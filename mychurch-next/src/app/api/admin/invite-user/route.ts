import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { resolvePublicSiteUrl } from "@/lib/site-url";

export async function POST(req: Request) {
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
            .eq('email', user.email?.toLowerCase())
            .single();

        if (!userRecord || userRecord.role !== 'Admin') {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }
        // ===== End Security Check =====

        const { email, name = "" } = await req.json();
        // ⚠️ Fixed: role is NO LONGER accepted from client - always default to 'User'
        // Only Admin can promote users via direct DB updates or separate endpoint
        const role = "User";

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey) {
            return NextResponse.json({ error: "Service role key not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local" }, { status: 500 });
        }

        // Use admin client to invite user
        const adminClient = createAdminClient(supabaseUrl!, serviceRoleKey);
        const siteUrl = resolvePublicSiteUrl();

        // Send invitation email via Supabase Auth
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email.toLowerCase(), {
            data: { name, role },
            redirectTo: `${siteUrl}/api/auth/callback`
        });

        if (inviteError) {
            return NextResponse.json({ error: inviteError.message }, { status: 400 });
        }

        // Also insert into users table so RBAC works
        const displayName = name || email.split('@')[0];
        await supabase.from('users').upsert([{
            email: email.toLowerCase(),
            name: displayName,
            role,
            permissions: {},
        }], { onConflict: 'email' });

        return NextResponse.json({ success: true, email: inviteData.user.email });

    } catch (error: any) {
        console.error("[Invite] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
