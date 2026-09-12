import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { getRealUserRole } from "@/utils/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = await getRealUserRole();
        if (role && !['Admin', 'Leader', 'Operator'].includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const adminSupabase = await createAdminClient();

        // Query counts in parallel
        const [prayersRes, ticketsRes, docsRes, usersRes] = await Promise.all([
            // 1. Pending prayer requests
            adminSupabase
                .from('prayer_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
                .eq('is_deleted', false),

            // 2. Open support tickets / contact messages
            adminSupabase
                .from('support_tickets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'open'),

            // 3. Scanned documents
            adminSupabase
                .from('scanned_documents')
                .select('*', { count: 'exact', head: true })
                .eq('is_deleted', false),

            // 4. Total users or pending
            adminSupabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'User')
        ]);

        const counts = {
            prayers: prayersRes.count || 0,
            messages: ticketsRes.count || 0,
            documents: docsRes.count || 0,
            users: usersRes.count || 0,
        };

        return NextResponse.json(counts);
    } catch (err: any) {
        console.error("[Sidebar Counts API] Error:", err.message);
        return NextResponse.json({ prayers: 0, messages: 0, documents: 0, users: 0 });
    }
}
