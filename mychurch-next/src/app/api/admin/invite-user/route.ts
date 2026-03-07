import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        // Auth check - only Admin can invite users
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { email, role = "User", name = "" } = await req.json();

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

        // Send invitation email via Supabase Auth
        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
            data: { name, role }
        });

        if (inviteError) {
            return NextResponse.json({ error: inviteError.message }, { status: 400 });
        }

        // Also insert into users table so RBAC works
        const displayName = name || email.split('@')[0];
        await supabase.from('users').upsert([{
            email,
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
