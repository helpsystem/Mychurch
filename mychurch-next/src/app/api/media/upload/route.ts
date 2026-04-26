import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure media directory exists
        const mediaDir = join(process.cwd(), 'public', 'media');
        try {
            await mkdir(mediaDir, { recursive: true });
        } catch (e) {
            // Already exists
        }

        // Generate a WordPress-like friendly filename while preserving extension.
        const original = file.name || 'media-file';
        const dotIndex = original.lastIndexOf('.');
        const ext = dotIndex > -1 ? original.substring(dotIndex) : '';
        const baseRaw = dotIndex > -1 ? original.substring(0, dotIndex) : original;
        const originalName = baseRaw
            .replace(/[^a-zA-Z0-9 _.-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[-.]+|[-.]+$/g, '') || 'media-file';
        const filename = `${originalName}-${Date.now()}${ext}`;
        const filePath = join(mediaDir, filename);

        await writeFile(filePath, buffer);

        // Return API-served URL to avoid nginx static path conflicts.
        return NextResponse.json({ success: true, url: `/api/serve/media/${encodeURIComponent(filename)}` });
    } catch (error: any) {
        console.error('Error uploading media file:', error);
        return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
    }
}
