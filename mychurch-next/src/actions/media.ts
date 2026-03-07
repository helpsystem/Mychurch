"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

export interface MediaAsset {
    name: string;
    url: string;
    type: "image" | "video" | "audio" | "other";
    size: number;
    createdAt: number;
}

const MEDIA_DIR = path.join(process.cwd(), "public", "media");

async function ensureMediaDir() {
    try {
        await fs.mkdir(MEDIA_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

function getFileType(filename: string): MediaAsset["type"] {
    const ext = path.extname(filename).toLowerCase();
    if (ext.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return "image";
    if (ext.match(/\.(mp4|webm|mkv|mov)$/)) return "video";
    if (ext.match(/\.(mp3|wav|ogg|m4a)$/)) return "audio";
    return "other";
}

export async function listMediaFiles(): Promise<MediaAsset[]> {
    await ensureMediaDir();

    try {
        const files = await fs.readdir(MEDIA_DIR);
        const assets: MediaAsset[] = [];

        for (const file of files) {
            // Skip hidden files
            if (file.startsWith('.')) continue;

            const filePath = path.join(MEDIA_DIR, file);
            const stats = await fs.stat(filePath);

            if (stats.isFile()) {
                assets.push({
                    name: file,
                    url: `/media/${file}`,
                    type: getFileType(file),
                    size: stats.size,
                    createdAt: stats.birthtimeMs || stats.mtimeMs // fallback for Linux
                });
            }
        }

        // Sort newest first
        return assets.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error("Error listing media files:", error);
        return [];
    }
}

export async function deleteMediaFile(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Prevent path traversal attacks
        const safeFilename = path.basename(filename);
        const filePath = path.join(MEDIA_DIR, safeFilename);

        await fs.unlink(filePath);
        revalidatePath("/admin/media");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting media file:", error);
        return { success: false, error: error.message };
    }
}
