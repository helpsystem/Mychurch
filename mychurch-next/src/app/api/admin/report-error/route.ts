import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { query } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

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
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
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
    <div style="font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
      <div style="padding: 16px 20px; background: #111827; color: #fff;">
        <h2 style="margin: 0; font-size: 18px;">Client Error Alert</h2>
      </div>
      <div style="padding: 20px; line-height: 1.6; color: #111827;">
        <p><strong>Severity:</strong> ${payload.ai.severity}</p>
        <p><strong>AI Summary:</strong> ${payload.ai.summary}</p>
        <p><strong>Probable Cause:</strong> ${payload.ai.probableCause}</p>
        <p><strong>Suggested Fix:</strong> ${payload.ai.suggestedFix}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
        <p><strong>Code:</strong> ${payload.code || "N/A"}</p>
        <p><strong>Source:</strong> ${payload.source || "N/A"}</p>
        <p><strong>URL:</strong> ${payload.url || "N/A"}</p>
        <p><strong>Timestamp:</strong> ${payload.timestamp}</p>
        <p><strong>Admin Ticket ID:</strong> ${payload.ticketId || "Not created"}</p>
        <p><strong>Message:</strong><br/>${payload.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
    </div>
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
