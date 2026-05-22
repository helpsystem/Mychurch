import { Resend } from 'resend';

// Use a fallback API key if not set in dev, but it should be set in .env
const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

interface EmailPayload {
    to: string[];
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
    if (!resend) {
        console.warn("RESEND_API_KEY is not set. Email not sent.", { to, subject });
        return { success: false, error: "Email configuration missing" };
    }

    try {
        const { data, error } = await resend.emails.send({
            // This needs to be a verified domain in Resend. For testing, it might need to be onboarding@resend.dev
            from: process.env.RESEND_FROM_EMAIL || 'MyChurch <onboarding@resend.dev>',
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("Email send exception:", error);
        return { success: false, error: error.message };
    }
}
