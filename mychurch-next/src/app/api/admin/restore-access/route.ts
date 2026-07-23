import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ============================================================
//  🚨 EMERGENCY ADMIN ACCESS RESTORE ENDPOINT 🚨
//  GET /api/admin/restore-access
//
//  This endpoint is a permanent "break-glass" solution.
//  It works by:
//  1. Verifying the caller has a valid Supabase session
//  2. Checking they are a known Admin/Leader email OR already in DB with admin role
//  3. Upserting their DB record to Admin
//  4. Setting the admin_2fa_verified cookie (skipping 2FA requirement)
//  5. Clearing any impersonation cookies
// ============================================================

const KNOWN_ADMINS = [
    'help.system@ymail.com',
    'helpsystem68@gmail.com',
    'appsamyar@gmail.com',
];

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. Get current user session from cookies
    const cookieStore = request.cookies;
    const anonClient = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
        },
    });

    const { data: { user } } = await anonClient.auth.getUser();

    if (!user || !user.email) {
        return NextResponse.json({
            success: false,
            error: "No active session. Please login first at /login"
        }, { status: 401 });
    }

    const email = user.email.toLowerCase();

    // 2. Check if user is a known admin or has admin role in DB
    const adminClient = createServerClient(supabaseUrl, supabaseServiceKey, {
        cookies: { getAll() { return []; }, setAll() {} },
    });

    const { data: dbUser } = await adminClient
        .from('users')
        .select('id, role, name')
        .ilike('email', email)
        .maybeSingle();

    const isKnownAdmin = KNOWN_ADMINS.includes(email);
    const dbRole = dbUser?.role ? String(dbUser.role).charAt(0).toUpperCase() + String(dbUser.role).slice(1).toLowerCase() : null;
    const hasAdminRole = dbRole && ['Admin', 'Leader', 'Operator'].includes(dbRole);

    if (!isKnownAdmin && !hasAdminRole) {
        return NextResponse.json({
            success: false,
            error: `Access denied. ${email} is not a known admin or leader.`
        }, { status: 403 });
    }

    // 3. Upsert DB record to ensure Admin role
    const targetRole = isKnownAdmin ? 'Admin' : dbRole;
    const upsertResult = await adminClient.from('users').upsert({
        email: email,
        name: dbUser?.name || email.split('@')[0],
        role: targetRole,
    }, { onConflict: 'email' });

    const upsertError = upsertResult.error;

    // 4. Build response with healing cookies
    const response = NextResponse.json({
        success: true,
        message: `✅ Access restored for ${email}. Role: ${targetRole}. Redirecting to admin panel...`,
        role: targetRole,
        upsertError: upsertError ? upsertError.message : null,
        redirect: '/admin',
    });

    // Set 2FA verified cookie (24 hours)
    response.cookies.set('admin_2fa_verified', 'true', {
        maxAge: 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    // Clear any impersonation cookie that could block access
    response.cookies.delete('mychurch_view_as_role');

    return response;
}
