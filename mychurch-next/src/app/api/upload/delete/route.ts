import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join, normalize } from 'path';
import { hasRoleOrPermission } from '@/lib/access-control';

const uploadsBaseDir = join(process.cwd(), 'public', 'uploads');

function resolveSafeUploadPath(relPath: string): string | null {
    const clean = (relPath || '').replace(/\.{2,}/g, '').replace(/^\/+/, '').trim();
    if (!clean) return null;

    const resolved = normalize(join(uploadsBaseDir, clean));
    const normalizedBase = normalize(uploadsBaseDir + '\\');
    if (!resolved.startsWith(normalizedBase) && resolved !== normalize(uploadsBaseDir)) {
        return null;
    }

    return resolved;
}

export async function DELETE(req: NextRequest) {
    try {
        const allowed = await hasRoleOrPermission(['canManageWidgets', 'canManageMedia', 'canManageWorship']);
        if (!allowed) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const relPath = String(body?.path || '');
        const absPath = resolveSafeUploadPath(relPath);

        if (!absPath) {
            return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
        }

        await unlink(absPath);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.message || 'Delete failed' }, { status: 500 });
    }
}
