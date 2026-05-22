"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ConferenceConfig {
    id: string;
    enabled: boolean;
    fcc_public_key: string;
    fcc_private_key: string;
    dial_in_number: string;
    access_code: string;
    updated_at: string;
}

const DEFAULT_CONFIG: ConferenceConfig = {
    id: 'default',
    enabled: false,
    fcc_public_key: '',
    fcc_private_key: '',
    dial_in_number: '',
    access_code: '',
    updated_at: new Date().toISOString(),
};

export async function getConferenceConfig(): Promise<ConferenceConfig> {
    try {
        const res = await query("SELECT * FROM church_conference_settings WHERE id = 'default' LIMIT 1");
        if (res.rows.length === 0) {
            // Insert default if not exists
            await query(`
                INSERT INTO church_conference_settings (id, enabled, fcc_public_key, fcc_private_key, dial_in_number, access_code)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['default', false, '', '', '', '']);
            return DEFAULT_CONFIG;
        }
        return res.rows[0] as ConferenceConfig;
    } catch (e) {
        console.error("Error getting conference config:", e);
        return DEFAULT_CONFIG;
    }
}

export async function saveConferenceConfig(config: Partial<ConferenceConfig>) {
    try {
        await query(`
            UPDATE church_conference_settings
            SET 
                enabled = COALESCE($1, enabled),
                fcc_public_key = COALESCE($2, fcc_public_key),
                fcc_private_key = COALESCE($3, fcc_private_key),
                dial_in_number = COALESCE($4, dial_in_number),
                access_code = COALESCE($5, access_code),
                updated_at = NOW()
            WHERE id = 'default'
        `, [
            config.enabled,
            config.fcc_public_key,
            config.fcc_private_key,
            config.dial_in_number,
            config.access_code
        ]);
        
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("Error saving conference config:", error);
        return { success: false, error: error.message };
    }
}
