"use server";

import { sendMail } from "@/lib/mailer";
import { requireRole } from "@/utils/rbac";

export async function emailDocument(recipientEmail: string, subject: string, htmlContent: string) {
    try {
        const role = await requireRole(['Admin', 'Leader']);
        
        const fullHtml = `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>سند رسمی | Official Document: ${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; color: #1c1917; font-family: 'Vazirmatn', Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); padding: 40px;">
                            <tr>
                                <td style="text-align: center; padding-bottom: 30px;">
                                    <img src="https://www.iranianchurchdc.com/logo-transparent.png" alt="Church Logo" style="height: 60px; border: 0; margin-bottom: 15px;" />
                                    <!-- Farsi Header -->
                                    <h2 style="color: #ba955c; margin: 0 0 4px 0; font-size: 20px; font-weight: bold; font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; text-align: center;">سند رسمی کلیسا</h2>
                                    <p style="color: #78716c; margin: 0 0 12px 0; font-size: 13px; font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; text-align: center;">کلیسای مسیحی ایرانی واشنگتن دی‌سی</p>
                                    
                                    <!-- Divider -->
                                    <div style="width: 60px; height: 1px; background-color: #e4e4e7; margin: 12px auto;"></div>
                                    
                                    <!-- English Header -->
                                    <h3 style="color: #1e1b4b; margin: 0 0 4px 0; font-size: 17px; font-weight: bold; font-family: Arial, sans-serif; direction: ltr; text-align: center;">Official Church Document</h3>
                                    <p style="color: #71717a; margin: 0; font-size: 12px; font-family: Arial, sans-serif; direction: ltr; text-align: center;">Iranian Christian Church of Washington D.C.</p>
                                </td>
                            </tr>
                            <tr>
                                <td dir="auto" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; font-size: 15px; line-height: 1.7; color: #1c1917; text-align: right; font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;">
                                    ${htmlContent}
                                </td>
                            </tr>
                            <tr>
                                <td style="text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 25px; line-height: 1.6; font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;">
                                    <!-- Farsi Footer -->
                                    <p style="margin: 0 0 6px 0; direction: rtl; text-align: center;">این یک مکاتبه رسمی خودکار از کلیسای مسیحی ایرانی واشنگتن دی‌سی است.</p>
                                    <p style="margin: 0 0 6px 0; direction: rtl; text-align: center;">نشانی: کلیسای ایرانی، واشنگتن دی‌سی، ایالات متحده</p>
                                    <p style="margin: 0 0 15px 0; direction: rtl; text-align: center;">اگر سوالی دارید، لطفا به این ایمیل پاسخ دهید یا با ما از طریق <a href="mailto:info@iranianchurchdc.com" style="color: #ba955c; text-decoration: underline;">info@iranianchurchdc.com</a> تماس بگیرید.</p>
                                    
                                    <!-- Divider -->
                                    <div style="width: 40px; height: 1px; background-color: #e4e4e7; margin: 15px auto;"></div>
                                    
                                    <!-- English Footer -->
                                    <p style="margin: 0 0 4px 0; direction: ltr; text-align: center; font-family: Arial, sans-serif;">This is an automated official communication from the Iranian Christian Church of Washington DC.</p>
                                    <p style="margin: 0 0 4px 0; direction: ltr; text-align: center; font-family: Arial, sans-serif;">Address: Iranian Christian Church, Washington D.C., USA</p>
                                    <p style="margin: 0; direction: ltr; text-align: center; font-family: Arial, sans-serif;">If you have any questions, please reply to this email or contact us at <a href="mailto:info@iranianchurchdc.com" style="color: #4f46e5; text-decoration: underline;">info@iranianchurchdc.com</a></p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        await sendMail({
            to: recipientEmail,
            subject: "سند رسمی | Official Document: " + subject,
            html: fullHtml
        });

        return { success: true };
    } catch (error: any) {
        console.error("[DocumentMailer] Failed to send document:", error);
        return { success: false, error: error.message || "Failed to send email." };
    }
}
