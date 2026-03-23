import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");
    const nextParam = requestUrl.searchParams.get("next");
    const next = nextParam && nextParam.startsWith("/") ? nextParam : "/profile";

    const supabase = await createClient();

    if (tokenHash && type) {
        await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change",
        });
    }

    if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        const user = data?.user;

        if (user) {
            // Synchronize with the 'users' table for RBAC using Admin Client
            try {
                const { createAdminClient } = await import("@/utils/supabase/server");
                const adminSupabase = await createAdminClient();
                await adminSupabase
                    .from('users')
                    .upsert({
                        email: user.email,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        role: 'User', // Default role for new signups
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'email' });
            } catch (syncError) {
                console.error("[AuthCallback] DB Sync Error:", syncError);
            }
        }
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
}