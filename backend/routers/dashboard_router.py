from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta

from dependencies import get_db, get_current_user
from models import Ticket, Customer, User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    today_start = datetime.combine(date.today(), datetime.min.time())

    total_tickets = db.query(Ticket).count()
    open_tickets = db.query(Ticket).filter(Ticket.status == "open").count()
    in_progress = db.query(Ticket).filter(Ticket.status == "in_progress").count()
    resolved_today = db.query(Ticket).filter(
        Ticket.status == "resolved",
        Ticket.resolved_at >= today_start,
    ).count()
    critical_tickets = db.query(Ticket).filter(
        Ticket.priority == "critical",
        Ticket.status.notin_(["resolved", "closed"]),
    ).count()
    total_customers = db.query(Customer).count()
    total_agents = db.query(User).filter(
        User.role == "agent", User.is_active == True
    ).count()

    resolved_all = db.query(Ticket).filter(
        Ticket.resolved_at.isnot(None),
        Ticket.status.in_(["resolved", "closed"]),
    ).all()

    avg_hours = None
    if resolved_all:
        total_sec = sum(
            (t.resolved_at - t.created_at).total_seconds()
            for t in resolved_all
            if t.resolved_at and t.created_at
        )
        avg_hours = round(total_sec / 3600 / len(resolved_all), 1)

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress_tickets": in_progress,
        "resolved_today": resolved_today,
        "critical_tickets": critical_tickets,
        "total_customers": total_customers,
        "total_agents": total_agents,
        "avg_resolution_time_hours": avg_hours,
    }


@router.get("/agent-workload")
def agent_workload(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    agents = db.query(User).filter(User.role == "agent", User.is_active == True).all()
    result = []
    for agent in agents:
        open_count = db.query(Ticket).filter(
            Ticket.assigned_agent_id == agent.id,
            Ticket.status.in_(["open", "in_progress"]),
        ).count()
        total_count = db.query(Ticket).filter(
            Ticket.assigned_agent_id == agent.id
        ).count()
        result.append(
            {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "open_tickets": open_count,
                "total_tickets": total_count,
            }
        )
    return result


@router.get("/category-breakdown")
def category_breakdown(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (
        db.query(Ticket.category, func.count(Ticket.id))
        .group_by(Ticket.category)
        .all()
    )
    return [{"category": r[0] or "Unclassified", "count": r[1]} for r in rows]


@router.get("/recent-tickets")
def recent_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload

    q = (
        db.query(Ticket)
        .options(joinedload(Ticket.customer), joinedload(Ticket.assigned_agent))
        .order_by(Ticket.created_at.desc())
        .limit(10)
    )
    if current_user.role == "agent":
        q = q.filter(Ticket.assigned_agent_id == current_user.id)

    tickets = q.all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "customer_name": t.customer.full_name if t.customer else "N/A",
            "agent_name": t.assigned_agent.name if t.assigned_agent else "Unassigned",
            "created_at": t.created_at.isoformat(),
        }
        for t in tickets
    ]


@router.get("/resolution-trends")
def resolution_trends(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Last 7 days: tickets created vs resolved per day."""
    result = []
    for i in range(6, -1, -1):
        day = date.today() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        created = db.query(Ticket).filter(
            Ticket.created_at >= day_start,
            Ticket.created_at <= day_end,
        ).count()

        resolved = db.query(Ticket).filter(
            Ticket.resolved_at >= day_start,
            Ticket.resolved_at <= day_end,
        ).count()

        result.append({
            "date": day.strftime("%b %d"),
            "created": created,
            "resolved": resolved,
        })
    return result
