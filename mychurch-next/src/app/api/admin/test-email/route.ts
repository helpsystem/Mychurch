import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";

// POST /api/admin/test-email — Send a test email to verify Resend config
export async function POST(req: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY environment variable is not set." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const to = body.to || "sam@iranianchurchdc.com";

    const data = await sendMail({
      to,
      subject: "✅ Email System Test — Iranian Christian Church DC",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #1a1a2e;">✅ سیستم ایمیل کار می‌کند!</h2>
          <p>این یک ایمیل تست از سرور <strong>samanabyar.online</strong> است.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">
            Sent at: ${new Date().toISOString()}<br/>
            Server: samanabyar.online<br/>
            Provider: Resend (iranianchurchdc.com)
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, id: data?.id, to });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
