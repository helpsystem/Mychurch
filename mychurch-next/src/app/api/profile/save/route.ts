import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

// Auto-migration helper to ensure all user profile columns exist in DB
async function ensureUserColumnsExist() {
    const columnsToEnsure = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(100);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(100);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(500);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(500);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(50);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS lng NUMERIC(10, 7);",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();",
    ];

    for (const sql of columnsToEnsure) {
        try {
            await query(sql);
        } catch (err) {
            console.warn('[ensureUserColumnsExist] Column addition warning (non-fatal):', err);
        }
    }

    // Request PostgREST schema cache reload in Supabase
    try {
        await query("NOTIFY pgrst, 'reload schema';");
    } catch {
        // Ignore if NOTIFY is not permitted
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, phone, whatsapp_number, telegram_id, bio,
            address_line1, address_line2, city, state, country, postal_code, lat, lng } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        const cleanEmail = email.trim().toLowerCase();

        // 1. Ensure table schema has all required columns
        await ensureUserColumnsExist();

        // 2. Direct PostgreSQL update via connection pool
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
            name || null,
            phone || null,
            whatsapp_number || null,
            telegram_id || null,
            bio || null,
            address_line1 || null,
            address_line2 || null,
            city || null,
            state || null,
            country || null,
            postal_code || null,
            lat ?? null,
            lng ?? null,
            cleanEmail
        ];

        const { rows } = await query(updateSql, params);

        if (rows && rows.length > 0) {
            console.log(`[profile/save] Successfully updated profile for ${cleanEmail}`);
            return NextResponse.json({ success: true, action: 'updated', id: rows[0].id });
        }

        // 3. If user row doesn't exist yet in PostgreSQL users table, INSERT it
        const insertSql = `
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
                updated_at = NOW()
            RETURNING id;
        `;

        const insertParams = [
            cleanEmail,
            name || cleanEmail.split('@')[0],
            phone || null,
            whatsapp_number || null,
            telegram_id || null,
            bio || null,
            address_line1 || null,
            address_line2 || null,
            city || null,
            state || null,
            country || null,
            postal_code || null,
            lat ?? null,
            lng ?? null
        ];

        const insertRes = await query(insertSql, insertParams);

        console.log(`[profile/save] Inserted/Upserted user record for ${cleanEmail}`);
        return NextResponse.json({ success: true, action: 'inserted', id: insertRes.rows?.[0]?.id });

    } catch (e: any) {
        console.error('[profile/save] Unexpected error during profile save:', e);
        return NextResponse.json({ success: false, error: e.message || 'Database error' }, { status: 500 });
    }
}
