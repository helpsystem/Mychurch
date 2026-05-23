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
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>کد تایید ورود | Admin 2FA Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #0c0a09; color: #ffffff; font-family: Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0a09; padding: 40px 10px;">
                    <tr>
                        <td align="center">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #1c1917; border: 1px solid #333333; border-radius: 15px; overflow: hidden; padding: 30px; text-align: center;">
                                <tr>
                                    <td>
                                        <h2 style="color: #ba955c; margin: 0 0 15px 0; font-size: 22px; font-family: Tahoma, Geneva, sans-serif;">تاییدیه ورود به پنل مدیریت</h2>
                                        <p style="font-size: 16px; margin: 0 0 30px 0; color: #e7e5e4; line-height: 1.6; font-family: Tahoma, Geneva, sans-serif;">یک درخواست برای ورود به پنل مدیریت با حساب شما ثبت شده است.</p>
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; border-radius: 10px; margin: 20px 0;">
                                            <tr>
                                                <td style="padding: 20px; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #ba955c; font-family: Courier New, Courier, monospace; text-align: center;">
                                                    ${code}
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 30px 0 0 0; font-size: 14px; color: #888888; font-family: Tahoma, Geneva, sans-serif;">این کد تنها به مدت ۱۰ دقیقه معتبر است.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
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
