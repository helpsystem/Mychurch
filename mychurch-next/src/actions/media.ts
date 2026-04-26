"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface MediaAsset {
    name: string;
    url: string;
    type: "image" | "video" | "audio" | "other";
    size: number;
    createdAt: number;
    inGallery?: boolean;
    galleryId?: string;
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
        let assets: MediaAsset[] = [];

        for (const file of files) {
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
        assets = assets.sort((a, b) => b.createdAt - a.createdAt);

        // Check which images are in the Public Gallery
        const supabase = await createClient();
        const { data: galleryImages } = await supabase
            .from('gallery_images')
            .select('id, src');

        if (galleryImages) {
            assets = assets.map(asset => {
                const galleryEntry = galleryImages.find(g => g.src === asset.url);
                return {
                    ...asset,
                    inGallery: !!galleryEntry,
                    galleryId: galleryEntry?.id
                };
            });
        }

        return assets;
    } catch (error) {
        console.error("Error listing media files:", error);
        return [];
    }
}

export async function deleteMediaFile(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
        const safeFilename = path.basename(filename);
        const filePath = path.join(MEDIA_DIR, safeFilename);

        const publicUrl = `/media/${safeFilename}`;
        
        // Remove from local file system
        await fs.unlink(filePath);

        // Remove from gallery DB if it exists
        const supabase = await createClient();
        await supabase.from('gallery_images').delete().eq('src', publicUrl);

        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting media file:", error);
        return { success: false, error: error.message };
    }
}

export async function toggleGalleryVisibility(asset: MediaAsset): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        if (asset.inGallery && asset.galleryId) {
            // Remove from gallery
            const { error } = await supabase.from('gallery_images').delete().eq('id', asset.galleryId);
            if (error) throw error;
        } else {
            // Add to gallery
            const { error } = await supabase.from('gallery_images').insert({
                src: asset.url,
                width: 800, // Default fallback
                height: 600, // Default fallback
                title: asset.name.split('.')[0],
            });
            if (error) throw error;
        }

        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true };
    } catch (error: any) {
        console.error("Error toggling gallery visibility:", error);
        return { success: false, error: error.message };
    }
}
