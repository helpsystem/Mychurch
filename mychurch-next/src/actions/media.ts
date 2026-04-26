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

function buildMediaUrl(fileName: string): string {
    // Serve media through API route to avoid direct nginx static path conflicts.
    return `/api/serve/media/${encodeURIComponent(fileName)}`;
}

function safeBaseName(input: string): string {
    return input
        .trim()
        .replace(/[^a-zA-Z0-9 _.-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-. ]+|[-. ]+$/g, "")
        .slice(0, 120);
}

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
                    url: buildMediaUrl(file),
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

        const publicUrl = buildMediaUrl(safeFilename);
        
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

export async function renameMediaFile(oldFilename: string, requestedName: string): Promise<{ success: boolean; newName?: string; error?: string }> {
    try {
        const safeOldFilename = path.basename(oldFilename);
        const oldPath = path.join(MEDIA_DIR, safeOldFilename);

        const ext = path.extname(safeOldFilename);
        const oldBase = path.basename(safeOldFilename, ext);
        const cleanRequested = safeBaseName(requestedName) || oldBase;
        const targetBase = path.basename(cleanRequested, ext);

        if (!targetBase) {
            return { success: false, error: "Invalid file name" };
        }

        let candidate = `${targetBase}${ext}`;
        let counter = 1;
        while (candidate !== safeOldFilename) {
            const candidatePath = path.join(MEDIA_DIR, candidate);
            try {
                await fs.access(candidatePath);
                candidate = `${targetBase}-${counter}${ext}`;
                counter += 1;
            } catch {
                break;
            }
        }

        if (candidate === safeOldFilename) {
            return { success: true, newName: safeOldFilename };
        }

        const newPath = path.join(MEDIA_DIR, candidate);
        await fs.rename(oldPath, newPath);

        // Keep gallery references in sync when filename changes.
        const supabase = await createClient();
        await supabase
            .from("gallery_images")
            .update({
                src: buildMediaUrl(candidate),
                title: path.basename(candidate, ext),
            })
            .eq("src", buildMediaUrl(safeOldFilename));

        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true, newName: candidate };
    } catch (error: any) {
        console.error("Error renaming media file:", error);
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
