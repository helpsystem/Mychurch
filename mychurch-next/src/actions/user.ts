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
        await query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 phone = COALESCE($2, phone), 
                 whatsapp_number = COALESCE($3, whatsapp_number), 
                 bio = COALESCE($4, bio),
                 address_line1 = $5,
                 address_line2 = $6,
                 city = $7,
                 state = $8,
                 country = $9,
                 postal_code = $10,
                 lat = $11,
                 lng = $12,
                 updated_at = NOW()
             WHERE email = $13`,
            [
                data.name || null, data.phone || null, data.whatsapp_number || null,
                data.bio || null, data.address_line1 || null, data.address_line2 || null,
                data.city || null, data.state || null, data.country || null,
                data.postal_code || null, data.lat ?? null, data.lng ?? null,
                email
            ]
        );
        revalidatePath('/profile');
        return { success: true };
    } catch (e) {
        console.error('Error updating user profile', e);
        return { success: false };
    }
}
