import { NextResponse } from "next/server";
import { uploadToTelegramStorage } from "@/services/telegram";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { filePath } = await req.json();

    if (!filePath) {
      return NextResponse.json({ error: "No file path provided" }, { status: 400 });
    }

    // Secure the path (prevent directory traversal)
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, "");
    
    // The file manager passes paths relative to the project root (e.g. "public/uploads/...")
    // Make sure we resolve from process.cwd()
    const absolutePath = path.join(process.cwd(), normalizedPath);

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: "File not found on server" }, { status: 404 });
    }

    const stat = fs.statSync(absolutePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Path is not a file" }, { status: 400 });
    }

    // 1. Read file to buffer
    const buffer = fs.readFileSync(absolutePath);
    const fileName = path.basename(absolutePath);

    // 2. Upload to Telegram Storage CDN
    const telegramFile = await uploadToTelegramStorage(
      buffer,
      fileName,
      `🔄 Auto-Synced from Host\nFile: ${fileName}\nSize: ${(stat.size / 1024 / 1024).toFixed(2)} MB`
    );

    // 3. (Optional future step) Save IDs to PostgreSQL
    // await query('INSERT INTO media ...')

    return NextResponse.json({ success: true, telegramFile });
  } catch (error: any) {
    console.error("[Telegram Sync API] Error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
