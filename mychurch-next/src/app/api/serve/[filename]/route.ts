import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request, context: any) {
    try {
        const { filename } = await context.params;
        const filePath = join(process.cwd(), 'public', 'uploads', filename);

        const fileBuffer = await readFile(filePath);

        const ext = filename.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        if (ext === 'webp') mimeType = 'image/webp';
        if (ext === 'gif') mimeType = 'image/gif';
        if (ext === 'svg') mimeType = 'image/svg+xml';
        if (ext === 'mp4') mimeType = 'video/mp4';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (e) {
        return new NextResponse('File not found', { status: 404 });
    }
}
