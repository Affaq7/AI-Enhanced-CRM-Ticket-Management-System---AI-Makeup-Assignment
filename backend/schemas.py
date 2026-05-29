from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ── Minimal nested schemas (no circular nesting) ─────────────────────────────

class UserMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str


class CustomerMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None


# ── User ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "agent"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


# ── Customer ──────────────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    assigned_agent_id: Optional[int] = None


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    assigned_agent_id: Optional[int] = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    company: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    assigned_agent_id: Optional[int] = None
    assigned_agent: Optional[UserMinimal] = None


# ── AI Metadata ───────────────────────────────────────────────────────────────

class AIMetadataOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ai_category: Optional[str] = None
    ai_sentiment: Optional[str] = None
    ai_sentiment_score: Optional[float] = None
    ai_summary: Optional[str] = None
    ai_suggested_reply: Optional[str] = None
    ai_tags: Optional[str] = None
    analyzed_at: Optional[datetime] = None


# ── Ticket ────────────────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    customer_id: int
    assigned_agent_id: Optional[int] = None


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_agent_id: Optional[int] = None


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    status: str
    priority: str
    category: Optional[str] = None
    customer_id: int
    assigned_agent_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    customer: Optional[CustomerMinimal] = None
    assigned_agent: Optional[UserMinimal] = None
    ai_metadata: Optional[AIMetadataOut] = None


# ── Comments & History ────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    message: str
    is_internal: bool = False


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    agent_id: int
    message: str
    is_internal: bool
    created_at: datetime
    agent: Optional[UserMinimal] = None


class HistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    agent_id: Optional[int] = None
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_at: datetime
    agent: Optional[UserMinimal] = None
