import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/rbac";
import { getValidFccAccessToken } from "@/actions/conference-config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        await requireRole(["Admin", "Leader", "Operator"]);

        const token = await getValidFccAccessToken();
        if (!token) {
            return NextResponse.json({ error: "FCC configuration not authenticated or disabled" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { action, conferenceId, participantId } = body;

        if (!action || !conferenceId || !participantId) {
            return NextResponse.json({ error: "Missing required parameters (action, conferenceId, participantId)" }, { status: 400 });
        }

        let fccUrl = "";
        let method = "POST";

        if (action === "mute") {
            fccUrl = `https://www.freeconferencecall.com/api/v4/conferences/${conferenceId}/participants/${participantId}/mute`;
            method = "POST";
        } else if (action === "unmute") {
            fccUrl = `https://www.freeconferencecall.com/api/v4/conferences/${conferenceId}/participants/${participantId}/unmute`;
            method = "POST";
        } else if (action === "kick") {
            fccUrl = `https://www.freeconferencecall.com/api/v4/conferences/${conferenceId}/participants/${participantId}`;
            method = "DELETE";
        } else {
            return NextResponse.json({ error: "Invalid moderation action" }, { status: 400 });
        }

        console.log(`[FCC API Control] Executing ${action} (${method}) for participant ${participantId} in conference ${conferenceId}`);

        const fccRes = await fetch(fccUrl, {
            method: method,
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!fccRes.ok) {
            const errText = await fccRes.text().catch(() => "");
            console.error(`[FCC API Control] FreeConferenceCall responded with status ${fccRes.status}:`, errText);
            return NextResponse.json({ error: `FreeConferenceCall error: ${errText || fccRes.statusText}` }, { status: fccRes.status });
        }

        return NextResponse.json({ success: true, action });
    } catch (e: any) {
        console.error("[FCC API Route] Error executing FCC moderation control:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
