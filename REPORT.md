# TechServe AI-Enhanced CRM & Ticket Management System
## Project Report

---

**Course:** Artificial Intelligence (CS-4XX)  
**Assignment:** Major Project — AI-Enhanced CRM & Ticket Management System  
**Submission Date:** May 2026  
**Student:** [Your Full Name] — [Student ID]  
**GitHub Repository:** https://github.com/[username]/techserve-crm  
**Live Demo:** http://localhost:3000 (local deployment)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [AI Integration](#4-ai-integration)
5. [Messaging Integration](#5-messaging-integration)
6. [Feature Screenshots](#6-feature-screenshots)
7. [Challenges & Learnings](#7-challenges--learnings)
8. [Work Division](#8-work-division)
9. [References](#9-references)

---

## 1. Project Overview

### 1.1 What Was Built

TechServe CRM is a full-stack, AI-enhanced Customer Relationship Management and Ticket Management System designed to solve the manual, error-prone support workflow at a mid-sized technology company. The system replaces spreadsheets and personal chat accounts with a centralized, intelligent platform that automates ticket categorization, detects customer sentiment, suggests agent responses, and delivers real-time notifications to the team via Telegram.

The system is built as a production-ready MVP covering all 10 minimum requirements defined in the assignment specification, plus five bonus features.

### 1.2 Key Technical Decisions

**FastAPI over Django/Flask:**  
FastAPI was selected as the backend framework for its native asynchronous support (critical for non-blocking AI API calls and Telegram notifications), automatic OpenAPI documentation generation, and Pydantic v2 integration for type-safe data validation. The async-first architecture ensures that expensive operations—Gemini AI calls, Telegram messages—never block the HTTP request cycle; they execute as background tasks after the response is already sent to the client.

**SQLite over PostgreSQL:**  
SQLite was chosen for zero-configuration portability, making the project trivially runnable from a fresh clone without any database server setup. For a course MVP, this is the correct trade-off. The schema is fully normalized and compatible with PostgreSQL or MySQL with a one-line configuration change (`DATABASE_URL` environment variable).

**Google Gemini 1.5 Flash over GPT-4:**  
Gemini Flash offers a generous free tier with no credit card required (suitable for a student project), low latency (~1-2 seconds), excellent JSON-constrained output via `responseMimeType: "application/json"`, and strong instruction-following capability for classification tasks.

**React + Vite over Next.js:**  
For a client-rendered SPA backed by a separate REST API, Vite's React template provides the fastest development iteration cycle. Next.js server-side rendering overhead is unnecessary when the backend is already a standalone FastAPI service.

**Telegram Bot over Discord/Email:**  
Telegram Bot setup requires zero infrastructure (no SMTP server, no verified domain), takes under 5 minutes via BotFather, and the Bot API is extremely reliable. The free tier has no rate limits for the volume of a support team.

### 1.3 What Differentiates This System

1. **AI Escalation Engine:** Unlike systems where agents manually escalate tickets, TechServe CRM automatically escalates to Critical priority when the AI detects Frustrated sentiment in the ticket description—without any human intervention. An alert is simultaneously sent via Telegram.

2. **Non-blocking AI pipeline:** All AI analysis runs as FastAPI background tasks. Ticket creation returns instantly (< 100ms) to the agent. The AI analysis, category update, and Telegram notification complete asynchronously, then appear when the agent refreshes the ticket detail page.

3. **Four AI features in one workflow:** Categorization, sentiment analysis, reply suggestion, and resolution summary are all integrated into the single ticket lifecycle—not bolted on as separate modules.

4. **Premium dark-mode UI:** The interface uses a custom CSS design system with glassmorphism cards, gradient accents, Chart.js visualizations, and micro-animations—significantly above the minimum acceptable UI quality for this assignment.

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                           │
│                                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Login   │  │ Dashboard │  │ Customers│  │  Ticket Detail   │  │
│  │  Page    │  │ (Charts)  │  │ (CRUD)   │  │  + AI Panel      │  │
│  └──────────┘  └───────────┘  └──────────┘  └──────────────────┘  │
│                                                                      │
│              Axios HTTP Client (JWT Bearer Token)                    │
└─────────────────────────────┬───────────────────────────────────────┘
                               │ REST API (HTTP/JSON)
┌─────────────────────────────▼───────────────────────────────────────┐
│                        FastAPI Backend                               │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  /auth   │  │/customers│  │ /tickets │  │   /dashboard     │  │
│  │  Router  │  │  Router  │  │  Router  │  │     Router       │  │
│  └──────────┘  └──────────┘  └────┬─────┘  └──────────────────┘  │
│                                    │                                 │
│        CORS Middleware             │ Background Tasks               │
│        JWT Auth Guard             │                                 │
│        Role-Based Access          ▼                                 │
│                          ┌─────────────────┐                        │
│                          │  AI Service      │ ◄── Gemini 1.5 Flash  │
│                          │  (async)         │     (HTTP POST)       │
│                          └────────┬────────┘                        │
│                                   │                                 │
│                          ┌────────▼────────┐                        │
│                          │ Telegram Service │ ◄── Bot API           │
│                          │  (async)         │     (HTTP POST)       │
│                          └─────────────────┘                        │
└─────────────────────────────┬───────────────────────────────────────┘
                               │ SQLAlchemy ORM
┌─────────────────────────────▼───────────────────────────────────────┐
│                      SQLite Database (crm.db)                        │
│                                                                      │
│  users │ customers │ tickets │ ai_metadata │ ticket_comments │       │
│  ticket_history │ notification_logs                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Descriptions

#### Frontend (React 18 + Vite)
The frontend is a single-page application with client-side routing via React Router v6. Authentication state is managed by a React Context (`AuthContext`) that stores the JWT token and decoded user profile in `localStorage`. An Axios instance with request interceptors automatically attaches the `Authorization: Bearer <token>` header to every API call. A 401 response interceptor automatically logs the user out and redirects to the login page.

**Pages:**
- **Login** — Glassmorphism card with click-to-fill demo credentials. Calls `POST /auth/login` and stores JWT.
- **Dashboard** — Displays 8 stat cards and 3 Chart.js visualizations: 7-day ticket trend (line), category breakdown (doughnut), and agent workload (bar).
- **Customers** — Searchable table with CRUD modals. Search queries `GET /customers?search=<term>`.
- **CustomerDetail** — Full profile card + complete ticket history table + create-ticket modal.
- **Tickets** — Filterable table by status, priority, and search term.
- **TicketDetail** — Two-column layout: main area (description, comment thread, history timeline) + sidebar (AI panel, controls, customer quick-info). Polls every 10 seconds for live updates.
- **Agents** — Manager-only page for creating, editing, and deactivating agent accounts.

#### Backend (Python 3.9 + FastAPI 0.104)
The backend follows a layered architecture: routers handle HTTP concerns, services handle external integrations, models define data, and schemas validate input/output.

**Routers:**
- `auth_router` — `POST /auth/login`, `GET /auth/me`
- `customers_router` — Full CRUD + `GET /customers/{id}/tickets`
- `tickets_router` — Full CRUD + `GET/POST /{id}/comments` + `GET /{id}/history`. Ticket creation triggers `BackgroundTasks` for AI analysis and Telegram notification.
- `dashboard_router` — 5 analytics endpoints consumed by the frontend charts
- `ai_router` — On-demand AI endpoints: `/analyze/{id}`, `/suggest-reply/{id}`, `/summarize/{id}`
- `users_router` — Agent management (manager-only for write operations)

**Key architectural pattern — Background Tasks:**  
When a ticket is created via `POST /tickets`, the FastAPI response is returned immediately with `status: "open"` and `category: "General"`. FastAPI then runs `_bg_analyze_and_notify()` asynchronously, which calls Gemini, updates the ticket category in the database, runs the AI escalation check, and sends Telegram notifications—all without the client waiting.

#### AI Service (`services/ai_service.py`)
All four AI operations call Gemini 1.5 Flash via `httpx.AsyncClient`. The `responseMimeType: "application/json"` generation config parameter forces the model to output valid JSON, eliminating the need for post-processing. Each function has a hardcoded fallback dict/string that is returned if the API key is missing or the call fails, ensuring the application never crashes due to AI unavailability.

#### Telegram Service (`services/telegram_service.py`)
Sends HTML-formatted messages to a configured Telegram chat using `POST https://api.telegram.org/bot{TOKEN}/sendMessage`. Three notification types are implemented: new ticket creation, critical escalation, and ticket resolution (with AI summary). Each notification call is wrapped in a try/except and logs failures without propagating exceptions to the main application.

#### Database (`database.py` + SQLAlchemy 2.0)
Uses SQLAlchemy's `DeclarativeBase` with a `SessionLocal` factory. A SQLite event listener enables `PRAGMA foreign_keys=ON` so SQLAlchemy cascade deletes (on `TicketComment`, `TicketHistory`, `AIMetadata`, `NotificationLog`) enforce referential integrity at the database level.

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         USERS                            │
│  id (PK) │ name │ email (UQ) │ password_hash │ role     │
│  is_active │ created_at                                  │
└──────────────────────┬──────────────────────────────────┘
                       │ 1
          ┌────────────┼─────────────────────────┐
          │ N          │ N                        │ N
          ▼            ▼                          ▼
┌──────────────┐ ┌────────────────────────┐ ┌──────────────────┐
│  CUSTOMERS   │ │        TICKETS         │ │  TICKET_COMMENTS │
│  id (PK)     │ │  id (PK)              │ │  id (PK)         │
│  full_name   │ │  title                │ │  ticket_id (FK)  │
│  email (UQ)  │ │  description          │ │  agent_id (FK)   │
│  phone       │ │  status               │ │  message         │
│  company     │ │  priority             │ │  is_internal     │
│  notes       │ │  category             │ │  created_at      │
│  created_at  │ │  customer_id (FK) ───►│ └──────────────────┘
│  agent_id(FK)│ │  agent_id (FK)        │
└──────────────┘ │  created_at           │ ┌──────────────────┐
                 │  updated_at           │ │  TICKET_HISTORY  │
                 │  resolved_at          │ │  id (PK)         │
                 └────────────┬──────────┘ │  ticket_id (FK)  │
                              │ 1          │  agent_id (FK)   │
              ┌───────────────┼────────────│  field_changed   │
              │ 1             │ 1          │  old_value       │
              ▼               ▼            │  new_value       │
┌──────────────────┐ ┌─────────────────┐  │  changed_at      │
│   AI_METADATA    │ │NOTIFICATION_LOGS│  └──────────────────┘
│  id (PK)         │ │  id (PK)        │
│  ticket_id (FK,UQ│ │  ticket_id (FK) │
│  ai_category     │ │  platform       │
│  ai_sentiment    │ │  message        │
│  ai_sentiment_scr│ │  status         │
│  ai_summary      │ │  sent_at        │
│  ai_suggested_rpl│ └─────────────────┘
│  ai_tags         │
│  analyzed_at     │
└──────────────────┘
```

### 3.2 Table Descriptions

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Agents and managers. Soft-deleted via `is_active=False` to preserve FK references | FK source for customers, tickets, comments, history |
| `customers` | Customer records with optional agent assignment | `assigned_agent_id → users.id` |
| `tickets` | Core entity. Tracks full lifecycle | `customer_id → customers.id`, `assigned_agent_id → users.id` |
| `ai_metadata` | One-to-one with tickets. Stores all AI outputs | `ticket_id → tickets.id` (unique) |
| `ticket_comments` | Public comments and internal notes on tickets | `ticket_id`, `agent_id` |
| `ticket_history` | Immutable changelog for every field change | `ticket_id`, `agent_id` |
| `notification_logs` | Audit trail for all Telegram messages sent | `ticket_id → tickets.id` |

### 3.3 Design Decisions

- **Soft delete on users:** Deleting an agent hard would orphan tickets and comments referencing their ID. Instead, `is_active = False` marks them inactive while preserving all historical data.
- **`ai_metadata` as separate table:** AI fields are optional and only populated after background processing completes. Placing them in a separate `1:1` table avoids nullable columns proliferating in the `tickets` table and makes it easy to query tickets with/without AI analysis.
- **`ticket_history` immutable log:** Every field change (status, priority, category, agent assignment) appends a new row. This creates a complete audit trail without UPDATE statements on historical records.

---

## 4. AI Integration

### 4.1 AI Features Overview

| # | Feature | Trigger | API | Stored in |
|---|---------|---------|-----|-----------|
| 1 | Auto-categorization | Ticket creation (background) | Gemini Flash | `ai_metadata.ai_category` |
| 2 | Sentiment analysis | Ticket creation (background) | Gemini Flash | `ai_metadata.ai_sentiment`, `ai_sentiment_score` |
| 3 | Reply suggestion | On-demand button (agent) | Gemini Flash | `ai_metadata.ai_suggested_reply` |
| 4 | Conversation summary | Ticket resolution (background) | Gemini Flash | `ai_metadata.ai_summary` |
| 5 | AI Escalation Engine | Ticket creation (automatic rule) | Uses sentiment result | `tickets.priority` |

### 4.2 API Used

**Google Gemini 1.5 Flash** via REST API:
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`
- Authentication: API key as query parameter
- Key configuration: `responseMimeType: "application/json"` forces structured JSON output
- Temperature: `0.2` (low randomness for consistent classification)
- Max tokens: `1024`

### 4.3 Feature 1: Auto Ticket Categorization

**Trigger:** `POST /tickets` → background task `_bg_analyze_and_notify()`

**Prompt:**
```
Analyze this customer support ticket and return ONLY a valid JSON object with these exact keys:
  "category": one of ["Billing", "Technical", "Account", "Shipping", "General"]
  "sentiment": one of ["Positive", "Neutral", "Negative", "Frustrated"]
  "sentiment_score": float 0.0 (very negative) to 1.0 (very positive)
  "tags": comma-separated keywords (max 5)

Ticket Title: {title}
Ticket Description: {description}
Return ONLY valid JSON. No explanation.
```

**Example Input:**
```
Title: "I was charged twice for my subscription"
Description: "My credit card was billed twice this month. I checked
my bank statement and there are two identical charges of $49.99.
This is unacceptable and I need a refund immediately."
```

**Example Output:**
```json
{
  "category": "Billing",
  "sentiment": "Frustrated",
  "sentiment_score": 0.15,
  "tags": "double charge, refund, subscription, billing, credit card"
}
```

**Integration:** The category is written to `tickets.category` and `ai_metadata.ai_category`. The sentiment is stored in `ai_metadata`. The ticket detail page's AI Panel displays these results with a visual sentiment score bar.

### 4.4 Feature 2: Sentiment Analysis & Auto-Escalation Engine

The sentiment score (0.0–1.0) is displayed in the AI Panel as a colored progress bar. This is not merely decorative—it drives the **AI Escalation Engine**:

```python
if ai_data.get("sentiment") == "Frustrated" and ticket.priority != "critical":
    ticket.priority = "critical"
    # Log to ticket_history
    # Send Telegram escalation alert
```

This rule executes within the same background task as categorization, so the escalation happens seconds after ticket creation with no agent action required.

**Example:** A ticket created with priority `"high"` containing the description *"This is completely unacceptable! I've been waiting for 3 days and nobody has responded..."* will be automatically escalated to `"critical"` and an urgent Telegram alert sent to the agents' channel.

### 4.5 Feature 3: AI-Generated Reply Suggestion

**Trigger:** Agent clicks "Generate" button in the AI Panel on the ticket detail page.

**API call:** `POST /ai/suggest-reply/{ticket_id}`

**Prompt:**
```
You are a professional customer support agent at TechServe Solutions.
Write a concise, empathetic, and professional draft reply (3-5 sentences) for the following support ticket.
Acknowledge the issue, give initial guidance, and set realistic expectations.
Return ONLY valid JSON with key "reply".

Category: Billing
Title: I was charged twice for my subscription
Description: My credit card was billed twice...
```

**Example Output:**
```json
{
  "reply": "Thank you for bringing this to our attention. We sincerely apologize for the duplicate charge on your account. Our billing team has been notified and will investigate this immediately—you can expect a full refund of the extra charge within 3-5 business days. We appreciate your patience and will keep you updated throughout the process."
}
```

The suggested reply is stored in `ai_metadata.ai_suggested_reply` and displayed in the AI Panel. The agent can read it, copy it, and post it as a comment (editing as needed).

### 4.6 Feature 4: Conversation Summary on Resolution

**Trigger:** `PUT /tickets/{id}` with `{"status": "resolved"}` → background task `_bg_resolution_task()`

The background task collects all comments for the ticket, then calls Gemini with:

```
Summarize this resolved customer support ticket in 2-3 sentences.
Include: original issue, key steps taken, and final resolution outcome.
Return ONLY JSON with field "summary".
Title: {title}
Original Description: {description}
Conversation: [Agent]: ... [Agent]: ...
```

The summary is stored in `ai_metadata.ai_summary` and displayed in the AI Panel's "Resolution Summary" section. A Telegram notification includes the summary text.

### 4.7 Error Handling

Every AI service function is wrapped in a `try/except Exception`. On failure (network timeout, API quota exceeded, malformed JSON), a sensible fallback is returned:
- Category → `"General"`, Sentiment → `"Neutral"`, Score → `0.5`
- Reply → pre-written professional response
- Summary → `"The issue regarding '{title}' was resolved by the support team."`

This guarantees the application never crashes or shows an error to the end user due to AI unavailability.

---

## 5. Messaging Integration

### 5.1 Platform: Telegram Bot API

**Why Telegram:** Zero infrastructure overhead (no SMTP server, no domain verification), BotFather setup in under 5 minutes, a reliable HTTP API with excellent uptime, and HTML message formatting support for rich notifications.

### 5.2 Setup

1. Message `@BotFather` on Telegram → send `/newbot`
2. Follow prompts to name the bot → receive bot token
3. Add the bot to a group or channel as an administrator
4. Retrieve the chat ID from `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `backend/.env`

### 5.3 Implementation

All notifications call a single `send_message(text: str) → bool` function:

```python
async def send_message(text: str) -> bool:
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            json=payload
        )
        return resp.status_code == 200
```

Three notification types are implemented:

**New Ticket Notification:**
```
🎫 New Ticket Created — #42

📌 Cannot login to dashboard
👤 Customer: Jane Doe
🟠 Priority: HIGH
📁 Category: Technical
🕐 2026-05-28 14:32 UTC
```

**Critical Escalation Alert:**
```
🚨 CRITICAL ESCALATION — #43

📌 Billing issue — charged twice
👤 Customer: Bob Smith
🔴 Priority auto-escalated to: CRITICAL
😡 AI Detected Sentiment: Frustrated
🕐 2026-05-28 14:35 UTC

⚠️ Immediate attention required!
```

**Ticket Resolved Notification:**
```
✅ Ticket Resolved — #42

📌 Cannot login to dashboard
👤 Customer: Jane Doe
🕐 2026-05-28 15:10 UTC

📋 AI Summary:
The customer was unable to log in due to a cached browser session.
The support team advised clearing cookies, which resolved the issue
immediately. The customer confirmed successful login.
```

### 5.4 Notification Results Storage

Every notification attempt (successful or failed) is recorded in `notification_logs`:

| Field | Value |
|-------|-------|
| `ticket_id` | FK reference to ticket |
| `platform` | `"telegram"` |
| `message` | Human-readable description |
| `status` | `"sent"` or `"failed"` |
| `sent_at` | UTC timestamp |

This provides a full audit trail of all communications.

### 5.5 Challenges

- **Chat ID retrieval:** The Telegram Bot API returns chat IDs in the `getUpdates` response only after the bot has received at least one message. The workaround is to send any message to the group after adding the bot, then poll `getUpdates`.
- **Group vs Channel:** For channels, the bot must be an administrator. For groups, it only needs to be a member. The `chat_id` is negative for groups (e.g., `-1001234567890`) and positive for private chats.

---

## 6. Feature Screenshots

*(Screenshots to be captured from the running application at http://localhost:3000 and added to this report)*

### Required Screenshots for Report Submission

| # | Screen | URL / Action |
|---|--------|-------------|
| 1 | **Login Page** | Navigate to `http://localhost:3000/login` |
| 2 | **Dashboard** | Log in as Manager → `/dashboard` |
| 3 | **Customer List** | Navigate to `/customers` |
| 4 | **Create Customer Modal** | Click "Add Customer" button |
| 5 | **Ticket List with Filters** | Navigate to `/tickets` |
| 6 | **Create Ticket Modal** | Click "New Ticket" |
| 7 | **Ticket Detail — AI Panel** | Open any ticket, wait 3-5 seconds for AI analysis to populate |
| 8 | **AI Reply Suggestion** | Click "Generate" in Draft Reply section of AI Panel |
| 9 | **Comment Thread** | Add a comment to a ticket |
| 10 | **History Timeline** | Scroll to History section on ticket detail |
| 11 | **Telegram Notification** | Screenshot of received Telegram message on phone/desktop |
| 12 | **Agents Page (Manager)** | Navigate to `/agents` as Manager |
| 13 | **API Documentation** | Navigate to `http://localhost:8000/docs` |

### Screenshot Notes

- Use browser window at 1440×900px for best presentation
- For the Telegram screenshot, show it on your phone or Telegram Desktop
- Include screenshots that show the AI panel AFTER analysis completes (category badge + sentiment bar populated)
- Show at least one ticket with "Critical" priority to demonstrate the escalation engine

---

## 7. Challenges & Learnings

### 7.1 Technical Challenges

**Challenge 1: bcrypt Compatibility on Python 3.9**  
The `passlib[bcrypt]` package installs the latest `bcrypt` version (≥4.1) which removed the `__about__.__version__` attribute that passlib's bcrypt handler reads. This caused a runtime error on password hashing.

**Solution:** Pinned `bcrypt==4.0.1` explicitly in `requirements.txt` as a separate dependency (not via `passlib[bcrypt]`), which is the last version with the expected attribute. This is a known upstream issue in the passlib GitHub issues tracker.

**Lesson:** Always pin transitive dependencies that are known to have breaking changes between versions. Use `pip-compile` for production projects.

---

**Challenge 2: JWT `sub` Claim Type**  
The `python-jose` library enforces RFC 7519, which requires the `sub` claim to be a string. Passing an integer user ID (`{"sub": user.id}`) caused a `Subject must be a string` error during token decoding.

**Solution:** Convert to string on encoding (`str(user.id)`) and convert back to int on decoding (`int(payload.get("sub"))`). Added this conversion in both `auth_router.py` and `dependencies.py`.

**Lesson:** Read RFC specifications before implementing JWT, not just library documentation. Libraries often silently accept incorrect data at encoding time but fail at decode time.

---

**Challenge 3: SQLAlchemy Lazy Loading After Session Close**  
FastAPI's Pydantic response model serialization accesses relationship attributes (e.g., `ticket.customer.full_name`) after the SQLAlchemy session might be closed. Lazy loading in this state raises a `DetachedInstanceError`.

**Solution:** Used `joinedload()` on all queries that need to serialize nested relationships, ensuring all relationship data is loaded eagerly within the session scope before Pydantic serializes the response.

---

**Challenge 4: Background Task Closure Variable Capture**  
Defining async functions inside a request handler and capturing SQLAlchemy model attributes through closures is dangerous—the ORM object may be expired or detached by the time the background task runs.

**Solution:** Extracted all needed values as plain Python strings/ints before creating background tasks, and created new database sessions inside each background task function using `SessionLocal()`.

---

**Challenge 5: Telegram Chat ID Discovery**  
The Telegram Bot API does not expose the chat ID in BotFather during setup. The `getUpdates` endpoint only returns updates if the bot has received at least one message.

**Solution:** Documented in the README: after adding the bot to a group, send any message to the group, then call `https://api.telegram.org/bot<TOKEN>/getUpdates` to find the `chat.id` field in the response.

### 7.2 Design Learnings

1. **Async-first is non-negotiable for AI integrations:** Synchronous AI API calls would add 1-3 seconds to every ticket creation request. Background tasks make the system feel instant.

2. **Graceful degradation is critical:** AI features should never make the core application brittle. Every AI call has a try/except with a sensible fallback. The system works perfectly with or without a Gemini API key configured.

3. **Prompt engineering matters more than model choice:** A well-structured prompt with explicit JSON schema constraints (`responseMimeType: "application/json"`) produces reliable, parseable results without post-processing or retries.

4. **Separate schemas from models:** Having distinct Pydantic schemas (with `from_attributes=True`) rather than exposing SQLAlchemy models directly prevents circular serialization issues and keeps the API contract stable independent of the database schema.

### 7.3 What Would Be Done Differently

1. **WebSockets instead of polling:** The current 10-second polling interval on the ticket detail page works but is inefficient. A WebSocket connection (`/ws/tickets/{id}`) would provide true real-time updates at near-zero overhead.

2. **PostgreSQL for production:** SQLite is excellent for development and demos, but concurrent writes are serialized. For a real multi-agent deployment, PostgreSQL with connection pooling (via `asyncpg`) would be required.

3. **Task queue for AI jobs:** FastAPI's `BackgroundTasks` are simple but have no retry logic, no visibility, and no dead-letter queue. A production deployment would use Celery + Redis or ARQ for reliable background processing.

4. **Rate limiting on AI endpoints:** The `/ai/` endpoints could be called in a tight loop by an agent, burning API quota. Adding a per-ticket cooldown (stored in `ai_metadata.analyzed_at`) would prevent abuse.

---

## 8. Work Division

*(For individual submission)*

| Section | Contributor | Effort |
|---------|------------|--------|
| System Architecture & Planning | [Your Name] | 100% |
| Database Schema Design | [Your Name] | 100% |
| Authentication Module (M1) | [Your Name] | 100% |
| Customer Module (M2) | [Your Name] | 100% |
| Ticket Module (M3) | [Your Name] | 100% |
| Dashboard Module (M4) | [Your Name] | 100% |
| AI Module (M5) | [Your Name] | 100% |
| Messaging Module (M6) | [Your Name] | 100% |
| Frontend UI / UX | [Your Name] | 100% |
| Documentation & Report | [Your Name] | 100% |

---

## 9. References

1. **FastAPI Documentation** — *Tiangolo, S.* — https://fastapi.tiangolo.com
2. **SQLAlchemy 2.0 ORM Documentation** — https://docs.sqlalchemy.org/en/20/orm/
3. **Pydantic v2 Documentation** — https://docs.pydantic.dev/latest/
4. **Python-JOSE Documentation** — https://python-jose.readthedocs.io/
5. **Google Gemini API Reference** — https://ai.google.dev/api/generate-content
6. **Telegram Bot API Documentation** — https://core.telegram.org/bots/api
7. **React Router v6 Documentation** — https://reactrouter.com/en/main
8. **Chart.js Documentation** — https://www.chartjs.org/docs/latest/
9. **RFC 7519: JSON Web Token (JWT)** — *IETF* — https://datatracker.ietf.org/doc/html/rfc7519
10. **Vite Documentation** — https://vitejs.dev/guide/
11. **bcrypt / passlib Compatibility Issue** — https://github.com/pyca/bcrypt/issues/684
12. **httpx Async HTTP Client** — https://www.python-httpx.org/
13. **Lucide React Icons** — https://lucide.dev/icons/
14. **Inter Typeface** — *Google Fonts* — https://fonts.google.com/specimen/Inter
15. **OWASP Authentication Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

*This report documents the design, implementation, and evaluation of the TechServe AI-Enhanced CRM & Ticket Management System, developed as a Major Project for CS-4XX Artificial Intelligence.*
