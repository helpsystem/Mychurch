"use server"

import { createClient } from "@/utils/supabase/server";

export interface GalleryImage {
    id: string;
    src: string;       // public URL
    width: number;
    height: number;
    title?: string;
    description?: string;
    category?: string;
    uploaded_at?: string;
}

export async function fetchGalleryImages(): Promise<GalleryImage[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("uploaded_at", { ascending: false });

    if (error || !data) {
        console.error("[gallery] Error fetching gallery images:", error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        src: row.src,
        width: row.width || 800,
        height: row.height || 600,
        title: row.title || undefined,
        description: row.description || undefined,
        category: row.category || undefined,
        uploaded_at: row.uploaded_at,
    }));
}

export async function deleteGalleryImage(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (error) {
        console.error("[gallery] Delete error:", error);
        throw new Error("Failed to delete image");
    }
}
