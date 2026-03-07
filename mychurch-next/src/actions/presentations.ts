"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface Presentation {
    id: string;
    title: string;
    session_date: string;
    slides: any[];
    created_at?: string;
    updated_at?: string;
}

export async function getPresentations(): Promise<Presentation[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('presentations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Failed to fetch presentations:", error);
        return [];
    }
}

export async function savePresentation(presentation: Partial<Presentation>) {
    try {
        const supabase = await createClient();

        // If ID exists, update. Otherwise, insert.
        if (presentation.id) {
            const { error } = await supabase
                .from('presentations')
                .update({
                    title: presentation.title,
                    session_date: presentation.session_date,
                    slides: presentation.slides,
                    updated_at: new Date().toISOString()
                })
                .eq('id', presentation.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('presentations')
                .insert([{
                    title: presentation.title,
                    session_date: presentation.session_date,
                    slides: presentation.slides
                }]);
            if (error) throw error;
        }

        revalidatePath('/broadcast');
        revalidatePath('/broadcast/builder');
        return { success: true };
    } catch (error) {
        console.error("Failed to save presentation:", error);
        return { success: false, error };
    }
}

export async function deletePresentation(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('presentations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/broadcast');
        revalidatePath('/broadcast/builder');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete presentation:", error);
        return { success: false, error };
    }
}
