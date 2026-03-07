"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface DashboardWidget {
    id: string;
    name: string;
    description: string;
    is_active: boolean;
    icon: string;
    color: string;
    config?: Record<string, any>;
}

// Alias for backward compat
export type Widget = DashboardWidget;

export async function getWidgets(): Promise<DashboardWidget[]> {
    try {
        const { rows } = await query('SELECT * FROM widgets ORDER BY name ASC');
        return rows;
    } catch (error) {
        console.error('[Action] Error fetching widgets:', error);
        return [];
    }
}

export async function toggleWidget(id: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        await query('UPDATE widgets SET is_active = $1, updated_at = NOW() WHERE id = $2', [!currentStatus, id]);

        // Revalidate paths that might rely on widgets
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
        const { rows } = await query("SELECT config FROM widgets WHERE id = 'w_watermark'");
        return rows[0]?.config || {};
    } catch (error) {
        console.error('[Action] Error fetching watermark config:', error);
        return {};
    }
}

export async function updateWidgetConfig(id: string, config: any): Promise<boolean> {
    try {
        await query('UPDATE widgets SET config = $1, updated_at = NOW() WHERE id = $2', [config, id]);

        // Revalidate paths
        revalidatePath('/', 'layout');
        revalidatePath('/admin/widgets');

        return true;
    } catch (error) {
        console.error('[Action] Error updating widget config:', error);
        return false;
    }
}
