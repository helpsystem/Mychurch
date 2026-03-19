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
            <style>
                body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; padding: 20px; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="https://samanabyar.online/logo-transparent.png" alt="Church Logo" style="height: 60px;" />
                    <h2 style="color: #1e1b4b; margin: 10px 0 0 0;">Official Church Document</h2>
                    <p style="color: #71717a; margin: 5px 0 0 0;">Iranian Christian Church of Washington DC</p>
                </div>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; border-radius: 6px;">
                    ${htmlContent}
                </div>
                
                <div class="footer">
                    <p>This is an automated official communication from the Iranian Christian Church of Washington DC.</p>
                    <p>If you have any questions, please reply to this email or contact us at info@samanabyar.online</p>
                </div>
            </div>
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
