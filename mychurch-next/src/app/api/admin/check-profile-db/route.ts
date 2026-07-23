import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
    const results: Record<string, any> = {};

    // 1. Check env vars
    results.hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    results.hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    results.serviceKeyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + "...";

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return NextResponse.json({ ...results, error: "Missing env vars" }, { status: 500 });
    }

    // 2. Test Supabase connection
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => [], setAll: () => {} } }
        );

        // Try to fetch one row from users
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, phone, whatsapp_number, telegram_id')
            .limit(3);

        results.querySuccess = !error;
        results.queryError = error?.message;
        results.rowCount = data?.length ?? 0;
        results.columns = data?.[0] ? Object.keys(data[0]) : [];

        // Check if telegram_id column exists
        if (data && data.length > 0) {
            results.hasTelegramIdColumn = 'telegram_id' in data[0];
        } else {
            // Try to check if column exists by doing a select
            const { error: colError } = await supabase
                .from('users')
                .select('telegram_id')
                .limit(1);
            results.hasTelegramIdColumn = !colError;
            results.telegramIdColError = colError?.message;
        }

    } catch (e: any) {
        results.connectionError = e.message;
    }

    return NextResponse.json(results);
}
