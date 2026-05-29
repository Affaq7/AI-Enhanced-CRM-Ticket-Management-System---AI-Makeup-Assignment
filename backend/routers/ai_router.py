from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from dependencies import get_db, get_current_user
from models import Ticket, AIMetadata, TicketComment
from services.ai_service import analyze_ticket, suggest_reply, summarize_conversation

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/analyze/{ticket_id}")
async def re_analyze(
    ticket_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Re-run AI analysis on an existing ticket (on-demand)."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ai_data = await analyze_ticket(ticket.title, ticket.description)

    meta = db.query(AIMetadata).filter(AIMetadata.ticket_id == ticket_id).first()
    if meta:
        meta.ai_category = ai_data.get("category", "General")
        meta.ai_sentiment = ai_data.get("sentiment", "Neutral")
        meta.ai_sentiment_score = ai_data.get("sentiment_score", 0.5)
        meta.ai_tags = ai_data.get("tags", "")
        meta.analyzed_at = datetime.utcnow()
    else:
        db.add(
            AIMetadata(
                ticket_id=ticket_id,
                ai_category=ai_data.get("category", "General"),
                ai_sentiment=ai_data.get("sentiment", "Neutral"),
                ai_sentiment_score=ai_data.get("sentiment_score", 0.5),
                ai_tags=ai_data.get("tags", ""),
            )
        )

    # Update ticket category
    ticket.category = ai_data.get("category", "General")
    db.commit()

    return ai_data


@router.post("/suggest-reply/{ticket_id}")
async def get_reply_suggestion(
    ticket_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Generate and persist an AI-suggested reply draft."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    meta = db.query(AIMetadata).filter(AIMetadata.ticket_id == ticket_id).first()
    category = (meta.ai_category if meta and meta.ai_category else None) or ticket.category or "General"

    reply = await suggest_reply(ticket.title, ticket.description, category)

    if meta:
        meta.ai_suggested_reply = reply
        meta.analyzed_at = datetime.utcnow()
    else:
        db.add(AIMetadata(ticket_id=ticket_id, ai_suggested_reply=reply))

    db.commit()
    return {"suggested_reply": reply}


@router.post("/summarize/{ticket_id}")
async def summarize(
    ticket_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Generate and persist an AI conversation summary."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    comments = (
        db.query(TicketComment)
        .filter(TicketComment.ticket_id == ticket_id)
        .all()
    )
    comment_data = [
        {"author": c.agent.name if c.agent else "Agent", "message": c.message}
        for c in comments
    ]

    summary = await summarize_conversation(ticket.title, ticket.description, comment_data)

    meta = db.query(AIMetadata).filter(AIMetadata.ticket_id == ticket_id).first()
    if meta:
        meta.ai_summary = summary
        meta.analyzed_at = datetime.utcnow()
    else:
        db.add(AIMetadata(ticket_id=ticket_id, ai_summary=summary))

    db.commit()
    return {"summary": summary}
