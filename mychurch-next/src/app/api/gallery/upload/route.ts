import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { hasRoleOrPermission } from '@/lib/access-control';
import { createAdminClient } from '@/utils/supabase/server';

const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
]);

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
    try {
        const allowed = await hasRoleOrPermission(['canManageMedia']);
        if (!allowed) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;
        const title = (data.get('title') as string | null) || '';
        const description = (data.get('description') as string | null) || '';
        const category = (data.get('category') as string | null) || 'همه';
        const visibility = (data.get('visibility') as string | null) || 'public';
        const folder = (data.get('folder') as string | null) || '';
        const widthRaw = (data.get('width') as string | null) || '';
        const heightRaw = (data.get('height') as string | null) || '';

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const mimeType = file.type || 'application/octet-stream';
        if (!ALLOWED_MIME.has(mimeType)) {
            return NextResponse.json({ success: false, error: 'Unsupported file type. Use JPG/PNG/WEBP/GIF/SVG.' }, { status: 400 });
        }

        if (file.size > MAX_IMAGE_SIZE) {
            return NextResponse.json({ success: false, error: `File too large. Max 10MB allowed.` }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure gallery directory exists
        const galleryDir = join(process.cwd(), 'public', 'uploads', 'gallery');
        try {
            await mkdir(galleryDir, { recursive: true });
        } catch (e) {
            // Already exists or can't write
        }

        // Clean name and create unique path
        const safeName = file.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF._-]/g, '');
        const filename = `gallery-${Date.now()}-${safeName}`;
        const filePath = join(galleryDir, filename);

        await writeFile(filePath, buffer);

        // Save metadata to database
        const dbSrc = `/uploads/gallery/${filename}`;
        const adminSupabase = await createAdminClient();
        const { data: dbData, error: dbError } = await adminSupabase
            .from("gallery_images")
            .insert({
                src: dbSrc,
                width: parseInt(widthRaw) || 1200,
                height: parseInt(heightRaw) || 800,
                title: title || null,
                description: description || null,
                category: category || "همه",
                visibility: visibility || "public",
                folder: folder || ""
            })
            .select();

        if (dbError) {
            console.error('[Gallery Upload API] Database insert failed:', dbError);
            return NextResponse.json({ success: false, error: 'Failed to record image metadata in database.' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            url: `/api/serve/gallery/${filename}`,
            src: dbSrc,
            image: dbData?.[0]
        });
    } catch (error: any) {
        console.error('Error in gallery upload route:', error);
        return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
    }
}
