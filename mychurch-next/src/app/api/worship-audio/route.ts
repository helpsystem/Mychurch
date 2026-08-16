import { NextResponse } from 'next/server';
import { getTelegramFileStreamUrl } from '@/services/telegram';
import { createClient } from '@/utils/supabase/server';

// Cache Telegram URLs for 45min (they expire after ~1h)
const urlCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 45 * 60 * 1000;

async function getCachedTelegramUrl(fileId: string): Promise<string> {
    const cached = urlCache.get(fileId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.url;
    const url = await getTelegramFileStreamUrl(fileId);
    urlCache.set(fileId, { url, ts: Date.now() });
    return url;
}

/**
 * GET /api/worship-audio?url=<encoded-url>
 * 
 * Routes audio based on source:
 * - Telegram file_id  → streams via Telegram CDN (priority)
 * - HiDrive WebDAV URL → proxies with auth (legacy fallback)  
 * - /worship/audio/*  → local file serve
 * 
 * Supports HTTP Range requests for audio seeking.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const songId = searchParams.get('songId'); // optional: resolve by song ID

    // ── Option 1: Resolve by song ID from DB ──────────────────────────────
    if (songId && !rawUrl) {
        try {
            const supabase = await createClient();
            const { data: song } = await supabase
                .from('church_worship_songs')
                .select('audio_url, telegram_file_id')
                .eq('id', songId)
                .single();
            
            if (song?.telegram_file_id) {
                const tgUrl = await getCachedTelegramUrl(song.telegram_file_id);
                return proxyAudio(request, tgUrl);
            }
            if (song?.audio_url) {
                return routeAudioUrl(request, song.audio_url);
            }
        } catch (err) {
            console.error('[worship-audio] DB lookup failed:', err);
        }
        return new NextResponse('Song audio not found', { status: 404 });
    }

    if (!rawUrl) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    return routeAudioUrl(request, rawUrl);
}

async function routeAudioUrl(request: Request, url: string): Promise<NextResponse> {
    // ── Telegram file_id (not a URL) ──────────────────────────────────────
    // Telegram file_ids don't start with http and have specific format
    if (!url.startsWith('http') && !url.startsWith('/') && url.length > 20) {
        try {
            const tgUrl = await getCachedTelegramUrl(url);
            return proxyAudio(request, tgUrl);
        } catch (err) {
            console.error('[worship-audio] Telegram file_id resolve failed:', err);
            return new NextResponse('Failed to resolve Telegram audio', { status: 502 });
        }
    }

    // ── HiDrive WebDAV (legacy) ───────────────────────────────────────────
    if (url.startsWith('https://webdav.hidrive.ionos.com/')) {
        const username = process.env.HIDRIVE_USER || 'adminchurch';
        const password = process.env.HIDRIVE_PASSWORD || 'SamanBbB1989bBb@';
        const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
        return proxyAudio(request, url, { Authorization: authHeader });
    }

    // ── Local /worship/audio/* ────────────────────────────────────────────
    if (url.startsWith('/worship/audio/') || url.startsWith('/audio/')) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const fullUrl = `${appUrl}${url}`;
        return proxyAudio(request, fullUrl);
    }

    // ── Other absolute URLs ───────────────────────────────────────────────
    if (url.startsWith('http')) {
        return proxyAudio(request, url);
    }

    return new NextResponse('Unsupported audio source', { status: 400 });
}

async function proxyAudio(
    request: Request, 
    sourceUrl: string, 
    extraHeaders: Record<string, string> = {}
): Promise<NextResponse> {
    try {
        const fetchHeaders: Record<string, string> = { ...extraHeaders };
        
        // Forward Range header for audio seeking
        const range = request.headers.get('range');
        if (range) fetchHeaders['Range'] = range;

        const response = await fetch(sourceUrl, { headers: fetchHeaders });

        if (!response.ok && response.status !== 206) {
            return new NextResponse(
                `Upstream audio error: ${response.status}`,
                { status: response.status }
            );
        }

        const headers = new Headers();
        const forwardHeaders = [
            'content-type', 'content-length', 'content-range',
            'accept-ranges', 'date', 'last-modified',
        ];
        for (const h of forwardHeaders) {
            const val = response.headers.get(h);
            if (val) headers.set(h, val);
        }

        // Ensure range requests work
        if (!headers.has('accept-ranges')) {
            headers.set('accept-ranges', 'bytes');
        }

        // Long cache — audio files don't change often
        headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    } catch (error) {
        console.error('[worship-audio] Proxy error:', error);
        return new NextResponse('Audio proxy error', { status: 500 });
    }
}
