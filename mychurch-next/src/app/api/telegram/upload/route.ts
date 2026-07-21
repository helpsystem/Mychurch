import { NextResponse } from "next/server";
import { uploadToTelegramStorage } from "@/services/telegram";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload to Telegram Storage CDN
    const telegramFile = await uploadToTelegramStorage(
      buffer,
      file.name,
      title || file.name
    );

    // 3. (Optional) Save IDs to PostgreSQL
    // await query('INSERT INTO media (title, storage_provider, file_id, message_id) VALUES ($1, $2, $3, $4)', 
    //   [title || file.name, 'TELEGRAM', telegramFile.fileId, telegramFile.messageId]);

    return NextResponse.json({ success: true, telegramFile });
  } catch (error) {
    console.error("[Telegram Upload API] Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
