"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface AIConfig {
    id: string;
    active_provider: 'studio' | 'vertex';
    gemini_api_key: string | null;
    vertex_project_id: string | null;
    vertex_region: string;
    vertex_service_account: any | null;
    updated_at?: string;
}

export async function getAIConfig(): Promise<AIConfig> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('church_ai_settings')
        .select('*')
        .eq('id', 'default')
        .single();
    
    if (error || !data) {
        // Fallback to env if not in DB (first time)
        return {
            id: 'default',
            active_provider: 'studio',
            gemini_api_key: process.env.GEMINI_API_KEY || null,
            vertex_project_id: null,
            vertex_region: 'us-central1',
            vertex_service_account: null
        };
    }
    
    return data as AIConfig;
}

export async function updateAIConfig(config: Partial<AIConfig>) {
    const supabase = await createClient();
    
    // Auth check (Admin only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    const { error } = await supabase
        .from('church_ai_settings')
        .upsert({
            id: 'default',
            ...config,
            updated_at: new Date().toISOString()
        });
    
    if (error) throw new Error(error.message);
    
    revalidatePath('/admin/settings');
    return { success: true };
}
