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

function buildMediaUrl(relativeFilePath: string): string {
    // relativeFilePath might be "worship/file.jpg"
    // Serve media through API route to avoid direct nginx static path conflicts.
    const parts = relativeFilePath.split('/');
    const encoded = parts.map(p => encodeURIComponent(p)).join('/');
    return `/api/serve/media/${encoded}`;
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

async function walkDir(
    dir: string, 
    baseDir: string = dir, 
    urlBuilder: (relPath: string) => string
): Promise<{name: string, url: string, type: any, size: number, createdAt: number, folder: string, visibility: any, _relativePath: string}[]> {
    let results: any[] = [];
    try {
        const list = await fs.readdir(dir, { withFileTypes: true });
        for (const item of list) {
            if (item.name.startsWith('.')) continue;
            const res = path.resolve(dir, item.name);
            if (item.isDirectory()) {
                results = results.concat(await walkDir(res, baseDir, urlBuilder));
            } else {
                const relativePath = path.relative(baseDir, res).replace(/\\/g, '/');
                const stats = await fs.stat(res);
                results.push({
                    name: item.name,
                    url: urlBuilder(relativePath),
                    type: getFileType(item.name),
                    size: stats.size,
                    createdAt: stats.birthtimeMs || stats.mtimeMs,
                    folder: path.dirname(relativePath) === '.' ? '' : path.dirname(relativePath),
                    visibility: 'admin',
                    _relativePath: relativePath // temporary for matching variants
                });
            }
        }
    } catch (e) {
        // Directory might not exist or be empty
    }
    return results;
}

export async function listMediaFiles(): Promise<MediaAsset[]> {
    if (!(await canAccessMediaLibrary())) {
        return [];
    }

    await ensureMediaDir();
    const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch {}

    try {
        // 1. Walk media dir
        const rawMediaAssets = await walkDir(MEDIA_DIR, MEDIA_DIR, (relativePath) => buildMediaUrl(relativePath));

        // 2. Walk uploads dir
        const rawUploadsAssets = await walkDir(UPLOADS_DIR, UPLOADS_DIR, (relativePath) => {
            const parts = relativePath.split('/');
            const encoded = parts.map(p => encodeURIComponent(p)).join('/');
            return `/api/serve/${encoded}`;
        });

        // 3. Combine assets
        const rawAssets = [...rawMediaAssets, ...rawUploadsAssets];

        // Sort newest first
        const sortedRaw = rawAssets.sort((a, b) => b.createdAt - a.createdAt);

        // Check which images are in the Public Gallery and get their visibility
        const supabase = await createClient();
        const { data: galleryImages } = await supabase
            .from('gallery_images')
            .select('id, src, visibility, folder');

        let assets: MediaAsset[] = [];

        if (galleryImages) {
            assets = sortedRaw.map(asset => {
                const isMedia = asset.url.startsWith('/api/serve/media/');
                const variants = isMedia
                    ? buildGalleryUrlVariants(asset._relativePath)
                    : [
                        asset.url,
                        `/uploads/${asset._relativePath}`,
                        `/uploads/gallery/${asset.name}`,
                        `/uploads/sermons/${asset.name}`
                      ];
                const galleryEntry = galleryImages.find(g => variants.includes(normalizeAssetUrl(g.src)));
                const { _relativePath, ...cleanAsset } = asset;
                return {
                    ...cleanAsset,
                    inGallery: !!galleryEntry,
                    galleryId: galleryEntry?.id,
                    visibility: (galleryEntry?.visibility as 'public' | 'admin' | 'user' | null) || 'admin',
                    folder: asset.folder // keep actual filesystem folder
                };
            });
        } else {
            assets = sortedRaw.map(a => {
                const { _relativePath, ...cleanAsset } = a;
                return cleanAsset;
            });
        }

        return assets;
    } catch (error) {
        console.error("Error listing media files:", error);
        return [];
    }
}

export async function createMediaFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) return { success: false, error: "Unauthorized" };
    try {
        const cleanPath = safeBaseName(folderPath.replace(/\\/g, '/')).replace(/[^a-zA-Z0-9/ _.-]/g, '');
        if (!cleanPath) return { success: false, error: "Invalid folder name" };
        const fullPath = path.join(MEDIA_DIR, cleanPath);
        // Ensure path stays within MEDIA_DIR
        if (!fullPath.startsWith(MEDIA_DIR)) return { success: false, error: "Invalid path" };
        await fs.mkdir(fullPath, { recursive: true });
        revalidatePath("/admin/media");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteMediaFile(filename: string): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const relativePath = filename.replace(/\\/g, '/');
        let filePath = path.join(MEDIA_DIR, relativePath);
        let baseDir = MEDIA_DIR;
        let isUploads = false;

        try {
            await fs.access(filePath);
        } catch {
            const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
            const uploadsPath = path.join(UPLOADS_DIR, relativePath);
            try {
                await fs.access(uploadsPath);
                filePath = uploadsPath;
                baseDir = UPLOADS_DIR;
                isUploads = true;
            } catch {
                return { success: false, error: "File not found" };
            }
        }

        // Ensure path stays within baseDir
        if (!filePath.startsWith(baseDir)) return { success: false, error: "Invalid path" };

        const urlVariants = isUploads
            ? [
                `/api/serve/${relativePath}`, 
                `/uploads/${relativePath}`, 
                `/uploads/gallery/${path.basename(relativePath)}`
              ]
            : buildGalleryUrlVariants(relativePath);
        
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
        const relativePath = oldFilename.replace(/\\/g, '/');
        let oldPath = path.join(MEDIA_DIR, relativePath);
        let baseDir = MEDIA_DIR;
        let isUploads = false;

        try {
            await fs.access(oldPath);
        } catch {
            const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
            const uploadsPath = path.join(UPLOADS_DIR, relativePath);
            try {
                await fs.access(uploadsPath);
                oldPath = uploadsPath;
                baseDir = UPLOADS_DIR;
                isUploads = true;
            } catch {
                return { success: false, error: "File not found" };
            }
        }

        if (!oldPath.startsWith(baseDir)) return { success: false, error: "Invalid path" };

        const ext = path.extname(relativePath);
        const oldBase = path.basename(relativePath, ext);
        const cleanRequested = safeBaseName(requestedName) || oldBase;
        const targetBase = path.basename(cleanRequested, ext);

        if (!targetBase) {
            return { success: false, error: "Invalid file name" };
        }

        const dirName = path.dirname(relativePath);
        let candidate = dirName === '.' ? `${targetBase}${ext}` : `${dirName}/${targetBase}${ext}`;
        let counter = 1;
        while (candidate !== relativePath) {
            const candidatePath = path.join(baseDir, candidate);
            try {
                await fs.access(candidatePath);
                candidate = dirName === '.' ? `${targetBase}-${counter}${ext}` : `${dirName}/${targetBase}-${counter}${ext}`;
                counter += 1;
            } catch {
                break;
            }
        }

        if (candidate === relativePath) {
            return { success: true, newName: relativePath };
        }

        const newPath = path.join(baseDir, candidate);
        await fs.rename(oldPath, newPath);

        // Keep gallery references in sync when filename changes.
        const supabase = await createClient();
        const newUrl = isUploads
            ? `/api/serve/${candidate}`
            : buildMediaUrl(candidate);
        const urlVariants = isUploads
            ? [
                `/api/serve/${relativePath}`, 
                `/uploads/${relativePath}`, 
                `/uploads/gallery/${path.basename(relativePath)}`
              ]
            : buildGalleryUrlVariants(relativePath);

        await supabase
            .from("gallery_images")
            .update({
                src: newUrl,
                title: path.basename(candidate, ext),
            })
            .in("src", urlVariants);

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
