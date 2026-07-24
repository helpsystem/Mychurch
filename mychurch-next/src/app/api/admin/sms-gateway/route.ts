import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRealUserRole } from "@/utils/rbac";
import { checkGoogleMessagesPairing, getGoogleMessagesQRCode, sendSMSViaGoogleMessages } from "@/services/google-messages";

export const dynamic = "force-dynamic";

// GET — Check pairing status + get QR code if needed
export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRealUserRole();
    if (!role || !['Admin'].includes(role)) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const status = await checkGoogleMessagesPairing();
    
    if (!status.paired) {
        // Try to get QR code
        const qr = await getGoogleMessagesQRCode();
        return NextResponse.json({ paired: false, qrCode: qr });
    }

    return NextResponse.json({ paired: true });
}

// POST — Send a test SMS or trigger manual send
export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRealUserRole();
    if (!role || !['Admin'].includes(role)) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { phone, message } = await req.json();
    if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

    const text = message || "✅ تست سرویس پیامک MyChurch\nاین یک پیام تست است.";
    const sent = await sendSMSViaGoogleMessages(phone, text);

    return NextResponse.json({ success: sent, phone });
}
