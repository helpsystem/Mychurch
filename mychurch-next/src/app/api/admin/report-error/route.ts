import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { query } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { getAIConfig } from "@/actions/ai-config";

type ErrorReportInput = {
  message?: string;
  code?: string | null;
  url?: string | null;
  timestamp?: string;
  userAgent?: string | null;
  stack?: string | null;
  source?: string | null;
};

type AIResult = {
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  probableCause: string;
  suggestedFix: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FALLBACK_ADMIN_EMAIL = "help.system@ymail.com";

function normalizeErrorInput(body: ErrorReportInput) {
  const message = (body.message || "Unknown error").slice(0, 3000);
  const code = body.code || null;
  const url = body.url || null;
  const timestamp = body.timestamp || new Date().toISOString();
  const userAgent = body.userAgent || null;
  const stack = body.stack || null;
  const source = body.source || null;

  return { message, code, url, timestamp, userAgent, stack, source };
}

function fallbackTriage(message: string): AIResult {
  const text = message.toLowerCase();
  if (text.includes("loading chunk") || text.includes("chunkloaderror")) {
    return {
      summary: "Client failed to load a Next.js chunk file for a route.",
      severity: "high",
      probableCause: "Stale browser cache or mismatched deployed asset hash after release.",
      suggestedFix: "Force hard refresh, clear service worker/cache, and verify CDN/proxy does not cache /_next/static aggressively.",
    };
  }

  if (text.includes("network") || text.includes("fetch")) {
    return {
      summary: "Client encountered a network/runtime fetch failure.",
      severity: "medium",
      probableCause: "Transient network error, blocked request, or backend endpoint timeout.",
      suggestedFix: "Check endpoint health and browser network logs; add retry/backoff where safe.",
    };
  }

  return {
    summary: "Unhandled runtime error reported by client.",
    severity: "medium",
    probableCause: "Unexpected client state or uncaught exception path.",
    suggestedFix: "Inspect stack trace and recent deployments; add guard checks around the failing component.",
  };
}

async function aiTriage(input: {
  message: string;
  code: string | null;
  url: string | null;
  source: string | null;
  stack: string | null;
}): Promise<AIResult> {
  let key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  if (!key) {
    try {
      const aiConfig = await getAIConfig();
      key = aiConfig?.gemini_api_key || null;
    } catch {
      key = null;
    }
  }

  if (!key) {
    return fallbackTriage(input.message);
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: key });
    const modelName = process.env.GEMINI_ERROR_MODEL || "gemini-2.0-flash";

    const prompt = `
You are a production incident triage assistant.
Analyze this client-side web error and return strict JSON object only.
Schema:
{
  "summary": "short summary",
  "severity": "low|medium|high|critical",
  "probableCause": "one sentence",
  "suggestedFix": "one sentence"
}

Error Message: ${input.message}
Error Code: ${input.code || "N/A"}
URL: ${input.url || "N/A"}
Source: ${input.source || "N/A"}
Stack: ${input.stack || "N/A"}
`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const raw = response.text?.trim() || "";
    const parsed = JSON.parse(raw) as Partial<AIResult>;
    const severity = parsed.severity;

    if (!parsed.summary || !parsed.probableCause || !parsed.suggestedFix) {
      return fallbackTriage(input.message);
    }

    if (!severity || !["low", "medium", "high", "critical"].includes(severity)) {
      return fallbackTriage(input.message);
    }

    return {
      summary: parsed.summary,
      severity,
      probableCause: parsed.probableCause,
      suggestedFix: parsed.suggestedFix,
    };
  } catch (error) {
    console.warn("[report-error] AI triage failed, using fallback triage:", error);
    return fallbackTriage(input.message);
  }
}

async function createAdminReviewTicket(payload: {
  message: string;
  code: string | null;
  url: string | null;
  timestamp: string;
  userAgent: string | null;
  stack: string | null;
  source: string | null;
  ai: AIResult;
}) {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        assigned_leader_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS support_ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_id VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255),
        message_body TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    const subject = `[AUTO][${payload.ai.severity.toUpperCase()}] ${payload.code || "CLIENT_ERROR"}`.slice(0, 255);
    const { rows } = await query(
      `INSERT INTO support_tickets (user_id, user_email, user_name, subject, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      ["system-error-reporter", "system@mychurch.local", "System Error Reporter", subject, "open"]
    );

    const ticketId = rows?.[0]?.id;
    if (!ticketId) return null;

    const messageBody = [
      "AUTO-GENERATED INCIDENT REPORT",
      `Severity: ${payload.ai.severity}`,
      `AI Summary: ${payload.ai.summary}`,
      `Probable Cause: ${payload.ai.probableCause}`,
      `Suggested Fix: ${payload.ai.suggestedFix}`,
      `Code: ${payload.code || "N/A"}`,
      `Source: ${payload.source || "N/A"}`,
      `URL: ${payload.url || "N/A"}`,
      `Timestamp: ${payload.timestamp}`,
      `UserAgent: ${payload.userAgent || "N/A"}`,
      "",
      "Message:",
      payload.message,
      "",
      "Stack:",
      payload.stack || "N/A",
    ].join("\n");

    await query(
      `INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_name, message_body)
       VALUES ($1, $2, $3, $4)`,
      [ticketId, "system-error-reporter", "System Error Reporter", messageBody]
    );

    return ticketId as string;
  } catch (error) {
    console.warn("[report-error] Could not create admin ticket:", error);
    return null;
  }
}

async function sendAdminAlertEmail(payload: {
  message: string;
  code: string | null;
  url: string | null;
  timestamp: string;
  source: string | null;
  ai: AIResult;
  ticketId: string | null;
}) {
  const to = process.env.ERROR_REPORT_EMAIL_TO || process.env.ADMIN_ALERT_EMAIL || FALLBACK_ADMIN_EMAIL;

  const subject = `🚨 [${payload.ai.severity.toUpperCase()}] Client Error ${payload.code || "UNKNOWN"}`;
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Client Error Alert</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; color: #111827; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; padding: 20px 10px;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 760px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        <!-- Header -->
                        <tr style="background-color: #111827; color: #ffffff;">
                            <td style="padding: 16px 20px;">
                                <h2 style="margin: 0; font-size: 18px; font-weight: bold;">Client Error Alert</h2>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 20px; line-height: 1.6; color: #111827; font-size: 14px;">
                                <p style="margin: 0 0 10px 0;"><strong>Severity:</strong> <span style="color: ${payload.ai.severity === 'critical' || payload.ai.severity === 'high' ? '#dc2626' : '#d97706'}; font-weight: bold;">${payload.ai.severity.toUpperCase()}</span></p>
                                <p style="margin: 0 0 10px 0;"><strong>AI Summary:</strong> ${payload.ai.summary}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Probable Cause:</strong> ${payload.ai.probableCause}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Suggested Fix:</strong> ${payload.ai.suggestedFix}</p>
                                
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
                                    <tr>
                                        <td style="border-top: 1px solid #e5e7eb; height: 1px;"></td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 0 0 10px 0;"><strong>Code:</strong> ${payload.code || "N/A"}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Source:</strong> ${payload.source || "N/A"}</p>
                                <p style="margin: 0 0 10px 0;"><strong>URL:</strong> ${payload.url || "N/A"}</p>
                                <p style="margin: 0 0 10px 0;"><strong>Timestamp:</strong> ${payload.timestamp}</p>
                                <p style="margin: 0 0 15px 0;"><strong>Admin Ticket ID:</strong> ${payload.ticketId || "Not created"}</p>
                                
                                <p style="margin: 0 0 5px 0;"><strong>Message:</strong></p>
                                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; border: 1px solid #e5e7eb; color: #374151;">
                                    ${payload.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr style="background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <td style="padding: 15px 20px; font-size: 11px; color: #6b7280; text-align: center;">
                                MyChurch Error Diagnostic System • www.iranianchurchdc.com
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;

  try {
    await sendMail({ to, subject, html });
  } catch (error) {
    console.warn("[report-error] Could not send alert email:", error);
  }
}

// POST /api/admin/report-error — Saves error reports from the AnimatedError component
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ErrorReportInput;
    const normalized = normalizeErrorInput(body);
    const ai = await aiTriage({
      message: normalized.message,
      code: normalized.code,
      url: normalized.url,
      source: normalized.source,
      stack: normalized.stack,
    });

    // Store in Supabase — table: error_reports (create if needed)
    const { error } = await supabase.from("error_reports").insert({
      message: normalized.message,
      code: normalized.code,
      url: normalized.url,
      timestamp: normalized.timestamp,
      user_agent: normalized.userAgent,
      source: normalized.source,
      stack: normalized.stack,
      ai_summary: ai.summary,
      ai_severity: ai.severity,
      ai_probable_cause: ai.probableCause,
      ai_suggested_fix: ai.suggestedFix,
    });

    if (error) {
      // If table doesn't exist yet, just log and return 200
      console.warn("[report-error] Could not save to DB:", error.message);
    }

    const ticketId = await createAdminReviewTicket({
      message: normalized.message,
      code: normalized.code,
      url: normalized.url,
      timestamp: normalized.timestamp,
      userAgent: normalized.userAgent,
      stack: normalized.stack,
      source: normalized.source,
      ai,
    });

    await sendAdminAlertEmail({
      message: normalized.message,
      code: normalized.code,
      url: normalized.url,
      timestamp: normalized.timestamp,
      source: normalized.source,
      ai,
      ticketId,
    });

    return NextResponse.json({ ok: true, ai, ticketId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
