import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        // ===== Security Check: Admin Role Required =====
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (!userRecord || userRecord.role !== 'Admin') {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }
        // ===== End Security Check =====

        // Fetch the last 50 cron job logs
        const { rows } = await query(`
            SELECT id, job_name, status, duration_ms, total_processed, success_count, failure_count, details, created_at
            FROM cron_logs
            ORDER BY created_at DESC
            LIMIT 50
        `);

        return NextResponse.json({ logs: rows });
    } catch (error: any) {
        console.error("Error fetching cron logs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
