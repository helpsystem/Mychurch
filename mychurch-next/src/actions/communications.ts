"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/utils/rbac";

export interface Announcement {
    id?: number;
    title: string;
    content: string;
    priority: "normal" | "high";
    status: "published" | "draft";
}

export async function createAnnouncement(announcement: Announcement): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);

        if (!announcement.title?.trim() || !announcement.content?.trim()) {
            return { success: false, error: "Title and content are required." };
        }

        await query(
            'INSERT INTO announcements (title, content, priority, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [announcement.title.trim(), announcement.content.trim(), announcement.priority, announcement.status]
        );
        // Revalidate public layouts where announcements might be shown
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('[Action] Error creating announcement:', error);
        return { success: false, error: 'Failed to publish announcement. Database may be offline.' };
    }
}

export async function sendMassEmail(subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);

        const cleanedSubject = (subject || "").trim();
        const cleanedBody = (body || "").trim();
        if (!cleanedSubject || !cleanedBody) {
            return { success: false, error: "Subject and body are required." };
        }

        // Get all user emails
        const { rows: usersRows } = await query('SELECT email FROM users');
        const userEmails = usersRows.map(r => r.email);

        // Get all active newsletter subscribers
        let subscriberEmails: string[] = [];
        try {
            const { rows: subRows } = await query("SELECT email FROM newsletter_subscribers WHERE status = 'active'");
            subscriberEmails = subRows.map(r => r.email);
        } catch (e) {
            console.warn('[Action] newsletter_subscribers table not accessible, skipping', e);
        }

        // Merge and deduplicate
        const uniqueEmails = Array.from(new Set([...userEmails, ...subscriberEmails])).filter(Boolean);

        if (uniqueEmails.length === 0) {
            return { success: false, error: "هیچ گیرنده‌ای یافت نشد / No recipients found." };
        }

        const bodyHtml = cleanedBody.replace(/\n/g, "<br />");
        const formattedHtml = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${cleanedSubject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0b0f19; color: #e2e8f0; font-family: Tahoma, 'Vazirmatn', Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #131826; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                            <!-- Header with Gold Accent -->
                            <tr style="background: linear-gradient(135deg, #1e2538 0%, #151a28 100%); text-align: center; border-bottom: 2px solid #f59e0b;">
                                <td style="padding: 32px 24px;">
                                    <h1 style="color: #f59e0b; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">کلیسای انجیلی ایرانیان واشنگتن دی‌سی</h1>
                                    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-family: Arial, sans-serif;" dir="ltr">Iranian Presbyterian Church of Washington D.C.</p>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style="padding: 36px 30px; text-align: right; color: #e2e8f0; line-height: 1.9; font-size: 15px;">
                                    <h2 style="color: #f59e0b; font-size: 19px; margin-top: 0; margin-bottom: 22px; font-weight: 700;">${cleanedSubject}</h2>
                                    <div style="color: #cbd5e1; font-size: 15px; line-height: 1.9;">
                                        ${bodyHtml}
                                    </div>
                                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
                                        <a href="https://www.iranianchurchdc.com" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0b0f19; text-decoration: none; font-weight: bold; border-radius: 9999px; font-size: 14px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">ورود به وب‌سایت کلیسا</a>
                                    </div>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr style="background-color: #0d121f; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                                <td style="padding: 24px 30px; font-size: 12px; color: #64748b; line-height: 1.7; font-family: Arial, sans-serif;">
                                    <p style="margin: 0 0 8px 0; font-family: Tahoma, sans-serif;">این ایمیل رسمی از سوی خادمین کلیسای ایرانیان واشنگتن ارسال گردیده است.</p>
                                    <p style="margin: 0 0 12px 0;">Pastor: Rev. Javad Pishghadamian &bull; Leadership: Mrs. Nazi Rasti<br/>Broadcast: iranianchurchdc.com/broadcast/view</p>
                                    <p style="margin: 0;">
                                        <a href="https://www.iranianchurchdc.com" style="color: #f59e0b; text-decoration: none; margin: 0 8px;">iranianchurchdc.com</a> &bull;
                                        <a href="https://www.iranianchurchdc.com/unsubscribe" style="color: #64748b; text-decoration: underline; margin: 0 8px;">لغو عضویت (Unsubscribe)</a>
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        // Send via mailer using BCC with safe chunking (batches of 40)
        const { sendMail } = await import("@/lib/mailer");
        const BATCH_SIZE = 40;
        let sentCount = 0;

        for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
            const chunk = uniqueEmails.slice(i, i + BATCH_SIZE);
            await sendMail({
                to: "recipients@iranianchurchdc.com",
                bcc: chunk,
                subject: cleanedSubject,
                html: formattedHtml
            });
            sentCount += chunk.length;
            // Brief 250ms pause between batches to respect SMTP rate limits
            if (i + BATCH_SIZE < uniqueEmails.length) {
                await new Promise(r => setTimeout(r, 250));
            }
        }

        // Log the email broadcast intent to database
        await query(
            'INSERT INTO email_logs (subject, body, sent_at) VALUES ($1, $2, NOW())',
            [cleanedSubject.slice(0, 240), cleanedBody]
        );

        return { success: true };
    } catch (error: any) {
        console.error('[Action] Error sending mass email:', error);
        return { success: false, error: error.message || 'Failed to dispatch email broadcast.' };
    }
}

export async function sendTestMassEmail(subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);
        const { getUserEmail } = await import("@/utils/rbac");
        const email = await getUserEmail();

        if (!email) {
            return { success: false, error: "ایمیل مدیر یافت نشد." };
        }

        const cleanedSubject = (subject || "").trim();
        const cleanedBody = (body || "").trim();
        if (!cleanedSubject || !cleanedBody) {
            return { success: false, error: "Subject and body are required." };
        }

        const bodyHtml = `<h3>این یک ایمیل تست است (گیرنده: ${email})</h3><p>${cleanedBody.replace(/\n/g, "<br />")}</p>`;
        const formattedHtml = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>[TEST] ${cleanedSubject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; color: #333333; font-family: Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f9fc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                            <!-- Header -->
                            <tr style="background-color: #4f46e5; text-align: center;">
                                <td style="padding: 30px 20px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; font-family: Tahoma, Geneva, sans-serif;">کلیسای ایرانی دی‌سی | MyChurch [TEST]</h1>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px; text-align: right; color: #333333; line-height: 1.8; font-size: 16px; font-family: Tahoma, Geneva, sans-serif;">
                                    <h2 style="color: #4f46e5; font-size: 18px; margin-top: 0; margin-bottom: 20px; font-family: Tahoma, Geneva, sans-serif;">[TEST] ${cleanedSubject}</h2>
                                    <div style="color: #333333; font-size: 15px; line-height: 1.8;">
                                        ${bodyHtml}
                                    </div>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                                <td style="padding: 25px 30px; font-size: 12px; color: #64748b; line-height: 1.6; font-family: Arial, sans-serif;">
                                    <p style="margin: 0 0 10px 0; font-family: Tahoma, Geneva, sans-serif;">این یک ایمیل تستی از بخش مدیریت سامانه است.</p>
                                    <p style="margin: 0 0 15px 0;">Iranian Presbyterian Church of Washington D.C.<br/>Address: Iranian Presbyterian Church, Washington D.C., USA</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        // Send test email via mailer
        const { sendMail } = await import("@/lib/mailer");
        await sendMail({
            to: email,
            subject: `[TEST] ${cleanedSubject}`,
            html: formattedHtml
        });

        console.log(`[Test Email] Sent to ${email}: ${cleanedSubject}`);

        return { success: true };
    } catch (error: any) {
        console.error('[Action] Error sending test email:', error);
        return { success: false, error: error.message || 'Failed to send test email.' };
    }
}

export async function getAnnouncements(): Promise<Announcement[]> {
    try {
        await requireRole(["Admin"]);
        const { rows } = await query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50');
        return rows as Announcement[];
    } catch (error) {
        console.error('[Action] Error fetching announcements:', error);
        return [];
    }
}

export async function getEmailLogs(): Promise<Array<{ id: number, subject: string, body: string, sent_at: string }>> {
    try {
        await requireRole(["Admin"]);
        const { rows } = await query('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50');
        return rows;
    } catch (error) {
        console.error('[Action] Error fetching email logs:', error);
        return [];
    }
}

export interface WhatsAppLog {
    id: number;
    recipient_count: number;
    body: string;
    status: string;
    sent_at: string;
}

export async function getWhatsAppLogs(): Promise<WhatsAppLog[]> {
    try {
        await requireRole(["Admin"]);
        // Ensure table exists
        await query(`
            CREATE TABLE IF NOT EXISTS whatsapp_logs (
                id SERIAL PRIMARY KEY,
                recipient_count INT,
                body TEXT,
                status VARCHAR(50),
                sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);
        const { rows } = await query('SELECT * FROM whatsapp_logs ORDER BY sent_at DESC LIMIT 50');
        return rows as WhatsAppLog[];
    } catch (error) {
        console.error('[Action] Error fetching whatsapp logs:', error);
        return [];
    }
}

export async function getWhatsAppProviderInfo(): Promise<{ provider: "personal" | "twilio" | "meta" | "none"; activeSender: string; personalLinked: boolean; personalName?: string }> {
    const { getPersonalWhatsAppStatus } = await import("@/services/whatsapp-personal");
    const personalStatus = await getPersonalWhatsAppStatus();
    if (personalStatus.paired && personalStatus.userPhone) {
        return {
            provider: "personal",
            activeSender: personalStatus.userPhone,
            personalLinked: true,
            personalName: personalStatus.userName || undefined
        };
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER;

    if (twilioSid && twilioAuth && twilioFrom) {
        return { provider: "twilio", activeSender: twilioFrom, personalLinked: false };
    }

    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (metaToken && metaPhoneId) {
        return { provider: "meta", activeSender: metaPhoneId, personalLinked: false };
    }

    return { provider: "none", activeSender: "", personalLinked: false };
}

async function sendSingleWhatsApp(
    recipientPhone: string,
    body: string,
    isTemplate: boolean = false,
    templateName: string = "hello_world",
    langCode: string = "en_US",
    providerPreference: "personal" | "twilio" | "meta" | "auto" = "auto"
): Promise<{ success: boolean; error?: string; usedProvider?: string }> {
    const cleanPhone = recipientPhone.replace(/[^\d+]/g, "").trim();
    if (!cleanPhone) {
        return { success: false, error: "شماره تلفن معتبر نیست." };
    }
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    // 1. Personal WhatsApp Line (Linked Devices / SIM Card)
    if (providerPreference === "personal" || providerPreference === "auto") {
        try {
            const { getPersonalWhatsAppStatus, sendPersonalWhatsAppMessage } = await import("@/services/whatsapp-personal");
            const personalStatus = await getPersonalWhatsAppStatus();
            if (personalStatus.paired) {
                const res = await sendPersonalWhatsAppMessage(formattedPhone, body.trim());
                if (res.success) {
                    return { success: true, usedProvider: "personal" };
                } else if (providerPreference === "personal") {
                    return { success: false, error: res.error || "خطا در ارسال از طریق خط شخصی واتساپ" };
                }
            } else if (providerPreference === "personal") {
                return {
                    success: false,
                    error: "خط شخصی واتساپ متصل نیست. لطفا ابتدا بارکد QR را از بخش دستگاه‌های متصل با واتساپ گوشی اسکن نمایید."
                };
            }
        } catch (err: any) {
            console.warn('[Personal WhatsApp Exception]:', err.message);
            if (providerPreference === "personal") {
                return { success: false, error: err.message };
            }
        }
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER;

    // 2. Try Twilio WhatsApp (Official Cloud Provider)
    if ((providerPreference === "twilio" || providerPreference === "auto") && twilioSid && twilioAuth && twilioFrom) {
        try {
            const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
            const fromNum = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
            const toNum = `whatsapp:${formattedPhone}`;

            const params = new URLSearchParams();
            params.append('From', fromNum);
            params.append('To', toNum);
            params.append('Body', body.trim());

            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            const data = await res.json();
            if (res.ok) {
                return { success: true, usedProvider: "twilio" };
            } else {
                return { success: false, error: data.message || `خطای توییلیو ${data.code}` };
            }
        } catch (err: any) {
            console.error('[Twilio WhatsApp Request Error]:', err);
            return { success: false, error: err.message || 'خطا در برقراری ارتباط با درگاه توییلیو.' };
        }
    }

    // 3. Fallback to Meta Cloud API
    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if ((providerPreference === "meta" || providerPreference === "auto") && metaToken && metaPhoneId) {
        try {
            const payload: any = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: formattedPhone.replace('+', ''),
            };

            if (isTemplate) {
                payload.type = "template";
                payload.template = {
                    name: templateName,
                    language: { code: langCode }
                };
            } else {
                payload.type = "text";
                payload.text = { preview_url: false, body: body.trim() };
            }

            const response = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${metaToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();
            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: resData?.error?.message || "Meta API Error" };
            }
        } catch (err: any) {
            return { success: false, error: err.message || 'خطا در ارتباط با Meta API' };
        }
    }

    return {
        success: false,
        error: "تنظیمات درگاه واتساپ (Twilio یا Meta) در متغیرهای سرور یافت نشد."
    };
}

export async function sendWhatsAppBroadcast(
    body: string,
    isTemplate: boolean = false,
    templateName: string = "hello_world",
    langCode: string = "en_US",
    providerPreference: "personal" | "twilio" | "meta" | "auto" = "auto"
): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
        await requireRole(["Admin"]);

        if (!body?.trim() && !isTemplate) {
            return { success: false, error: "متن پیام واتساپ الزامی است." };
        }

        // Get all users with whatsapp numbers
        const { rows } = await query("SELECT whatsapp_number FROM users WHERE whatsapp_number IS NOT NULL AND whatsapp_number != ''");
        const recipients = rows.map(r => r.whatsapp_number.trim());

        if (recipients.length === 0) {
            return { success: false, error: "هیچ کاربری با شماره واتساپ معتبر در پایگاه‌داده یافت نشد." };
        }

        let successCount = 0;
        let lastError = "";

        for (const recipient of recipients) {
            const res = await sendSingleWhatsApp(recipient, body, isTemplate, templateName, langCode, providerPreference);
            if (res.success) {
                successCount++;
            } else {
                lastError = res.error || "Delivery failure";
            }
            // 200ms spacing between recipients
            await new Promise(r => setTimeout(r, 200));
        }

        // Ensure logs table exists
        await query(`
            CREATE TABLE IF NOT EXISTS whatsapp_logs (
                id SERIAL PRIMARY KEY,
                recipient_count INT,
                body TEXT,
                status VARCHAR(50),
                sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        const statusStr = successCount === recipients.length ? "success" : successCount > 0 ? "partial_success" : "failed";
        const loggedBody = isTemplate ? `Template: ${templateName} (${langCode})` : body;

        await query(
            "INSERT INTO whatsapp_logs (recipient_count, body, status, sent_at) VALUES ($1, $2, $3, NOW())",
            [successCount, loggedBody, statusStr]
        );

        if (successCount === 0) {
            return { success: false, error: `ارسال ناموفق بود: ${lastError}` };
        }

        return { success: true, count: successCount };
    } catch (error: any) {
        console.error('[Action] Error in sendWhatsAppBroadcast:', error);
        return { success: false, error: error.message || 'خطای غیرمنتظره در ارسال واتساپ.' };
    }
}

export async function sendTestWhatsAppMessage(
    recipientPhone: string,
    body: string,
    isTemplate: boolean = false,
    templateName: string = "hello_world",
    langCode: string = "en_US",
    providerPreference: "personal" | "twilio" | "meta" | "auto" = "auto"
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);

        if (!recipientPhone?.trim()) {
            return { success: false, error: "شماره گیرنده تست الزامی است." };
        }

        const messageText = body?.trim() || "سلام! این یک پیام آزمایشی از سوی سامانه هوشمند کلیسای ایرانیان واشنگتن است. 🕊️";
        return await sendSingleWhatsApp(recipientPhone, messageText, isTemplate, templateName, langCode, providerPreference);
    } catch (error: any) {
        console.error('[Action] Error in sendTestWhatsAppMessage:', error);
        return { success: false, error: error.message || 'خطای غیرمنتظره در ارسال تست واتساپ.' };
    }
}

/**
 * Fetch current Verse of the Day text and reference from database or default dictionary
 */
export async function getVerseOfTheDayContent(): Promise<{
    verseFa: string;
    verseEn: string;
    refFa: string;
    refEn: string;
    formattedFa: string;
}> {
    let verseFa = "آیا تو را امر نکردم؟ قوی و دلیر باش! نترس و هراسان مباش، زیرا هر جا که بروی، یَهُوَه خدایت با تو خواهد بود.";
    let verseEn = "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.";
    let refFa = "یوشع ۱:۹";
    let refEn = "Joshua 1:9";

    try {
        const { rows } = await query("SELECT config FROM widgets WHERE id = 'w_verse_donation' LIMIT 1");
        if (rows && rows[0]?.config) {
            const cfg = rows[0].config;
            if (cfg.verseFa) verseFa = cfg.verseFa;
            if (cfg.verseEn) verseEn = cfg.verseEn;
            if (cfg.refFa) refFa = cfg.refFa;
            if (cfg.refEn) refEn = cfg.refEn;
        }
    } catch (e) {
        console.warn('[Action] getVerseOfTheDayContent DB warning:', e);
    }

    const formattedFa = `📖 آیه روز:\n«${verseFa}»\n— ${refFa}\n\n🕊️ کلیسای انجیلی ایرانیان واشنگتن دی‌سی\nhttps://www.iranianchurchdc.com`;

    return {
        verseFa,
        verseEn,
        refFa,
        refEn,
        formattedFa
    };
}

/**
 * Broadcast SMS to all registered users with valid phone numbers
 */
export async function sendSMSBroadcast(
    body: string,
    providerPreference: "google-messages" | "twilio" | "auto" = "auto"
): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
        await requireRole(["Admin"]);

        if (!body?.trim()) {
            return { success: false, error: "متن پیامک الزامی است." };
        }

        const { rows } = await query("SELECT phone FROM users WHERE phone IS NOT NULL AND phone != ''");
        const recipients = Array.from(
            new Set(rows.map(r => r.phone.trim()).filter(Boolean))
        );

        if (recipients.length === 0) {
            return { success: false, error: "هیچ کاربری با شماره موبایل در پایگاه‌داده یافت نشد." };
        }

        const { sendSMSViaGoogleMessages, checkGoogleMessagesPairing } = await import("@/services/google-messages");
        const { sendSMS } = await import("@/lib/twilio");

        let gmPaired = false;
        if (providerPreference === "google-messages" || providerPreference === "auto") {
            try {
                const gmStatus = await checkGoogleMessagesPairing();
                gmPaired = gmStatus.paired;
            } catch {}
        }

        let successCount = 0;
        let lastError = "";

        for (const recipient of recipients) {
            let sent = false;

            // 1. Google Messages SIM
            if ((providerPreference === "google-messages" || providerPreference === "auto") && gmPaired) {
                try {
                    sent = await sendSMSViaGoogleMessages(recipient, body.trim());
                } catch (e: any) {
                    lastError = e?.message || "Google Messages error";
                }
            }

            // 2. Fallback to Twilio SMS
            if (!sent && (providerPreference === "twilio" || providerPreference === "auto")) {
                try {
                    const twRes = await sendSMS(recipient, body.trim());
                    sent = twRes.success;
                    if (!sent) lastError = twRes.error || "Twilio SMS delivery failure";
                } catch (e: any) {
                    lastError = e?.message || "Twilio SMS exception";
                }
            }

            if (sent) {
                successCount++;
            }

            // Stagger 300ms between SMS sends
            await new Promise(r => setTimeout(r, 300));
        }

        // Ensure logs table exists
        await query(`
            CREATE TABLE IF NOT EXISTS sms_logs (
                id SERIAL PRIMARY KEY,
                recipient_count INT,
                body TEXT,
                provider VARCHAR(50),
                status VARCHAR(50),
                sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        const statusStr = successCount === recipients.length ? "success" : successCount > 0 ? "partial_success" : "failed";
        await query(
            "INSERT INTO sms_logs (recipient_count, body, provider, status, sent_at) VALUES ($1, $2, $3, $4, NOW())",
            [successCount, body.trim(), providerPreference, statusStr]
        );

        if (successCount === 0) {
            return { success: false, error: `ارسال پیامک به گیرندگان ناموفق بود: ${lastError}` };
        }

        return { success: true, count: successCount };
    } catch (error: any) {
        console.error('[Action] Error in sendSMSBroadcast:', error);
        return { success: false, error: error.message || 'خطا در ارسال گروهی پیامک.' };
    }
}
