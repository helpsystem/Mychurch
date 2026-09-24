import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRealUserRole } from "@/utils/rbac";
import { checkGoogleMessagesPairing, getGoogleMessagesQRCode, sendSMSViaGoogleMessages } from "@/services/google-messages";

export const dynamic = "force-dynamic";

async function sendSMSViaTwilio(toPhone: string, text: string) {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (!twilioSid || !twilioAuth || !twilioFrom) {
        throw new Error("تنظیمات Twilio SMS کامل نیست.");
    }

    let cleanPhone = toPhone.replace(/[^\d+]/g, "").trim();
    if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }

    const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
    const params = new URLSearchParams();
    params.append('From', twilioFrom);
    params.append('To', cleanPhone);
    params.append('Body', text);

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || `خطای درگاه پیامک Twilio: کد ${data.code}`);
    }
    return { sid: data.sid, status: data.status };
}

// GET — Check pairing status for both Google Messages (SIM) and Twilio Cloud
export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRealUserRole();
    if (role && !['Admin', 'Leader', 'Operator'].includes(role)) {
        return NextResponse.json({ error: "Admin or Leader only" }, { status: 403 });
    }

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const twilioConfigured = !!(twilioSid && twilioAuth && twilioFrom);

    let gmStatus: { paired: boolean; qrCodeDataUrl?: string } = { paired: false };
    let gmQrCode: string | null = null;

    try {
        gmStatus = await checkGoogleMessagesPairing();
        if (!gmStatus.paired) {
            gmQrCode = gmStatus.qrCodeDataUrl || (await getGoogleMessagesQRCode());
        }
    } catch (err: any) {
        console.warn('[SMSGateway API] Google Messages pairing check:', err.message);
    }

    return NextResponse.json({
        // Backwards compatibility fields — Twilio is the primary/default provider whenever
        // it's configured (a real API with delivery confirmation); Google Messages (browser
        // automation against a paired Android phone) is reported as active only as a fallback.
        paired: gmStatus.paired || twilioConfigured,
        provider: twilioConfigured ? "twilio" : gmStatus.paired ? "google-messages" : "none",
        carrier: twilioConfigured ? "Twilio Direct Cloud SMS" : gmStatus.paired ? "Google Messages Android SIM" : "سرویس پیامک",
        phoneNumber: twilioFrom || "",
        qrCode: gmQrCode,

        // Detailed dual-provider structure
        twilio: {
            configured: twilioConfigured,
            carrier: "Twilio Direct Cloud SMS",
            phoneNumber: twilioFrom || ""
        },
        googleMessages: {
            paired: gmStatus.paired,
            carrier: "Google Messages Android (سیم‌کارت شخصی)",
            qrCode: gmQrCode
        }
    });
}

// POST — Send an SMS message
export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRealUserRole();
    if (role && !['Admin', 'Leader', 'Operator'].includes(role)) {
        return NextResponse.json({ error: "Admin or Leader only" }, { status: 403 });
    }

    const { phone, message, provider } = await req.json();
    if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

    const text = message || "✅ تست سرویس پیامک کلیسای ایرانیان واشنگتن";
    const selectedProvider = provider || "auto";

    // 1. If Google Messages (Personal SIM) selected
    if (selectedProvider === "google-messages") {
        try {
            const sent = await sendSMSViaGoogleMessages(phone, text);
            if (sent) {
                return NextResponse.json({ success: true, phone, provider: "google-messages" });
            } else {
                return NextResponse.json({ 
                    success: false, 
                    error: "ارسال از طریق Google Messages انجام نشد. لطفا مطمئن شوید گوشی شما جفت (Pair) شده و متصل به اینترنت است." 
                }, { status: 500 });
            }
        } catch (err: any) {
            return NextResponse.json({ success: false, error: err.message, phone }, { status: 500 });
        }
    }

    // 2. If Twilio selected
    if (selectedProvider === "twilio") {
        try {
            const twilioRes = await sendSMSViaTwilio(phone, text);
            return NextResponse.json({ success: true, phone, provider: "twilio", sid: twilioRes.sid });
        } catch (err: any) {
            console.error('[Twilio SMS Error]:', err);
            return NextResponse.json({ success: false, error: err.message, phone }, { status: 500 });
        }
    }

    // 3. Auto mode: try Twilio first (real API, delivery-confirmed), fall back to
    // Google Messages (browser automation against a paired Android phone) only if Twilio
    // isn't configured or the send fails.
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioAuth && twilioFrom) {
        try {
            const twilioRes = await sendSMSViaTwilio(phone, text);
            return NextResponse.json({ success: true, phone, provider: "twilio", sid: twilioRes.sid });
        } catch (err: any) {
            console.warn('[SMSGateway API] Twilio failed, falling back to Google Messages:', err.message);
        }
    }

    try {
        const gmCheck = await checkGoogleMessagesPairing();
        if (gmCheck.paired) {
            const sent = await sendSMSViaGoogleMessages(phone, text);
            if (sent) {
                return NextResponse.json({ success: true, phone, provider: "google-messages" });
            }
        }
    } catch {}

    return NextResponse.json({
        success: false,
        error: "هیچ درگاه پیامکی (Twilio یا Google Messages سیم‌کارت) آماده ارسال نیست."
    }, { status: 500 });
}
