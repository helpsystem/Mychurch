"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { generateOTP, verifyOTP } from "@/lib/otp-store";
import { sendMail } from "@/lib/mailer";
import { sendSMS, sendWhatsApp } from "@/lib/twilio";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";
import { render } from "@react-email/components";
import Admin2faOtpEmail from "@/emails/2fa-otp";
import { sendTelegramMessage } from "@/services/telegram";
import { sendTelegramUserMessageById, sendTelegramUserMessage } from "@/services/telegram-user";
import { sendSMSViaGoogleMessages } from "@/services/google-messages";

export async function sendAdminOTP(channel: "whatsapp" | "sms" | "email" | "telegram" = "email"): Promise<{ success?: boolean; error?: string; channelUsed?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "کاربر یافت نشد" };
    }

    const { getRealUserRole } = await import("@/utils/rbac");
    const role = await getRealUserRole();

    if (!role || !['Admin', 'Leader', 'Operator'].includes(role)) {
        return { error: "دسترسی غیرمجاز" };
    }

    // Retrieve contact info using admin client to bypass RLS policies
    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('phone, whatsapp_number, telegram_id')
        .ilike('email', user.email)
        .maybeSingle();

    if (!userData) {
        return { error: "اطلاعات کاربر یافت نشد" };
    }

    const phone = userData.phone?.trim();
    const whatsapp = userData.whatsapp_number?.trim();
    // telegram_id MUST be numeric (e.g. "123456789") — reject emails or other invalid values
    const rawTelegram = userData.telegram_id?.trim();
    const telegramId = rawTelegram && /^\d+$/.test(rawTelegram) ? rawTelegram : undefined;

    if (channel === "telegram" && !telegramId) {
        const hint = rawTelegram 
            ? `مقدار ذخیره‌شده («${rawTelegram}») معتبر نیست. شناسه تلگرام باید عدد باشد.`
            : "شناسه تلگرام برای حساب کاربری شما ثبت نشده است.";
        return { error: hint };
    }


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
    if (channel === "telegram" && telegramId) {
        console.log(`[Auth OTP] 🚀 Attempting to send OTP via Telegram to ${telegramId}...`);

        let telegramSent = false;

        // Try MTProto user account first (bypasses /start requirement)
        if (process.env.TELEGRAM_USER_SESSION) {
            console.log(`[Auth OTP] 📱 Using church user account (MTProto) to send...`);
            telegramSent = await sendTelegramUserMessageById(telegramId, messageText);
            // Fallback: if by ID fails, try by phone number
            if (!telegramSent && phone) {
                console.log(`[Auth OTP] 📱 Trying by phone number ${phone}...`);
                const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
                telegramSent = await sendTelegramUserMessage(normalizedPhone, messageText);
            }
        }

        // Fallback to bot if MTProto not available or failed
        if (!telegramSent) {
            console.log(`[Auth OTP] 🤖 Using bot API as fallback...`);
            telegramSent = await sendTelegramMessage(telegramId, messageText);
        }

        if (telegramSent) {
            return { success: true, channelUsed: "telegram" };
        }

        console.warn(`[Auth OTP] ⚠️ Telegram sending failed. Switching to SMS fallback...`);
        if (phone) {
            finalChannel = "sms";
        } else {
            finalChannel = "email";
        }
    }

    if (finalChannel === "whatsapp" && whatsapp) {
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
        console.log(`[Auth OTP] 🚀 Attempting to send OTP via SMS (Google Messages) to ${phone}...`);
        const sent = await sendSMSViaGoogleMessages(phone, messageText);
        if (sent) {
            return { success: true, channelUsed: "sms" };
        }

        console.warn(`[Auth OTP] ⚠️ SMS (Google Messages) sending failed. Switching to Email fallback...`);
        finalChannel = "email";
    }

    // Email fallback or primary
    try {
        console.log(`[Auth OTP] 🚀 Sending OTP via Email to ${user.email}...`);
        const supportEmail = process.env.SMTP_USER || "iranianchurchdc.us@gmail.com";
        
        const html = await render(React.createElement(Admin2faOtpEmail, { code }));
        const text = await render(React.createElement(Admin2faOtpEmail, { code }), { plainText: true });

        await sendMail({
            to: user.email,
            subject: "کد ورود به پنل مدیریت | Admin 2FA Code",
            replyTo: supportEmail,
            text,
            html,
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
