"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { generateOTP, verifyOTP } from "@/lib/otp-store";
import { sendMail } from "@/lib/mailer";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function sendAdminOTP(channel: "whatsapp" | "sms" | "email" = "email"): Promise<{ success?: boolean; error?: string; channelUsed?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "کاربر یافت نشد" };
    }

    // Verify role and retrieve contact info using admin client to bypass RLS policies
    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('role, phone, whatsapp_number')
        .eq('email', user.email)
        .single();

    if (!userData || !['Admin', 'Leader', 'Operator'].includes(userData.role)) {
        return { error: "دسترسی غیرمجاز" };
    }

    const phone = userData.phone?.trim();
    const whatsapp = userData.whatsapp_number?.trim();

    if (channel === "whatsapp" && !whatsapp) {
        return { error: "شماره واتساپ برای حساب کاربری شما ثبت نشده است." };
    }

    if (channel === "sms" && !phone) {
        return { error: "شماره موبایل برای حساب کاربری شما ثبت نشده است." };
    }

    const code = generateOTP(user.email);
    const messageText = `کد ورود شما به پنل مدیریت MyChurch: ${code}\nاین کد تا ۱۰ دقیقه معتبر است.\n\nYour MyChurch admin login code: ${code}\nThis code is valid for 10 minutes.`;

    let finalChannel: string = channel;

    // Send code based on requested channel
    if (channel === "whatsapp" && whatsapp) {
        console.log(`[Auth OTP] 🚀 Attempting to send OTP via WhatsApp to ${whatsapp}...`);
        const res = await sendWhatsApp(whatsapp, messageText);
        if (res.success) {
            return { success: true, channelUsed: "whatsapp" };
        }

        console.warn(`[Auth OTP] ⚠️ WhatsApp sending failed: ${res.error}. Switching to SMS fallback...`);
        // Fallback: If SMS phone is available, try SMS. Otherwise, fallback to Email.
        if (phone) {
            finalChannel = "sms";
        } else {
            finalChannel = "email";
        }
    }

    if (finalChannel === "sms" && phone) {
        console.log(`[Auth OTP] 🚀 Attempting to send OTP via SMS to ${phone}...`);
        const res = await sendSMS(phone, messageText);
        if (res.success) {
            return { success: true, channelUsed: "sms" };
        }

        console.warn(`[Auth OTP] ⚠️ SMS sending failed: ${res.error}. Switching to Email fallback...`);
        finalChannel = "email";
    }

    // Email fallback or primary
    try {
        console.log(`[Auth OTP] 🚀 Sending OTP via Email to ${user.email}...`);
        const supportEmail = process.env.SMTP_USER || "iranianchurchdc.us@gmail.com";
        await sendMail({
            to: user.email,
            subject: "کد ورود به پنل مدیریت | Admin 2FA Code",
            replyTo: supportEmail,
            text: `کد ورود شما: ${code}\nاین کد تا 10 دقیقه معتبر است.\n\nYour login code: ${code}\nThis code is valid for 10 minutes.`,
            html: `
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>کد تایید ورود | Admin 2FA Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #0c0a09; color: #ffffff; font-family: 'Vazirmatn', Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0a09; padding: 40px 10px;">
                    <tr>
                        <td align="center">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px; background-color: #1c1917; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden; padding: 35px 30px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                                <tr>
                                    <td>
                                        <!-- Header Image or Icon -->
                                        <div style="margin-bottom: 24px; display: inline-block;">
                                            <span style="font-size: 40px; line-height: 1;">🔐</span>
                                        </div>

                                        <!-- Farsi Section -->
                                        <h2 style="color: #ba955c; margin: 0 0 8px 0; font-size: 22px; font-weight: bold; font-family: 'Vazirmatn', Tahoma, sans-serif;">تاییدیه ورود به پنل مدیریت</h2>
                                        <p style="font-size: 15px; margin: 0 0 20px 0; color: #e7e5e4; line-height: 1.6; font-family: 'Vazirmatn', Tahoma, sans-serif;">یک درخواست برای ورود به پنل مدیریت با حساب شما ثبت شده است.</p>
                                        
                                        <!-- OTP Display Box -->
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; border: 1px solid rgba(186, 149, 92, 0.3); border-radius: 12px; margin: 25px 0;">
                                            <tr>
                                                <td style="padding: 20px; font-size: 36px; letter-spacing: 6px; font-weight: bold; color: #ba955c; font-family: 'Courier New', Courier, monospace; text-align: center;">
                                                    ${code}
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- English Section -->
                                        <div dir="ltr" style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px; margin-top: 20px;">
                                            <h3 style="color: #ba955c; margin: 0 0 8px 0; font-size: 18px; font-weight: 600; font-family: Arial, sans-serif;">Admin Access Verification</h3>
                                            <p style="font-size: 14px; margin: 0 0 20px 0; color: #a8a29e; line-height: 1.5; font-family: Arial, sans-serif;">A login request for the admin console has been initiated for your account.</p>
                                        </div>
                                        
                                        <!-- Expiry details -->
                                        <div style="margin-top: 25px; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 15px;">
                                            <p style="margin: 0 0 4px 0; font-size: 13px; color: #78716c; font-family: 'Vazirmatn', Tahoma, sans-serif;">این کد تنها به مدت <strong>۱۰ دقیقه</strong> معتبر است.</p>
                                            <p dir="ltr" style="margin: 0; font-size: 12px; color: #78716c; font-family: Arial, sans-serif;">This code is only valid for <strong>10 minutes</strong>.</p>
                                        </div>
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
        return { success: true, channelUsed: "email" };
    } catch (err: any) {
        console.error("Failed to send OTP email:", err);
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
