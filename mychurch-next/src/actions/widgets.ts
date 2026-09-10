"use server";

import { query } from "@/lib/db";
import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { hasAdminRoleOrPermission } from "@/lib/access-control";

export interface DashboardWidget {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    icon: string;
    color: string;
    config?: Record<string, any>;
}

export type Widget = DashboardWidget;

async function canManageWidgets(): Promise<boolean> {
    return hasAdminRoleOrPermission(["canManageWidgets"]);
}

export async function getWidgets(): Promise<DashboardWidget[]> {
    try {
        try {
            const supabase = await createAdminClient();
            const { data, error } = await supabase.from('widgets').select('*').order('name', { ascending: true });
            if (!error && data) return data as DashboardWidget[];
        } catch {
            // fallback
        }
        const { rows } = await query('SELECT * FROM widgets ORDER BY name ASC');
        return rows;
    } catch (error) {
        console.error('[Action] Error fetching widgets:', error);
        return [];
    }
}

export async function toggleWidget(id: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
    if (!(await canManageWidgets())) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        try {
            const supabase = await createAdminClient();
            const { error } = await supabase.from('widgets').update({ is_active: !currentStatus, updated_at: new Date().toISOString() }).eq('id', id);
            if (!error) {
                revalidatePath('/', 'layout');
                revalidatePath('/admin/widgets');
                return { success: true };
            }
        } catch {
            // fallback
        }
        await query('UPDATE widgets SET is_active = $1, updated_at = NOW() WHERE id = $2', [!currentStatus, id]);

        revalidatePath('/', 'layout');
        revalidatePath('/admin/widgets');

        return { success: true };
    } catch (error) {
        console.error('[Action] Error toggling widget:', error);
        return { success: false, error: 'Failed to update widget status' };
    }
}

export async function getWatermarkConfig(): Promise<any> {
    try {
        try {
            const supabase = await createAdminClient();
            const { data, error } = await supabase.from('widgets').select('config').eq('id', 'w_watermark').maybeSingle();
            if (!error && data) return data.config || {};
        } catch {
            // fallback
        }
        const { rows } = await query("SELECT config FROM widgets WHERE id = 'w_watermark'");
        return rows[0]?.config || {};
    } catch (error) {
        console.error('[Action] Error fetching watermark config:', error);
        return {};
    }
}

export async function getGlobalPopupData(): Promise<{ isActive: boolean, config: any }> {
    try {
        try {
            const supabase = await createAdminClient();
            const { data, error } = await supabase.from('widgets').select('is_active, config').eq('id', 'w_global_popup').maybeSingle();
            if (!error && data) {
                return {
                    isActive: !!data.is_active,
                    config: data.config || {}
                };
            }
        } catch {
            // fallback
        }
        const { rows } = await query("SELECT is_active, config FROM widgets WHERE id = 'w_global_popup'");
        return {
            isActive: rows[0]?.is_active || false,
            config: rows[0]?.config || {}
        };
    } catch (error) {
        console.error('[Action] Error fetching global popup data:', error);
        return { isActive: false, config: {} };
    }
}

export async function updateWidgetConfig(id: string, config: any): Promise<boolean> {
    if (!(await canManageWidgets())) {
        return false;
    }

    try {
        try {
            const supabase = await createAdminClient();
            const { error } = await supabase.from('widgets').update({ config, updated_at: new Date().toISOString() }).eq('id', id);
            if (!error) {
                revalidatePath('/', 'layout');
                revalidatePath('/admin/widgets');
                return true;
            }
        } catch {
            // fallback
        }
        await query('UPDATE widgets SET config = $1, updated_at = NOW() WHERE id = $2', [config, id]);

        revalidatePath('/', 'layout');
        revalidatePath('/admin/widgets');

        return true;
    } catch (error) {
        console.error('[Action] Error updating widget config:', error);
        return false;
    }
}
