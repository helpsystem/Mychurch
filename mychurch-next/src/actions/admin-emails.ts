"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole, getUserEmail } from "@/utils/rbac";
import { sendMail } from "@/lib/mailer";
import { analyzeSpamAndBot } from "@/lib/spam-filter";

export interface AdminEmailRecord {
  id: number;
  direction: "inbound" | "outbound";
  from_email: string;
  from_name: string | null;
  to_email: string;
  reply_to: string | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  status: "unread" | "read" | "replied" | "sent" | "spam" | "archived";
  is_spam: boolean;
  spam_score: number;
  spam_reasons: string[];
  is_bot_flagged: boolean;
  bot_reason: string | null;
  resend_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailFilterOptions {
  folder?: "inbox" | "sent" | "spam" | "archived" | "all";
  search?: string;
  page?: number;
  limit?: number;
}

// In-memory sliding window rate limiter (20 sends / 10 minutes per admin)
const sendRateLimits = new Map<string, number[]>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxAttempts = 20;

  const timestamps = (sendRateLimits.get(identifier) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxAttempts) {
    return false;
  }
  timestamps.push(now);
  sendRateLimits.set(identifier, timestamps);
  return true;
}

/**
 * Get emails with pagination, search, and folder filtering.
 */
export async function getAdminEmails(options: EmailFilterOptions = {}): Promise<{
  success: boolean;
  emails: AdminEmailRecord[];
  total: number;
  unreadCount: number;
  folderCounts: {
    inbox: number;
    inboxUnread: number;
    sent: number;
    spam: number;
  };
  error?: string;
}> {
  try {
    await requireRole(["Admin", "Leader"]);

    const { folder = "inbox", search = "", page = 1, limit = 30 } = options;
    const offset = Math.max(0, (page - 1) * limit);

    // Build conditions
    const whereParts: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (folder === "inbox") {
      whereParts.push(`direction = 'inbound' AND is_spam = FALSE AND status != 'archived'`);
    } else if (folder === "sent") {
      whereParts.push(`direction = 'outbound'`);
    } else if (folder === "spam") {
      whereParts.push(`(is_spam = TRUE OR status = 'spam')`);
    } else if (folder === "archived") {
      whereParts.push(`status = 'archived'`);
    }

    if (search.trim()) {
      whereParts.push(`(subject ILIKE $${paramIndex} OR from_email ILIKE $${paramIndex} OR to_email ILIKE $${paramIndex} OR body_text ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    // Query list
    const listSql = `
      SELECT * FROM admin_emails
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const { rows: emails } = await query(listSql, params);

    // Count for current filter
    const countSql = `SELECT COUNT(*) as cnt FROM admin_emails ${whereSql}`;
    const countParams = params.slice(0, paramIndex - 1);
    const { rows: countRows } = await query(countSql, countParams);
    const total = parseInt(countRows[0]?.cnt || "0", 10);

    // Global folder counts
    const { rows: statsRows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE direction = 'inbound' AND is_spam = FALSE AND status != 'archived') as inbox_total,
        COUNT(*) FILTER (WHERE direction = 'inbound' AND is_spam = FALSE AND status = 'unread') as inbox_unread,
        COUNT(*) FILTER (WHERE direction = 'outbound') as sent_total,
        COUNT(*) FILTER (WHERE is_spam = TRUE OR status = 'spam') as spam_total
      FROM admin_emails
    `);

    const stats = statsRows[0] || {};
    const folderCounts = {
      inbox: parseInt(stats.inbox_total || "0", 10),
      inboxUnread: parseInt(stats.inbox_unread || "0", 10),
      sent: parseInt(stats.sent_total || "0", 10),
      spam: parseInt(stats.spam_total || "0", 10),
    };

    return {
      success: true,
      emails,
      total,
      unreadCount: folderCounts.inboxUnread,
      folderCounts,
    };
  } catch (err: any) {
    console.error("[getAdminEmails] Error:", err);
    return {
      success: false,
      emails: [],
      total: 0,
      unreadCount: 0,
      folderCounts: { inbox: 0, inboxUnread: 0, sent: 0, spam: 0 },
      error: err.message || "Failed to load emails.",
    };
  }
}

/**
 * Fetch a single email and mark it as read if unread.
 */
export async function getAdminEmailById(id: number): Promise<{
  success: boolean;
  email?: AdminEmailRecord;
  error?: string;
}> {
  try {
    await requireRole(["Admin", "Leader"]);

    const { rows } = await query("SELECT * FROM admin_emails WHERE id = $1", [id]);
    if (rows.length === 0) {
      return { success: false, error: "ایمیل مورد نظر یافت نشد. (Email not found)" };
    }

    const email: AdminEmailRecord = rows[0];

    // Mark as read if unread
    if (email.status === "unread") {
      await query("UPDATE admin_emails SET status = 'read', updated_at = NOW() WHERE id = $1", [id]);
      email.status = "read";
      revalidatePath("/admin/communications/email");
    }

    return { success: true, email };
  } catch (err: any) {
    console.error("[getAdminEmailById] Error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send an email from admin@iranianchurchdc.com with anti-bot, honeypot & rate-limiting protection.
 */
export async function sendAdminEmail(payload: {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  replyToId?: number;
  honeypot?: string;
  formFillTimeMs?: number;
}): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    await requireRole(["Admin"]);
    const adminEmail = await getUserEmail() || "admin";

    // 1. Anti-Bot: Honeypot trap check
    if (payload.honeypot && payload.honeypot.trim().length > 0) {
      console.warn(`[Anti-Bot] 🛑 Bot honeypot triggered by admin session: ${adminEmail}`);
      return { success: false, error: "درخواست نامعتبر تشخیص داده شد (Bot activity flagged)." };
    }

    // 2. Anti-Bot: Form fill timing guard (Human typically needs > 1.2 seconds)
    if (payload.formFillTimeMs !== undefined && payload.formFillTimeMs < 1200) {
      console.warn(`[Anti-Bot] 🛑 Form submitted suspiciously fast (${payload.formFillTimeMs}ms)`);
      return { success: false, error: "ارسال بیش از حد سریع بود. لطفاً چند ثانیه تأمل فرموده و مجدداً تلاش کنید." };
    }

    // 3. Anti-Abuse: Rate Limiter
    if (!checkRateLimit(adminEmail)) {
      return { success: false, error: "محدودیت نرخ ارسال: شما حداکثر سقف مجاز را پر کرده‌اید. لطفاً ۱۰ دقیقه صبر کنید." };
    }

    // 4. Sanitize inputs to prevent Email Header Injection
    const cleanedTo = (payload.to || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanedTo)) {
      return { success: false, error: "فرمت آدرس ایمیل گیرنده نامعتبر است." };
    }

    // Strip carriage returns and line feeds from subject to block CRLF header injection
    const cleanedSubject = (payload.subject || "").replace(/[\r\n]+/g, " ").trim();
    if (!cleanedSubject) {
      return { success: false, error: "موضوع ایمیل الزامی است." };
    }

    const rawBody = (payload.body || "").trim();
    if (!rawBody) {
      return { success: false, error: "متن پیام نمی‌تواند خالی باشد." };
    }

    // 5. Construct HTML & Text
    const FROM_EMAIL = "admin@iranianchurchdc.com";
    const FROM_DISPLAY = "Iranian Christian Church DC <admin@iranianchurchdc.com>";

    const bodyHtml = payload.isHtml
      ? rawBody
      : `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Tahoma, 'Vazirmatn', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; direction: rtl; }
            .card { max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #d4af37; }
            .header h1 { color: #d4af37; margin: 0; font-size: 19px; font-weight: bold; }
            .header p { color: #94a3b8; margin: 6px 0 0; font-size: 13px; font-family: Arial, sans-serif; direction: ltr; }
            .content { padding: 32px 28px; line-height: 1.8; font-size: 15px; text-align: right; }
            .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>کلیسای انجیلی ایرانیان واشنگتن دی‌سی</h1>
              <p>Iranian Presbyterian Church of Washington D.C.</p>
            </div>
            <div class="content">
              ${rawBody.replace(/\n/g, "<br />")}
            </div>
            <div class="footer">
              <p style="margin: 0 0 6px;">این پیام رسمی از آدرس رسمی کلیسا (${FROM_EMAIL}) ارسال شده است.</p>
              <p style="margin: 0;"><a href="https://www.iranianchurchdc.com" style="color: #d4af37; text-decoration: none;">iranianchurchdc.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

    // 6. Send via mailer
    console.log(`[Admin Mail] 📤 Sending email to ${cleanedTo} with subject: "${cleanedSubject}"`);
    const mailResult: any = await sendMail({
      from: FROM_DISPLAY,
      to: cleanedTo,
      subject: cleanedSubject,
      text: rawBody,
      html: bodyHtml,
      replyTo: FROM_EMAIL,
    });

    const resendMessageId = mailResult?.messageId || `msg_${Date.now()}`;

    // 7. Store outbound record in DB
    await query(
      `INSERT INTO admin_emails 
        (direction, from_email, from_name, to_email, reply_to, subject, body_text, body_html, status, is_spam, resend_id, created_at)
       VALUES 
        ('outbound', $1, $2, $3, $4, $5, $6, $7, 'sent', FALSE, $8, NOW())`,
      [
        FROM_EMAIL,
        "Iranian Christian Church DC",
        cleanedTo,
        FROM_EMAIL,
        cleanedSubject,
        rawBody,
        bodyHtml,
        resendMessageId,
      ]
    );

    // If this was a reply to an inbound email, mark parent as 'replied'
    if (payload.replyToId) {
      await query("UPDATE admin_emails SET status = 'replied', updated_at = NOW() WHERE id = $1", [payload.replyToId]);
    }

    revalidatePath("/admin/communications/email");
    return { success: true, messageId: resendMessageId };
  } catch (err: any) {
    console.error("[sendAdminEmail] Error:", err);
    return { success: false, error: err.message || "Failed to send email." };
  }
}

/**
 * Toggle spam status or move to spam.
 */
export async function markEmailSpam(id: number, isSpam: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["Admin"]);
    await query(
      "UPDATE admin_emails SET is_spam = $1, status = $2, updated_at = NOW() WHERE id = $3",
      [isSpam, isSpam ? "spam" : "read", id]
    );
    revalidatePath("/admin/communications/email");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete an email.
 */
export async function deleteAdminEmail(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["Admin"]);
    await query("DELETE FROM admin_emails WHERE id = $1", [id]);
    revalidatePath("/admin/communications/email");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Quick unread count for sidebar badge.
 */
export async function getAdminUnreadEmailCount(): Promise<number> {
  try {
    const { rows } = await query(
      "SELECT COUNT(*) as count FROM admin_emails WHERE direction = 'inbound' AND is_spam = FALSE AND status = 'unread'"
    );
    return parseInt(rows[0]?.count || "0", 10);
  } catch (err) {
    return 0;
  }
}
