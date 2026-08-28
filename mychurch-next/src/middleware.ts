import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    const isBroadcastRoute = pathname.startsWith('/broadcast') && pathname !== '/broadcast/view';
    const isProfileRoute = pathname.startsWith('/profile');
    const isVerifyRoute = pathname.startsWith('/verify-admin-login');

    const isProtected = isAdminRoute || isBroadcastRoute;
    const needsAuthCheck = isProtected || isProfileRoute || isVerifyRoute;

    let supabaseResponse = NextResponse.next({
        request,
    });

    // 🚀 PERFORMANCE OPTIMIZATION:
    // Only query Supabase Auth if accessing a protected or auth-sensitive route.
    // Public page loads (homepage, worship, bible, etc.) pass INSTANTLY without waiting for Supabase API latency!
    if (!needsAuthCheck) {
        return supabaseResponse;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Fetch user session for protected routes
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (isProtected && !user) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
        }
        // Redirect out if no active session
        const url = request.nextUrl.clone();
        const proto = request.headers.get('x-forwarded-proto') || 'http';
        if (proto === 'https') {
            url.protocol = 'https:';
        }
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Profile Completion Check for Admins/Leaders
    if (isProtected && user) {
        const { data: profile } = await supabase
            .from('users')
            .select('role, phone, telegram_id')
            .eq('email', user.email)
            .single();

        if (profile) {
            const isAdminOrLeader = profile.role === 'Admin' || profile.role === 'Leader';
            // Enforce that phone is required for leaders/admins
            const isProfileComplete = Boolean(profile.phone && profile.phone.trim().length > 0);

            if (isAdminOrLeader && !isProfileComplete) {
                const url = request.nextUrl.clone();
                const proto = request.headers.get('x-forwarded-proto') || 'http';
                if (proto === 'https') url.protocol = 'https:';
                url.pathname = '/profile';
                url.searchParams.set('complete_required', 'true');
                return NextResponse.redirect(url);
            }
        }
    }

    // 2FA Protection for Admin Panel ONLY (not broadcast)
    if (isAdminRoute && user) {
        const isVerified = request.cookies.get('admin_2fa_verified')?.value === 'true';
        if (!isVerified) {
            const url = request.nextUrl.clone();
            const proto = request.headers.get('x-forwarded-proto') || 'http';
            if (proto === 'https') url.protocol = 'https:';
            url.pathname = '/verify-admin-login';
            return NextResponse.redirect(url);
        }

        // Auto-renew 2FA cookie on every valid admin page access
        supabaseResponse.cookies.set('admin_2fa_verified', 'true', {
            maxAge: 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });
    }

    // 🚨 Strict No-Cache Headers for Admin/Protected Responses to eliminate stale browser rendering
    supabaseResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    supabaseResponse.headers.set('Pragma', 'no-cache');
    supabaseResponse.headers.set('Expires', '0');

    return supabaseResponse;
}

export const config = {
    matcher: [
        // NOTE: 'api' removed from exclusion so /api/admin/* gets auth-checked.
        // Public API routes (prayers, telegram, etc.) are correctly handled by
        // the isProtected logic above which only gates /admin and /api/admin paths.
        '/((?!_next/static|_next/image|favicon.ico|images|.*\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mp3|wav|ogg)$).*)',
    ],
};
