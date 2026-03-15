import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  
  const payload: any = {
    from: from ?? DEFAULT_FROM,
    to: Array.isArray(to) ? to : [to],
    subject: subject,
    replyTo: replyTo,
  };

  if (html) {
    payload.html = html;
  } else if (text) {
    payload.text = text;
  }

  const { data, error } = await resend.emails.send(payload);

  if (error) throw new Error(error.message);
  return data;
}
