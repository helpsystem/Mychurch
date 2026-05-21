import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { hasRoleOrPermission } from '@/lib/access-control';

export async function POST(request: Request) {
    try {
        const allowed = await hasRoleOrPermission(['canManageMedia', 'canManageWorship']);
        if (!allowed) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const folder = data.get('folder') as string;
        let mediaDir = join(process.cwd(), 'public', 'media');
        
        if (folder) {
            // sanitize folder path
            const cleanFolder = folder.replace(/\\/g, '/').replace(/[^a-zA-Z0-9/ _.-]/g, '');
            mediaDir = join(mediaDir, cleanFolder);
        }

        // Ensure media directory exists
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
        let relativePath = filename;
        if (folder) {
            const cleanFolder = folder.replace(/\\/g, '/').replace(/[^a-zA-Z0-9/ _.-]/g, '');
            relativePath = `${cleanFolder}/${filename}`;
        }
        const parts = relativePath.split('/');
        const encoded = parts.map(p => encodeURIComponent(p)).join('/');

        return NextResponse.json({ success: true, url: `/api/serve/media/${encoded}` });
    } catch (error: any) {
        console.error('Error uploading media file:', error);
        return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
    }
}
