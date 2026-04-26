"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface MediaAsset {
    name: string;
    url: string;
    type: "image" | "video" | "audio" | "other";
    size: number;
    createdAt: number;
    inGallery?: boolean;
    galleryId?: string;
}

function getFileType(filename: string): MediaAsset["type"] {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (ext.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return "image";
    if (ext.match(/\.(mp4|webm|mkv|mov)$/)) return "video";
    if (ext.match(/\.(mp3|wav|ogg|m4a)$/)) return "audio";
    return "other";
}

export async function listMediaFiles(): Promise<MediaAsset[]> {
    const supabase = await createClient();

    try {
        // 1. Get files from Storage
        const { data: files, error: storageError } = await supabase
            .storage
            .from('media')
            .list('', {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' },
            });

        if (storageError) {
            console.error("Storage list error:", storageError);
            return [];
        }

        // Filter out the empty placeholder file (usually .emptyFolderPlaceholder)
        const validFiles = files?.filter(f => f.name !== '.emptyFolderPlaceholder') || [];

        // 2. Get public URLs and map types
        let assets: MediaAsset[] = validFiles.map(file => {
            const { data } = supabase.storage.from('media').getPublicUrl(file.name);
            return {
                name: file.name,
                url: data.publicUrl,
                type: getFileType(file.name),
                size: file.metadata?.size || 0,
                createdAt: new Date(file.created_at).getTime()
            };
        });

        // 3. Check which images are in the Public Gallery
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
        const supabase = await createClient();
        
        // 1. Check if it's in the gallery
        const { data } = supabase.storage.from('media').getPublicUrl(filename);
        if (data?.publicUrl) {
            await supabase.from('gallery_images').delete().eq('src', data.publicUrl);
        }

        // 2. Delete from storage
        const { error } = await supabase.storage.from('media').remove([filename]);
        
        if (error) {
            throw error;
        }

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
