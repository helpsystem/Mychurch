"use server";

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'audio');

// Ensure the directory exists
function ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}

export async function uploadToLocal(buffer: Buffer, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
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

export async function moveExternalToLocal(externalUrl: string, songTitle: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        console.log(`[Storage] Moving external link to local: ${externalUrl}`);
        
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
