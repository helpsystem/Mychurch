"use server";

import { query } from "@/lib/db";

export interface AIConfig {
    id: string;
    active_provider: 'studio' | 'vertex';
    gemini_api_key: string | null;
    vertex_project_id: string | null;
    vertex_region: string;
    vertex_service_account: any | null;
    worship_ai_enabled: boolean;
    worship_ai_schedule_mode: 'off' | 'manual' | 'daily' | 'weekly' | 'monthly';
    worship_ai_schedule_time: string;
    worship_ai_schedule_day_of_week: number;
    worship_ai_schedule_day_of_month: number;
    updated_at?: string;
}

const DEFAULT_AI_CONFIG: AIConfig = {
    id: 'default',
    active_provider: 'studio',
    gemini_api_key: process.env.GEMINI_API_KEY || null,
    vertex_project_id: null,
    vertex_region: 'us-central1',
    vertex_service_account: null,
    worship_ai_enabled: false,
    worship_ai_schedule_mode: 'off',
    worship_ai_schedule_time: '03:00',
    worship_ai_schedule_day_of_week: 1,
    worship_ai_schedule_day_of_month: 1,
};

function normalizeAIConfig(data?: Partial<AIConfig> | null): AIConfig {
    const scheduleMode = data?.worship_ai_schedule_mode;
    const scheduleHourMinute = typeof data?.worship_ai_schedule_time === 'string' && /^\d{2}:\d{2}$/.test(data.worship_ai_schedule_time)
        ? data.worship_ai_schedule_time
        : DEFAULT_AI_CONFIG.worship_ai_schedule_time;

    return {
        ...DEFAULT_AI_CONFIG,
        ...data,
        id: data?.id || 'default',
        active_provider: data?.active_provider === 'vertex' ? 'vertex' : 'studio',
        gemini_api_key: data?.gemini_api_key ?? DEFAULT_AI_CONFIG.gemini_api_key,
        vertex_project_id: data?.vertex_project_id ?? null,
        vertex_region: data?.vertex_region || DEFAULT_AI_CONFIG.vertex_region,
        vertex_service_account: data?.vertex_service_account ?? null,
        worship_ai_enabled: Boolean(data?.worship_ai_enabled),
        worship_ai_schedule_mode: scheduleMode && ['off', 'manual', 'daily', 'weekly', 'monthly'].includes(scheduleMode)
            ? scheduleMode
            : DEFAULT_AI_CONFIG.worship_ai_schedule_mode,
        worship_ai_schedule_time: scheduleHourMinute,
        worship_ai_schedule_day_of_week: Number.isFinite(Number(data?.worship_ai_schedule_day_of_week))
            ? Math.max(0, Math.min(6, Number(data?.worship_ai_schedule_day_of_week)))
            : DEFAULT_AI_CONFIG.worship_ai_schedule_day_of_week,
        worship_ai_schedule_day_of_month: Number.isFinite(Number(data?.worship_ai_schedule_day_of_month))
            ? Math.max(1, Math.min(31, Number(data?.worship_ai_schedule_day_of_month)))
            : DEFAULT_AI_CONFIG.worship_ai_schedule_day_of_month,
    };
}

async function ensureAISettingsSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS church_ai_settings (
            id TEXT PRIMARY KEY DEFAULT 'default',
            active_provider TEXT DEFAULT 'studio' CHECK (active_provider IN ('studio', 'vertex')),
            gemini_api_key TEXT,
            vertex_project_id TEXT,
            vertex_region TEXT DEFAULT 'us-central1',
            vertex_service_account JSONB,
            worship_ai_enabled BOOLEAN DEFAULT FALSE,
            worship_ai_schedule_mode TEXT DEFAULT 'off',
            worship_ai_schedule_time TEXT DEFAULT '03:00',
            worship_ai_schedule_day_of_week INTEGER DEFAULT 1,
            worship_ai_schedule_day_of_month INTEGER DEFAULT 1,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        )
    `);

    await query(`ALTER TABLE church_ai_settings ADD COLUMN IF NOT EXISTS worship_ai_enabled BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE church_ai_settings ADD COLUMN IF NOT EXISTS worship_ai_schedule_mode TEXT DEFAULT 'off'`);
    await query(`ALTER TABLE church_ai_settings ADD COLUMN IF NOT EXISTS worship_ai_schedule_time TEXT DEFAULT '03:00'`);
    await query(`ALTER TABLE church_ai_settings ADD COLUMN IF NOT EXISTS worship_ai_schedule_day_of_week INTEGER DEFAULT 1`);
    await query(`ALTER TABLE church_ai_settings ADD COLUMN IF NOT EXISTS worship_ai_schedule_day_of_month INTEGER DEFAULT 1`);

    await query(`
        INSERT INTO church_ai_settings (id, active_provider, worship_ai_enabled, worship_ai_schedule_mode, worship_ai_schedule_time, worship_ai_schedule_day_of_week, worship_ai_schedule_day_of_month)
        SELECT 'default', 'studio', FALSE, 'off', '03:00', 1, 1
        WHERE NOT EXISTS (SELECT 1 FROM church_ai_settings WHERE id = 'default')
    `);
}

export async function getAIConfig(): Promise<AIConfig> {
    try {
        await ensureAISettingsSchema();
        const { rows } = await query("SELECT * FROM church_ai_settings WHERE id = 'default'");
        const data = rows[0];
        
        if (!data) {
            return DEFAULT_AI_CONFIG;
        }
        
        return normalizeAIConfig(data as Partial<AIConfig>);
    } catch (e) {
        console.error('[AIConfig] Error fetching config:', e);
        return DEFAULT_AI_CONFIG;
    }
}

export async function updateAIConfig(config: Partial<AIConfig>) {
    await ensureAISettingsSchema();
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    
    // Auth check (Admin only)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const currentConfig = await getAIConfig();
    const nextConfig = normalizeAIConfig({ ...currentConfig, ...config });
    
    const { error } = await supabase
        .from('church_ai_settings')
        .upsert({
            ...nextConfig,
            updated_at: new Date().toISOString()
        });
    
    if (error) throw new Error(error.message);
    
    const { revalidatePath } = await import("next/cache");
    revalidatePath('/admin/settings');
    revalidatePath('/admin/worship');
    return { success: true };
}
