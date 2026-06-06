import twilio from "twilio";

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
    if (twilioClient) return twilioClient;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        console.warn("[Twilio] ⚠️ Twilio credentials are not configured in environment variables.");
        return null;
    }

    try {
        twilioClient = twilio(accountSid, authToken);
        console.log("[Twilio] ✅ Twilio SDK initialized successfully.");
        return twilioClient;
    } catch (e: any) {
        console.error("[Twilio] ❌ Failed to initialize Twilio client:", e.message || e);
        return null;
    }
}

/**
 * Sends an SMS message to a phone number.
 * @param to Phone number with country code (e.g. +989123456789)
 * @param body Message body content
 */
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    const client = getTwilioClient();
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!client || !from) {
        return { success: false, error: "Twilio account or sender phone number is not configured." };
    }

    try {
        const cleanTo = to.startsWith("+") ? to : `+${to}`;
        const message = await client.messages.create({
            from: from,
            to: cleanTo,
            body: body
        });
        console.log(`[Twilio SMS] Message sent to ${cleanTo}. SID: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (e: any) {
        console.error(`[Twilio SMS] Failed to send SMS to ${to}:`, e.message || e);
        return { success: false, error: e.message || "Failed to send SMS." };
    }
}

/**
 * Sends a WhatsApp message to a phone number.
 * @param to Phone number with country code (e.g. +989123456789)
 * @param body Message body content
 */
export async function sendWhatsApp(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
    const client = getTwilioClient();
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886"; // Default Twilio Sandbox WhatsApp number

    if (!client) {
        return { success: false, error: "Twilio account is not configured." };
    }

    try {
        const cleanTo = to.replace(/[^\d+]/g, "");
        const formattedTo = cleanTo.startsWith("+") ? cleanTo : `+${cleanTo}`;
        const formattedFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

        const message = await client.messages.create({
            from: formattedFrom,
            to: `whatsapp:${formattedTo}`,
            body: body
        });
        console.log(`[Twilio WhatsApp] Message sent to ${formattedTo}. SID: ${message.sid}`);
        return { success: true, sid: message.sid };
    } catch (e: any) {
        console.error(`[Twilio WhatsApp] Failed to send WhatsApp to ${to}:`, e.message || e);
        return { success: false, error: e.message || "Failed to send WhatsApp message." };
    }
}
