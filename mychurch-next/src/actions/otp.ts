"use server";

import { createClient } from "@/utils/supabase/server";
import { generateOTP, verifyOTP } from "@/lib/otp-store";
import { sendMail } from "@/lib/mailer";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function sendAdminOTP() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "کاربر یافت نشد" };
    }

    // Verify role
    const { data: roleData } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single();

    if (!roleData || !['Admin', 'Leader', 'Operator'].includes(roleData.role)) {
        return { error: "دسترسی غیرمجاز" };
    }

    const code = generateOTP(user.email);

    try {
        const supportEmail = process.env.SMTP_USER || "iranianchurchdc.us@gmail.com";
        await sendMail({
            to: user.email,
            subject: "کد ورود به پنل مدیریت | Admin 2FA Code",
            replyTo: supportEmail,
            text: `کد ورود شما: ${code}\nاین کد تا 10 دقیقه معتبر است.`,
            html: `
            <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; text-align: center; background: #0c0a09; padding: 40px; color: #fff;">
                <div style="max-width: 500px; margin: 0 auto; background: #1c1917; padding: 30px; border-radius: 15px; border: 1px solid #333;">
                    <h2 style="color: #ba955c;">تاییدیه ورود به پنل مدیریت</h2>
                    <p style="font-size: 16px; margin-bottom: 30px;">یک درخواست برای ورود به پنل مدیریت با حساب شما ثبت شده است.</p>
                    <div style="background: #000; padding: 20px; border-radius: 10px; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #ba955c;">
                        ${code}
                    </div>
                    <p style="margin-top: 30px; font-size: 14px; color: #888;">این کد تنها به مدت ۱۰ دقیقه معتبر است.</p>
                </div>
            </div>
            `
        });
        return { success: true };
    } catch (err: any) {
        console.error("Failed to send OTP", err);
        return { error: "خطا در ارسال ایمیل. لطفا دوباره تلاش کنید." };
    }
}

export async function verifyAdminOTP(code: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "کاربر یافت نشد" };
    }

    const isValid = verifyOTP(user.email, code);

    if (isValid) {
        // Set 2FA verified cookie for 24 hours
        const cookieStore = await cookies();
        cookieStore.set('admin_2fa_verified', 'true', {
            maxAge: 24 * 60 * 60, // 24 hours
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });
        return { success: true };
    } else {
        return { error: "کد نامعتبر است یا منقضی شده." };
    }
}
