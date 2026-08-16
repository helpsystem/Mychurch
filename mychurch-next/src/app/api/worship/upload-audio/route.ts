import { NextResponse } from "next/server";
import { uploadToTelegramStorage } from "@/services/telegram";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/worship/upload-audio
 * 
 * Uploads a worship song audio file to Telegram Storage CDN
 * and saves the file_id back to the song record.
 * 
 * Body: FormData with:
 *   - file: File (MP3/M4A/OGG)
 *   - songId: string (UUID of church_worship_songs record)
 *   - title: string (optional caption)
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const songId = formData.get("songId") as string | null;
    const title = (formData.get("title") as string) || undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/m4a", "audio/ogg", "audio/wav", "audio/x-m4a"];
    if (!allowedTypes.some(t => file.type.includes(t.split("/")[1]))) {
      return NextResponse.json({ error: "Only audio files allowed" }, { status: 400 });
    }

    // Max 200MB
    if (file.size > 200 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 200MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[worship/upload-audio] Uploading "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)}MB) to Telegram...`);

    const telegramResult = await uploadToTelegramStorage(
      buffer,
      file.name,
      `🎵 ${title || file.name}`
    );

    console.log(`[worship/upload-audio] ✅ Uploaded. file_id=${telegramResult.fileId} messageId=${telegramResult.messageId}`);

    // Save file_id to DB if songId provided
    if (songId) {
      try {
        await query(
          `UPDATE church_worship_songs 
           SET telegram_file_id = $1, telegram_message_id = $2, audio_health_status = 'ok', audio_health_checked_at = now()
           WHERE id = $3`,
          [telegramResult.fileId, telegramResult.messageId, songId]
        );
        console.log(`[worship/upload-audio] Saved telegram_file_id to song ${songId}`);
      } catch (dbErr) {
        console.error("[worship/upload-audio] Failed to save to DB:", dbErr);
        // Don't fail — file was uploaded successfully
      }
    }

    return NextResponse.json({
      success: true,
      fileId: telegramResult.fileId,
      messageId: telegramResult.messageId,
      fileSize: telegramResult.fileSize,
      streamUrl: `/api/telegram/stream/${telegramResult.fileId}`,
    });

  } catch (err: any) {
    console.error("[worship/upload-audio] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
