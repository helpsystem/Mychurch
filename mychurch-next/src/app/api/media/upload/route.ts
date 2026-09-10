import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { hasRoleOrPermission } from '@/lib/access-control';
import { uploadToTelegramStorage } from '@/services/telegram';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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
        const mimeType = file.type || 'application/octet-stream';

        const folder = data.get('folder') as string;
        let mediaDir = join(process.cwd(), 'public', 'media');
        
        const cleanFolder = folder ? folder.replace(/\\/g, '/').replace(/[^a-zA-Z0-9/ _.-]/g, '') : '';
        if (cleanFolder) {
            mediaDir = join(mediaDir, cleanFolder);
        }

        // Ensure local media directory exists for fast serving
        try {
            await mkdir(mediaDir, { recursive: true });
        } catch (e) {
            // Already exists
        }

        // Generate a friendly filename while preserving extension
        const original = file.name || 'media-file';
        const dotIndex = original.lastIndexOf('.');
        const ext = dotIndex > -1 ? original.substring(dotIndex) : '';
        const baseRaw = dotIndex > -1 ? original.substring(0, dotIndex) : original;
        const originalName = baseRaw
            .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF _.-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[-.]+|[-.]+$/g, '') || 'media-file';
        const filename = `${originalName}-${Date.now()}${ext}`;
        const filePath = join(mediaDir, filename);

        // 1. Save to local disk cache
        await writeFile(filePath, buffer);

        // 2. Upload to Telegram Cloud Storage
        let uploadResult: any = null;
        try {
            uploadResult = await uploadToTelegramStorage(buffer, filename, `Media Library: ${filename}`);
        } catch (storageErr) {
            console.warn('[Media Upload] Telegram storage upload warning:', storageErr);
        }

        // 3. Register and verify record in Supabase Database (media_library)
        let dbId: string | null = null;
        try {
            const supabase = await createClient();
            const { data: inserted, error: dbError } = await supabase.from('media_library').insert({
                file_name: filename,
                telegram_file_id: uploadResult?.fileId || null,
                telegram_message_id: uploadResult?.messageId || null,
                mime_type: mimeType,
                size: file.size,
                folder: cleanFolder || '',
                visibility: 'admin'
            }).select('id').single();

            if (dbError) {
                console.error('[Media Upload] Database insert error:', dbError);
            } else if (inserted) {
                dbId = inserted.id;
            }
        } catch (dbErr) {
            console.error('[Media Upload] Supabase client error:', dbErr);
        }

        // 4. Return serving URL and metadata
        let relativePath = filename;
        if (cleanFolder) {
            relativePath = `${cleanFolder}/${filename}`;
        }
        const parts = relativePath.split('/');
        const encoded = parts.map(p => encodeURIComponent(p)).join('/');

        // 5. Log activity
        try {
            const { logUserActivity } = await import('@/actions/audit');
            await logUserActivity({
                action: 'UPLOAD_MEDIA',
                resourceType: 'media',
                resourceId: dbId || filename,
                details: {
                    filename,
                    folder: cleanFolder,
                    size: file.size,
                    mimeType,
                    storage: uploadResult?.fileId ? 'telegram' : 'local'
                }
            });
        } catch (auditErr) {
            console.warn('[Media Upload] Audit log failed:', auditErr);
        }

        revalidatePath('/admin/media');
        revalidatePath('/gallery');

        return NextResponse.json({
            success: true,
            url: dbId ? `/api/serve/cloud/${dbId}` : `/api/serve/media/${encoded}`,
            localUrl: `/api/serve/media/${encoded}`,
            cloudUrl: dbId ? `/api/serve/cloud/${dbId}` : undefined,
            id: dbId,
            filename,
            size: file.size,
            mimeType,
            registeredInDatabase: !!dbId,
            registeredInStorage: !!uploadResult?.fileId
        });
    } catch (error: any) {
        console.error('Error uploading media file:', error);
        return NextResponse.json({ success: false, error: error.message || 'Upload failed' }, { status: 500 });
    }
}
