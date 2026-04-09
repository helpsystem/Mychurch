"use server";

import { query } from "@/lib/db";

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
    try {
        const { rows } = await query("SELECT * FROM church_ai_settings WHERE id = 'default'");
        const data = rows[0];
        
        if (!data) {
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
    } catch (e) {
        console.error('[AIConfig] Error fetching config:', e);
        return {
            id: 'default',
            active_provider: 'studio',
            gemini_api_key: process.env.GEMINI_API_KEY || null,
            vertex_project_id: null,
            vertex_region: 'us-central1',
            vertex_service_account: null
        };
    }
}

export async function updateAIConfig(config: Partial<AIConfig>) {
    const { createClient } = await import("@/utils/supabase/server");
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
    
    const { revalidatePath } = await import("next/cache");
    revalidatePath('/admin/settings');
    return { success: true };
}
