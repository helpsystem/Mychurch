import { NextRequest, NextResponse } from "next/server";
import { executeWorkflow } from "@/lib/automation-engine";
import { Workflow } from "@/actions/automation";
import { requireRole } from "@/utils/rbac"; // mychurch role based access control

export async function POST(request: NextRequest) {
  try {
    // Only admins should trigger manual workflow runs from the studio
    await requireRole(['Admin']);

    const body = await request.json();
    const { workflow, isMock, triggerPayload } = body as { workflow: Workflow, isMock: boolean, triggerPayload: any };

    if (!workflow) {
      return NextResponse.json({ error: "Workflow is required" }, { status: 400 });
    }

    // Execute the workflow
    const executionLog = await executeWorkflow(workflow, triggerPayload, { isMockRun: isMock });

    return NextResponse.json({
      status: "success",
      log: executionLog
    });

  } catch (error: any) {
    console.error("[Automation Run] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
