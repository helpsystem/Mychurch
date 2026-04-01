import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

const uploadsBaseDir = join(process.cwd(), 'public', 'uploads');

function detectType(fileName: string): 'image' | 'video' | 'other' {
    const lower = fileName.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return 'image';
    if (/\.(mp4|webm|mov|m4v)$/.test(lower)) return 'video';
    return 'other';
}

async function walkFiles(dirPath: string, baseDir: string): Promise<Array<{ path: string; name: string; url: string; type: 'image' | 'video' | 'other'; size: number; modifiedAt: number }>> {
    const items = await readdir(dirPath, { withFileTypes: true });
    const result: Array<{ path: string; name: string; url: string; type: 'image' | 'video' | 'other'; size: number; modifiedAt: number }> = [];

    for (const item of items) {
        if (item.name.startsWith('.')) continue;
        const absPath = join(dirPath, item.name);

        if (item.isDirectory()) {
            const nested = await walkFiles(absPath, baseDir);
            result.push(...nested);
            continue;
        }

        const fileStat = await stat(absPath);
        const relPath = relative(baseDir, absPath).replace(/\\/g, '/');
        result.push({
            path: relPath,
            name: item.name,
            url: `/api/serve/${relPath}`,
            type: detectType(item.name),
            size: fileStat.size,
            modifiedAt: fileStat.mtimeMs,
        });
    }

    return result;
}

export async function GET(req: NextRequest) {
    try {
        const folder = (req.nextUrl.searchParams.get('folder') || '').replace(/\.{2,}/g, '').replace(/^\/+/, '').trim();
        const targetDir = folder ? join(uploadsBaseDir, folder) : uploadsBaseDir;

        const files = await walkFiles(targetDir, uploadsBaseDir);
        files.sort((a, b) => b.modifiedAt - a.modifiedAt);

        return NextResponse.json({ success: true, files });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.message || 'Failed to list uploads' }, { status: 500 });
    }
}
