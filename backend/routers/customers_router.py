from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from dependencies import get_db, get_current_user
from models import Customer, Ticket, User
from schemas import CustomerCreate, CustomerOut, CustomerUpdate, TicketOut

router = APIRouter(prefix="/customers", tags=["Customers"])


def _load_customer(db: Session, customer_id: int) -> Customer:
    c = (
        db.query(Customer)
        .options(joinedload(Customer.assigned_agent))
        .filter(Customer.id == customer_id)
        .first()
    )
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c


@router.get("", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, email, or company"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Customer).options(joinedload(Customer.assigned_agent))
    if search:
        like = f"%{search}%"
        q = q.filter(
            Customer.full_name.ilike(like)
            | Customer.email.ilike(like)
            | Customer.company.ilike(like)
        )
    return q.order_by(Customer.created_at.desc()).all()


@router.post("", response_model=CustomerOut)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if db.query(Customer).filter(Customer.email == data.email).first():
        raise HTTPException(status_code=400, detail="Customer with this email already exists")

    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return _load_customer(db, customer.id)


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _load_customer(db, customer_id)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(customer, field, value)

    db.commit()
    return _load_customer(db, customer_id)


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return {"detail": "Customer deleted"}


@router.get("/{customer_id}/tickets", response_model=List[TicketOut])
def get_customer_tickets(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not db.query(Customer).filter(Customer.id == customer_id).first():
        raise HTTPException(status_code=404, detail="Customer not found")

    from models import AIMetadata
    return (
        db.query(Ticket)
        .options(
            joinedload(Ticket.customer),
            joinedload(Ticket.assigned_agent),
            joinedload(Ticket.ai_metadata),
        )
        .filter(Ticket.customer_id == customer_id)
        .order_by(Ticket.created_at.desc())
        .all()
    )
