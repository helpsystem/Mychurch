"use server";

import { sendMail } from "@/lib/mailer";
import { requireRole } from "@/utils/rbac";

export async function emailDocument(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  pdfBase64?: string,
  pdfFilename?: string,
  imageBase64?: string,
  imageFilename?: string
) {
    try {
        await requireRole(['Admin', 'Leader']);
        
        const fullHtml = `
        <!DOCTYPE html>
        <html lang="en" dir="ltr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Official Document: ${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; color: #1c1917; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 40px; text-align: center;">
                                    <img src="https://www.iranianchurchdc.com/logo-transparent.png" alt="Church Logo" style="height: 56px; border: 0; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;" />
                                    <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 20px; font-weight: 900; font-family: Arial, sans-serif; letter-spacing: 0.05em; text-transform: uppercase;">Official Document</h1>
                                    <p style="color: #a5b4fc; margin: 0; font-size: 13px; font-family: Arial, sans-serif;">Iranian Christian Church of Washington D.C.</p>
                                    <div style="width: 48px; height: 2px; background-color: #6366f1; margin: 16px auto 0; border-radius: 2px;"></div>
                                </td>
                            </tr>

                            <!-- Subject Banner -->
                            <tr>
                                <td style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 16px 40px;">
                                    <p style="margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; font-family: Arial, sans-serif;">RE: ${subject}</p>
                                </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                                <td style="padding: 32px 40px; font-size: 15px; line-height: 1.7; color: #1c1917; font-family: Arial, sans-serif;">
                                    ${htmlContent}
                                </td>
                            </tr>

                            ${pdfBase64 ? `
                            <!-- PDF Notice -->
                            <tr>
                                <td style="padding: 0 40px 24px;">
                                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 12px;">
                                        <div style="width: 40px; height: 40px; background-color: #3b82f6; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; vertical-align: middle; margin-right: 12px;">
                                            <span style="color: white; font-size: 18px; font-weight: bold;">📄</span>
                                        </div>
                                        <div style="display: inline-block; vertical-align: middle;">
                                            <p style="margin: 0 0 2px; font-weight: 700; font-size: 13px; color: #1e40af; font-family: Arial, sans-serif;">PDF Document Attached</p>
                                            <p style="margin: 0; font-size: 12px; color: #3b82f6; font-family: Arial, sans-serif;">${pdfFilename || 'official-document.pdf'} — Open or print with any PDF viewer</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            ` : ''}

                            <!-- Verify Link -->
                            <tr>
                                <td style="padding: 0 40px 32px;">
                                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center;">
                                        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; font-family: Arial, sans-serif;">🔒 Authenticity Verification</p>
                                        <p style="margin: 0; font-size: 12px; color: #15803d; font-family: Arial, sans-serif;">This document can be verified at <a href="https://www.iranianchurchdc.com/verify" style="color: #16a34a; font-weight: 700; text-decoration: underline;">iranianchurchdc.com/verify</a></p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; border-top: 1px solid #e4e4e7; padding: 24px 40px; text-align: center;">
                                    <p style="margin: 0 0 6px; font-size: 12px; color: #71717a; font-family: Arial, sans-serif;">This is an automated official communication from the Iranian Christian Church of Washington DC.</p>
                                    <p style="margin: 0 0 6px; font-size: 12px; color: #71717a; font-family: Arial, sans-serif;">Washington D.C., USA &nbsp;|&nbsp; <a href="mailto:info@iranianchurchdc.com" style="color: #4f46e5; text-decoration: underline;">info@iranianchurchdc.com</a> &nbsp;|&nbsp; <a href="https://www.iranianchurchdc.com" style="color: #4f46e5; text-decoration: underline;">iranianchurchdc.com</a></p>
                                    <div style="width: 40px; height: 1px; background-color: #e4e4e7; margin: 16px auto;"></div>
                                    <p style="margin: 0; font-size: 11px; color: #a1a1aa; font-family: Arial, sans-serif;">If you received this email by mistake, please disregard it.</p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        const attachments: any[] = [];
        if (pdfBase64) {
            attachments.push({
                filename: pdfFilename || "official-document.pdf",
                content: pdfBase64,
                encoding: "base64",
                contentType: "application/pdf",
            });
        }
        if (imageBase64) {
            attachments.push({
                filename: imageFilename || "official-document.jpg",
                content: imageBase64,
                encoding: "base64",
                contentType: "image/jpeg",
            });
        }

        await sendMail({
            to: recipientEmail,
            subject: "Official Document: " + subject,
            html: fullHtml,
            attachments: attachments.length > 0 ? attachments : undefined,
        });

        return { success: true };
    } catch (error: any) {
        console.error("[DocumentMailer] Failed to send document:", error);
        return { success: false, error: error.message || "Failed to send email." };
    }
}
