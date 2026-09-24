"use server";

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { requireRole } from '@/utils/rbac';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'audio');
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200MB, matches /api/worship/upload-audio limit

// Ensure the directory exists
function ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}

export async function uploadToLocal(buffer: Buffer, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
    await requireRole(["Admin", "Leader", "Operator"]);

    if (buffer.length > MAX_UPLOAD_BYTES) {
        return { success: false, error: "File too large (max 200MB)" };
    }

    try {
        ensureUploadDir();
        
        let safeName = fileName.replace(/[^a-zA-Z0-9.\u0600-\u06FF_-]/g, '_');
        if (!safeName.toLowerCase().endsWith('.mp3') && !safeName.toLowerCase().endsWith('.m4a')) {
            safeName += '.mp3';
        }
        
        // Ensure uniqueness
        const uniqueId = crypto.randomBytes(4).toString('hex');
        const finalName = `${uniqueId}_${safeName}`;
        const filePath = path.join(UPLOAD_DIR, finalName);

        fs.writeFileSync(filePath, buffer);

        // Next.js serves from public directory at /
        const url = `/uploads/audio/${finalName}`;

        return { success: true, url };
    } catch (error: any) {
        console.error('[Storage] Upload error:', error);
        return { success: false, error: error.message };
    }
}

function isBlockedHost(hostname: string): boolean {
    const h = hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0' || h === '::1') return true;
    // IPv4 loopback / private / link-local ranges
    if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true;
    return false;
}

export async function moveExternalToLocal(externalUrl: string, songTitle: string): Promise<{ success: boolean; url?: string; error?: string }> {
    await requireRole(["Admin", "Leader", "Operator"]);

    try {
        console.log(`[Storage] Moving external link to local: ${externalUrl}`);

        let parsed: URL;
        try {
            parsed = new URL(externalUrl);
        } catch {
            return { success: false, error: "آدرس نامعتبر است" };
        }
        if (!['http:', 'https:'].includes(parsed.protocol) || isBlockedHost(parsed.hostname)) {
            return { success: false, error: "آدرس مجاز نیست" };
        }

        const fetchRes = await fetch(externalUrl);
        if (!fetchRes.ok) throw new Error(`Failed to fetch external audio (${fetchRes.status})`);
        
        const arrayBuffer = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fileName = `${songTitle.replace(/\s+/g, '_')}.mp3`;
        return await uploadToLocal(buffer, fileName);
    } catch (error: any) {
        console.error('[Storage] Conversion error:', error);
        return { success: false, error: error.message };
    }
}
