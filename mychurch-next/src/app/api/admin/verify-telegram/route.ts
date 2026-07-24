import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { sendTelegramMessage } from "@/services/telegram";
import { getRealUserRole } from "@/utils/rbac";

export const dynamic = "force-dynamic";

// In-memory store for verification codes (production: use Redis)
const verificationCodes = new Map<string, { code: string; expires: number; telegramId: string }>();

// POST /api/admin/verify-telegram — Send verification code to a telegram ID
export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRealUserRole();
    if (!role || !['Admin', 'Leader'].includes(role)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { telegramId, userId, action } = await req.json();

    if (!telegramId || !/^\d+$/.test(String(telegramId).trim())) {
        return NextResponse.json({ error: "شناسه تلگرام باید یک عدد باشد" }, { status: 400 });
    }

    const cleanId = String(telegramId).trim();

    if (action === "send_code") {
        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `${userId}_${cleanId}`;
        verificationCodes.set(key, { code, expires: Date.now() + 10 * 60 * 1000, telegramId: cleanId });

        const sent = await sendTelegramMessage(cleanId,
            `🔐 کد تأیید شناسه تلگرام شما در سیستم MyChurch:\n\n` +
            `🔑 کد: <b>${code}</b>\n\n` +
            `این کد ۱۰ دقیقه اعتبار دارد.\n` +
            `Your MyChurch Telegram verification code: ${code}`
        );

        if (!sent) {
            return NextResponse.json({
                error: "ارسال پیام به این Chat ID ناموفق بود. مطمئن شوید ربات @my_iranianchurch_bot را Start کرده‌اید."
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "کد تأیید به تلگرام ارسال شد." });
    }

    if (action === "verify_code") {
        const { code } = await req.json();
        const key = `${userId}_${cleanId}`;
        const stored = verificationCodes.get(key);

        if (!stored || stored.code !== code || Date.now() > stored.expires) {
            return NextResponse.json({ error: "کد نامعتبر یا منقضی شده است." }, { status: 400 });
        }

        // Code is valid — update the DB
        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('users')
            .update({ telegram_id: cleanId })
            .eq('id', userId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        verificationCodes.delete(key);
        return NextResponse.json({ success: true, message: "شناسه تلگرام با موفقیت تأیید و ذخیره شد." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// PATCH /api/admin/verify-telegram — Direct save without verification (Admin only)
export async function PATCH(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRealUserRole();
    if (!role || !['Admin'].includes(role)) {
        return NextResponse.json({ error: "Only Admins can save without verification" }, { status: 403 });
    }

    const { telegramId, userId } = await req.json();
    const cleanId = telegramId ? String(telegramId).trim() : null;

    if (cleanId && !/^\d+$/.test(cleanId)) {
        return NextResponse.json({ error: "شناسه تلگرام باید عدد باشد" }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
        .from('users')
        .update({ telegram_id: cleanId })
        .eq('id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
