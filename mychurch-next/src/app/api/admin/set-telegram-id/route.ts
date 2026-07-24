import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { sendTelegramMessage } from "@/services/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { telegram_id } = await req.json();

        // Validate: must be numeric
        if (!telegram_id || !/^\d+$/.test(String(telegram_id).trim())) {
            return NextResponse.json({ error: "telegram_id باید عدد باشد" }, { status: 400 });
        }

        const cleanId = String(telegram_id).trim();

        const adminSupabase = await createAdminClient();

        // Update in DB
        const { error: updateError } = await adminSupabase
            .from('users')
            .update({ telegram_id: cleanId })
            .ilike('email', user.email);

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Test send a message
        const sent = await sendTelegramMessage(cleanId, `✅ شناسه تلگرام شما با موفقیت در MyChurch ثبت شد!\n\nاکنون کدهای 2FA و اعلان‌ها به این حساب ارسال خواهند شد.\n\n🤖 MyChurch — ${user.email}`);

        return NextResponse.json({
            success: true,
            telegram_id: cleanId,
            email: user.email,
            testMessageSent: sent,
            message: sent ? "شناسه ثبت شد و پیام تست ارسال گردید." : "شناسه ثبت شد ولی پیام تست ارسال نشد — ربات را در تلگرام Start کنید."
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
