"""Email notification service.

Sends HTML-formatted emails via SMTP (Gmail by default).
Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, NOTIFY_EMAIL in .env.

For Gmail:
  1. Enable 2-Step Verification on your Google account
  2. Generate an App Password at myaccount.google.com/apppasswords
  3. Use that 16-character password as SMTP_PASSWORD
"""

import os
import ssl
import smtplib
import asyncio
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")   # Gmail App Password (16 chars)
NOTIFY_EMAIL  = os.getenv("NOTIFY_EMAIL", "")    # Recipient(s), comma-separated

_PRIORITY_COLOR = {
    "low":      "#22c55e",
    "medium":   "#3b82f6",
    "high":     "#f97316",
    "critical": "#ef4444",
}

_PRIORITY_BADGE = {
    "low":      "🟢 LOW",
    "medium":   "🟡 MEDIUM",
    "high":     "🟠 HIGH",
    "critical": "🔴 CRITICAL",
}


# ── HTML template ─────────────────────────────────────────────────────────────

def _build_html(title: str, color: str, rows: list[tuple[str, str]], footer: str = "") -> str:
    """Render a clean, table-based HTML email."""
    row_html = "".join(
        f"<tr><td style='padding:8px 12px;color:#6b7280;font-weight:500;"
        f"white-space:nowrap;width:140px'>{label}</td>"
        f"<td style='padding:8px 12px;color:#111827'>{value}</td></tr>"
        for label, value in rows
    )

    footer_html = (
        f"<p style='margin:16px 0 0;padding:16px;background:#f9fafb;"
        f"border-radius:6px;color:#374151;font-size:13px;line-height:1.6'>"
        f"{footer}</p>"
    ) if footer else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#f3f4f6;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;
                    box-shadow:0 1px 6px rgba(0,0,0,.08);overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:{color};padding:24px 28px">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.08em;
                      color:rgba(255,255,255,.75);text-transform:uppercase">
              TechServe CRM
            </p>
            <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#fff;
                       line-height:1.3">{title}</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:24px 28px">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:8px;
                          border-collapse:collapse;overflow:hidden">
              {row_html}
            </table>
            {footer_html}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center">
              TechServe CRM &nbsp;·&nbsp;
              {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC &nbsp;·&nbsp;
              Automated notification
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ── SMTP send (sync, runs in thread) ─────────────────────────────────────────

def _send_sync(subject: str, html: str, recipient_email: str) -> bool:
    """Blocking SMTP send — called via asyncio.to_thread."""
    if not SMTP_USER or not SMTP_PASSWORD or not recipient_email:
        print("[Email] SMTP credentials or recipient email not configured — skipping.")
        return False

    recipients = [r.strip() for r in recipient_email.split(",") if r.strip()]

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"TechServe CRM <{SMTP_USER}>"
    msg["To"]      = ", ".join(recipients)
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, recipients, msg.as_string())
        print(f"[Email] Sent '{subject}' → {recipients}")
        return True
    except Exception as exc:
        print(f"[Email] Send failed: {exc}")
        return False


async def send_email(subject: str, html: str, recipient_email: str) -> bool:
    """Async wrapper — offloads blocking SMTP to a thread."""
    return await asyncio.to_thread(_send_sync, subject, html, recipient_email)


# ── Notification functions ────────────────────────────────────────────────────

async def notify_new_ticket(
    ticket_id: int,
    title: str,
    customer_name: str,
    priority: str,
    category: str,
    customer_email: str = "",
) -> bool:
    color = _PRIORITY_COLOR.get(priority, "#6b7280")
    badge = _PRIORITY_BADGE.get(priority, priority.upper())
    rows = [
        ("Ticket ID",  f"<strong>#{ticket_id}</strong>"),
        ("Title",      f"<strong>{title}</strong>"),
        ("Customer",   customer_name),
        ("Priority",   f"<span style='color:{color};font-weight:700'>{badge}</span>"),
        ("Category",   category),
        ("Created",    datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")),
    ]
    html = _build_html(
        title=f"New Ticket #{ticket_id}: {title}",
        color=color,
        rows=rows,
        footer="Your support ticket has been received. Our team will get back to you shortly.",
    )
    recipient = customer_email or NOTIFY_EMAIL
    return await send_email(f"[TechServe] New Ticket #{ticket_id} — {title}", html, recipient)


async def notify_escalation(
    ticket_id: int,
    title: str,
    customer_name: str,
    sentiment: str = None,
    customer_email: str = "",
) -> bool:
    rows = [
        ("Ticket ID",  f"<strong>#{ticket_id}</strong>"),
        ("Title",      f"<strong>{title}</strong>"),
        ("Customer",   customer_name),
        ("Priority",
         "<span style='color:#ef4444;font-weight:700'>🔴 AUTO-ESCALATED TO CRITICAL</span>"),
    ]
    if sentiment:
        rows.append(("AI Sentiment",
                     f"<span style='color:#ef4444;font-weight:600'>{sentiment}</span>"))

    html = _build_html(
        title=f"🚨 Critical Escalation — Ticket #{ticket_id}",
        color="#ef4444",
        rows=rows,
        footer=(
            "Your ticket has been escalated to <strong>Critical</strong> priority "
            "and will receive immediate attention from our support team."
        ),
    )
    recipient = customer_email or NOTIFY_EMAIL
    return await send_email(
        f"[TechServe] 🚨 CRITICAL ESCALATION — Ticket #{ticket_id}", html, recipient
    )


async def notify_resolution(
    ticket_id: int,
    title: str,
    customer_name: str,
    summary: str = None,
    customer_email: str = "",
) -> bool:
    rows = [
        ("Ticket ID", f"<strong>#{ticket_id}</strong>"),
        ("Title",     f"<strong>{title}</strong>"),
        ("Customer",  customer_name),
        ("Status",    "<span style='color:#22c55e;font-weight:700'>✅ RESOLVED</span>"),
        ("Resolved",  datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")),
    ]
    html = _build_html(
        title=f"✅ Ticket #{ticket_id} Resolved",
        color="#22c55e",
        rows=rows,
        footer=f"<strong>Resolution Summary:</strong><br>{summary}" if summary else "",
    )
    recipient = customer_email or NOTIFY_EMAIL
    return await send_email(
        f"[TechServe] ✅ Resolved — Ticket #{ticket_id}: {title}", html, recipient
    )
