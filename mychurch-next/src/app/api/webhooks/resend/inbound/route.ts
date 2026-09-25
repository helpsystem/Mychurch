import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { analyzeSpamAndBot } from "@/lib/spam-filter";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    // 1. Optional Secret Verification (Anti-Bot / Spoofing)
    const webhookSecret = process.env.RESEND_INBOUND_SECRET;
    if (webhookSecret) {
      const authHeader = req.headers.get("authorization");
      const urlSecret = req.nextUrl.searchParams.get("secret");
      const token = authHeader?.replace("Bearer ", "").trim() || urlSecret;
      if (token !== webhookSecret) {
        console.warn("[Inbound Webhook] 🛑 Unauthorized webhook request rejected.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await req.json();
    console.log("[Inbound Webhook] 📨 Received webhook event:", payload?.type || "unknown");

    let fromEmail = "";
    let fromName = "";
    let toEmail = "admin@iranianchurchdc.com";
    let subject = "(بدون موضوع)";
    let bodyText = "";
    let bodyHtml = "";
    let resendId = "";
    let spfStatus = "pass";
    let dkimStatus = "pass";

    // Handle standard Resend Inbound Event: email.received
    if (payload?.type === "email.received" && payload?.data) {
      const eventData = payload.data;
      resendId = eventData.email_id || "";
      fromEmail = eventData.from || "";
      toEmail = Array.isArray(eventData.to) ? eventData.to.join(", ") : (eventData.to || toEmail);
      subject = eventData.subject || "(بدون موضوع)";

      // Attempt to retrieve full email body via Resend Receiving API if email_id is present
      if (resendId && process.env.RESEND_API_KEY) {
        try {
          console.log(`[Inbound Webhook] 🔍 Fetching email content for email_id: ${resendId}`);
          // Resend receiving get API
          const fullEmail: any = await (resend as any).emails.receiving?.get(resendId);
          if (fullEmail?.data) {
            bodyText = fullEmail.data.text || "";
            bodyHtml = fullEmail.data.html || "";
          }
        } catch (fetchErr: any) {
          console.warn("[Inbound Webhook] ⚠️ Could not fetch full content via Resend API:", fetchErr.message);
        }
      }

      // Fallback to text/html directly in eventData if provided
      if (!bodyText && eventData.text) bodyText = eventData.text;
      if (!bodyHtml && eventData.html) bodyHtml = eventData.html;
    } else {
      // Allow custom or direct inbound payloads
      fromEmail = payload.from || payload.from_email || "";
      fromName = payload.from_name || "";
      toEmail = payload.to || payload.to_email || toEmail;
      subject = payload.subject || "(بدون موضوع)";
      bodyText = payload.text || payload.body_text || payload.body || "";
      bodyHtml = payload.html || payload.body_html || "";
      resendId = payload.email_id || payload.id || "";
    }

    if (!fromEmail) {
      return NextResponse.json({ error: "Missing from email in payload" }, { status: 400 });
    }

    // Extract display name if formatted as "Name <email@example.com>"
    const nameMatch = fromEmail.match(/^"?([^"<]+)"?\s*<([^>]+)>/);
    if (nameMatch) {
      fromName = nameMatch[1].trim();
      fromEmail = nameMatch[2].trim();
    }

    // 2. Anti-Bot & Spam Filter Analysis
    const spamAnalysis = analyzeSpamAndBot({
      fromEmail,
      fromName,
      subject,
      bodyText,
      bodyHtml,
      spfStatus,
      dkimStatus,
    });

    console.log(`[Inbound Webhook] 🛡️ Spam Analysis for ${fromEmail}:`, {
      score: spamAnalysis.score,
      verdict: spamAnalysis.verdict,
      isSpam: spamAnalysis.isSpam,
      isBot: spamAnalysis.isBot,
    });

    const status = spamAnalysis.isSpam ? "spam" : "unread";

    // 3. Persist into admin_emails table
    const insertSql = `
      INSERT INTO admin_emails (
        direction,
        from_email,
        from_name,
        to_email,
        subject,
        body_text,
        body_html,
        status,
        is_spam,
        spam_score,
        spam_reasons,
        is_bot_flagged,
        bot_reason,
        resend_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id
    `;

    const { rows } = await query(insertSql, [
      "inbound",
      fromEmail,
      fromName || null,
      toEmail,
      subject,
      bodyText || null,
      bodyHtml || null,
      status,
      spamAnalysis.isSpam,
      spamAnalysis.score,
      JSON.stringify(spamAnalysis.reasons),
      spamAnalysis.isBot,
      spamAnalysis.botReason || null,
      resendId || null,
    ]);

    const insertedId = rows[0]?.id;
    console.log(`[Inbound Webhook] ✅ Email stored successfully with ID: ${insertedId} (Folder: ${status})`);

    return NextResponse.json({
      success: true,
      id: insertedId,
      verdict: spamAnalysis.verdict,
      isSpam: spamAnalysis.isSpam,
    });
  } catch (err: any) {
    console.error("[Inbound Webhook] ❌ Error processing inbound email:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
