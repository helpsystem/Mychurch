import { NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

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
