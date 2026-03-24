import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || !url.startsWith('https://webdav.hidrive.ionos.com/')) {
        return new NextResponse('Invalid URL or Not A Authorized HiDrive Resource', { status: 400 });
    }

    try {
        // Fallback to defaults since .env.local doesn't have it explicitly right now
        const username = process.env.HIDRIVE_USER || 'adminchurch';
        const password = process.env.HIDRIVE_PASSWORD || 'SamanBbB1989bBb@';
        
        const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

        const fetchHeaders = new Headers();
        fetchHeaders.set('Authorization', authHeader);
        
        // Forward Range header to support seeking in audio perfectly
        if (request.headers.has('range')) {
            fetchHeaders.set('Range', request.headers.get('range')!);
        }

        const response = await fetch(url, { headers: fetchHeaders });

        if (!response.ok && response.status !== 206) {
            return new NextResponse('Failed to fetch from HiDrive', { status: response.status });
        }

        const headers = new Headers();
        // Forward essential headers
        ['content-type', 'content-length', 'content-range', 'accept-ranges', 'date', 'last-modified'].forEach((h) => {
            if (response.headers.has(h)) {
                headers.set(h, response.headers.get(h)!);
            }
        });
        
        // Force the browser to cache this 
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });

    } catch (error) {
        console.error('[Audio Proxy] Stream error:', error);
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
