import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function POST() {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
}
