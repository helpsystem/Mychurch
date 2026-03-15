import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: process.env.RESEND_API_KEY,
  },
});

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  from?: string;
}

const DEFAULT_FROM = process.env.MAIL_FROM || "Iranian Christian Church DC <noreply@iranianchurchdc.com>";

export async function sendMail(options: MailOptions) {
  const { from, to, subject, text, html, replyTo } = options;
  
  const info = await transporter.sendMail({
    from: from ?? DEFAULT_FROM,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject: subject,
    text: text,
    html: html,
    replyTo: replyTo,
  });

  return info;
}
