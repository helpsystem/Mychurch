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
    fcc_access_token?: string;
    fcc_refresh_token?: string;
    fcc_token_expires_at?: string;
    updated_at: string;
}

const DEFAULT_CONFIG: ConferenceConfig = {
    id: 'default',
    enabled: false,
    fcc_public_key: '',
    fcc_private_key: '',
    dial_in_number: '',
    access_code: '',
    fcc_access_token: '',
    fcc_refresh_token: '',
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
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS fcc_access_token VARCHAR(2048) DEFAULT '';`);
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS fcc_refresh_token VARCHAR(2048) DEFAULT '';`);
    await query(`ALTER TABLE church_conference_settings ADD COLUMN IF NOT EXISTS fcc_token_expires_at TIMESTAMP WITH TIME ZONE;`);
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
        const row = res.rows[0] as ConferenceConfig;
        return {
            ...row,
            fcc_access_token: row.fcc_access_token ? "PRESENT" : "",
            fcc_refresh_token: row.fcc_refresh_token ? "PRESENT" : ""
        };
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

export async function getValidFccAccessToken(): Promise<string | null> {
    try {
        const config = await getConferenceConfig();
        // Since getConferenceConfig masks key token fields, we need to query db directly for actual tokens
        const dbRes = await query("SELECT fcc_public_key, fcc_private_key, fcc_access_token, fcc_refresh_token, fcc_token_expires_at FROM church_conference_settings WHERE id = 'default' LIMIT 1");
        if (dbRes.rows.length === 0) return null;
        
        const { fcc_public_key, fcc_private_key, fcc_access_token, fcc_refresh_token, fcc_token_expires_at } = dbRes.rows[0];
        
        if (!fcc_public_key || !fcc_private_key || !fcc_access_token) return null;
        
        const expiresAt = fcc_token_expires_at ? new Date(fcc_token_expires_at).getTime() : 0;
        const now = Date.now();
        
        // If token expires in more than 5 minutes, use it
        if (expiresAt > now + 5 * 60 * 1000) {
            return fcc_access_token;
        }
        
        // Otherwise try to refresh if we have a refresh token
        if (fcc_refresh_token) {
            console.log("[FCC API] Stored access token expired. Refreshing token...");
            const auth = Buffer.from(`${fcc_public_key.trim()}:${fcc_private_key.trim()}`).toString('base64');
            const res = await fetch("https://www.freeconferencecall.com/api/v4/token", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: fcc_refresh_token
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.access_token) {
                    const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
                    const newRefreshToken = data.refresh_token || fcc_refresh_token;
                    
                    await query(`
                        UPDATE church_conference_settings
                        SET fcc_access_token = $1,
                            fcc_refresh_token = $2,
                            fcc_token_expires_at = $3
                        WHERE id = 'default'
                    `, [data.access_token, newRefreshToken, newExpiresAt]);
                    
                    console.log("[FCC API] Access token refreshed successfully.");
                    return data.access_token;
                }
            } else {
                console.error("[FCC API] Failed to refresh token, status:", res.status);
            }
        }
    } catch (err) {
        console.error("[FCC API] Error in getValidFccAccessToken:", err);
    }
    return null;
}

export async function exchangeFccCodeForToken(code: string, redirectUri: string) {
    try {
        const dbRes = await query("SELECT fcc_public_key, fcc_private_key FROM church_conference_settings WHERE id = 'default' LIMIT 1");
        if (dbRes.rows.length === 0) {
            return { success: false, error: "تنظیمات یافت نشد." };
        }
        const { fcc_public_key, fcc_private_key } = dbRes.rows[0];
        
        if (!fcc_public_key || !fcc_private_key) {
            return { success: false, error: "ابتدا کلیدهای عمومی و خصوصی API را ذخیره کنید." };
        }
        
        const auth = Buffer.from(`${fcc_public_key.trim()}:${fcc_private_key.trim()}`).toString('base64');
        const res = await fetch("https://www.freeconferencecall.com/api/v4/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: redirectUri
            })
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
                error: `خطا در دریافت توکن (کد وضعیت: ${status}). پیام خطا: ${detail}` 
            };
        }
        
        const data = await res.json();
        if (data.access_token) {
            const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
            const refreshToken = data.refresh_token || "";
            
            await query(`
                UPDATE church_conference_settings
                SET fcc_access_token = $1,
                    fcc_refresh_token = $2,
                    fcc_token_expires_at = $3
                WHERE id = 'default'
            `, [data.access_token, refreshToken, expiresAt]);
            
            return { success: true };
        } else {
            return { success: false, error: "توکن معتبری از سرور دریافت نشد." };
        }
    } catch (e: any) {
        console.error("Error exchanging code for token:", e);
        return { success: false, error: `خطا در ارتباط با سرور: ${e.message}` };
    }
}

export async function testFccConnection(publicKey?: string, privateKey?: string) {
    try {
        const token = await getValidFccAccessToken();
        if (!token) {
            return { 
                success: false, 
                error: "حساب کاربری شما احراز هویت نشده یا اعتبار آن منقضی شده است. لطفا ابتدا از دکمه «احراز هویت با اکانت FCC» برای اتصال استفاده کنید." 
            };
        }
        
        const res = await fetch("https://www.freeconferencecall.com/api/v4/conferences", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
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
                error: `خطا در برقراری ارتباط (کد وضعیت: ${status}). پیام خطا: ${detail}` 
            };
        }
        
        const data = await res.json();
        const conferences = data.conferences || (Array.isArray(data) ? data : null);
        if (conferences && conferences.length > 0) {
            const conf = conferences[0];
            return { 
                success: true, 
                message: `اتصال با موفقیت برقرار شد! کنفرانس فعال یافت شد: ${conf.dial_number || conf.dial_in_number || '-'} (کد دسترسی: ${conf.access_code || '-'})` 
            };
        } else if (data.dial_number || data.access_code) {
            return { 
                success: true, 
                message: `اتصال با موفقیت برقرار شد! کنفرانس فعال یافت شد: ${data.dial_number || data.dial_in_number || '-'} (کد دسترسی: ${data.access_code || '-'})` 
            };
        }
        
        return { success: true, message: "اتصال موفقیت‌آمیز بود! توکن احراز هویت معتبر است." };
    } catch (e: any) {
        return { success: false, error: `خطا در برقراری ارتباط با شبکه: ${e.message}` };
    }
}
