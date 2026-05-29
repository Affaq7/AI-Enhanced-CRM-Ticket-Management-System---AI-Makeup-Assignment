"""TechServe CRM — FastAPI backend entry point."""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base, SessionLocal
from models import User
from auth import hash_password

from routers.auth_router import router as auth_router
from routers.users_router import router as users_router
from routers.customers_router import router as customers_router
from routers.tickets_router import router as tickets_router
from routers.dashboard_router import router as dashboard_router
from routers.ai_router import router as ai_router

app = FastAPI(
    title="TechServe CRM API",
    description="AI-Enhanced CRM & Ticket Management System",
    version="1.0.0",
)

# CORS — allow all origins for development (tighten for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(customers_router)
app.include_router(tickets_router)
app.include_router(dashboard_router)
app.include_router(ai_router)


@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    _seed_defaults()
    print("✅ TechServe CRM API started")


def _seed_defaults():
    """Insert default manager and agent accounts if no users exist."""
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            seed_users = [
                User(
                    name="Admin Manager",
                    email="admin@techserve.com",
                    password_hash=hash_password("Admin@123"),
                    role="manager",
                ),
                User(
                    name="Sarah Chen",
                    email="sarah@techserve.com",
                    password_hash=hash_password("Agent@123"),
                    role="agent",
                ),
                User(
                    name="John Smith",
                    email="john@techserve.com",
                    password_hash=hash_password("Agent@123"),
                    role="agent",
                ),
            ]
            db.add_all(seed_users)
            db.commit()
            print("✅ Seeded default users (admin, sarah, john)")
    except Exception as exc:
        print(f"[Seed] Error: {exc}")
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "service": "TechServe CRM API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }
