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

        let images = data.map(row => ({
            id: row.id,
            src: normalizeAssetUrl(row.src),
            width: row.width || 800,
            height: row.height || 600,
            title: row.title || undefined,
            description: row.description || undefined,
            category: row.category || undefined,
            visibility: row.visibility || 'admin',
            uploaded_at: row.uploaded_at,
        }));

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
