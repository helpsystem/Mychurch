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

        // Generate unique filename preserving extension but sanitizing original name
        const ext = file.name.substring(file.name.lastIndexOf('.'));
        const originalName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${originalName}-${Date.now()}${ext}`;
        const filePath = join(mediaDir, filename);

        await writeFile(filePath, buffer);

        // Return the public URL
        return NextResponse.json({ success: true, url: `/media/${filename}` });
    } catch (error: any) {
        console.error('Error uploading media file:', error);
        return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
    }
}
