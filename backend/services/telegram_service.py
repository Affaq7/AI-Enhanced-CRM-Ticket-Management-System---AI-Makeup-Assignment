"""Telegram Bot notification service.

Sends real messages to a Telegram chat/group/channel using the Bot API.
Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the .env file.
"""

import os
import httpx
from datetime import datetime

TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")

_PRIORITY_EMOJI = {
    "low": "🟢",
    "medium": "🟡",
    "high": "🟠",
    "critical": "🔴",
}


def _url() -> str:
    return f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"


async def send_message(text: str) -> bool:
    """Send a raw HTML-formatted message to the configured chat."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[Telegram] Token or Chat ID not configured — skipping notification.")
        return False

    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(_url(), json=payload)
            ok = resp.status_code == 200
            if not ok:
                print(f"[Telegram] Failed ({resp.status_code}): {resp.text}")
            return ok
    except Exception as exc:
        print(f"[Telegram] Exception: {exc}")
        return False


async def notify_new_ticket(
    ticket_id: int,
    title: str,
    customer_name: str,
    priority: str,
    category: str,
) -> bool:
    emoji = _PRIORITY_EMOJI.get(priority, "⚪")
    text = (
        f"🎫 <b>New Ticket Created — #{ticket_id}</b>\n\n"
        f"📌 <b>{title}</b>\n"
        f"👤 Customer: {customer_name}\n"
        f"{emoji} Priority: <b>{priority.upper()}</b>\n"
        f"📁 Category: {category}\n"
        f"🕐 {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC"
    )
    return await send_message(text)


async def notify_escalation(
    ticket_id: int,
    title: str,
    customer_name: str,
    sentiment: str = None,
) -> bool:
    text = (
        f"🚨 <b>CRITICAL ESCALATION — #{ticket_id}</b>\n\n"
        f"📌 <b>{title}</b>\n"
        f"👤 Customer: {customer_name}\n"
        f"🔴 Priority auto-escalated to: <b>CRITICAL</b>\n"
    )
    if sentiment:
        text += f"😡 AI Detected Sentiment: <b>{sentiment}</b>\n"
    text += (
        f"🕐 {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC\n\n"
        f"<i>⚠️ Immediate attention required!</i>"
    )
    return await send_message(text)


async def notify_resolution(
    ticket_id: int,
    title: str,
    customer_name: str,
    summary: str = None,
) -> bool:
    text = (
        f"✅ <b>Ticket Resolved — #{ticket_id}</b>\n\n"
        f"📌 <b>{title}</b>\n"
        f"👤 Customer: {customer_name}\n"
        f"🕐 {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC\n"
    )
    if summary:
        text += f"\n📋 <b>AI Summary:</b>\n{summary}"
    return await send_message(text)
