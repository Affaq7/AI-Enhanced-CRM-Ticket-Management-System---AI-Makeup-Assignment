#!/usr/bin/env bash
# =============================================================================
# TechServe CRM — Git Repository Setup & Push Script
# Run this ONCE from the AI_Assignment directory to initialize and push to GitHub
# =============================================================================

set -e

REPO_DIR="/Users/muhammadkumail/Downloads/AI_Assignment"
cd "$REPO_DIR"

echo "=== TechServe CRM — Git Setup ==="

# ── Step 1: Initialize git ────────────────────────────────────────────────────
if [ ! -d ".git" ]; then
  git init
  echo "✅ Git initialized"
else
  echo "ℹ️  Git already initialized"
fi

# ── Step 2: Configure author (edit these) ─────────────────────────────────────
git config user.name  "Your Name"
git config user.email "your.email@example.com"

# ── Step 3: Ensure .gitignore covers all sensitive files ─────────────────────
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*.pyo
venv/
.env
*.db
*.sqlite3
*.egg-info/
dist/
build/

# Node
node_modules/
dist/
.cache/

# IDE
.vscode/
.idea/
*.swp
.DS_Store

# Logs
*.log
EOF
echo "✅ .gitignore written"

# ── Step 4: Stage all files ───────────────────────────────────────────────────
git add .
echo "✅ Files staged"

# ── Step 5: Commit ────────────────────────────────────────────────────────────
git commit -m "feat: complete TechServe AI-Enhanced CRM & Ticket Management System

- FastAPI backend: auth, customers, tickets, dashboard, AI routers
- SQLite + SQLAlchemy ORM: 7 normalized tables
- Google Gemini 1.5 Flash: auto-categorization, sentiment analysis,
  reply suggestion, resolution summary, AI escalation engine
- Telegram Bot API: new ticket, escalation, resolution notifications
- React 18 + Vite frontend: dark-mode SPA with Chart.js dashboards
- Full CRUD: customers, tickets, agents
- JWT auth with role-based access (manager / agent)
- Docker Compose support
- Comprehensive README and project report"

echo "✅ Committed"

# ── Step 6: Rename branch to main ────────────────────────────────────────────
git branch -M main

echo ""
echo "================================================================="
echo "Now push to GitHub:"
echo ""
echo "  1. Create a NEW repo at https://github.com/new"
echo "     Name: techserve-crm"
echo "     Visibility: Public (required for grading)"
echo "     ⚠️  Do NOT initialize with README/gitignore — repo must be empty"
echo ""
echo "  2. Copy your remote URL (HTTPS or SSH) and run:"
echo "     git remote add origin https://github.com/YOUR_USERNAME/techserve-crm.git"
echo "     git push -u origin main"
echo "================================================================="
