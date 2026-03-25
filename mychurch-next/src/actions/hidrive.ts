"use server";

import { revalidatePath } from "next/cache";

const HIDRIVE_USER = process.env.HIDRIVE_USER || 'adminchurch';
const HIDRIVE_PASSWORD = process.env.HIDRIVE_PASSWORD || 'SamanBbB1989bBb@';
const HIDRIVE_BASE_URL = 'https://webdav.hidrive.ionos.com/public/worship/audio';

async function getAuthHeader() {
    return 'Basic ' + Buffer.from(`${HIDRIVE_USER}:${HIDRIVE_PASSWORD}`).toString('base64');
}

export async function uploadToHiDrive(buffer: Buffer, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const authHeader = await getAuthHeader();
        // Ensure filename is safe and has .mp3 extension if missing
        let safeName = fileName.replace(/[^a-zA-Z0-9.\u0600-\u06FF_-]/g, '_');
        if (!safeName.toLowerCase().endsWith('.mp3') && !safeName.toLowerCase().endsWith('.m4a')) {
            safeName += '.mp3';
        }

        const targetUrl = `${HIDRIVE_BASE_URL}/${encodeURIComponent(safeName)}`;

        console.log(`[HiDrive] Uploading to: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'PUT',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'audio/mpeg'
            },
            body: new Uint8Array(buffer)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
        }

        return { success: true, url: targetUrl };
    } catch (error: any) {
        console.error('[HiDrive] Upload error:', error);
        return { success: false, error: error.message };
    }
}

export async function moveExternalToInternal(externalUrl: string, songTitle: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        console.log(`[HiDrive] Moving external link to internal: ${externalUrl}`);
        
        // 1. Fetch the external file
        const fetchRes = await fetch(externalUrl);
        if (!fetchRes.ok) throw new Error(`Failed to fetch external audio (${fetchRes.status})`);
        
        const arrayBuffer = await fetchRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 2. Upload to HiDrive
        const fileName = `${songTitle.replace(/\s+/g, '_')}_${Date.now()}.mp3`;
        return await uploadToHiDrive(buffer, fileName);
    } catch (error: any) {
        console.error('[HiDrive] Conversion error:', error);
        return { success: false, error: error.message };
    }
}
