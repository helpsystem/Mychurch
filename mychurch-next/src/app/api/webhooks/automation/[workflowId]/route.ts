import { NextRequest, NextResponse } from "next/server";
import { getWorkflow } from "@/actions/automation";
import { executeWorkflow } from "@/lib/automation-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const { workflowId } = params;
    
    // Parse the incoming JSON payload (if any)
    let payload = {};
    try {
      const textBody = await request.text();
      if (textBody) {
        payload = JSON.parse(textBody);
      }
    } catch (e) {
      console.warn("[Webhook] Could not parse payload as JSON", e);
    }

    console.log(`[Webhook] Received trigger for workflow ${workflowId}:`, payload);

    // Look up the workflow in the database
    const workflow = await getWorkflow(workflowId);
    
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (!workflow.active) {
      return NextResponse.json({ error: "Workflow is inactive" }, { status: 400 });
    }

    // Ensure the trigger matches
    if (workflow.trigger.type !== "webhook" && workflow.trigger.type !== "wordpress") {
      return NextResponse.json({ error: "Workflow does not accept webhook triggers" }, { status: 400 });
    }

    // In a production app, we might push this to a background queue (like BullMQ or Inngest)
    // For now, we await the execution directly (this might timeout if it takes > 10s on serverless)
    // Wait! Since it's a webhook, we can respond immediately and run the engine asynchronously.
    // However, Vercel/Next.js edge/serverless functions terminate as soon as the response is sent.
    // To allow background execution, we should ideally use waitUntil (Next.js 14).
    
    // Using standard await for now. If it's slow, we'll need Edge waitUntil or a cron queue.
    const executionLog = await executeWorkflow(workflow, payload);

    return NextResponse.json({
      status: "success",
      message: `Webhook processed for workflow ${workflowId}`,
      logId: executionLog.id,
      executionStatus: executionLog.status
    });

  } catch (error: any) {
    console.error("[Webhook] Processing error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
