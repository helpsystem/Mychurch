import { NextResponse } from "next/server";
import { getTelegramFileStreamUrl } from "@/services/telegram";

// Cache URL lookups for 45 minutes (Bot API URLs expire in ~1h)
const urlCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 45 * 60 * 1000;

export const dynamic = "force-dynamic";

/**
 * GET /api/telegram/stream/[fileId]
 * 
 * Streams a Telegram file by its file_id.
 * Supports HTTP Range requests for video/audio seeking.
 * 
 * For files < 20MB: uses Bot API direct URL (fast)
 * For files > 20MB: proxies through our server via MTProto
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return new NextResponse("File ID required", { status: 400 });
    }

    // Check cache first
    const cached = urlCache.get(fileId);
    const now = Date.now();

    let streamUrl: string;

    if (cached && now - cached.ts < CACHE_TTL) {
      streamUrl = cached.url;
    } else {
      streamUrl = await getTelegramFileStreamUrl(fileId);
      urlCache.set(fileId, { url: streamUrl, ts: now });
    }

    // Forward Range header for video/audio seeking support
    const range = request.headers.get("range");
    const fetchHeaders: Record<string, string> = {};
    if (range) {
      fetchHeaders["Range"] = range;
    }

    // Proxy the stream from Telegram
    const upstream = await fetch(streamUrl, { headers: fetchHeaders });

    if (!upstream.ok && upstream.status !== 206) {
      // Try to refresh the URL if it failed (might have expired)
      try {
        const freshUrl = await getTelegramFileStreamUrl(fileId);
        urlCache.set(fileId, { url: freshUrl, ts: now });
        const retryUpstream = await fetch(freshUrl, { headers: fetchHeaders });
        return buildProxyResponse(retryUpstream);
      } catch {
        return new NextResponse("Failed to fetch from Telegram", {
          status: upstream.status,
        });
      }
    }

    return buildProxyResponse(upstream);
  } catch (error) {
    console.error("[Telegram Stream] Error:", error);
    return new NextResponse("Stream error", { status: 500 });
  }
}

function buildProxyResponse(upstream: Response): NextResponse {
  const responseHeaders = new Headers();

  // Forward essential streaming headers
  const forwardHeaders = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ];

  for (const h of forwardHeaders) {
    const val = upstream.headers.get(h);
    if (val) responseHeaders.set(h, val);
  }

  // Ensure accept-ranges is set for video seeking
  if (!responseHeaders.has("accept-ranges")) {
    responseHeaders.set("accept-ranges", "bytes");
  }

  // Long cache for immutable media — Telegram file_ids are stable
  responseHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
