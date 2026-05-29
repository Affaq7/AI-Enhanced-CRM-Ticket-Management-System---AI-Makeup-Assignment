# TechServe CRM — Live Demo Script
## CS-4XX AI Assignment — Major Project Demo

**Total Demo Time:** 8–12 minutes  
**Setup:** Both servers must be running before the demo.

---

## Pre-Demo Checklist (Do Before Demo Starts)

```bash
# Terminal 1 — Backend
cd AI_Assignment/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
cd AI_Assignment/frontend
npm run dev
```

Open these tabs in Chrome before starting:
- `http://localhost:3000` — Frontend
- `http://localhost:8000/docs` — Swagger API docs
- Gmail inbox (for the team notification email demo)

---

## Demo Flow

---

### Scene 1 — Login & Role-Based Access (1 min)

**Action:** Navigate to `http://localhost:3000`

**Say:** *"The system opens on a secure login page. I'll log in first as a Manager — the highest privilege role."*

1. Click **"👑 Manager: admin@techserve.com / Admin@123"** (demo fill)
2. Click **Sign In**
3. **Show:** Sidebar shows Dashboard, Customers, Tickets, AND the **Agents** menu item (manager-only)
4. Log out → Log back in as Sarah (Agent)
5. **Show:** Sidebar has NO Agents link — role-based access working

**Key point:** *"JWT tokens carry the role claim. The frontend conditionally renders navigation, and the backend independently enforces permissions on every API call."*

---

### Scene 2 — Dashboard Analytics (1.5 min)

**Action:** Navigate to `/dashboard`

**Say:** *"The dashboard gives managers a real-time operational view."*

1. **Show the 8 stat cards** — Total Tickets, Open, Critical, Resolved Today, Customers, Agents, Avg Resolution Time, In Progress
2. **Show the Line chart** — *"7-day ticket trend: created vs resolved"*
3. **Show the Doughnut chart** — *"AI-classified category breakdown"*
4. **Show the Bar chart** — *"Agent workload distribution — open vs total tickets per agent"*
5. Click a row in the Recent Tickets table → navigates to ticket detail

---

### Scene 3 — Customer Management (1 min)

**Action:** Navigate to `/customers`

**Say:** *"Full CRM customer management with search and CRUD."*

1. Type in the search box — results filter live
2. Click **Add Customer** → fill the modal form
   - Name: `John Demo`, Email: `john.demo@example.com`, Company: `Demo Corp`
3. Click **Add Customer** → row appears in table
4. Click the **↗ link icon** → CustomerDetail page
5. **Show:** Profile card, assigned agent, notes section, full ticket history table

---

### Scene 4 — Ticket Creation & AI Analysis (3 min) ⭐ KEY SCENE

**Action:** Navigate to `/tickets` → Click **New Ticket**

**Say:** *"This is where the AI integration comes alive. Watch what happens after we create a ticket."*

**Create Ticket 1 — billing (frustrated tone):**
```
Title: I was charged TWICE this month — this is outrageous!
Description: I cannot believe this is happening. I checked my bank
statement and there are TWO identical charges of $49.99. This is
completely unacceptable. I need a refund immediately or I will
dispute with my bank.
Priority: High
Customer: (select any customer)
```

1. Click **Create Ticket** → response is instant (< 100ms)
2. Navigate to the new ticket's detail page
3. **Say:** *"The ticket was created instantly. Behind the scenes, FastAPI launched a background task — it's calling the Gemini AI API right now, asynchronously."*
4. Wait 3-5 seconds → click **Refresh**
5. **Show AI Panel — fully populated:**
   - Category badge: **Billing** ✅
   - Sentiment badge: **Frustrated** ✅  
   - Sentiment score bar: low (negative) ✅
   - Tags: `double charge, refund, subscription, billing` ✅
6. **Point to the priority badge:** *"Notice the priority changed from High to **Critical**. The AI Escalation Engine detected 'Frustrated' sentiment and auto-escalated — no agent action required."*
7. **Show Gmail inbox:** *"And simultaneously, the team received this critical alert by email — subject line shows CRITICAL ESCALATION, red header, AI sentiment label."*

**Create Ticket 2 — technical (neutral):**
```
Title: Unable to export reports as PDF
Description: When I click the Export button in the Reports section,
nothing happens. I'm using Chrome 124. I've tried clearing cache.
Priority: Medium
```

8. **Show:** Category = Technical, Sentiment = Neutral/Negative, NOT escalated ✅

---

### Scene 5 — AI Reply Suggestion (1 min)

**Action:** Stay on any ticket detail page (Billing ticket from Scene 4)

**Say:** *"Agents can request an AI-drafted reply directly from the ticket."*

1. In the **AI Panel**, find **Draft Reply**
2. Click **Generate**
3. After 2-3 seconds, click the **▼ expand** button
4. **Show the draft reply** — professional, empathetic, category-appropriate
5. **Say:** *"The agent reads this, edits if needed, then posts it as a comment."*

---

### Scene 6 — Comments, Internal Notes & History (1 min)

**Action:** Scroll down on the ticket detail page

**Say:** *"Full communication thread with support for internal agent notes."*

1. Type a public comment: *"Hi, I've raised this to our billing team. You'll receive a refund within 3–5 business days."*
2. Click **Post**
3. Click the **🔓 Public Comment** toggle → switches to **🔒 Internal Note**
4. Type: *"Verified duplicate charge in Stripe dashboard. Initiating refund."*
5. Click **Post**
6. **Show:** Internal note has amber border — visually differentiated from public comments
7. Scroll to **History Timeline** — shows every field change with timestamps

---

### Scene 7 — Ticket Resolution & AI Summary (1 min)

**Action:** Use the Controls sidebar on the ticket

**Say:** *"When an agent resolves a ticket, AI generates a summary of the entire conversation."*

1. In the **Status** dropdown, select **Resolved**
2. Page updates instantly, `resolved_at` timestamp appears
3. Wait 3-5 seconds → click **Refresh**
4. In AI Panel, click **Generate** under **Resolution Summary**
   *(or it auto-populates if already generated by background task)*
5. **Show the summary** — 2-3 sentences capturing the issue, steps, and resolution
6. **Show Gmail inbox** — resolution email received with green header and AI summary in the body ✅

---

### Scene 8 — Agent Management (1 min)

**Action:** Log in as Manager → Navigate to `/agents`

**Say:** *"Managers can manage the entire support team from here."*

1. **Show:** Table of all users with roles (Shield icons differentiate manager vs agent), active status, joined date
2. Click **Add Agent** → Fill modal: Name, Email, Password, Role
3. Click **Create Agent** → appears in table
4. Click **Edit** on any agent → change role or name
5. Click the **deactivate icon** on a non-self user → soft-deletes (preserves ticket history)

---

### Scene 9 — API Documentation (30 sec)

**Action:** Open `http://localhost:8000/docs`

**Say:** *"FastAPI auto-generates interactive Swagger documentation for every endpoint."*

1. **Show the endpoint list** — grouped by auth, customers, tickets, dashboard, AI, users
2. Expand one endpoint (e.g., `POST /tickets`) — show request schema and response model
3. **Say:** *"All endpoints are documented, type-safe, and testable directly from this UI."*

---

### Scene 10 — Closing (30 sec)

**Say:** *"To summarize — TechServe CRM delivers:*
- *Full CRM with customer and ticket lifecycle management*
- *JWT authentication with manager and agent roles*
- *Four AI features powered by Google Gemini 1.5 Flash*
- *An AI escalation engine that auto-promotes frustrated tickets to critical*
- *Real-time Telegram notifications for the support team*
- *A premium dark-mode React dashboard with live Chart.js analytics"*

---

## If Demo Issues Occur

| Problem | Fix |
|---------|-----|
| Backend not running | `cd backend && source venv/bin/activate && uvicorn main:app --reload` |
| Frontend not running | `export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh" && cd frontend && npm run dev` |
| AI Panel empty after refresh | Normal — wait 5-10 seconds and refresh again (Gemini latency) |
| No email notification | Check `.env` for correct SMTP credentials and NOTIFY_EMAIL |
| Login fails | Ensure crm.db exists — restart backend to re-seed |
| CORS error in browser | Ensure backend is on port 8000, frontend on 3000 |

---

## What to Show in Gmail

- Email with subject `[TechServe] New Ticket #N — <title>` (orange/blue header)
- Email with subject `[TechServe] 🚨 CRITICAL ESCALATION — Ticket #N` (red header)
- Email with subject `[TechServe] ✅ Resolved — Ticket #N: <title>` (green header + AI summary)

These three emails demonstrate the complete notification lifecycle across the ticket workflow.
