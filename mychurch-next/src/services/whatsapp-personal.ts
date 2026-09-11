/**
 * WhatsApp Personal Line Service
 * Connects to the local WhatsApp Web Bridge (Baileys) on http://127.0.0.1:3005
 * Enables sending WhatsApp messages directly from the user's personal phone number / SIM.
 */

const WA_BRIDGE_URL = process.env.WHATSAPP_BRIDGE_URL || 'http://127.0.0.1:3005';

export interface PersonalWhatsAppStatus {
    paired: boolean;
    qrCode: string | null;
    userPhone: string | null;
    userName: string | null;
}

export async function getPersonalWhatsAppStatus(): Promise<PersonalWhatsAppStatus> {
    try {
        const res = await fetch(`${WA_BRIDGE_URL}/api/status`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            // Timeout after 4 seconds if bridge is starting
            signal: AbortSignal.timeout(4000)
        });

        if (!res.ok) {
            return { paired: false, qrCode: null, userPhone: null, userName: null };
        }

        const data = await res.json();
        return {
            paired: !!data.paired,
            qrCode: data.qrCode || null,
            userPhone: data.userPhone || null,
            userName: data.userName || null
        };
    } catch (err: any) {
        console.warn('[PersonalWhatsApp] Bridge status query offline or timeout:', err.message);
        return { paired: false, qrCode: null, userPhone: null, userName: null };
    }
}

export async function sendPersonalWhatsAppMessage(
    to: string,
    message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const res = await fetch(`${WA_BRIDGE_URL}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message }),
            signal: AbortSignal.timeout(20000)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            return { success: false, error: data.error || 'خطا در ارسال پیام از طریق خط شخصی واتساپ' };
        }

        return { success: true, messageId: data.messageId };
    } catch (err: any) {
        return { success: false, error: err.message || 'عدم دسترسی به سرویس واتساپ شخصی' };
    }
}

export async function disconnectPersonalWhatsApp(): Promise<{ success: boolean }> {
    try {
        const res = await fetch(`${WA_BRIDGE_URL}/api/disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        return { success: !!data.success };
    } catch {
        return { success: false };
    }
}
