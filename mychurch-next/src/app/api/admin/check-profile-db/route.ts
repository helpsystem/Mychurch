import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    const results: Record<string, any> = {};

    // 1. Run auto-migration to add any missing columns
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
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"
    ];

    const migrationLogs: string[] = [];
    for (const sql of columnsToEnsure) {
        try {
            await query(sql);
            migrationLogs.push(`Executed: ${sql}`);
        } catch (err: any) {
            migrationLogs.push(`Err: ${err.message}`);
        }
    }
    results.migrationLogs = migrationLogs;

    // Reload PostgREST cache if possible
    try {
        await query("NOTIFY pgrst, 'reload schema';");
    } catch {}

    // 2. Query users table structure
    try {
        const { rows } = await query(`
            SELECT column_name, data_type 
            from information_schema.columns 
            WHERE table_name = 'users';
        `);
        results.columns = rows;
        results.hasTelegramId = rows.some((r: any) => r.column_name === 'telegram_id');
        results.hasBio = rows.some((r: any) => r.column_name === 'bio');
        results.dbCheckSuccess = true;
    } catch (e: any) {
        results.dbCheckSuccess = false;
        results.dbCheckError = e.message;
    }

    return NextResponse.json(results);
}
