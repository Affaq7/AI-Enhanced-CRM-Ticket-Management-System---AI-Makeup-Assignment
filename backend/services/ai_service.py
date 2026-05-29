"""AI service — Gemini 1.5 Flash integration.

Provides:
- analyze_ticket   → category, sentiment, sentiment_score, tags
- suggest_reply    → draft agent response
- summarize_conversation → resolution summary
"""

import os
import json
import httpx
from typing import Optional

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
_MODEL = "gemini-1.5-flash-latest"
_BASE_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{_MODEL}:generateContent"
)

_FALLBACK_ANALYSIS = {
    "category": "General",
    "sentiment": "Neutral",
    "sentiment_score": 0.5,
    "tags": "support",
}


async def _call_gemini(prompt: str) -> str:
    """Call Gemini API and return the raw text response."""
    if not GEMINI_API_KEY:
        return ""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{_BASE_URL}?key={GEMINI_API_KEY}",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def analyze_ticket(title: str, description: str) -> dict:
    """Auto-categorize, sentiment-score, and tag a ticket."""
    if not GEMINI_API_KEY:
        return _FALLBACK_ANALYSIS

    prompt = (
        "Analyze this customer support ticket and return ONLY a valid JSON object "
        "with these exact keys:\n"
        '  "category": one of ["Billing", "Technical", "Account", "Shipping", "General"]\n'
        '  "sentiment": one of ["Positive", "Neutral", "Negative", "Frustrated"]\n'
        '  "sentiment_score": float 0.0 (very negative) to 1.0 (very positive)\n'
        '  "tags": comma-separated keywords (max 5)\n\n'
        f"Ticket Title: {title}\n"
        f"Ticket Description: {description}\n\n"
        "Return ONLY valid JSON. No explanation."
    )

    try:
        raw = await _call_gemini(prompt)
        return json.loads(raw)
    except Exception as exc:
        print(f"[AI] analyze_ticket error: {exc}")
        return _FALLBACK_ANALYSIS


async def suggest_reply(title: str, description: str, category: str) -> str:
    """Generate a professional draft reply for the agent."""
    if not GEMINI_API_KEY:
        return (
            "Thank you for reaching out to TechServe Solutions. "
            "We have received your request and our team will review it shortly. "
            "We will keep you updated on the progress."
        )

    prompt = (
        "You are a professional customer support agent at TechServe Solutions. "
        "Write a concise, empathetic, and professional draft reply (3-5 sentences) "
        "for the following support ticket. Acknowledge the issue, give initial guidance, "
        "and set realistic expectations. Return ONLY valid JSON with key \"reply\".\n\n"
        f"Category: {category}\n"
        f"Title: {title}\n"
        f"Description: {description}"
    )

    try:
        raw = await _call_gemini(prompt)
        data = json.loads(raw)
        return data.get("reply", "")
    except Exception as exc:
        print(f"[AI] suggest_reply error: {exc}")
        return (
            "Thank you for contacting TechServe Solutions support. "
            "We have received your ticket and our team is reviewing it. "
            "We will get back to you as soon as possible."
        )


async def summarize_conversation(title: str, description: str, comments: list) -> str:
    """Generate a resolution summary from the ticket conversation."""
    if not GEMINI_API_KEY:
        return f"The customer's issue regarding '{title}' was successfully resolved by the support team."

    convo = "\n".join(
        f"[{c.get('author', 'Agent')}]: {c.get('message', '')}" for c in comments
    )

    prompt = (
        "Summarize this resolved customer support ticket in 2-3 sentences. "
        "Include: original issue, key steps taken, and final resolution. "
        "Return ONLY valid JSON with key \"summary\".\n\n"
        f"Title: {title}\n"
        f"Original Description: {description}\n"
        f"Conversation:\n{convo}"
    )

    try:
        raw = await _call_gemini(prompt)
        data = json.loads(raw)
        return data.get("summary", f"Ticket '{title}' resolved.")
    except Exception as exc:
        print(f"[AI] summarize_conversation error: {exc}")
        return f"The issue regarding '{title}' was resolved after investigation by the support team."
