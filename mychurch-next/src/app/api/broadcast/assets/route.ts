import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, relative } from 'path';
import { hasRoleOrPermission } from '@/lib/access-control';

type AssetType = 'image' | 'video' | 'audio' | 'other';

type AssetItem = {
  name: string;
  path: string;
  url: string;
  source: 'uploads' | 'media' | 'images';
  type: AssetType;
  size: number;
  modifiedAt: number;
};

const ROOTS = {
  uploads: join(process.cwd(), 'public', 'uploads'),
  media: join(process.cwd(), 'public', 'media'),
  images: join(process.cwd(), 'public', 'images'),
} as const;

function detectType(fileName: string): AssetType {
  const lower = fileName.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg|avif)$/i.test(lower)) return 'image';
  if (/\.(mp4|webm|mov|m4v|mkv)$/i.test(lower)) return 'video';
  if (/\.(mp3|wav|ogg|m4a|aac)$/i.test(lower)) return 'audio';
  return 'other';
}

function toPublicUrl(source: AssetItem['source'], relPath: string): string {
  const normalized = relPath.replace(/\\/g, '/');
  if (source === 'uploads') return `/api/serve/${normalized}`;
  if (source === 'media') return `/api/serve/media/${normalized}`;
  return `/images/${normalized}`;
}

async function walk(dirPath: string, baseDir: string, source: AssetItem['source']): Promise<AssetItem[]> {
  const dirents = await readdir(dirPath, { withFileTypes: true });
  const result: AssetItem[] = [];

  for (const item of dirents) {
    if (item.name.startsWith('.')) continue;
    const absPath = join(dirPath, item.name);

    if (item.isDirectory()) {
      const nested = await walk(absPath, baseDir, source);
      result.push(...nested);
      continue;
    }

    if (!item.isFile()) continue;

    const fileStat = await stat(absPath);
    const relPath = relative(baseDir, absPath).replace(/\\/g, '/');
    result.push({
      name: item.name,
      path: relPath,
      url: toPublicUrl(source, relPath),
      source,
      type: detectType(item.name),
      size: fileStat.size,
      modifiedAt: fileStat.mtimeMs,
    });
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const allowed = await hasRoleOrPermission(['canManageMedia', 'canManageWorship']);
    if (!allowed) {
      return NextResponse.json({ success: false, assets: [], error: 'Unauthorized' }, { status: 403 });
    }

    const wantedType = (req.nextUrl.searchParams.get('type') || 'all').toLowerCase();
    const sourceParam = (req.nextUrl.searchParams.get('source') || 'all').toLowerCase();

    const sources = (['uploads', 'media', 'images'] as const).filter((s) => sourceParam === 'all' || sourceParam === s);

    const allAssets: AssetItem[] = [];
    for (const source of sources) {
      const rootPath = ROOTS[source];
      if (!existsSync(rootPath)) continue;
      const items = await walk(rootPath, rootPath, source);
      allAssets.push(...items);
    }

    const filtered = allAssets
      .filter((a) => (wantedType === 'all' ? true : a.type === wantedType))
      .sort((a, b) => b.modifiedAt - a.modifiedAt)
      .slice(0, 500);

    return NextResponse.json({ success: true, assets: filtered });
  } catch (error: any) {
    console.error('[Broadcast Assets GET Error]', error?.message);
    return NextResponse.json({ success: false, assets: [], error: error?.message || 'Failed to list assets' }, { status: 500 });
  }
}
