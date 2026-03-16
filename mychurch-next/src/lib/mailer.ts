import nodemailer from "nodemailer";

let resendTransporter: nodemailer.Transporter | null = null;
let fallbackTransporter: nodemailer.Transporter | null = null;

function getTransporters() {
  if (!resendTransporter) {
    resendTransporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  if (!fallbackTransporter) {
    fallbackTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return { resendTransporter, fallbackTransporter };
}

export interface Attachment {
  filename: string;
  path: string;
  cid: string;
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  from?: string;
  attachments?: Attachment[];
}

export async function sendMail(options: MailOptions) {
  const { from, to, subject, text, html, replyTo, attachments } = options;
  const { resendTransporter, fallbackTransporter } = getTransporters();
  
  const DEFAULT_FROM = process.env.MAIL_FROM || process.env.SMTP_FROM || "Iranian Christian Church DC <noreply@iranianchurchdc.com>";

  const mailPayload = {
    from: from ?? DEFAULT_FROM,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject: subject,
    text: text,
    html: html,
    replyTo: replyTo,
    attachments: attachments,
  };

  try {
    // Try primary provider (Resend)
    console.log("[Mailer] 🚀 Attempting to send via Resend...");
    const info = await resendTransporter.sendMail(mailPayload);
    console.log("[Mailer] ✅ Sent via Resend:", info.messageId);
    return info;
  } catch (error: any) {
    console.warn("[Mailer] ⚠️ Resend failed, attempting fallback SMTP:", error.message || error);
    
    // Fallback to generic SMTP
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log(`[Mailer] 🔄 Using fallback SMTP with user: ${process.env.SMTP_USER}`);
        const info = await fallbackTransporter.sendMail(mailPayload);
        console.log("[Mailer] ✅ Sent via Fallback SMTP:", info.messageId);
        return info;
    }
    
    throw error;
  }
}
