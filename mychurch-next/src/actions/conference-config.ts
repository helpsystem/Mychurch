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

async function ensureConferenceConfigSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS church_conference_settings (
            id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
            enabled BOOLEAN DEFAULT FALSE,
            fcc_public_key VARCHAR(255) DEFAULT '',
            fcc_private_key VARCHAR(255) DEFAULT '',
            dial_in_number VARCHAR(100) DEFAULT '',
            access_code VARCHAR(100) DEFAULT '',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);
    
    // Add columns if they don't exist for robustness (backward compatibility)
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS fcc_public_key VARCHAR(255) DEFAULT '';`);
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS fcc_private_key VARCHAR(255) DEFAULT '';`);
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS dial_in_number VARCHAR(100) DEFAULT '';`);
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS access_code VARCHAR(100) DEFAULT '';`);
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`);
}

export async function getConferenceConfig(): Promise<ConferenceConfig> {
    try {
        await ensureConferenceConfigSchema();
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
        await ensureConferenceConfigSchema();
        
        // Fetch current values
        const current = await getConferenceConfig();
        
        const enabled = config.enabled !== undefined ? config.enabled : current.enabled;
        const fcc_public_key = config.fcc_public_key !== undefined ? config.fcc_public_key : current.fcc_public_key;
        const fcc_private_key = config.fcc_private_key !== undefined ? config.fcc_private_key : current.fcc_private_key;
        const dial_in_number = config.dial_in_number !== undefined ? config.dial_in_number : current.dial_in_number;
        const access_code = config.access_code !== undefined ? config.access_code : current.access_code;

        await query(`
            INSERT INTO church_conference_settings (id, enabled, fcc_public_key, fcc_private_key, dial_in_number, access_code, updated_at)
            VALUES ('default', $1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE
            SET 
                enabled = EXCLUDED.enabled,
                fcc_public_key = EXCLUDED.fcc_public_key,
                fcc_private_key = EXCLUDED.fcc_private_key,
                dial_in_number = EXCLUDED.dial_in_number,
                access_code = EXCLUDED.access_code,
                updated_at = EXCLUDED.updated_at;
        `, [
            enabled,
            fcc_public_key,
            fcc_private_key,
            dial_in_number,
            access_code
        ]);
        
        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        console.error("Error saving conference config:", error);
        return { success: false, error: error.message };
    }
}

export async function testFccConnection(publicKey: string, privateKey: string) {
    try {
        if (!publicKey || !privateKey) {
            return { success: false, error: "کلید عمومی و خصوصی نمی‌توانند خالی باشند." };
        }
        
        const auth = Buffer.from(`${publicKey.trim()}:${privateKey.trim()}`).toString('base64');
        const res = await fetch("https://www.freeconferencecall.com/api/v4/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
        });

        if (!res.ok) {
            const status = res.status;
            let detail = "";
            try {
                const data = await res.json();
                detail = data.error_description || data.error || JSON.stringify(data);
            } catch {
                detail = await res.text().catch(() => "");
            }
            return { 
                success: false, 
                error: `خطا در احراز هویت با سرور (کد وضعیت: ${status}). پیام خطا: ${detail || 'مشخصات نامعتبر'}` 
            };
        }

        const data = await res.json();
        if (data.access_token) {
            return { success: true, message: "ارتباط با موفقیت برقرار شد! توکن دسترسی دریافت گردید." };
        } else {
            return { success: false, error: "توکن معتبری از سرور دریافت نشد." };
        }
    } catch (e: any) {
        return { success: false, error: `خطا در برقراری ارتباط با شبکه: ${e.message}` };
    }
}
