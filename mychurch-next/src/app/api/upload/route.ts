import { NextResponse } from 'next/server';
import { hasRoleOrPermission } from '@/lib/access-control';
import { uploadToTelegramStorage } from '@/services/telegram';
import { createClient } from '@/utils/supabase/server';

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

        const safeName = file.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF._-]/g, '');
        const filename = `media-${Date.now()}-${safeName}`;

        // Upload to Telegram Cloud Storage
        const uploadResult = await uploadToTelegramStorage(buffer, filename, `Uploaded via Church Platform: ${filename}`);

        // Save to Supabase media_library
        const supabase = await createClient();
        const { data: inserted, error: dbError } = await supabase.from('media_library').insert({
            file_name: filename,
            telegram_file_id: uploadResult.fileId,
            telegram_message_id: uploadResult.messageId,
            mime_type: mimeType,
            size: file.size,
            folder: safeFolder,
            visibility: 'admin'
        }).select('id').single();

        if (dbError || !inserted) {
            console.error("Database insert error:", dbError);
            return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
        }

        // Return the API Serving URL
        const relativePath = safeFolder ? `${safeFolder}/${filename}` : filename;

        return NextResponse.json({
            success: true,
            url: `/api/serve/cloud/${inserted.id}`,
            path: relativePath,
            folder: safeFolder,
            mimeType,
            mediaType: isVideo ? 'video' : 'image',
            size: file.size,
            id: inserted.id
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }
}
