import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

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
  if (target === 'media') return `/media/${normalized}`;
  return `/api/serve/${normalized}`;
}

export async function POST(request: Request) {
  try {
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
    await writeFile(filePath, buffer);

    const relativePath = safeFolder ? `${safeFolder}/${filename}` : filename;
    const url = buildPublicUrl(target, relativePath);

    return NextResponse.json({
      success: true,
      url,
      target,
      folder: safeFolder,
      path: relativePath,
      mimeType,
    });
  } catch (error: any) {
    console.error('[Broadcast Asset Upload Error]', error?.message);
    return NextResponse.json({ success: false, error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
