import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { sendTelegramMessage } from "@/services/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
    const result: Record<string, any> = {};

    try {
        // 1. Get logged-in user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Not authenticated", authError });
        }

        result.email = user.email;

        // 2. Fetch user record from DB
        const adminSupabase = await createAdminClient();
        const { data: userData, error: dbError } = await adminSupabase
            .from('users')
            .select('phone, whatsapp_number, telegram_id, email, name')
            .ilike('email', user.email || '')
            .maybeSingle();

        result.dbError = dbError?.message;
        result.userData = userData;
        result.telegramIdRaw = userData?.telegram_id;
        result.telegramIdType = typeof userData?.telegram_id;
        result.telegramIdIsNumeric = userData?.telegram_id ? /^\d+$/.test(String(userData.telegram_id).trim()) : false;

        // 3. If telegram_id exists and is numeric, test sending a message
        const telegramId = userData?.telegram_id ? String(userData.telegram_id).trim() : null;
        if (telegramId && /^\d+$/.test(telegramId)) {
            result.telegramSendAttempt = true;
            const sent = await sendTelegramMessage(telegramId, "✅ تست اتصال تلگرام - MyChurch\nاگر این پیام را دریافت کردید، تنظیمات تلگرام شما صحیح است.");
            result.telegramSendSuccess = sent;
        } else {
            result.telegramSendAttempt = false;
            result.reason = telegramId 
                ? `telegram_id = "${telegramId}" — این یک عدد نیست (شاید ایمیل ذخیره شده؟)` 
                : "telegram_id در دیتابیس خالی است";
        }

        // 4. Check env vars for bot config
        result.botTokenExists = !!process.env.TELEGRAM_BOT_TOKEN;
        result.botTokenPrefix = process.env.TELEGRAM_BOT_TOKEN?.slice(0, 10) + "...";

    } catch (err: any) {
        result.fatalError = err.message;
    }

    return NextResponse.json(result, { status: 200 });
}
