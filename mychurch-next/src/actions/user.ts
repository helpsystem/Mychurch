"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";

export async function initializeUserDB() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                role VARCHAR(50) DEFAULT 'User',
                phone VARCHAR(50),
                whatsapp_number VARCHAR(50),
                bio TEXT,
                avatar_url TEXT,
                address_line1 VARCHAR(500),
                address_line2 VARCHAR(500),
                city VARCHAR(255),
                state VARCHAR(255),
                country VARCHAR(255),
                postal_code VARCHAR(50),
                lat DECIMAL(10, 7),
                lng DECIMAL(10, 7),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        // Add address columns to existing tables that may not have them
        const newCols = [
            'address_line1 VARCHAR(500)',
            'address_line2 VARCHAR(500)',
            'city VARCHAR(255)',
            'state VARCHAR(255)',
            'country VARCHAR(255)',
            'postal_code VARCHAR(50)',
            'lat DECIMAL(10,7)',
            'lng DECIMAL(10,7)'
        ];
        for (const col of newCols) {
            await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
        }
        console.log('[Action] User DB initialized');
    } catch (e) {
        console.error('[Action] Error initializing User DB', e);
    }
}

export async function getUserProfile(email: string) {
    try {
        await initializeUserDB();
        const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
        return rows[0] || null;
    } catch (e) {
        console.error('Error fetching user profile', e);
        return null;
    }
}

export async function updateUserProfile(email: string, data: {
    name?: string;
    phone?: string;
    whatsapp_number?: string;
    telegram_id?: string;
    bio?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    lat?: number | null;
    lng?: number | null;
}) {
    try {
        const supabase = await createAdminClient();

        // Build update payload (only include fields that are provided)
        const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };
        if (data.name !== undefined) updatePayload.name = data.name || null;
        if (data.phone !== undefined) updatePayload.phone = data.phone || null;
        if (data.whatsapp_number !== undefined) updatePayload.whatsapp_number = data.whatsapp_number || null;
        if (data.telegram_id !== undefined) updatePayload.telegram_id = data.telegram_id || null;
        if (data.bio !== undefined) updatePayload.bio = data.bio || null;
        if (data.address_line1 !== undefined) updatePayload.address_line1 = data.address_line1 || null;
        if (data.address_line2 !== undefined) updatePayload.address_line2 = data.address_line2 || null;
        if (data.city !== undefined) updatePayload.city = data.city || null;
        if (data.state !== undefined) updatePayload.state = data.state || null;
        if (data.country !== undefined) updatePayload.country = data.country || null;
        if (data.postal_code !== undefined) updatePayload.postal_code = data.postal_code || null;
        if (data.lat !== undefined) updatePayload.lat = data.lat ?? null;
        if (data.lng !== undefined) updatePayload.lng = data.lng ?? null;

        const { error } = await supabase
            .from('users')
            .update(updatePayload)
            .ilike('email', email);

        if (error) {
            console.error('[updateUserProfile] Supabase error:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (e: any) {
        console.error('Error updating user profile', e);
        return { success: false, error: e.message };
    }
}
