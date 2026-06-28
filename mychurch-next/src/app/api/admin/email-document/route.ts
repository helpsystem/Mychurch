import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendMail } from "@/lib/mailer";

/** Slugify a reference number so it's safe as a URL segment */
function refToSlug(ref: string) {
  return ref.replace(/[^a-zA-Z0-9\-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  try {
    // ===== Security Check: Admin or Leader Role Required =====
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .ilike('email', user.email)
      .maybeSingle();

    if (!userRecord || (userRecord.role !== 'Admin' && userRecord.role !== 'Leader')) {
      return NextResponse.json(
        { error: "Forbidden: Admin or Leader access required" },
        { status: 403 }
      );
    }
    // ===== End Security Check =====

    const body = await req.json().catch(() => ({}));
    const {
      recipientEmail,
      subject,
      pdfBase64,
      pdfFilename,
      imageBase64,
      imageFilename,
      recipientName,
      refNo,
    } = body;

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    const BASE_URL = "https://www.iranianchurchdc.com";
    const slug = refNo ? refToSlug(refNo) : "";
    const verifyUrl = slug
      ? `${BASE_URL}/verify/${slug}`
      : `${BASE_URL}/verify`;

    const name = (recipientName || "").trim();

    // ── Personalised greeting ──────────────────────────────────────────────
    // English greeting
    const greetEn = name
      ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1c1917;font-family:Arial,sans-serif;">Dear <strong>${name}</strong>,</p>`
      : `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1c1917;font-family:Arial,sans-serif;">Dear Valued Member,</p>`;

    // Farsi greeting  
    const greetFa = name
      ? `<p dir="rtl" style="margin:0 0 8px;font-size:15px;line-height:2;color:#1c1917;font-family:'Vazirmatn',Arial,sans-serif;">${name} عزیز،</p>`
      : `<p dir="rtl" style="margin:0 0 8px;font-size:15px;line-height:2;color:#1c1917;font-family:'Vazirmatn',Arial,sans-serif;">برادر / خواهر عزیز،</p>`;

    // ── Body ─────────────────────────────────────────────────────────────
    const bodyEn = pdfBase64
      ? `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#374151;font-family:Arial,sans-serif;">
           Please find the official document <strong>"${subject}"</strong> attached to this email as a PDF file.
         </p>
         <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#6b7280;font-family:Arial,sans-serif;">
           You may open or print the attachment using any standard PDF viewer (e.g. Adobe Acrobat, Preview).
         </p>`
      : `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#374151;font-family:Arial,sans-serif;">
           This is an official communication regarding <strong>"${subject}"</strong> from the Iranian Christian Church of Washington D.C.
         </p>`;

    const bodyFa = pdfBase64
      ? `<p dir="rtl" style="margin:0 0 10px;font-size:15px;line-height:2;color:#374151;font-family:'Vazirmatn',Arial,sans-serif;">
           سند رسمی «<strong>${subject}</strong>» به‌عنوان فایل PDF به این ایمیل پیوست شده است.
         </p>
         <p dir="rtl" style="margin:0 0 0;font-size:13px;line-height:2;color:#6b7280;font-family:'Vazirmatn',Arial,sans-serif;">
           برای مشاهده یا چاپ، فایل پیوست را با هر نرم‌افزار PDF مانند Adobe Acrobat باز کنید.
         </p>`
      : `<p dir="rtl" style="margin:0 0 10px;font-size:15px;line-height:2;color:#374151;font-family:'Vazirmatn',Arial,sans-serif;">
           این پیام رسمی درباره «<strong>${subject}</strong>» از طرف کلیسای ایرانی مسیحی واشنگتن است.
         </p>`;

    const fullHtml = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Official Document: ${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;color:#1c1917;font-family:Arial,Helvetica,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;padding:40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%"
          style="max-width:640px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">

          <!-- ── Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:32px 40px;text-align:center;">
              <img src="${BASE_URL}/logo-transparent.png" alt="Church Logo"
                width="48" height="48"
                style="height:48px;width:48px;border:0;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
              <h1 style="color:#ffffff;margin:0 0 4px;font-size:20px;font-weight:900;font-family:Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;">
                Official Document
              </h1>
              <p style="color:#a5b4fc;margin:0;font-size:13px;font-family:Arial,sans-serif;">
                Iranian Christian Church of Washington D.C.
              </p>
              <div style="width:48px;height:2px;background-color:#6366f1;margin:16px auto 0;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- ── Subject Banner ── -->
          <tr>
            <td style="background-color:#f8fafc;border-bottom:1px solid #e2e8f0;padding:16px 40px;">
              <p style="margin:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;font-family:Arial,sans-serif;">
                RE: ${subject}${refNo ? ` &nbsp;|&nbsp; Ref: ${refNo}` : ""}
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:32px 40px 20px;font-size:15px;line-height:1.7;color:#1c1917;font-family:Arial,sans-serif;">
              ${greetEn}
              ${bodyEn}
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
              ${greetFa}
              ${bodyFa}
            </td>
          </tr>

          ${pdfBase64 ? `
          <!-- ── PDF Notice ── -->
          <tr>
            <td style="padding:0 40px 24px;">
              <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;">
                <div style="display:inline-block;width:40px;height:40px;background-color:#3b82f6;border-radius:8px;text-align:center;line-height:40px;vertical-align:middle;margin-right:12px;">
                  <span style="color:white;font-size:18px;font-weight:bold;">📄</span>
                </div>
                <div style="display:inline-block;vertical-align:middle;">
                  <p style="margin:0 0 2px;font-weight:700;font-size:13px;color:#1e40af;font-family:Arial,sans-serif;">PDF Attached &nbsp;|&nbsp; فایل PDF پیوست شده</p>
                  <p style="margin:0;font-size:12px;color:#3b82f6;font-family:Arial,sans-serif;">
                    ${pdfFilename || "official-document.pdf"} — Open or print with any PDF viewer
                  </p>
                </div>
              </div>
            </td>
          </tr>` : ""}

          <!-- ── Verification ── -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.05em;font-family:Arial,sans-serif;">
                  🔒 Authenticity Verification &nbsp;|&nbsp; تأیید اصالت سند
                </p>
                <p style="margin:0 0 10px;font-size:13px;color:#15803d;font-family:Arial,sans-serif;">
                  This document can be verified online at:
                </p>
                <a href="${verifyUrl}"
                  style="display:inline-block;background-color:#16a34a;color:#ffffff;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;font-family:Arial,sans-serif;letter-spacing:0.03em;">
                  ✅ Verify This Document
                </a>
                <p style="margin:10px 0 0;font-size:11px;color:#6b7280;font-family:Arial,sans-serif;word-break:break-all;">
                  ${verifyUrl}
                </p>
                ${refNo ? `<p dir="rtl" style="margin:8px 0 0;font-size:12px;color:#15803d;font-family:'Vazirmatn',Arial,sans-serif;">اصالت این سند را می‌توانید از طریق لینک بالا تأیید کنید.</p>` : ""}
              </div>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e4e4e7;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#71717a;font-family:Arial,sans-serif;">
                This is an automated official communication from the Iranian Christian Church of Washington DC.
              </p>
              <p style="margin:0 0 6px;font-size:12px;color:#71717a;font-family:Arial,sans-serif;">
                Washington D.C., USA &nbsp;|&nbsp;
                <a href="mailto:info@iranianchurchdc.com" style="color:#4f46e5;text-decoration:underline;">info@iranianchurchdc.com</a>
                &nbsp;|&nbsp;
                <a href="${BASE_URL}" style="color:#4f46e5;text-decoration:underline;">iranianchurchdc.com</a>
              </p>
              <div style="width:40px;height:1px;background-color:#e4e4e7;margin:16px auto;"></div>
              <p style="margin:0;font-size:11px;color:#a1a1aa;font-family:Arial,sans-serif;">
                If you received this email by mistake, please disregard it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

    const info = await sendMail({
      to: recipientEmail,
      subject: `Official Document: ${subject}`,
      html: fullHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    return NextResponse.json({ success: true, messageId: info?.messageId });
  } catch (error: any) {
    console.error("[EmailDocumentAPI] Failed to send document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email." },
      { status: 500 }
    );
  }
}
