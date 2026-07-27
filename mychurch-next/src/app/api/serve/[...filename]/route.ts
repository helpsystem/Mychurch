import { NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@/utils/supabase/server';
import { getTelegramFileStream } from '@/services/telegram';

import { getTelegramFileStreamUrl } from '@/services/telegram';

const urlCache = new Map<string, { url: string, expires: number }>();

async function getCachedTelegramUrl(fileId: string) {
    const cached = urlCache.get(fileId);
    if (cached && cached.expires > Date.now()) return cached.url;
    
    const url = await getTelegramFileStreamUrl(fileId);
    // Cache for 30 minutes (Telegram file URLs expire after ~1 hour)
    urlCache.set(fileId, { url, expires: Date.now() + 1000 * 60 * 30 });
    return url;
}

export async function GET(request: Request, context: any) {
    try {
        const params = await context.params;
        const filenameParts = Array.isArray(params?.filename) ? params.filename : [params?.filename];
        const safeParts = filenameParts
            .filter(Boolean)
            .map((part: string) => decodeURIComponent(part))
            .map((part: string) => part.replace(/\.{2,}/g, '').replace(/^\/+|\/+$/g, ''));

        if (safeParts.length === 0) {
            return new NextResponse('File not found', { status: 404 });
        }

        const [rootCandidate, ...rest] = safeParts;

        // Handle Telegram Cloud Storage Serve
        if (rootCandidate === 'cloud') {
            const id = rest[0];
            if (!id) return new NextResponse('File not found', { status: 404 });

            const supabase = await createClient();
            const { data: asset } = await supabase.from('media_library').select('*').eq('id', id).single();
            if (!asset || (!asset.telegram_message_id && !asset.telegram_file_id)) {
                return new NextResponse('File not found in cloud storage', { status: 404 });
            }

            try {
                // High-Speed Telegram Bot API CDN for files < 20MB
                if (asset.telegram_file_id && asset.size < 20 * 1024 * 1024) {
                    try {
                        const botUrl = await getCachedTelegramUrl(asset.telegram_file_id);
                        const botResponse = await fetch(botUrl);
                        if (botResponse.ok && botResponse.body) {
                            return new NextResponse(botResponse.body, {
                                headers: {
                                    'Content-Type': asset.mime_type || botResponse.headers.get('content-type') || 'application/octet-stream',
                                    'Content-Length': String(asset.size || botResponse.headers.get('content-length') || 0),
                                    'Cache-Control': 'public, max-age=31536000, immutable',
                                    'Accept-Ranges': 'bytes'
                                }
                            });
                        }
                    } catch (botErr) {
                        console.warn("Bot API fetch failed, falling back to MTProto:", botErr);
                    }
                }

                if (!asset.telegram_message_id) {
                     return new NextResponse('File not found in cloud storage (no MTProto fallback)', { status: 404 });
                }

                // Fallback / Large File Streaming via MTProto
                const iterable = await getTelegramFileStream(asset.telegram_message_id);
                
                // Convert AsyncIterable to ReadableStream
                const stream = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of iterable) {
                                controller.enqueue(new Uint8Array(chunk));
                            }
                            controller.close();
                        } catch (err) {
                            console.error("Stream error:", err);
                            controller.error(err);
                        }
                    }
                });

                return new NextResponse(stream, {
                    headers: {
                        'Content-Type': asset.mime_type || 'application/octet-stream',
                        'Content-Length': String(asset.size || 0),
                        'Cache-Control': 'public, max-age=31536000, immutable',
                        'Accept-Ranges': 'none'
                    }
                });
            } catch (err) {
                console.error("Cloud serve error:", err);
                return new NextResponse('Error serving cloud file', { status: 500 });
            }
        }

        const useMediaRoot = rootCandidate === 'media';
        const relativeParts = useMediaRoot ? rest : safeParts;

        if (relativeParts.length === 0) {
            return new NextResponse('File not found', { status: 404 });
        }

        const filePath = useMediaRoot
            ? join(process.cwd(), 'public', 'media', ...relativeParts)
            : join(process.cwd(), 'public', 'uploads', ...relativeParts);
        const fileStat = await stat(filePath);

        const fileName = relativeParts[relativeParts.length - 1];
        const ext = fileName.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        if (ext === 'webp') mimeType = 'image/webp';
        if (ext === 'gif') mimeType = 'image/gif';
        if (ext === 'svg') mimeType = 'image/svg+xml';
        if (ext === 'mp4') mimeType = 'video/mp4';
        if (ext === 'webm') mimeType = 'video/webm';
        if (ext === 'mov') mimeType = 'video/quicktime';

        const isVideo = mimeType.startsWith('video/');

        if (isVideo) {
            const range = request.headers.get('range');

            if (!range) {
                const stream = createReadStream(filePath);
                return new NextResponse(stream as any, {
                    headers: {
                        'Content-Type': mimeType,
                        'Content-Length': String(fileStat.size),
                        'Accept-Ranges': 'bytes',
                        'Cache-Control': 'public, max-age=31536000, immutable',
                    },
                });
            }

            const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
            const start = Number(startStr);
            const end = endStr ? Number(endStr) : fileStat.size - 1;

            if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end >= fileStat.size || start > end) {
                return new NextResponse('Invalid range', { status: 416 });
            }

            const chunkSize = end - start + 1;
            const stream = createReadStream(filePath, { start, end });

            return new NextResponse(stream as any, {
                status: 206,
                headers: {
                    'Content-Type': mimeType,
                    'Content-Length': String(chunkSize),
                    'Content-Range': `bytes ${start}-${end}/${fileStat.size}`,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            });
        }

        const fileBuffer = await readFile(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch {
        return new NextResponse('File not found', { status: 404 });
    }
}
