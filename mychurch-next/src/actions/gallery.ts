"use server"

import { createClient } from "@/utils/supabase/server";
import { hasAdminRoleOrPermission, normalizeAssetUrl, hasRoleOrPermission } from "@/lib/access-control";

export interface GalleryImage {
    id: string;
    src: string;       // public URL
    width: number;
    height: number;
    title?: string;
    description?: string;
    category?: string;
    visibility?: 'public' | 'admin' | 'user';
    uploaded_at?: string;
    mediaType?: 'image' | 'video' | 'audio';
    isExternalLink?: boolean;
    metadata?: any;
}

export async function fetchGalleryImages(filterByVisibility = true): Promise<GalleryImage[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("gallery_images")
            .select("*")
            .order("uploaded_at", { ascending: false });

        if (error || !data) {
            console.error("[gallery] Error fetching gallery images:", error);
            return [];
        }

        let images: GalleryImage[] = data.map(row => {
            const isVideo = row.metadata?.mediaType === 'video' ||
                !!row.src?.match(/\.(mp4|webm|mov|mkv)$/i) ||
                row.src?.includes('youtube.com') ||
                row.src?.includes('youtu.be') ||
                row.src?.includes('vimeo.com');
            const isAudio = row.metadata?.mediaType === 'audio' || !!row.src?.match(/\.(mp3|wav|ogg|m4a)$/i);
            const mediaType: 'image' | 'video' | 'audio' = isVideo ? 'video' : (isAudio ? 'audio' : 'image');

            return {
                id: row.id,
                src: normalizeAssetUrl(row.src),
                width: row.width || 800,
                height: row.height || 600,
                title: row.title || undefined,
                description: row.description || row.metadata?.description || undefined,
                category: row.metadata?.category || row.category || undefined,
                visibility: row.visibility || 'admin',
                uploaded_at: row.uploaded_at,
                mediaType,
                isExternalLink: !!row.metadata?.isExternalLink || row.src?.startsWith('http'),
                metadata: row.metadata || undefined
            };
        });

        // Filter by visibility if requested
        if (filterByVisibility) {
            const isAdmin = await hasRoleOrPermission(['Admin', 'Leader']);
            const { data: { user } } = await supabase.auth.getUser();
            const isAuthenticated = !!user;

            images = images.filter(img => {
                if (img.visibility === 'public') return true;
                if (img.visibility === 'admin') return isAdmin;
                if (img.visibility === 'user') return isAuthenticated;
                return false;
            });
        }

        return images;
    } catch (e) {
        console.error("[gallery] Critical failure in fetchGalleryImages:", e);
        return [];
    }
}

export async function deleteGalleryImage(id: string) {
    const allowed = await hasAdminRoleOrPermission(["canManageMedia"]);
    if (!allowed) {
        throw new Error("Unauthorized");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) {
        console.error("[gallery] Delete error:", error);
        throw new Error("Failed to delete image");
    }
}
