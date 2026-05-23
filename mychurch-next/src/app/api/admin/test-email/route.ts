import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendMail } from "@/lib/mailer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/admin/test-email — Send a test email to verify Resend config
// 🔒 ADMIN ONLY - Requires Admin role to prevent email relay abuse
export async function POST(req: Request) {
  try {
    // ===== Security Check: Admin Role Required =====
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!userRecord || userRecord.role !== 'Admin') {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
    // ===== End Security Check =====

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY environment variable is not set." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const to = typeof body.to === "string" ? body.to.trim() : user.email;

    if (!to || to.length > 254 || !EMAIL_REGEX.test(to)) {
      return NextResponse.json({ error: "Invalid recipient email" }, { status: 400 });
    }

    const data = await sendMail({
      to,
      subject: "✅ Email System Test — Iranian Christian Church DC",
      html: `
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email System Test</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f9f9f9; color: #1c1917; font-family: Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9; padding: 40px 10px;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); padding: 32px; text-align: right;">
                            <tr>
                                <td>
                                    <h2 style="color: #4f46e5; margin: 0 0 15px 0; font-size: 20px; font-family: Tahoma, Geneva, sans-serif;">✅ سیستم ایمیل کار می‌کند!</h2>
                                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0; font-family: Tahoma, Geneva, sans-serif;">این یک ایمیل تست از سرور <strong>samanabyar.online</strong> جهت اعتبارسنجی تنظیمات ایمیل کلیسا است.</p>
                                    
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
                                        <tr>
                                            <td style="border-top: 1px solid #e2e8f0; height: 1px;"></td>
                                        </tr>
                                    </table>
                                    
                                    <p dir="ltr" style="color: #64748b; font-size: 12px; line-height: 1.6; text-align: left; margin: 0; font-family: Arial, sans-serif;">
                                        Sent at: ${new Date().toISOString()}<br/>
                                        Server: samanabyar.online<br/>
                                        Provider: Resend (iranianchurchdc.com)<br/>
                                        Address: Iranian Christian Church, Washington D.C., USA
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ ok: true, id: data?.id, to });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
