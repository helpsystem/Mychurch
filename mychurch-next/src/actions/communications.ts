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
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; color: #333333; font-family: Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f9fc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                            <!-- Header -->
                            <tr style="background-color: #4f46e5; text-align: center;">
                                <td style="padding: 30px 20px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; font-family: Tahoma, Geneva, sans-serif;">کلیسای ایرانی دی‌سی | MyChurch</h1>
                                </td>
                            </tr>
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px; text-align: right; color: #333333; line-height: 1.8; font-size: 16px; font-family: Tahoma, Geneva, sans-serif;">
                                    <h2 style="color: #4f46e5; font-size: 18px; margin-top: 0; margin-bottom: 20px; font-family: Tahoma, Geneva, sans-serif;">${cleanedSubject}</h2>
                                    <div style="color: #333333; font-size: 15px; line-height: 1.8;">
                                        ${bodyHtml}
                                    </div>
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                                <td style="padding: 25px 30px; font-size: 12px; color: #64748b; line-height: 1.6; font-family: Arial, sans-serif;">
                                    <p style="margin: 0 0 10px 0; font-family: Tahoma, Geneva, sans-serif;">این ایمیل از طرف کلیسای ایرانی واشنگتن دی‌سی برای شما ارسال شده است.</p>
                                    <p style="margin: 0 0 15px 0;">Iranian Christian Church of Washington D.C.<br/>Address: Iranian Christian Church, Washington D.C., USA</p>
                                    <p style="margin: 0;">
                                        <a href="https://www.iranianchurchdc.com/unsubscribe" style="color: #4f46e5; text-decoration: underline;">لغو عضویت (Unsubscribe)</a>
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

        // Send via mailer using BCC for privacy
        const { sendMail } = await import("@/lib/mailer");
        await sendMail({
            to: "recipients@iranianchurchdc.com",
            bcc: uniqueEmails,
            subject: cleanedSubject,
            html: formattedHtml
        });

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
                                    <p style="margin: 0 0 15px 0;">Iranian Christian Church of Washington D.C.<br/>Address: Iranian Christian Church, Washington D.C., USA</p>
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

export async function sendWhatsAppBroadcast(
    body: string,
    isTemplate: boolean = false,
    templateName: string = "hello_world",
    langCode: string = "en_US"
): Promise<{ success: boolean; error?: string; count?: number }> {
    try {
        await requireRole(["Admin"]);

        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!token || !phoneId) {
            return {
                success: false,
                error: "تنظیمات واتساپ پیکربندی نشده است. متغیرهای محیطی WHATSAPP_ACCESS_TOKEN و WHATSAPP_PHONE_NUMBER_ID را در فایل .env.local قرار دهید."
            };
        }

        // Get all users with whatsapp numbers
        const { rows } = await query("SELECT whatsapp_number FROM users WHERE whatsapp_number IS NOT NULL AND whatsapp_number != ''");
        const recipients = rows.map(r => r.whatsapp_number.trim());

        if (recipients.length === 0) {
            return { success: false, error: "هیچ کاربری با شماره واتساپ معتبر یافت نشد." };
        }

        let successCount = 0;
        let lastError = "";

        for (const recipient of recipients) {
            try {
                // Format phone: remove spaces, dashes, parentheses. Must only keep digits and '+'
                const cleanPhone = recipient.replace(/[^\d+]/g, "");
                if (!cleanPhone) continue;

                const payload: any = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: cleanPhone,
                };

                if (isTemplate) {
                    payload.type = "template";
                    payload.template = {
                        name: templateName,
                        language: {
                            code: langCode
                        }
                    };
                } else {
                    payload.type = "text";
                    payload.text = {
                        preview_url: false,
                        body: body.trim()
                    };
                }

                const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const resData = await response.json();
                if (response.ok) {
                    successCount++;
                } else {
                    console.error(`[WhatsApp API Error] for ${recipient}:`, resData);
                    lastError = resData?.error?.message || "Meta API Error";
                }
            } catch (e: any) {
                console.error(`[WhatsApp API Connection Error] for ${recipient}:`, e);
                lastError = e.message || "Connection Error";
            }
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
            return { success: false, error: `ارسال پیام به تمام شماره‌ها ناموفق بود. آخرین خطا: ${lastError}` };
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
    langCode: string = "en_US"
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);

        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!token || !phoneId) {
            return {
                success: false,
                error: "تنظیمات واتساپ پیکربندی نشده است. متغیرهای محیطی را ست کنید."
            };
        }

        const cleanPhone = recipientPhone.replace(/[^\d+]/g, "");
        if (!cleanPhone) {
            return { success: false, error: "شماره گیرنده معتبر نیست." };
        }

        const payload: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
        };

        if (isTemplate) {
            payload.type = "template";
            payload.template = {
                name: templateName,
                language: {
                    code: langCode
                }
            };
        } else {
            payload.type = "text";
            payload.text = {
                preview_url: false,
                body: body.trim()
            };
        }

        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();
        if (response.ok) {
            return { success: true };
        } else {
            console.error(`[WhatsApp Test Error]:`, resData);
            return { success: false, error: resData?.error?.message || "Meta API Error" };
        }
    } catch (error: any) {
        console.error('[Action] Error in sendTestWhatsAppMessage:', error);
        return { success: false, error: error.message || 'خطای غیرمنتظره در ارسال تست واتساپ.' };
    }
}
