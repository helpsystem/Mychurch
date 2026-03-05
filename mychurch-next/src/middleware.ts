import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Temporary Mock for RBAC checking until Database acts up
const MOCK_USER_ROLE = "admin"; // Change to "user" or null to test restrictions

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect Admin Routes
    if (pathname.startsWith('/admin')) {
        if (MOCK_USER_ROLE !== 'admin' && MOCK_USER_ROLE !== 'leader') {
            // Redirect unauthorized users to home
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // Protect Broadcast Console Routes
    if (pathname.startsWith('/broadcast')) {
        // Specifically allow /broadcast/view for projector without strict admin
        if (pathname === '/broadcast/view') {
            return NextResponse.next();
        }

        if (MOCK_USER_ROLE !== 'admin' && MOCK_USER_ROLE !== 'leader' && MOCK_USER_ROLE !== 'operator') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/broadcast/:path*'
    ],
};
