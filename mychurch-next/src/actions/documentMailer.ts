"use server";

import { sendMail } from "@/lib/mailer";
import { requireRole } from "@/utils/rbac";

export async function emailDocument(recipientEmail: string, subject: string, htmlContent: string) {
    try {
        const role = await requireRole(['Admin', 'Leader']);
        
        const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Official Document: ${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; color: #1c1917; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 800px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); padding: 40px;">
                            <tr>
                                <td style="text-align: center; padding-bottom: 30px;">
                                    <img src="https://samanabyar.online/logo-transparent.png" alt="Church Logo" style="height: 60px; border: 0;" />
                                    <h2 style="color: #1e1b4b; margin: 10px 0 0 0; font-size: 20px; font-weight: bold;">Official Church Document</h2>
                                    <p style="color: #71717a; margin: 5px 0 0 0; font-size: 14px;">Iranian Christian Church of Washington DC</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #1c1917;">
                                    ${htmlContent}
                                </td>
                            </tr>
                            <tr>
                                <td style="margin-top: 40px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 20px; line-height: 1.5;">
                                    <p style="margin: 0 0 5px 0;">This is an automated official communication from the Iranian Christian Church of Washington DC.</p>
                                    <p style="margin: 0 0 5px 0;">Address: Iranian Christian Church, Washington D.C., USA</p>
                                    <p style="margin: 0;">If you have any questions, please reply to this email or contact us at info@samanabyar.online</p>
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
            subject: "Official Document: " + subject,
            html: fullHtml
        });

        return { success: true };
    } catch (error: any) {
        console.error("[DocumentMailer] Failed to send document:", error);
        return { success: false, error: error.message || "Failed to send email." };
    }
}
