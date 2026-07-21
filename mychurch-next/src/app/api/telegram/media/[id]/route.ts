import { NextResponse } from "next/server";
import { getTelegramFileStreamUrl } from "@/services/telegram";
import { query } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // In a real scenario, you'd fetch the fileId from your DB where id = :id
    // For now, if the id passed is actually the Telegram file_id (which usually contains underscores/dashes),
    // or if we query it from a media table:
    // const res = await query('SELECT file_id FROM media WHERE id = $1', [id]);
    // const fileId = res.rows[0]?.file_id || id;
    const fileId = id; // Direct fileId passed for testing

    if (!fileId) {
      return new NextResponse("File ID not provided", { status: 400 });
    }

    const streamUrl = await getTelegramFileStreamUrl(fileId);

    // Redirect to Telegram CDN stream URL (1 hour validity)
    return NextResponse.redirect(streamUrl, {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Telegram Media Proxy] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
