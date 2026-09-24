import { resolvePublicSiteUrl } from "@/lib/site-url";

function escapeHtml(text: string): string {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

interface SessionMetadataEntry {
    type: "song" | "scripture";
    title: string;
    details?: string;
}

interface SessionCaptionInput {
    title: string;
    sessionDate: string | Date;
    metadata: SessionMetadataEntry[] | null | undefined;
    mediaLibraryId: string;
}

/**
 * Builds the public Telegram channel caption for a published session recording.
 * Uses Telegram's HTML parse mode (safer to escape correctly than legacy Markdown,
 * which breaks entirely if a song/scripture title happens to contain * _ or [ ]).
 */
export function buildSessionTelegramCaption({ title, sessionDate, metadata, mediaLibraryId }: SessionCaptionInput): string {
    const meta = metadata || [];
    const songs = meta.filter((m) => m.type === "song");
    const scriptures = meta.filter((m) => m.type === "scripture");

    const dateStr = new Date(sessionDate).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const header = `🎙 <b>${escapeHtml(title || "فایل صوتی جلسه")}</b>\n📅 ${escapeHtml(dateStr)}\n`;
    const listenUrl = `${resolvePublicSiteUrl()}/api/serve/cloud/${mediaLibraryId}`;
    const footer = `\n🔗 <a href="${listenUrl}">پخش و دانلود فایل صوتی کامل جلسه</a>\n\n⛪️ <b>کلیسای ایرانیان واشنگتن دی‌سی</b>`;

    // Telegram media captions are capped at 1024 characters — build the song/scripture
    // list line by line and stop early (with a "+N more" note) rather than let a long
    // service list produce a caption Telegram would reject outright.
    const CAPTION_LIMIT = 1024;
    const budget = CAPTION_LIMIT - header.length - footer.length - 40; // safety margin for the "+N" line
    let body = "";
    let omitted = 0;

    if (songs.length > 0) {
        const section = `\n🎵 <b>سرودهای پرستشی:</b>\n`;
        if (body.length + section.length <= budget) body += section;
        songs.forEach((s, idx) => {
            const details = s.details ? ` <i>(${escapeHtml(s.details)})</i>` : "";
            const line = `${idx + 1}. ${escapeHtml(s.title)}${details}\n`;
            if (body.length + line.length <= budget) body += line;
            else omitted++;
        });
    }

    if (scriptures.length > 0) {
        const section = `\n📖 <b>آیات خوانده شده:</b>\n`;
        if (body.length + section.length <= budget) body += section;
        scriptures.forEach((s) => {
            const details = s.details ? ` <i>(${escapeHtml(s.details)})</i>` : "";
            const line = `• ${escapeHtml(s.title)}${details}\n`;
            if (body.length + line.length <= budget) body += line;
            else omitted++;
        });
    }

    if (omitted > 0) {
        body += `\n… و ${omitted} مورد دیگر\n`;
    }

    return `${header}${body}${footer}`;
}
