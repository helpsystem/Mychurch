import { NextResponse } from "next/server";
import { uploadToTelegramStorage } from "@repo/telegram";
import { prisma } from "@repo/database";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const tenantId = formData.get("tenantId") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
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

    // 3. Save IDs to PostgreSQL via Prisma
    const mediaRecord = await prisma.media.create({
      data: {
        title: title || file.name,
        storageProvider: "TELEGRAM",
        fileId: telegramFile.fileId,
        messageId: telegramFile.messageId,
        fileSize: telegramFile.fileSize || file.size,
        mimeType: file.type,
        tenantId: tenantId,
      },
    });

    return NextResponse.json({ success: true, media: mediaRecord });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
