import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/rbac";
import { getValidFccAccessToken } from "@/actions/conference-config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        await requireRole(["Admin", "Leader", "Operator"]);

        const token = await getValidFccAccessToken();
        if (!token) {
            return NextResponse.json({ error: "FCC configuration not authenticated or disabled" }, { status: 401 });
        }

        // 1. Get conferences list from FreeConferenceCall API
        const conferencesRes = await fetch("https://www.freeconferencecall.com/api/v4/conferences", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!conferencesRes.ok) {
            return NextResponse.json({ error: "Failed to fetch active calls from FreeConferenceCall" }, { status: conferencesRes.status });
        }

        const confData = await conferencesRes.json();
        const conferences = confData.conferences || (Array.isArray(confData) ? confData : null);

        if (!conferences || conferences.length === 0) {
            return NextResponse.json({ conferences: [], participants: [] });
        }

        // Use the latest/active conference ID
        const activeConf = conferences[0];
        const confId = activeConf.id;

        // 2. Get active participants for this conference
        const participantsRes = await fetch(`https://www.freeconferencecall.com/api/v4/conferences/${confId}/participants`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!participantsRes.ok) {
            // Graceful fallback if the conference has ended or has no participants
            return NextResponse.json({ 
                conference: activeConf, 
                participants: [] 
            });
        }

        const partData = await participantsRes.json();
        const participants = partData.participants || (Array.isArray(partData) ? partData : []);

        return NextResponse.json({
            conference: activeConf,
            participants
        });
    } catch (e: any) {
        console.error("[FCC API Route] Error fetching FCC participants:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
