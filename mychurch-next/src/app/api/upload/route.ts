import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { hasRoleOrPermission } from '@/lib/access-control';

const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

function sanitizeFolder(input: string): string {
    return input
        .split('/')
        .map((segment) => segment.trim().replace(/[^a-zA-Z0-9_-]/g, ''))
        .filter(Boolean)
        .join('/');
}

export async function POST(request: Request) {
    try {
        const allowed = await hasRoleOrPermission(['canManageWidgets', 'canManageMedia', 'canManageWorship']);
        if (!allowed) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const folderRaw = (data.get('folder') as string | null) || '';

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const mimeType = file.type || 'application/octet-stream';
        if (!ALLOWED_MIME.has(mimeType)) {
            return NextResponse.json({ success: false, error: 'Unsupported file type. Use JPG/PNG/WEBP/GIF/SVG or MP4/WEBM/MOV.' }, { status: 400 });
        }

        const isVideo = mimeType.startsWith('video/');
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.size > maxSize) {
            return NextResponse.json({ success: false, error: `File too large. Max ${(maxSize / (1024 * 1024)).toFixed(0)}MB allowed.` }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeFolder = sanitizeFolder(folderRaw);

        // Ensure uploads directory exists
        const uploadsBaseDir = join(process.cwd(), 'public', 'uploads');
        const uploadsDir = safeFolder ? join(uploadsBaseDir, safeFolder) : uploadsBaseDir;
        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (e) {
            console.log("Uploads directory exists or could not be created:", e);
        }

        // Generate unique filename while preserving extension for media-type detection.
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
        const filename = `media-${Date.now()}-${safeName}`;
        const path = join(uploadsDir, filename);

        await writeFile(path, buffer);

        // Return the API Serving URL
        const relativePath = safeFolder ? `${safeFolder}/${filename}` : filename;

        return NextResponse.json({
            success: true,
            url: `/api/serve/${relativePath}`,
            path: relativePath,
            folder: safeFolder,
            mimeType,
            mediaType: isVideo ? 'video' : 'image',
            size: file.size,
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
