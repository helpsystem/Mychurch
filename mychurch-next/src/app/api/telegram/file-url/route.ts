import { NextResponse } from "next/server";
import { getTelegramFileStreamUrl } from "@/services/telegram";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/telegram/file-url?fileId=xxx
 * GET /api/telegram/file-url?messageId=123&type=video
 * 
 * Returns the direct Telegram CDN URL for a file.
 * Used by homepage media to get video URLs without streaming through our server.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  const slot = searchParams.get("slot"); // e.g. "hero_video"

  try {
    // --- Option 1: direct fileId ---
    if (fileId) {
      const url = await getTelegramFileStreamUrl(fileId);
      return NextResponse.json({ url }, {
        headers: { "Cache-Control": "public, max-age=2700" }, // 45min
      });
    }

    // --- Option 2: resolve by slot name from site_settings ---
    if (slot) {
      const { rows } = await query(
        "SELECT homepage_media FROM site_settings WHERE id = 'default' LIMIT 1"
      );
      const mapping: Record<string, string> = rows[0]?.homepage_media || {};
      const savedFileId = mapping[slot];

      if (!savedFileId) {
        return NextResponse.json({ error: `Slot '${slot}' not configured` }, { status: 404 });
      }

      const url = await getTelegramFileStreamUrl(savedFileId);
      return NextResponse.json({ url, slot, fileId: savedFileId }, {
        headers: { "Cache-Control": "public, max-age=2700" },
      });
    }

    return NextResponse.json({ error: "Provide fileId or slot parameter" }, { status: 400 });

  } catch (err: any) {
    console.error("[Telegram File URL] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
