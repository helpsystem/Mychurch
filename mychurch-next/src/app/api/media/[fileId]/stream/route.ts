import { NextRequest, NextResponse } from "next/server";
import { getBot } from "@/services/telegram";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        const fileId = (await params).fileId;
        if (!fileId) {
            return new NextResponse("Missing fileId", { status: 400 });
        }

        const { bot, telegramConfig } = getBot();
        
        // 1. Get file path from Telegram
        const file = await bot.api.getFile(fileId);
        if (!file || !file.file_path) {
            return new NextResponse("File not found in Telegram", { status: 404 });
        }

        // 2. Construct the direct download URL
        const downloadUrl = `https://api.telegram.org/file/bot${telegramConfig.BOT_TOKEN}/${file.file_path}`;

        // 3. Fetch the file stream from Telegram
        const telegramResponse = await fetch(downloadUrl);
        if (!telegramResponse.ok) {
            return new NextResponse("Failed to download from Telegram", { status: 502 });
        }

        // 4. Determine Content-Type (fallback to application/octet-stream)
        const contentType = telegramResponse.headers.get("content-type") || "application/octet-stream";
        const contentLength = telegramResponse.headers.get("content-length");

        // 5. Pipe the stream to the client with aggressive caching
        const headers: HeadersInit = {
            "Content-Type": contentType,
            // Cache for 30 days (public) since Telegram files are immutable
            "Cache-Control": "public, max-age=2592000, immutable",
            // Allow cross-origin for potential embedded players
            "Access-Control-Allow-Origin": "*",
        };

        if (contentLength) {
            headers["Content-Length"] = contentLength;
        }
        
        // Return stream directly to Next.js Response
        return new NextResponse(telegramResponse.body, { headers });
    } catch (error: any) {
        console.error("❌ [Media Proxy] Error streaming file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
