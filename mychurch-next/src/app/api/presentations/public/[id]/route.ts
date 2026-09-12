import { NextRequest, NextResponse } from "next/server";
import { getPublicPresentationById } from "@/actions/presentations";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        if (!id) {
            return NextResponse.json({ error: "Missing presentation ID" }, { status: 400 });
        }

        const presentation = await getPublicPresentationById(id);
        if (!presentation) {
            return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
        }

        // Return with public caching headers for high scalability
        return NextResponse.json(
            { success: true, presentation },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (err: any) {
        console.error("[PublicPresentationAPI] Error:", err);
        return NextResponse.json({ error: err.message || "Failed to load presentation" }, { status: 500 });
    }
}
