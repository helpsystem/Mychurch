import { query } from "@/lib/db";
import { sendTelegramMessage } from "@/services/telegram";
import { sendTelegramUserMessageById, sendTelegramUserMessage } from "@/services/telegram-user";
import { sendEmail } from "@/lib/email";
import { logUserActivity } from "@/actions/audit";

export type RoleType = 'Admin' | 'Leader' | 'Operator' | 'User';

export type NotificationEvent = 
  | 'prayer_created'
  | 'prayer_status_updated'
  | 'document_scanned_confidential'
  | 'user_role_changed'
  | 'gift_received'
  | 'broadcast_alert'
  | 'system_alert';

export interface NotificationPayload {
  event: NotificationEvent;
  title: string;
  summary: string;
  targetRoles: RoleType[];
  directUserIds?: string[];
  directEmails?: string[];
  directTelegramIds?: string[];
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
}

interface RecipientUser {
  id: string | number;
  email?: string;
  name?: string;
  role: string;
  telegram_id?: string;
  phone?: string;
}

/**
 * Modern responsive HTML email template generator for church notifications.
 */
function generateEmailHtml(payload: NotificationPayload, recipientName: string): string {
  const churchName = "کلیسای پروتستان ایرانیان واشنگتن دی‌سی";
  const year = new Date().getFullYear();
  const domain = "https://www.iranianchurchdc.com";
  const actionUrl = payload.actionUrl ? (payload.actionUrl.startsWith('http') ? payload.actionUrl : `${domain}${payload.actionUrl}`) : `${domain}/admin`;
  const actionText = payload.actionText || "مشاهده و اقدام در پنل";

  // Build metadata items table if metadata exists
  let metaRows = '';
  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    metaRows = Object.entries(payload.metadata)
      .map(([key, val]) => {
        if (val === undefined || val === null || val === '') return '';
        return `
          <tr>
            <td style="padding: 8px 12px; font-weight: bold; color: #94a3b8; border-bottom: 1px solid #334155; font-size: 13px; width: 35%;">${key}:</td>
            <td style="padding: 8px 12px; color: #f8fafc; border-bottom: 1px solid #334155; font-size: 13px;">${val}</td>
          </tr>
        `;
      })
      .join('');
  }

  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: Tahoma, 'Vazirmatn', -apple-system, sans-serif; color: #f8fafc; direction: rtl; text-align: right;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #111827; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 24px; text-align: center; border-bottom: 2px solid #6366f1;">
              <img src="${domain}/logo-transparent.png" alt="Logo" width="56" height="56" style="margin-bottom: 10px; display: inline-block;">
              <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 800;">${churchName}</h1>
              <p style="margin: 4px 0 0; color: #c7d2fe; font-size: 12px; letter-spacing: 1px;">سامانه اطلاع‌رسانی و نوتیفیکیشن هوشمند</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px; font-size: 14px; color: #94a3b8;">
                سلام <strong>${recipientName || 'همکار گرامی'}</strong>،
              </p>

              <div style="background-color: #1e293b; border-right: 4px solid #6366f1; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <h2 style="margin: 0 0 8px; font-size: 16px; color: #ffffff; font-weight: bold;">
                  ${payload.title}
                </h2>
                <p style="margin: 0; font-size: 14px; color: #cbd5e1; line-height: 1.7; white-space: pre-line;">
                  ${payload.summary}
                </p>
              </div>

              ${metaRows ? `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #0f172a; border-radius: 8px; border: 1px solid #1e293b; overflow: hidden;">
                ${metaRows}
              </table>
              ` : ''}

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0 16px;">
                <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: bold; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                  ${actionText}
                </a>
              </div>

              <p style="margin: 20px 0 0; font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
                این پیام به دلیل سطح دسترسی شما در سامانه کلیسا ارسال شده است.<br>
                آدرس مستقیم: <a href="${actionUrl}" style="color: #818cf8; word-break: break-all;">${actionUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0f19; padding: 16px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #475569;">
              © ${year} ${churchName} — تمامی حقوق محفوظ است.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate formatted HTML text for Telegram (Bilingual Persian + English)
 */
function generateTelegramHtml(payload: NotificationPayload, recipientName: string): string {
  const domain = "https://www.iranianchurchdc.com";
  const actionUrl = payload.actionUrl ? (payload.actionUrl.startsWith('http') ? payload.actionUrl : `${domain}${payload.actionUrl}`) : `${domain}/admin`;
  const actionText = payload.actionText || "بررسی و اقدام در پنل | Review in Panel";

  let lines: string[] = [];
  lines.push(`🔔 <b>${payload.title}</b>\n`);
  if (recipientName && recipientName !== 'مسئول گرامی') {
    lines.push(`👤 <i>مخاطب | Recipient: ${recipientName}</i>`);
  }
  lines.push(`📄 <b>شرح | Details:</b>\n${payload.summary}\n`);

  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    lines.push(`📋 <b>مشخصات | Metadata:</b>`);
    for (const [key, val] of Object.entries(payload.metadata)) {
      if (val !== undefined && val !== null && val !== '') {
        lines.push(`• <b>${key}:</b> ${val}`);
      }
    }
    lines.push('');
  }

  lines.push(`🔗 <a href="${actionUrl}">${actionText}</a>`);
  lines.push(`\n⛪️ <i>کلیسای ایرانیان واشنگتن دی‌سی | Iranian Presbyterian Church DC</i>`);

  return lines.join('\n');
}

/**
 * Plain text version for MTProto and text email fallback (Bilingual)
 */
function generatePlainText(payload: NotificationPayload, recipientName: string): string {
  const domain = "https://www.iranianchurchdc.com";
  const actionUrl = payload.actionUrl ? (payload.actionUrl.startsWith('http') ? payload.actionUrl : `${domain}${payload.actionUrl}`) : `${domain}/admin`;
  const actionText = payload.actionText || "بررسی در پنل | Review in Panel";

  let lines: string[] = [];
  lines.push(`[${payload.title}]`);
  lines.push(`سلام | Greetings ${recipientName || 'گرامی'},`);
  lines.push(payload.summary);

  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    lines.push('---');
    for (const [key, val] of Object.entries(payload.metadata)) {
      if (val !== undefined && val !== null && val !== '') {
        lines.push(`${key}: ${val}`);
      }
    }
    lines.push('---');
  }

  lines.push(`لینک اقدام | Action Link: ${actionUrl}`);
  lines.push(`Iranian Presbyterian Church DC — کلیسای ایرانیان واشنگتن`);
  return lines.join('\n');
}

/**
 * Send notification to a single user via Telegram (Bot -> User MTProto -> Phone MTProto)
 */
async function sendTelegramToUser(telegramId: string, phone: string | undefined, htmlText: string, plainText: string): Promise<boolean> {
  // 1. Try bot first
  try {
    const botSent = await sendTelegramMessage(telegramId, htmlText, { parse_mode: "HTML" });
    if (botSent) {
      console.log(`[NotificationService] ✅ Bot sent Telegram message to ${telegramId}`);
      return true;
    }
  } catch (err: any) {
    console.warn(`[NotificationService] ⚠️ Bot send failed for ${telegramId}:`, err.message);
  }

  // 2. Fallback to MTProto user client by Chat ID
  try {
    const userSent = await sendTelegramUserMessageById(telegramId, plainText);
    if (userSent) {
      console.log(`[NotificationService] ✅ MTProto sent Telegram message to chat ID ${telegramId}`);
      return true;
    }
  } catch (err: any) {
    console.warn(`[NotificationService] ⚠️ MTProto by chat ID failed for ${telegramId}:`, err.message);
  }

  // 3. Fallback to MTProto user client by Phone Number
  if (phone) {
    try {
      const phoneSent = await sendTelegramUserMessage(phone, plainText);
      if (phoneSent) {
        console.log(`[NotificationService] ✅ MTProto sent Telegram message to phone ${phone}`);
        return true;
      }
    } catch (err: any) {
      console.warn(`[NotificationService] ⚠️ MTProto by phone failed for ${phone}:`, err.message);
    }
  }

  return false;
}

/**
 * Dispatch notification across Telegram and Email to users matching target roles
 */
export async function dispatchRoleNotification(payload: NotificationPayload): Promise<{
  success: boolean;
  recipientsCount: number;
  telegramDelivered: number;
  emailDelivered: number;
  details?: string;
}> {
  console.log(`[NotificationService] 🚀 Dispatching event: ${payload.event} for roles:`, payload.targetRoles);

  let recipients: RecipientUser[] = [];

  try {
    // 1. Fetch eligible users from Database based on targetRoles
    if (payload.targetRoles && payload.targetRoles.length > 0) {
      const rolePlaceholders = payload.targetRoles.map((_, i) => `$${i + 1}`).join(',');
      const res = await query(
        `SELECT id, email, name, role, telegram_id, phone 
         FROM users 
         WHERE role IN (${rolePlaceholders})`,
        payload.targetRoles
      );
      recipients = (res.rows || []).map((r: any) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        telegram_id: r.telegram_id,
        phone: r.phone
      }));
    }

    // 2. Add direct user IDs if specified
    if (payload.directUserIds && payload.directUserIds.length > 0) {
      for (const uid of payload.directUserIds) {
        const uRes = await query(
          `SELECT id, email, name, role, telegram_id, phone FROM users WHERE id::text = $1 OR email = $1 LIMIT 1`,
          [uid]
        );
        if (uRes.rows && uRes.rows[0]) {
          const r = uRes.rows[0];
          if (!recipients.some(x => x.id === r.id || x.email === r.email)) {
            recipients.push({
              id: r.id,
              email: r.email,
              name: r.name,
              role: r.role,
              telegram_id: r.telegram_id,
              phone: r.phone
            });
          }
        }
      }
    }

    // 3. Add direct Emails or Telegram IDs if provided directly (e.g. guest prayer applicant)
    if (payload.directEmails && payload.directEmails.length > 0) {
      for (const email of payload.directEmails) {
        if (!recipients.some(x => x.email === email)) {
          recipients.push({
            id: 'guest',
            email,
            name: 'ایماندار گرامی',
            role: 'User'
          });
        }
      }
    }
    if (payload.directTelegramIds && payload.directTelegramIds.length > 0) {
      for (const tgId of payload.directTelegramIds) {
        if (!recipients.some(x => x.telegram_id === tgId)) {
          recipients.push({
            id: 'guest_tg',
            telegram_id: tgId,
            name: 'ایماندار گرامی',
            role: 'User'
          });
        }
      }
    }

  } catch (dbErr: any) {
    console.error("[NotificationService] ❌ Failed to fetch recipient users:", dbErr.message);
  }

  console.log(`[NotificationService] Found ${recipients.length} recipients for event ${payload.event}`);

  let telegramDelivered = 0;
  let emailDelivered = 0;
  let telegramAttempted = false;

  // 4. Send to all individual recipients
  for (const user of recipients) {
    const recipientName = user.name || (user.email ? user.email.split('@')[0] : 'مسئول گرامی');
    const telegramHtml = generateTelegramHtml(payload, recipientName);
    const plainText = generatePlainText(payload, recipientName);
    const emailHtml = generateEmailHtml(payload, recipientName);

    // A) Telegram
    if (user.telegram_id) {
      telegramAttempted = true;
      const tgSuccess = await sendTelegramToUser(user.telegram_id, user.phone, telegramHtml, plainText);
      if (tgSuccess) telegramDelivered++;
    }

    // B) Email
    if (user.email && user.email.includes('@')) {
      try {
        const mailRes = await sendEmail({
          to: [user.email],
          subject: `[کلیسای ایرانیان واشنگتن] ${payload.title}`,
          html: emailHtml,
          text: plainText
        });
        if (mailRes.success) {
          console.log(`[NotificationService] ✅ Email sent to ${user.email}`);
          emailDelivered++;
        } else {
          console.warn(`[NotificationService] ⚠️ Email failed for ${user.email}:`, mailRes.error);
          // Fallback to verified church address if external recipient was blocked by sandbox
          if (user.email !== 'iranianchurchdc.us@gmail.com') {
            const fallbackRes = await sendEmail({
              to: ['iranianchurchdc.us@gmail.com'],
              subject: `[ارجاع نوتیفیکیشن کلیسا: ${user.name || user.email}] ${payload.title}`,
              html: emailHtml,
              text: plainText
            });
            if (fallbackRes.success) {
              console.log(`[NotificationService] ✅ Email forwarded to church admin fallback (iranianchurchdc.us@gmail.com)`);
              emailDelivered++;
            }
          }
        }
      } catch (mErr: any) {
        console.error(`[NotificationService] ❌ Email exception for ${user.email}:`, mErr.message);
      }
    }
  }

  // 5. Fallback for Telegram: If no individual recipient had a telegram_id and target is Admin/Leader/Operator,
  // broadcast to the public group ID if configured
  const publicGroupId = process.env.TELEGRAM_PUBLIC_GROUP_ID;
  if (!telegramAttempted && publicGroupId && (payload.targetRoles.includes('Admin') || payload.targetRoles.includes('Leader') || payload.targetRoles.includes('Operator'))) {
    try {
      console.log(`[NotificationService] ℹ️ Broadcasting to fallback Telegram group: ${publicGroupId}`);
      const groupHtml = generateTelegramHtml(payload, 'کادر و مسئولین کلیسا');
      const sentGroup = await sendTelegramMessage(publicGroupId, groupHtml, { parse_mode: 'HTML' });
      if (sentGroup) telegramDelivered++;
    } catch (gErr: any) {
      console.warn("[NotificationService] Group broadcast fallback failed:", gErr.message);
    }
  }

  // 6. Log to Audit Logs
  try {
    await logUserActivity({
      action: 'NOTIFICATION_DISPATCH',
      resourceType: 'system',
      details: {
        event: payload.event,
        title: payload.title,
        targetRoles: payload.targetRoles,
        recipientsCount: recipients.length,
        telegramDelivered,
        emailDelivered
      }
    });
  } catch (auditErr) {
    // Non-blocking
  }

  return {
    success: telegramDelivered > 0 || emailDelivered > 0,
    recipientsCount: recipients.length,
    telegramDelivered,
    emailDelivered
  };
}
