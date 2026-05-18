"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { hasRoleOrPermission, normalizeAssetUrl } from "@/lib/access-control";

export interface MediaAsset {
    name: string;
    url: string;
    type: "image" | "video" | "audio" | "other";
    size: number;
    createdAt: number;
    folder?: string;
    visibility?: 'public' | 'admin' | 'user';
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

async function canAccessMediaLibrary(): Promise<boolean> {
    return hasRoleOrPermission(["canManageMedia", "canManageWorship"]);
}

function buildGalleryUrlVariants(fileName: string): string[] {
    const normalized = buildMediaUrl(fileName);
    const legacy = `/media/${fileName}`;
    return [normalized, legacy];
}

function getFileType(filename: string): MediaAsset["type"] {
    const ext = path.extname(filename).toLowerCase();
    if (ext.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return "image";
    if (ext.match(/\.(mp4|webm|mkv|mov)$/)) return "video";
    if (ext.match(/\.(mp3|wav|ogg|m4a)$/)) return "audio";
    return "other";
}

export async function listMediaFiles(): Promise<MediaAsset[]> {
    if (!(await canAccessMediaLibrary())) {
        return [];
    }

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
                    createdAt: stats.birthtimeMs || stats.mtimeMs, // fallback for Linux
                    folder: '',
                    visibility: 'admin'
                });
            }
        }

        // Sort newest first
        assets = assets.sort((a, b) => b.createdAt - a.createdAt);

        // Check which images are in the Public Gallery and get their visibility
        const supabase = await createClient();
        const { data: galleryImages } = await supabase
            .from('gallery_images')
            .select('id, src, visibility, folder');

        if (galleryImages) {
            assets = assets.map(asset => {
                const variants = buildGalleryUrlVariants(asset.name);
                const galleryEntry = galleryImages.find(g => variants.includes(normalizeAssetUrl(g.src)));
                return {
                    ...asset,
                    inGallery: !!galleryEntry,
                    galleryId: galleryEntry?.id,
                    visibility: (galleryEntry?.visibility as 'public' | 'admin' | 'user' | null) || 'admin',
                    folder: galleryEntry?.folder || ''
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
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const safeFilename = path.basename(filename);
        const filePath = path.join(MEDIA_DIR, safeFilename);

        const urlVariants = buildGalleryUrlVariants(safeFilename);
        
        // Remove from local file system
        await fs.unlink(filePath);

        // Remove from gallery DB if it exists
        const supabase = await createClient();
        await supabase.from('gallery_images').delete().in('src', urlVariants);

        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting media file:", error);
        return { success: false, error: error.message };
    }
}

export async function renameMediaFile(oldFilename: string, requestedName: string): Promise<{ success: boolean; newName?: string; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

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
            .in("src", buildGalleryUrlVariants(safeOldFilename));

        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true, newName: candidate };
    } catch (error: any) {
        console.error("Error renaming media file:", error);
        return { success: false, error: error.message };
    }
}

export async function toggleGalleryVisibility(asset: MediaAsset): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const supabase = await createClient();
        const normalizedAssetUrl = normalizeAssetUrl(asset.url);

        if (asset.inGallery && asset.galleryId) {
            // Remove from gallery
            const { error } = await supabase.from('gallery_images').delete().eq('id', asset.galleryId);
            if (error) throw error;
        } else if (asset.inGallery && !asset.galleryId) {
            const fallbackName = path.basename(normalizedAssetUrl);
            const { error } = await supabase
                .from('gallery_images')
                .delete()
                .in('src', buildGalleryUrlVariants(fallbackName));
            if (error) throw error;
        } else {
            // Add to gallery
            const { error } = await supabase.from('gallery_images').insert({
                src: normalizedAssetUrl,
                width: 800, // Default fallback
                height: 600, // Default fallback
                title: asset.name.split('.')[0],
                visibility: 'admin',
                folder: ''
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

export async function updateMediaVisibility(
    assetUrl: string,
    visibility: 'public' | 'admin' | 'user'
): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const supabase = await createClient();
        const normalizedUrl = normalizeAssetUrl(assetUrl);

        if (!assetUrl) {
            return { success: false, error: "Invalid asset URL" };
        }

        // Update visibility in gallery_images
        const { error } = await supabase
            .from('gallery_images')
            .update({ visibility })
            .in('src', buildGalleryUrlVariants(path.basename(assetUrl)));

        if (error) throw error;

        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating media visibility:", error);
        return { success: false, error: error.message };
    }
}

export async function canViewMediaByVisibility(visibility?: 'public' | 'admin' | 'user'): Promise<boolean> {
    if (!visibility || visibility === 'public') {
        return true;
    }

    if (visibility === 'admin') {
        return hasRoleOrPermission(['Admin', 'Leader']);
    }

    if (visibility === 'user') {
        // Any authenticated user can view 'user' visibility
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    }

    return false;
}
