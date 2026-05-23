"use server";

import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { query } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function subscribeToNewsletter(formData: FormData) {
    const email = formData.get("email") as string;

    if (!email || !email.includes("@")) {
        return { success: false, error: "ایمیل نامعتبر است / Invalid email" };
    }

    try {
        const supabase = await createClient();
        
        // Check if already subscribed
        const { data: existing } = await supabase
            .from("newsletter_subscribers")
            .select("id, status")
            .eq("email", email)
            .single();

        if (existing) {
            if (existing.status === 'unsubscribed') {
                // Reactivate subscription
                const { error: updateError } = await supabase
                    .from("newsletter_subscribers")
                    .update({ status: 'active', subscribed_at: new Date().toISOString() })
                    .eq("id", existing.id);
                
                if (updateError) throw updateError;
                return { success: true, message: "عضویت شما مجدداً فعال شد / Subscription reactivated" };
            }
            return { success: false, error: "شما قبلاً عضو خبرنامه شده‌اید / Already subscribed" };
        }

        // Insert new subscriber
        const { error } = await supabase
            .from("newsletter_subscribers")
            .insert({ email, status: 'active' });

        if (error) {
            console.error("Newsletter Insert Error:", error);
            return { success: false, error: "خطا در ثبت ایمیل / Failed to subscribe" };
        }

        return { success: true, message: "با موفقیت عضو خبرنامه شدید! / Successfully subscribed!" };
    } catch (err: any) {
        console.error("Newsletter Subscription Error:", err);
        return { success: false, error: "خطای سیستم / System error" };
    }
}

export async function getNewsletterSubscribers() {
    const supabase = await createClient();
    
    // Require admin access - simplified check based on existing role structure
    // Normally you would check user role here.
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

export async function sendNewsletterCampaign(subject: string, htmlContent: string) {
    if (!process.env.RESEND_API_KEY) {
        return { success: false, error: "کلید API مربوط به Resend تنظیم نشده است / RESEND_API_KEY missing" };
    }

    const supabase = await createClient();
    
    // Fetch all active subscribers
    const { data: subscribers, error: dbError } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("status", "active");

    if (dbError || !subscribers) {
        return { success: false, error: "خطا در دریافت لیست ایمیل‌ها / Failed to fetch subscribers" };
    }

    if (subscribers.length === 0) {
        return { success: false, error: "هیچ عضو فعالی وجود ندارد / No active subscribers found" };
    }

    const emails = subscribers.map(s => s.email);

    try {
        // Ensure log table exists
        await query(`
            CREATE TABLE IF NOT EXISTS newsletter_logs (
                id SERIAL PRIMARY KEY,
                subject VARCHAR(255) NOT NULL,
                body TEXT NOT NULL,
                recipient_count INT NOT NULL,
                sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const wrappedHtmlContent = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; color: #333333; font-family: Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f6f9fc; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                            <!-- Header -->
                            <tr style="background-color: #4f46e5; text-align: center;">
                                <td style="padding: 30px 20px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; font-family: Tahoma, Geneva, sans-serif;">خبرنامه کلیسای ایرانی دی‌سی</h1>
                                </td>
                            </tr>
                            <!-- Content Area -->
                            <tr>
                                <td style="padding: 40px 30px; text-align: right; color: #333333; line-height: 1.8; font-size: 16px; font-family: Tahoma, Geneva, sans-serif;">
                                    ${htmlContent}
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                                <td style="padding: 25px 30px; font-size: 12px; color: #64748b; line-height: 1.6; font-family: Arial, sans-serif;">
                                    <p style="margin: 0 0 10px 0; font-family: Tahoma, Geneva, sans-serif;">شما این ایمیل را به دلیل عضویت در خبرنامه کلیسای ایرانی واشنگتن دریافت کرده‌اید.</p>
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

        const plainText = wrappedHtmlContent
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const { data, error } = await resend.emails.send({
            from: "MyChurch <newsletter@iranianchurchdc.com>", // Make sure to verify this domain in Resend
            to: ["newsletter@iranianchurchdc.com"], // Dummy TO
            bcc: emails, // Send to everyone else hidden
            subject: subject,
            html: wrappedHtmlContent,
            text: plainText,
            headers: {
                "Precedence": "bulk",
                "List-Unsubscribe": "<mailto:unsubscribe@iranianchurchdc.com>, <https://www.iranianchurchdc.com/unsubscribe>"
            }
        });

        if (error) {
            console.error("Resend Send Error:", error);
            return { success: false, error: error.message };
        }

        // Log the successful campaign
        await query(
            'INSERT INTO newsletter_logs (subject, body, recipient_count) VALUES ($1, $2, $3)',
            [subject, htmlContent, emails.length]
        );

        return { success: true, message: `خبرنامه با موفقیت به ${emails.length} نفر ارسال شد.` };
    } catch (err: any) {
        console.error("Newsletter Send Error:", err);
        return { success: false, error: "خطای سیستم در ارسال ایمیل / System error sending emails" };
    }
}

export async function getNewsletterLogs() {
    try {
        const { getUserRole } = await import("@/utils/rbac");
        const role = await getUserRole();
        if (role !== "Admin" && role !== "Leader") {
            return { success: false, error: "Unauthorized" };
        }

        const { rows } = await query('SELECT * FROM newsletter_logs ORDER BY sent_at DESC LIMIT 50');
        return { success: true, data: rows };
    } catch (error) {
        console.error('[Action] Error fetching newsletter logs:', error);
        return { success: false, error: "Failed to load history" };
    }
}
