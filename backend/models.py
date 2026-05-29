from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="agent")   # agent | manager
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assigned_customers = relationship(
        "Customer", back_populates="assigned_agent",
        foreign_keys="Customer.assigned_agent_id"
    )
    assigned_tickets = relationship(
        "Ticket", back_populates="assigned_agent",
        foreign_keys="Ticket.assigned_agent_id"
    )
    comments = relationship("TicketComment", back_populates="agent")
    history_entries = relationship("TicketHistory", back_populates="agent")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(30))
    company = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    assigned_agent = relationship(
        "User", back_populates="assigned_customers",
        foreign_keys=[assigned_agent_id]
    )
    tickets = relationship("Ticket", back_populates="customer")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="open")       # open|in_progress|resolved|closed
    priority = Column(String(20), default="medium")   # low|medium|high|critical
    category = Column(String(50), default="General")
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    assigned_agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    customer = relationship("Customer", back_populates="tickets")
    assigned_agent = relationship(
        "User", back_populates="assigned_tickets",
        foreign_keys=[assigned_agent_id]
    )
    comments = relationship(
        "TicketComment", back_populates="ticket",
        cascade="all, delete-orphan"
    )
    history = relationship(
        "TicketHistory", back_populates="ticket",
        cascade="all, delete-orphan"
    )
    ai_metadata = relationship(
        "AIMetadata", back_populates="ticket",
        uselist=False, cascade="all, delete-orphan"
    )
    notification_logs = relationship(
        "NotificationLog", back_populates="ticket",
        cascade="all, delete-orphan"
    )


class AIMetadata(Base):
    __tablename__ = "ai_metadata"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), unique=True, nullable=False)
    ai_category = Column(String(50))
    ai_sentiment = Column(String(20))
    ai_sentiment_score = Column(Float)
    ai_summary = Column(Text)
    ai_suggested_reply = Column(Text)
    ai_tags = Column(String(300))
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="ai_metadata")


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="comments")
    agent = relationship("User", back_populates="comments")


class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    agent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    field_changed = Column(String(60), nullable=False)
    old_value = Column(String(200))
    new_value = Column(String(200))
    changed_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="history")
    agent = relationship("User", back_populates="history_entries")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    platform = Column(String(20), default="telegram")
    message = Column(Text)
    status = Column(String(20), default="sent")   # sent | failed
    sent_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="notification_logs")
