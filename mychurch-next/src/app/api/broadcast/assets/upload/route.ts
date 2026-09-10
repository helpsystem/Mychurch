import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { hasRoleOrPermission } from '@/lib/access-control';
import { uploadToTelegramStorage } from '@/services/telegram';
import { createAdminClient, createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

type UploadTarget = 'uploads' | 'media';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
]);

function sanitizeSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, '');
}

function sanitizeFolder(input: string): string {
  return input
    .split('/')
    .map((part) => sanitizeSegment(part.trim()))
    .filter(Boolean)
    .join('/');
}

function resolveTargetRoot(target: UploadTarget): string {
  if (target === 'media') return join(process.cwd(), 'public', 'media');
  return join(process.cwd(), 'public', 'uploads');
}

function buildPublicUrl(target: UploadTarget, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  if (target === 'media') return `/api/serve/media/${normalized}`;
  return `/api/serve/${normalized}`;
}

export async function POST(request: Request) {
  try {
    const allowed = await hasRoleOrPermission(['canManageMedia', 'canManageWorship']);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetRaw = (formData.get('target') as string | null) || 'uploads';
    const folderRaw = (formData.get('folder') as string | null) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ success: false, error: 'Unsupported file type.' }, { status: 400 });
    }

    const target: UploadTarget = targetRaw === 'media' ? 'media' : 'uploads';
    const safeFolder = sanitizeFolder(folderRaw);
    const targetRoot = resolveTargetRoot(target);
    const targetDir = safeFolder ? join(targetRoot, safeFolder) : targetRoot;

    await mkdir(targetDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    const filename = `asset-${Date.now()}-${safeName}`;
    const filePath = join(targetDir, filename);

    // 1. Save locally for fast disk caching / OBS serving
    await writeFile(filePath, buffer);

    const relativePath = safeFolder ? `${safeFolder}/${filename}` : filename;
    const localUrl = buildPublicUrl(target, relativePath);

    // 2. Upload to Telegram Cloud Storage
    let uploadResult: any = null;
    try {
      uploadResult = await uploadToTelegramStorage(buffer, filename, `Broadcast Asset: ${filename}`);
    } catch (storageErr) {
      console.warn('[Broadcast Asset Upload] Telegram storage upload warning:', storageErr);
    }

    // 3. Register and verify record in Supabase Database (media_library)
    let dbId: string | null = null;
    try {
      let supabase: any;
      try {
        supabase = await createAdminClient();
      } catch {
        supabase = await createClient();
      }

      const { data: inserted, error: dbError } = await supabase.from('media_library').insert({
        file_name: filename,
        telegram_file_id: uploadResult?.fileId || null,
        telegram_message_id: uploadResult?.messageId || null,
        mime_type: mimeType,
        size: file.size,
        folder: safeFolder || 'broadcast',
        visibility: 'admin'
      }).select('id').single();

      if (dbError) {
        console.error('[Broadcast Asset Upload] Database insert error:', dbError);
      } else if (inserted) {
        dbId = inserted.id;
      }
    } catch (dbErr) {
      console.error('[Broadcast Asset Upload] Supabase client error:', dbErr);
    }

    revalidatePath('/admin/media');
    revalidatePath('/broadcast');

    // 4. Log activity
    try {
      const { logUserActivity } = await import('@/actions/audit');
      await logUserActivity({
        action: 'UPLOAD_MEDIA',
        resourceType: 'media',
        resourceId: dbId || filename,
        details: {
          filename,
          folder: safeFolder,
          target,
          size: file.size,
          mimeType,
          storage: uploadResult?.fileId ? 'telegram' : 'local'
        }
      });
    } catch (auditErr) {
      console.warn('[Broadcast Asset Upload] Audit log failed:', auditErr);
    }

    const primaryUrl = dbId ? `/api/serve/cloud/${dbId}` : localUrl;

    return NextResponse.json({
      success: true,
      url: primaryUrl,
      localUrl,
      cloudUrl: dbId ? `/api/serve/cloud/${dbId}` : undefined,
      id: dbId,
      target,
      folder: safeFolder,
      path: relativePath,
      mimeType,
      size: file.size,
      registeredInDatabase: !!dbId,
      registeredInStorage: !!uploadResult?.fileId,
    });
  } catch (error: any) {
    console.error('[Broadcast Asset Upload Error]', error?.message);
    return NextResponse.json({ success: false, error: error?.message || 'Upload failed' }, { status: 500 });
  }
}

