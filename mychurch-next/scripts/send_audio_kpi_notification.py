#!/usr/bin/env python3
import argparse
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


DEFAULT_TEXT_FILE = Path("Bible/bible_output/audio_kpi_brief.txt")


def compact_text(text: str) -> str:
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    return lines[0] if lines else ""


def send_slack(webhook_url: str, text: str) -> tuple[bool, str]:
    payload = json.dumps({"text": text}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            ok = 200 <= resp.status < 300
            return ok, f"status={resp.status} body={body[:200]}"
    except urllib.error.URLError as exc:
        return False, str(exc)


def send_telegram(bot_token: str, chat_id: str, text: str) -> tuple[bool, str]:
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    body = urllib.parse.urlencode(
        {
            "chat_id": chat_id,
            "text": text,
            "disable_web_page_preview": "true",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            ok = 200 <= resp.status < 300
            return ok, f"status={resp.status} body={body[:200]}"
    except urllib.error.URLError as exc:
        return False, str(exc)


def main() -> int:
    parser = argparse.ArgumentParser(description="Send audio KPI brief to Slack/Telegram")
    parser.add_argument("--text-file", type=Path, default=DEFAULT_TEXT_FILE, help="Path to text brief")
    parser.add_argument("--text", type=str, default="", help="Override text directly")
    parser.add_argument("--strict", action="store_true", help="Return non-zero if any configured target fails")
    parser.add_argument("--slack-webhook", type=str, default="", help="Slack incoming webhook URL")
    parser.add_argument("--telegram-bot-token", type=str, default="", help="Telegram bot token")
    parser.add_argument("--telegram-chat-id", type=str, default="", help="Telegram chat id")
    args = parser.parse_args()

    text = (args.text or "").strip()
    if not text:
        if not args.text_file.exists():
            print(f"[SKIP] brief text file not found: {args.text_file}")
            return 0
        text = args.text_file.read_text(encoding="utf-8").strip()

    if not text:
        print("[SKIP] empty KPI text")
        return 0

    if not args.text.strip():
        text = compact_text(text)

    slack_webhook = (args.slack_webhook or os.getenv("SLACK_WEBHOOK_URL") or "").strip()
    tg_token = (args.telegram_bot_token or os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
    tg_chat_id = (args.telegram_chat_id or os.getenv("TELEGRAM_CHAT_ID") or "").strip()

    configured_targets = 0
    failures: list[str] = []

    if slack_webhook:
        configured_targets += 1
        ok, detail = send_slack(slack_webhook, text)
        if ok:
            print("[OK] Slack notification sent")
        else:
            failures.append(f"Slack failed: {detail}")

    if tg_token and tg_chat_id:
        configured_targets += 1
        ok, detail = send_telegram(tg_token, tg_chat_id, text)
        if ok:
            print("[OK] Telegram notification sent")
        else:
            failures.append(f"Telegram failed: {detail}")

    if configured_targets == 0:
        print("[SKIP] No notification target configured (set SLACK_WEBHOOK_URL and/or TELEGRAM_BOT_TOKEN+TELEGRAM_CHAT_ID)")
        return 0

    if failures:
        print("[WARN] Notification failures:")
        for item in failures:
            print(f"  - {item}")
        return 1 if args.strict else 0

    print("[PASS] All configured notifications sent")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
