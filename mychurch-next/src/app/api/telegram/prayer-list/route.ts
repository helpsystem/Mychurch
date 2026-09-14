import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type PrayerCategory =
  | "healing"
  | "family"
  | "financial"
  | "spiritual"
  | "thanksgiving"
  | "grief"
  | "other";

interface PrayerItem {
  id: string;
  name: string;
  request: string;
  category: PrayerCategory;
  addedAt: string;
  isPrivate?: boolean;
}

const CATEGORY_EMOJIS: Record<PrayerCategory, string> = {
  healing:      "💊",
  family:       "👨‍👩‍👧",
  financial:    "💼",
  spiritual:    "🙏",
  thanksgiving: "🌟",
  grief:        "🕊️",
  other:        "📿",
};

const CATEGORY_LABELS: Record<PrayerCategory, string> = {
  healing:      "شفا",
  family:       "خانواده",
  financial:    "مالی",
  spiritual:    "روحانی",
  thanksgiving: "تشکر",
  grief:        "عزاداری",
  other:        "سایر",
};

/**
 * Format a Persian-style date string from an ISO date
 */
function formatPersianDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fa-IR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Build the Telegram HTML-formatted prayer list message
 */
function buildPrayerMessage(items: PrayerItem[], churchName: string, date: string): string {
  const persianDate = formatPersianDate(date);
  const lines: string[] = [
    `🙏 <b>لیست درخواست‌های دعا</b>`,
    ``,
    `📅 ${persianDate}`,
    `🏛 ${churchName}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━`,
  ];

  items.forEach((item, idx) => {
    const emoji = CATEGORY_EMOJIS[item.category] || "📿";
    const label = CATEGORY_LABELS[item.category] || "سایر";
    const displayName = item.isPrivate ? "یک نفر از اعضا 🔒" : item.name;

    lines.push(``);
    lines.push(`<b>${idx + 1}. ${emoji} ${displayName}</b>  <i>(${label})</i>`);
    lines.push(item.request);
  });

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`<i>با محبت، ${churchName}</i>`);
  lines.push(`<i>@IranianChurchDC</i>`);

  return lines.join("\n");
}

/**
 * Send a message to a Telegram chat via Bot API
 */
async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${errText}`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items = [] as PrayerItem[],
      churchName = "کلیسای انجیلی ایرانیان",
      date = new Date().toISOString(),
      chatId: requestedChatId,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "لیست دعا خالی است." },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_PUBLIC_CHANNEL_ID || "-1003905361426";
    const groupId = process.env.TELEGRAM_PUBLIC_GROUP_ID;

    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN در سرور تنظیم نشده است." },
        { status: 500 }
      );
    }

    // Determine targets
    const targets: { id: string; name: string }[] = [];
    if (requestedChatId) {
      targets.push({ id: String(requestedChatId), name: "چت درخواستی" });
    } else {
      if (channelId) {
        targets.push({ id: String(channelId), name: "کانال رسمی کلیسا" });
      }
      if (groupId && groupId !== channelId) {
        targets.push({ id: String(groupId), name: "گروه کلیسا" });
      }
    }

    if (targets.length === 0) {
      return NextResponse.json(
        { error: "هیچ کانال یا گروه تلگرامی تنظیم نشده است." },
        { status: 500 }
      );
    }

    const message = buildPrayerMessage(items, churchName, date);

    const results: { target: string; success: boolean; error?: string }[] = [];

    for (const target of targets) {
      try {
        await sendTelegramMessage(botToken, target.id, message);
        results.push({ target: target.name, success: true });
      } catch (err: any) {
        console.error(`[PrayerList Telegram] Failed to send to ${target.name}:`, err);
        results.push({ target: target.name, success: false, error: err.message });
      }
    }

    const anySuccess = results.some((r) => r.success);
    if (!anySuccess) {
      return NextResponse.json(
        { error: "ارسال به تمام مقصدها شکست خورد.", results },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      itemCount: items.length,
      results,
    });
  } catch (error: any) {
    console.error("[PrayerList Telegram] Exception:", error);
    return NextResponse.json(
      { error: error.message || "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}
