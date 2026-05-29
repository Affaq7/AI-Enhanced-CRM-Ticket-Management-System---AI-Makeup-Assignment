from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from dependencies import get_db, get_current_user
from models import (
    Ticket, Customer, User, AIMetadata,
    TicketComment, TicketHistory, NotificationLog,
)
from schemas import (
    TicketCreate, TicketOut, TicketUpdate,
    CommentCreate, CommentOut, HistoryOut,
)
from services.ai_service import analyze_ticket, summarize_conversation
from services.email_service import notify_new_ticket, notify_escalation, notify_resolution

router = APIRouter(prefix="/tickets", tags=["Tickets"])


# ── Helpers ──────────────────────────────────────────────────────────────────

def _load_ticket(db: Session, ticket_id: int) -> Ticket:
    t = (
        db.query(Ticket)
        .options(
            joinedload(Ticket.customer),
            joinedload(Ticket.assigned_agent),
            joinedload(Ticket.ai_metadata),
            joinedload(Ticket.comments).joinedload(TicketComment.agent),
        )
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return t


# ── Background tasks ─────────────────────────────────────────────────────────

async def _bg_analyze_and_notify(
    ticket_id: int,
    title: str,
    description: str,
    customer_name: str,
    priority: str,
):
    """Runs after ticket creation: AI analysis + auto-escalation + Telegram."""
    from database import SessionLocal

    db = SessionLocal()
    try:
        ai_data = await analyze_ticket(title, description)

        meta = db.query(AIMetadata).filter(AIMetadata.ticket_id == ticket_id).first()
        if meta:
            meta.ai_category = ai_data.get("category", "General")
            meta.ai_sentiment = ai_data.get("sentiment", "Neutral")
            meta.ai_sentiment_score = ai_data.get("sentiment_score", 0.5)
            meta.ai_tags = ai_data.get("tags", "")
            meta.analyzed_at = datetime.utcnow()
        else:
            meta = AIMetadata(
                ticket_id=ticket_id,
                ai_category=ai_data.get("category", "General"),
                ai_sentiment=ai_data.get("sentiment", "Neutral"),
                ai_sentiment_score=ai_data.get("sentiment_score", 0.5),
                ai_tags=ai_data.get("tags", ""),
            )
            db.add(meta)

        # Update ticket category from AI
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        escalated = False
        if ticket:
            ticket.category = ai_data.get("category", "General")

            # AI escalation engine: Frustrated sentiment → Critical
            if (
                ai_data.get("sentiment") == "Frustrated"
                and ticket.priority != "critical"
            ):
                old_priority = ticket.priority
                ticket.priority = "critical"
                ticket.updated_at = datetime.utcnow()
                db.add(
                    TicketHistory(
                        ticket_id=ticket_id,
                        field_changed="priority",
                        old_value=old_priority,
                        new_value="critical",
                    )
                )
                escalated = True

        db.commit()

        # Send email notification — new ticket
        category = ai_data.get("category", "General")
        sent = await notify_new_ticket(ticket_id, title, customer_name, priority, category)
        db.add(
            NotificationLog(
                ticket_id=ticket_id,
                platform="email",
                message=f"New ticket #{ticket_id} notification",
                status="sent" if sent else "failed",
            )
        )

        if escalated:
            sent2 = await notify_escalation(
                ticket_id, title, customer_name, ai_data.get("sentiment")
            )
            db.add(
                NotificationLog(
                    ticket_id=ticket_id,
                    platform="email",
                    message=f"Escalation #{ticket_id}",
                    status="sent" if sent2 else "failed",
                )
            )

        db.commit()
    except Exception as exc:
        print(f"[BG] analyze+notify error: {exc}")
    finally:
        db.close()


async def _bg_resolution_task(
    ticket_id: int,
    title: str,
    description: str,
    customer_name: str,
    comment_data: list,
):
    from database import SessionLocal

    db = SessionLocal()
    try:
        summary = await summarize_conversation(title, description, comment_data)

        meta = db.query(AIMetadata).filter(AIMetadata.ticket_id == ticket_id).first()
        if meta:
            meta.ai_summary = summary
            meta.analyzed_at = datetime.utcnow()
        else:
            db.add(AIMetadata(ticket_id=ticket_id, ai_summary=summary))

        db.commit()

        sent = await notify_resolution(ticket_id, title, customer_name, summary)
        db.add(
            NotificationLog(
                ticket_id=ticket_id,
                platform="email",
                message=f"Resolution #{ticket_id}",
                status="sent" if sent else "failed",
            )
        )
        db.commit()
    except Exception as exc:
        print(f"[BG] resolution task error: {exc}")
    finally:
        db.close()


async def _bg_escalation_task(ticket_id: int, title: str, customer_name: str):
    from database import SessionLocal

    sent = await notify_escalation(ticket_id, title, customer_name)
    db = SessionLocal()
    try:
        db.add(
            NotificationLog(
                ticket_id=ticket_id,
                platform="email",
                message=f"Manual escalation #{ticket_id}",
                status="sent" if sent else "failed",
            )
        )
        db.commit()
    finally:
        db.close()


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[TicketOut])
def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    agent_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Ticket).options(
        joinedload(Ticket.customer),
        joinedload(Ticket.assigned_agent),
        joinedload(Ticket.ai_metadata),
    )

    if status:
        q = q.filter(Ticket.status == status)
    if priority:
        q = q.filter(Ticket.priority == priority)
    if agent_id:
        q = q.filter(Ticket.assigned_agent_id == agent_id)
    if customer_id:
        q = q.filter(Ticket.customer_id == customer_id)
    if search:
        q = q.filter(Ticket.title.ilike(f"%{search}%"))

    # Agents see only their assigned tickets
    if current_user.role == "agent":
        q = q.filter(Ticket.assigned_agent_id == current_user.id)

    return q.order_by(Ticket.created_at.desc()).all()


@router.post("", response_model=TicketOut)
async def create_ticket(
    data: TicketCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    ticket = Ticket(
        title=data.title,
        description=data.description,
        priority=data.priority,
        customer_id=data.customer_id,
        assigned_agent_id=data.assigned_agent_id,
        status="open",
        category="General",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    db.add(
        TicketHistory(
            ticket_id=ticket.id,
            agent_id=current_user.id,
            field_changed="status",
            old_value=None,
            new_value="open",
        )
    )
    db.commit()

    # Fire background AI analysis + Telegram
    background_tasks.add_task(
        _bg_analyze_and_notify,
        ticket.id,
        data.title,
        data.description,
        customer.full_name,
        data.priority,
    )

    return _load_ticket(db, ticket.id)


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _load_ticket(db, ticket_id)


@router.put("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.customer))
        .filter(Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    updates = data.model_dump(exclude_none=True)
    old_priority = ticket.priority

    for field, new_val in updates.items():
        old_val = getattr(ticket, field)
        setattr(ticket, field, new_val)
        db.add(
            TicketHistory(
                ticket_id=ticket_id,
                agent_id=current_user.id,
                field_changed=field,
                old_value=str(old_val) if old_val is not None else None,
                new_value=str(new_val),
            )
        )

    ticket.updated_at = datetime.utcnow()

    # Gather values for background tasks BEFORE session commit/close
    customer_name = ticket.customer.full_name if ticket.customer else "Unknown"
    ticket_title = ticket.title
    ticket_desc = ticket.description

    # Resolved → generate AI summary + Telegram
    if data.status == "resolved":
        ticket.resolved_at = datetime.utcnow()
        comments = (
            db.query(TicketComment)
            .filter(TicketComment.ticket_id == ticket_id)
            .all()
        )
        comment_data = [
            {"author": c.agent.name if c.agent else "Agent", "message": c.message}
            for c in comments
        ]
        background_tasks.add_task(
            _bg_resolution_task,
            ticket_id, ticket_title, ticket_desc, customer_name, comment_data,
        )

    # Escalated to Critical (only if it changed)
    if data.priority == "critical" and old_priority != "critical":
        background_tasks.add_task(
            _bg_escalation_task, ticket_id, ticket_title, customer_name
        )

    db.commit()
    return _load_ticket(db, ticket_id)


@router.delete("/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()
    return {"detail": "Ticket deleted"}


# ── Comments ─────────────────────────────────────────────────────────────────

@router.get("/{ticket_id}/comments", response_model=List[CommentOut])
def get_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(TicketComment)
        .options(joinedload(TicketComment.agent))
        .filter(TicketComment.ticket_id == ticket_id)
        .order_by(TicketComment.created_at.asc())
        .all()
    )


@router.post("/{ticket_id}/comments", response_model=CommentOut)
def add_comment(
    ticket_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(Ticket).filter(Ticket.id == ticket_id).first():
        raise HTTPException(status_code=404, detail="Ticket not found")

    comment = TicketComment(
        ticket_id=ticket_id,
        agent_id=current_user.id,
        message=data.message,
        is_internal=data.is_internal,
    )
    db.add(comment)
    db.add(
        TicketHistory(
            ticket_id=ticket_id,
            agent_id=current_user.id,
            field_changed="comment",
            old_value=None,
            new_value="internal note" if data.is_internal else "public comment",
        )
    )
    db.commit()
    db.refresh(comment)
    return (
        db.query(TicketComment)
        .options(joinedload(TicketComment.agent))
        .filter(TicketComment.id == comment.id)
        .first()
    )


# ── History ───────────────────────────────────────────────────────────────────

@router.get("/{ticket_id}/history", response_model=List[HistoryOut])
def get_history(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(TicketHistory)
        .options(joinedload(TicketHistory.agent))
        .filter(TicketHistory.ticket_id == ticket_id)
        .order_by(TicketHistory.changed_at.asc())
        .all()
    )
