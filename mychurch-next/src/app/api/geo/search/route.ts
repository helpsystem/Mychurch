import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q");
    const lang = request.nextUrl.searchParams.get("lang") || "en";
    
    if (!q || q.length < 2) {
        return NextResponse.json({ features: [] });
    }

    try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=${lang}`;
        const res = await fetch(url, {
            headers: { "User-Agent": "MyChurch-App/1.0" },
            next: { revalidate: 0 },
        });

        if (!res.ok) {
            return NextResponse.json({ features: [] });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        console.error("[Photon Proxy] Error:", e);
        return NextResponse.json({ features: [] });
    }
}
