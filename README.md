# TechServe CRM — AI-Enhanced CRM & Ticket Management System

A full-stack, AI-powered Customer Relationship Management and Ticket Management system with Telegram integration, built as a CS-4XX Major Project.

---

## Team
| Name | Student ID | Role |
|------|-----------|------|
| [Your Name] | [Your ID] | Full Stack Developer |

---

## Tech Stack
| Layer | Choice |
|-------|--------|
| Backend | Python 3.11 + FastAPI |
| Database | SQLite (SQLAlchemy ORM) |
| Frontend | React 18 + Vite + Vanilla CSS |
| Auth | JWT (python-jose) + bcrypt |
| AI | Google Gemini 1.5 Flash API |
| Messaging | Telegram Bot API |

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
- ✅ Telegram Bot notifications (new ticket, escalation, resolution)
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
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))
- A Telegram Bot token ([BotFather](https://t.me/BotFather))

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/techserve-crm.git
cd techserve-crm
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in your keys (see Environment Variables section below)

# Start the backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Login Credentials (auto-seeded)
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
| `GEMINI_API_KEY` | Google Gemini API key from aistudio.google.com | Yes (for AI features) |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather on Telegram | Yes (for notifications) |
| `TELEGRAM_CHAT_ID` | Chat/group/channel ID to send notifications to | Yes (for notifications) |

### Getting a Telegram Bot Token
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the token provided
4. Add your bot to a group or channel
5. Get the chat ID: visit `https://api.telegram.org/bot<TOKEN>/getUpdates` after sending a message

---

## Docker Compose (Bonus)
```bash
# Copy env example
cp .env.example .env
# Fill in .env values

# Launch everything
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
| GET/POST | /users | List/create agents (manager) |
| PUT/DELETE | /users/{id} | Update/deactivate agent |

---

## Project Structure
```
AI_Assignment/
├── backend/
│   ├── main.py              # FastAPI entry + startup seed
│   ├── database.py          # SQLAlchemy engine
│   ├── models.py            # ORM models (6 tables)
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # JWT + bcrypt
│   ├── dependencies.py      # Auth middleware
│   ├── routers/             # 6 API routers
│   └── services/            # AI + Telegram services
├── frontend/
│   └── src/
│       ├── pages/           # 7 pages
│       ├── components/      # Reusable components
│       ├── api/             # Axios client
│       └── context/         # Auth context
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Screenshots
*(Add screenshots of the running application here for your report)*

---

## License
MIT — for academic purposes
