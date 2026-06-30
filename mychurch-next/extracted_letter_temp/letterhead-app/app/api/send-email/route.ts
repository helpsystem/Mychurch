import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { mailDefaults } from "@/lib/company";

export const runtime = "nodejs";

/**
 * ارسال ایمیل به همراه پیوست HTML سند.
 * تنظیمات SMTP از متغیرهای محیطی خوانده می‌شود (.env.local):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
export async function POST(req: NextRequest) {
  try {
    const { to, subject, message, html, filename } = await req.json();

    if (!to || !subject) {
      return NextResponse.json({ error: "گیرنده و موضوع الزامی است" }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const from = process.env.SMTP_FROM || `"${mailDefaults.fromName}" <${user}>`;

    if (!host || !user || !pass) {
      return NextResponse.json(
        {
          error:
            "تنظیمات SMTP یافت نشد. فایل .env.local را با SMTP_HOST/SMTP_USER/SMTP_PASS پر کنید.",
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const safeName = (filename || "document") + ".html";

    await transporter.sendMail({
      from,
      to,
      subject,
      text: message || "",
      html: `<div style="font-family:Tahoma,sans-serif;white-space:pre-wrap">${(message || "").replace(/</g, "&lt;")}</div>`,
      attachments: html
        ? [
            {
              filename: safeName,
              content: html,
              contentType: "text/html; charset=utf-8",
            },
          ]
        : [],
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "send failed" }, { status: 500 });
  }
}
