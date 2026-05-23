import { Resend } from 'resend';

// Use a fallback API key if not set in dev, but it should be set in .env
const resend = process.env.RESEND_API_KEY 
    ? new Resend(process.env.RESEND_API_KEY) 
    : null;

interface EmailPayload {
    to: string[];
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailPayload) {
    if (!resend) {
        console.warn("RESEND_API_KEY is not set. Email not sent.", { to, subject });
        return { success: false, error: "Email configuration missing" };
    }

    // Auto-generate clean plain text from HTML to avoid spam filters
    const plainText = text || html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    try {
        const { data, error } = await resend.emails.send({
            // This needs to be a verified domain in Resend. For testing, it might need to be onboarding@resend.dev
            from: process.env.RESEND_FROM_EMAIL || 'MyChurch <onboarding@resend.dev>',
            to,
            subject,
            html,
            text: plainText,
            headers: {
                "Precedence": to.length > 1 ? "bulk" : "list",
                "List-Unsubscribe": to.length > 1 ? `<mailto:unsubscribe@iranianchurchdc.com>, <https://www.iranianchurchdc.com/unsubscribe?email=${encodeURIComponent(to[0] || "")}>` : undefined
            } as any
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
