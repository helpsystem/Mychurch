"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/utils/supabase/server";
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
    id: string;
    telegram_file_id?: string;
    telegram_message_id?: number;
    isExternalLink?: boolean;
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

    try {
        const supabase = await createClient();
        
        // 1. Fetch all non-deleted media from media_library
        const { data: mediaLibraryAssets, error } = await supabase
            .from('media_library')
            .select('*')
            .or('is_deleted.is.null,is_deleted.eq.false')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Error fetching media from library:", error);
            return [];
        }

        // 2. Fetch gallery mapping to know which ones are in the public gallery
        const { data: galleryImages } = await supabase
            .from('gallery_images')
            .select('id, src, visibility, title, metadata, folder, uploaded_at');

        const assets: MediaAsset[] = (mediaLibraryAssets || []).map((asset) => {
            const isExternal = asset.folder === 'links' || asset.file_name?.startsWith('http');
            const url = isExternal ? asset.file_name : `/api/serve/cloud/${asset.id}`;
            const galleryEntry = galleryImages?.find(g => normalizeAssetUrl(g.src) === normalizeAssetUrl(url) || g.id === asset.id);
            
            return {
                name: asset.file_name,
                url: url,
                type: asset.mime_type?.startsWith('video/') ? 'video' : (asset.mime_type?.startsWith('audio/') ? 'audio' : 'image'),
                size: asset.size || 0,
                createdAt: new Date(asset.created_at).getTime(),
                folder: asset.folder || '',
                visibility: asset.visibility || 'admin',
                inGallery: !!galleryEntry,
                galleryId: galleryEntry?.id,
                telegram_file_id: asset.telegram_file_id,
                telegram_message_id: asset.telegram_message_id,
                id: asset.id,
                isExternalLink: isExternal
            };
        });

        // 3. Include external links / background items stored in gallery_images
        if (galleryImages && Array.isArray(galleryImages)) {
            for (const g of galleryImages) {
                const gUrl = normalizeAssetUrl(g.src);
                const exists = assets.some(a => normalizeAssetUrl(a.url) === gUrl || a.id === g.id);
                if (!exists && (g.src?.startsWith('http://') || g.src?.startsWith('https://') || g.folder === 'links')) {
                    const isVideo = g.metadata?.mediaType === 'video' || !!g.src.match(/\.(mp4|webm|mov|mkv)$/i) || g.src.includes('youtube.com') || g.src.includes('youtu.be');
                    const isAudio = g.metadata?.mediaType === 'audio' || !!g.src.match(/\.(mp3|wav|ogg|m4a)$/i);
                    assets.unshift({
                        name: g.title || g.src.split('/').pop()?.split('?')[0] || 'لینک مدیا',
                        url: g.src,
                        type: isVideo ? 'video' : (isAudio ? 'audio' : 'image'),
                        size: 0,
                        createdAt: g.uploaded_at ? new Date(g.uploaded_at).getTime() : Date.now(),
                        folder: g.folder || 'links',
                        visibility: g.visibility || 'public',
                        inGallery: true,
                        galleryId: g.id,
                        id: g.id,
                        isExternalLink: true
                    });
                }
            }
        }

        return assets;
    } catch (error) {
        console.error("Error listing media files:", error);
        return [];
    }
}

export async function addMediaLink(payload: {
    url: string;
    title?: string;
    mediaType?: 'image' | 'video' | 'audio';
    category?: string;
    visibility?: 'public' | 'admin' | 'user';
    description?: string;
}): Promise<{ success: boolean; asset?: MediaAsset; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        let rawUrl = payload.url?.trim() || "";
        if (rawUrl.startsWith('://')) {
            rawUrl = 'https' + rawUrl;
        } else if (rawUrl.startsWith('//')) {
            rawUrl = 'https:' + rawUrl;
        } else if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('/')) {
            rawUrl = 'https://' + rawUrl;
        }

        if (!rawUrl || (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('/'))) {
            return { success: false, error: "آدرس اینترنتی نامعتبر است. آدرس باید با http یا https آغاز گردد." };
        }

        let detectedType: 'image' | 'video' | 'audio' = payload.mediaType || 'image';
        if (!payload.mediaType) {
            if (rawUrl.match(/\.(mp4|webm|mov|mkv)$/i) || rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be') || rawUrl.includes('vimeo.com')) {
                detectedType = 'video';
            } else if (rawUrl.match(/\.(mp3|wav|ogg|m4a)$/i)) {
                detectedType = 'audio';
            } else {
                detectedType = 'image';
            }
        }

        const title = payload.title?.trim() || (detectedType === 'video' ? 'ویدیو پس‌زمینه' : 'تصویر پس‌زمینه');
        const visibility = payload.visibility || 'public';
        const category = payload.category || 'پس‌زمینه اسلاید';

        const supabase = await createAdminClient();

        // 1. Insert into gallery_images
        const { data: gData, error: gError } = await supabase
            .from('gallery_images')
            .insert({
                src: rawUrl,
                width: 1920,
                height: 1080,
                title: title,
                visibility: visibility,
                folder: 'links',
                metadata: {
                    mediaType: detectedType,
                    category: category,
                    description: payload.description || '',
                    isExternalLink: true,
                    addedAt: new Date().toISOString()
                }
            })
            .select()
            .single();

        if (gError) {
            console.error("Error inserting into gallery_images:", gError);
            throw gError;
        }

        // 2. Also register in media_library so it is tracked consistently
        try {
            await supabase.from('media_library').insert({
                file_name: title,
                mime_type: detectedType === 'video' ? 'video/mp4' : (detectedType === 'audio' ? 'audio/mpeg' : 'image/jpeg'),
                size: 0,
                folder: 'links',
                visibility: visibility
            });
        } catch (mErr) {
            console.warn("media_library link registration note:", mErr);
        }

        revalidatePath("/admin/media");
        revalidatePath("/gallery");

        const newAsset: MediaAsset = {
            id: gData.id,
            name: title,
            url: rawUrl,
            type: detectedType,
            size: 0,
            createdAt: Date.now(),
            folder: 'links',
            visibility: visibility,
            inGallery: true,
            galleryId: gData.id,
            isExternalLink: true
        };

        return { success: true, asset: newAsset };
    } catch (err: any) {
        console.error("addMediaLink error:", err);
        return { success: false, error: err.message || "Failed to add media link" };
    }
}

export async function deleteMediaFile(idOrFilename: string): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const supabase = await createClient();
        
        // Check if it's in gallery_images directly
        const { data: gAsset } = await supabase
            .from('gallery_images')
            .select('id, src')
            .or(`id.eq.${idOrFilename},src.eq.${idOrFilename}`)
            .maybeSingle();

        if (gAsset) {
            await supabase.from('gallery_images').delete().eq('id', gAsset.id);
        }

        // Find the record in media_library
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrFilename);
        let query = supabase.from('media_library').select('*');
        
        if (isUuid) {
            query = query.or(`id.eq.${idOrFilename},file_name.eq."${idOrFilename}"`);
        } else {
            query = query.eq('file_name', idOrFilename);
        }

        const { data: asset, error: fetchError } = await query.maybeSingle();
            
        if (!asset) {
            if (gAsset) {
                revalidatePath("/admin/media");
                revalidatePath("/gallery");
                return { success: true };
            }
            return { success: false, error: "File not found in database" };
        }

        // Safe Soft Delete: Move to Trash (preserves Telegram Cloud Storage and enables instant recovery)
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || 'operator';

        const { error: updateError } = await supabase
            .from('media_library')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: userEmail
            })
            .eq('id', asset.id);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        // Log action in Audit Logs
        const { logUserActivity } = await import('@/actions/audit');
        await logUserActivity({
            action: 'TRASH_MEDIA',
            resourceType: 'media',
            resourceId: asset.id,
            details: {
                fileName: asset.file_name,
                size: asset.size,
                deleted_by: userEmail
            }
        });

        revalidatePath("/admin/media");
        revalidatePath("/admin/trash");
        revalidatePath("/gallery");
        return { success: true };
    } catch (error: any) {
        console.error("Error moving media file to trash:", error);
        return { success: false, error: error.message };
    }
}


export async function renameMediaFile(idOrOldFilename: string, requestedName: string): Promise<{ success: boolean; newName?: string; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const cleanRequested = safeBaseName(requestedName);
        if (!cleanRequested) {
            return { success: false, error: "Invalid file name" };
        }

        const supabase = await createClient();
        
        // Find the record
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrOldFilename);
        let query = supabase.from('media_library').select('*');
        
        if (isUuid) {
            query = query.or(`id.eq.${idOrOldFilename},file_name.eq."${idOrOldFilename}"`);
        } else {
            query = query.eq('file_name', idOrOldFilename);
        }

        const { data: asset, error: fetchError } = await query.single();
            
        if (fetchError || !asset) {
            return { success: false, error: "File not found in database" };
        }

        // Update database record
        await supabase
            .from('media_library')
            .update({ file_name: cleanRequested })
            .eq('id', asset.id);

        // Keep gallery references in sync when filename changes.
        const url = `/api/serve/cloud/${asset.id}`;
        await supabase
            .from("gallery_images")
            .update({ title: cleanRequested })
            .eq("src", url);

        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true, newName: cleanRequested };
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

export async function createMediaFolder(folderName: string, parentFolder: string = ""): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        const supabase = await createClient();
        const cleanName = safeBaseName(folderName);
        if (!cleanName) return { success: false, error: "Invalid folder name" };
        
        const fullPath = parentFolder ? `${parentFolder}/${cleanName}` : cleanName;
        
        // Insert a dummy .keep file to instantiate the folder
        const { error } = await supabase.from('media_library').insert({
            file_name: '.keep',
            folder: fullPath,
            mime_type: 'application/x-empty',
            size: 0,
            visibility: 'admin'
        });
        
        if (error) throw error;
        
        revalidatePath("/admin/media");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating folder:", error);
        return { success: false, error: error.message };
    }
}

export async function moveMediaFile(id: string, newFolder: string): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('media_library')
            .update({ folder: newFolder })
            .eq('id', id);
            
        if (error) throw error;
        
        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true };
    } catch (error: any) {
        console.error("Error moving media:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteMediaFolder(folderPath: string): Promise<{ success: boolean; error?: string }> {
    if (!(await canAccessMediaLibrary())) {
        return { success: false, error: "Unauthorized" };
    }
    
    try {
        const supabase = await createClient();
        
        // Delete all files in this folder
        const { data: files } = await supabase.from('media_library')
            .select('*')
            .or(`folder.eq."${folderPath}",folder.like."${folderPath}/%"`);
            
        if (files && files.length > 0) {
            // Also delete from Telegram if applicable
            const { deleteFromTelegramStorage } = await import('@/services/telegram');
            for (const f of files) {
                if (f.telegram_message_id) {
                    await deleteFromTelegramStorage(f.telegram_message_id).catch(() => {});
                }
            }
            
            // Delete from media library
            await supabase.from('media_library')
                .delete()
                .or(`folder.eq."${folderPath}",folder.like."${folderPath}/%"`);
                
            // Clean up gallery
            for (const f of files) {
                const url = `/api/serve/cloud/${f.id}`;
                await supabase.from('gallery_images').delete().eq('src', url);
            }
        }
        
        revalidatePath("/admin/media");
        revalidatePath("/gallery");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting folder:", error);
        return { success: false, error: error.message };
    }
}
