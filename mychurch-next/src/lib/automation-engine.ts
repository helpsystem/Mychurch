import { sendEmail } from "@/lib/email";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { GoogleGenAI } from "@google/genai";
import { Workflow, ExecutionLog, ExecutionStep, logExecution } from "@/actions/automation";

/**
 * Resolves templated parameters (like {{trigger.payload.name}} or {{step1.output}})
 * using the execution context.
 */
export function resolveTemplate(text: string, context: Record<string, any>): string {
  if (!text) return "";
  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    const parts = trimmedPath.split(".");
    let current: any = context;
    for (const part of parts) {
      if (current === null || current === undefined) return match;
      current = current[part];
    }
    return current !== undefined ? String(current) : match;
  });
}

/**
 * Executes a single AI Gemini prompt
 */
async function generateAiText(prompt: string, model: string = "gemini-2.5-flash", systemInstruction: string = ""): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is required");
  
  const aiClient = new GoogleGenAI({ apiKey });
  
  const config: any = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const response = await aiClient.models.generateContent({
    model: model,
    contents: prompt,
    config: config
  });

  return response.text || "";
}

/**
 * Runs the visual workflow step-by-step using actual Real-world Twilio / Resend / Gemini APIs.
 * Supports direct mocked output for sandbox test runs (if isMockRun = true).
 */
export async function executeWorkflow(
  workflow: Workflow,
  triggerPayload: any = {},
  options?: { isMockRun?: boolean }
): Promise<ExecutionLog> {
  const isMock = options?.isMockRun ?? false;

  // Initialize context for templating
  const context: Record<string, any> = {
    trigger: {
      payload: triggerPayload,
      type: workflow.trigger.type,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };

  const stepsLogs: ExecutionStep[] = [];
  let workflowStatus: "success" | "failed" = "success";

  for (const action of workflow.actions) {
    const stepLog: ExecutionStep = {
      name: action.name,
      type: action.type,
      status: "success",
    };

    try {
      // 1. Resolve templates before executing
      const resolvedConfig: Record<string, any> = {};
      Object.entries(action.config).forEach(([key, val]) => {
        if (typeof val === "string") {
          resolvedConfig[key] = resolveTemplate(val, context);
        } else {
          resolvedConfig[key] = val;
        }
      });

      // 2. Execute Action (Mock vs. Real)
      if (isMock) {
        // Mock Sandbox execution
        if (action.type === "ai_gemini") {
          stepLog.output = `[Mock AI Response] Evaluated prompt "${resolvedConfig.prompt}". Result: "Approved. The content is positive."`;
        } else if (action.type === "gmail_send") {
          stepLog.output = `[Mock Email] Email successfully composed and dispatched to <${resolvedConfig.to}>. Subject: "${resolvedConfig.subject}".`;
        } else if (action.type === "whatsapp_send") {
          const mode = resolvedConfig.whatsappType || "individual";
          const recipient = resolvedConfig.whatsappRecipient || "";
          const msg = resolvedConfig.whatsappMessage || "";
          stepLog.output = `[Mock WhatsApp] Type: ${mode.toUpperCase()} | Recipient: ${recipient}\nMessage: "${msg}"\nStatus: SENT (Mock)`;
        } else if (action.type === "multi_broadcast") {
          const platforms = resolvedConfig.broadcastPlatforms || [];
          const msg = resolvedConfig.broadcastMessage || "";
          stepLog.output = `[Mock Multi-Broadcast] Platforms: ${platforms.join(', ')}\nContent: "${msg}"\nStatus: MOCK DELIVERED`;
        } else {
          stepLog.output = `[Mock ${action.type}] Simulated successful execution.`;
        }
      } else {
        // REAL execution using actual environment keys
        if (action.type === "ai_gemini") {
          const prompt = resolvedConfig.prompt || "";
          const systemInstruction = resolvedConfig.systemInstruction || "";
          const model = resolvedConfig.model || "gemini-2.5-flash";
          const output = await generateAiText(prompt, model, systemInstruction);
          stepLog.output = output;
        } 
        else if (action.type === "gmail_send") {
          const to = resolvedConfig.to || "";
          const subject = resolvedConfig.subject || "Automation Alert";
          const body = resolvedConfig.body || "";
          
          const result = await sendEmail({ to: [to], subject, html: body, text: body });
          if (!result.success) throw new Error(result.error);
          
          stepLog.output = `Email sent successfully to ${to}.`;
        } 
        else if (action.type === "whatsapp_send") {
          const recipient = resolvedConfig.whatsappRecipient || "";
          const msg = resolvedConfig.whatsappMessage || "";
          
          if (!recipient) throw new Error("WhatsApp recipient missing.");
          
          const result = await sendWhatsApp(recipient, msg);
          if (!result.success) throw new Error(result.error);
          
          stepLog.output = `WhatsApp message sent. SID: ${result.sid}`;
        }
        else if (action.type === "multi_broadcast") {
          const platforms = resolvedConfig.broadcastPlatforms || [];
          const msg = resolvedConfig.broadcastMessage || "";
          const phone = resolvedConfig.broadcastRecipientPhone || "";
          const email = resolvedConfig.broadcastRecipientEmail || "";
          const waGroup = resolvedConfig.broadcastGroupWhatsAppId || phone; // Twilio can send to WhatsApp groups via unique IDs theoretically, or just phone
          
          let outputDetail = `[Multi-Channel Omni Broadcast]\nSubject: ${resolvedConfig.broadcastSubject || "No Subject"}\nChannels: ${platforms.join(", ") || "None"}\n\n`;
            
          for (const platform of platforms) {
            if (platform === "gmail" || platform === "email") {
              if (email) {
                const result = await sendEmail({ to: [email], subject: resolvedConfig.broadcastSubject || "Broadcast Alert", html: msg });
                outputDetail += `  - [EMAIL]: ${result.success ? "Success" : "Failed - " + result.error}\n`;
              } else {
                outputDetail += `  - [EMAIL]: Skipped (No email provided)\n`;
              }
            } else if (platform === "whatsapp") {
              if (waGroup) {
                const result = await sendWhatsApp(waGroup, msg);
                outputDetail += `  - [WHATSAPP]: ${result.success ? "Success SID:" + result.sid : "Failed - " + result.error}\n`;
              } else {
                outputDetail += `  - [WHATSAPP]: Skipped (No phone provided)\n`;
              }
            } else if (platform === "sms") {
              if (phone) {
                const result = await sendSMS(phone, msg);
                outputDetail += `  - [SMS]: ${result.success ? "Success SID:" + result.sid : "Failed - " + result.error}\n`;
              } else {
                outputDetail += `  - [SMS]: Skipped (No phone provided)\n`;
              }
            }
          }
          stepLog.output = outputDetail;
        }
        else {
          stepLog.output = `Unsupported action type for backend: ${action.type}`;
        }
      }

      // Add output into context for downstream steps
      const keySafeId = action.id;
      const keySafeName = action.name.replace(/\s+/g, "_");
      context[keySafeId] = { output: stepLog.output };
      context[keySafeName] = { output: stepLog.output };

    } catch (error: any) {
      console.error(`Workflow step "${action.name}" failed:`, error);
      stepLog.status = "failed";
      stepLog.error = error.message || String(error);
      workflowStatus = "failed";
      stepsLogs.push(stepLog);
      // Stop pipeline execution upon failure
      break;
    }

    stepsLogs.push(stepLog);
  }

  const executionLog: ExecutionLog = {
    workflowId: workflow.id || "manual_test",
    workflowName: workflow.name,
    userId: workflow.userId || "system",
    status: workflowStatus,
    steps: stepsLogs,
    triggeredBy: workflow.trigger.type,
  };

  // Persist the log inside the database (Supabase)
  try {
    const logId = await logExecution(executionLog);
    executionLog.id = logId;
  } catch (dbError) {
    console.error("Failed to write execution log to DB:", dbError);
  }

  return executionLog;
}
