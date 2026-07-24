"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
                telegram_id VARCHAR(255),
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

        const newCols = [
            'name VARCHAR(255)',
            'phone VARCHAR(50)',
            'whatsapp_number VARCHAR(50)',
            'telegram_id VARCHAR(255)',
            'bio TEXT',
            'avatar_url TEXT',
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
        console.log('[Action] User DB schema initialized and verified');
    } catch (e) {
        console.error('[Action] Error initializing User DB schema', e);
    }
}

export async function getUserProfile(email: string) {
    try {
        await initializeUserDB();
        const { rows } = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
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
        await initializeUserDB();

        const updateSql = `
            UPDATE users 
            SET name = COALESCE($1, name), 
                phone = $2, 
                whatsapp_number = $3, 
                telegram_id = $4,
                bio = $5,
                address_line1 = $6,
                address_line2 = $7,
                city = $8,
                state = $9,
                country = $10,
                postal_code = $11,
                lat = $12,
                lng = $13,
                updated_at = NOW()
            WHERE LOWER(email) = LOWER($14)
            RETURNING id;
        `;

        const params = [
            data.name || null,
            data.phone || null,
            data.whatsapp_number || null,
            data.telegram_id || null,
            data.bio || null,
            data.address_line1 || null,
            data.address_line2 || null,
            data.city || null,
            data.state || null,
            data.country || null,
            data.postal_code || null,
            data.lat ?? null,
            data.lng ?? null,
            email.trim()
        ];

        const { rows } = await query(updateSql, params);

        if (!rows || rows.length === 0) {
            // Upsert fallback
            await query(`
                INSERT INTO users (
                    email, name, role, phone, whatsapp_number, telegram_id, bio,
                    address_line1, address_line2, city, state, country, postal_code, lat, lng, updated_at
                ) VALUES (
                    $1, $2, 'User', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
                )
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    whatsapp_number = EXCLUDED.whatsapp_number,
                    telegram_id = EXCLUDED.telegram_id,
                    bio = EXCLUDED.bio,
                    address_line1 = EXCLUDED.address_line1,
                    address_line2 = EXCLUDED.address_line2,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    country = EXCLUDED.country,
                    postal_code = EXCLUDED.postal_code,
                    lat = EXCLUDED.lat,
                    lng = EXCLUDED.lng,
                    updated_at = NOW();
            `, [
                email.trim().toLowerCase(),
                data.name || email.split('@')[0],
                data.phone || null,
                data.whatsapp_number || null,
                data.telegram_id || null,
                data.bio || null,
                data.address_line1 || null,
                data.address_line2 || null,
                data.city || null,
                data.state || null,
                data.country || null,
                data.postal_code || null,
                data.lat ?? null,
                data.lng ?? null
            ]);
        }

        revalidatePath('/profile');
        return { success: true };
    } catch (e: any) {
        console.error('Error updating user profile', e);
        return { success: false, error: e.message || 'Failed to update profile' };
    }
}
