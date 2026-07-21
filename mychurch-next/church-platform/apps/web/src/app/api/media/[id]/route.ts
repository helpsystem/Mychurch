import { NextResponse } from "next/server";
import { getTelegramFileStreamUrl } from "@repo/telegram";
import { prisma } from "@repo/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Get the media record from the database
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media || !media.fileId) {
      return new NextResponse("Media not found", { status: 404 });
    }

    // 2. If it's stored in Telegram, generate the stream URL
    if (media.storageProvider === "TELEGRAM") {
      const streamUrl = await getTelegramFileStreamUrl(media.fileId);

      // 3. Proxy the stream or redirect (Redirect is faster and uses Telegram's bandwidth directly)
      // Since Telegram URLs are temporary (1 hour validity), redirecting is safe and offloads bandwidth
      return NextResponse.redirect(streamUrl, {
        headers: {
          "Cache-Control": "public, max-age=3600", // Cache the redirect for 1 hour
        },
      });
    }

    return new NextResponse("Storage provider not supported", { status: 500 });
  } catch (error) {
    console.error("[Media Proxy] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
