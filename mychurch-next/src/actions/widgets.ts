"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type Widget = {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    icon: string;
    color: string;
    config: Record<string, any>;
};

export async function getWidgets(): Promise<Widget[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('widgets')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Failed to fetch widgets:", error);
        return [];
    }
}

export async function toggleWidget(id: string, currentStatus: boolean) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('widgets')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/widgets');
        revalidatePath('/admin');
        return true;
    } catch (error) {
        console.error("Failed to toggle widget:", error);
        return false;
    }
}

export async function getWatermarkConfig() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('widgets')
            .select('config')
            .eq('id', 'w_watermark')
            .single();

        if (error || !data) return null;
        return data.config;
    } catch (error) {
        console.error("Failed to fetch watermark config:", error);
        return null; // Fallback to React component defaults
    }
}

export async function updateWidgetConfig(id: string, config: Record<string, any>) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('widgets')
            .update({ config })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/widgets');
        revalidatePath('/', 'layout'); // Revalidate everything so the watermark updates everywhere
        return true;
    } catch (error) {
        console.error("Failed to update widget config:", error);
        return false;
    }
}
