# TechServe CRM — AI-Enhanced CRM & Ticket Management System

A full-stack, AI-powered Customer Relationship Management and Ticket Management system with Email notification integration, built as a CS-4XX Major Project.

---

## Team
| Name | Student ID | Role |
|------|-----------|------|
| [Your Name] | [Your ID] | Full Stack Developer |

---

## Tech Stack
| Layer | Choice |
|-------|--------|
| Backend | Python 3.10+ + FastAPI |
| Database | SQLite (SQLAlchemy ORM) |
| Frontend | React 18 + Vite + Vanilla CSS |
| Auth | JWT (python-jose) + bcrypt |
| AI | Google Gemini 1.5 Flash API |
| Messaging | Email (SMTP via Gmail) |

---

## Features
- ✅ JWT Authentication with Agent & Manager roles
- ✅ Full Customer CRUD (search, filter, profile view, ticket history)
- ✅ Full Ticket CRUD (status, priority, category, assignment, comment thread, history)
- ✅ AI Auto-Categorization (Billing, Technical, Account, Shipping, General)
- ✅ AI Sentiment Analysis (Positive / Neutral / Negative / Frustrated)
- ✅ AI Reply Suggestion (draft reply per ticket)
- ✅ AI Conversation Summary (on resolution)
- ✅ AI Auto-Escalation Engine (Frustrated → Critical automatically)
- ✅ Email notifications (new ticket, critical escalation, resolution with AI summary)
- ✅ Dashboard with 8 stats + Line/Doughnut/Bar charts
- ✅ Internal Notes (agent-only comments)
- ✅ Ticket Activity History Timeline
- ✅ 10-second polling for live ticket updates
- ✅ Mobile-responsive design
- ✅ Docker Compose support

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com)) — free
- A Gmail account with an App Password (for email notifications)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/techserve-crm.git
cd techserve-crm
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your keys (see Environment Variables section below)

# Start the backend
uvicorn main:app --reload --port 8000
```

API available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend available at `http://localhost:3000`

### 4. Login Credentials (auto-seeded on first run)
| Role | Email | Password |
|------|-------|----------|
| Manager | admin@techserve.com | Admin@123 |
| Agent | sarah@techserve.com | Agent@123 |
| Agent | john@techserve.com | Agent@123 |

---

## Environment Variables

Create `backend/.env` with the following:

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing secret (any random string) | Yes |
| `DATABASE_URL` | SQLite path (default: `sqlite:///./crm.db`) | No |
| `GEMINI_API_KEY` | Google Gemini API key from aistudio.google.com | Yes (AI features) |
| `SMTP_HOST` | SMTP server hostname (default: `smtp.gmail.com`) | Yes (email) |
| `SMTP_PORT` | SMTP port (default: `587`) | Yes (email) |
| `SMTP_USER` | Gmail address used to send emails | Yes (email) |
| `SMTP_PASSWORD` | Gmail App Password (16 characters, NOT your login password) | Yes (email) |
| `NOTIFY_EMAIL` | Recipient email(s) for notifications (comma-separated) | Yes (email) |

### Setting Up Gmail Email Notifications

1. Go to your Google Account → **Security** → enable **2-Step Verification**
2. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Select **Mail** → **Other (Custom name)** → enter `TechServe CRM` → click **Generate**
4. Copy the **16-character App Password** (shown only once)
5. Set `SMTP_USER=your.email@gmail.com` and `SMTP_PASSWORD=xxxx xxxx xxxx xxxx` in `.env`
6. Set `NOTIFY_EMAIL` to the address(es) that should receive alerts

> **Note:** Using the App Password works with any Gmail account. No credit card required.

---

## Docker Compose (Bonus)
```bash
# Copy and fill env file
cp .env.example .env

# Launch backend + frontend
docker-compose up --build
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login, returns JWT |
| GET | /auth/me | Current user profile |
| GET/POST | /customers | List/create customers |
| GET/PUT/DELETE | /customers/{id} | Customer CRUD |
| GET | /customers/{id}/tickets | Customer ticket history |
| GET/POST | /tickets | List/create tickets |
| GET/PUT/DELETE | /tickets/{id} | Ticket CRUD |
| GET/POST | /tickets/{id}/comments | Comments |
| GET | /tickets/{id}/history | History log |
| GET | /dashboard/stats | Summary statistics |
| GET | /dashboard/agent-workload | Agent workloads |
| GET | /dashboard/category-breakdown | Category counts |
| GET | /dashboard/resolution-trends | 7-day trends |
| POST | /ai/analyze/{id} | Re-analyze ticket with AI |
| POST | /ai/suggest-reply/{id} | Generate draft reply |
| POST | /ai/summarize/{id} | Generate conversation summary |
| GET/POST | /users | List/create agents (manager only) |
| PUT/DELETE | /users/{id} | Update/deactivate agent |

---

## Project Structure
```
AI_Assignment/
├── backend/
│   ├── main.py              # FastAPI entry + startup seed
│   ├── database.py          # SQLAlchemy engine
│   ├── models.py            # ORM models (7 tables)
│   ├── schemas.py           # Pydantic v2 schemas
│   ├── auth.py              # JWT + bcrypt
│   ├── dependencies.py      # Auth middleware
│   ├── routers/             # 6 API routers
│   └── services/
│       ├── ai_service.py    # Gemini AI (4 features)
│       └── email_service.py # SMTP email notifications
├── frontend/
│   └── src/
│       ├── pages/           # 7 pages
│       ├── components/      # 5 reusable components
│       ├── api/             # Axios client
│       └── context/         # Auth context
├── docker-compose.yml
├── .env.example
├── REPORT.md
└── README.md
```

---

## Screenshots
*(Add screenshots of the running application here for your report)*

---

## License
MIT — for academic purposes
