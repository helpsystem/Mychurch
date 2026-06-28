"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendMail } from "@/lib/mailer";
import { resolvePublicSiteUrl } from "@/lib/site-url";
import path from "path";
import fs from "fs";
import React from "react";
import { render } from "@react-email/components";
import WelcomeEmail from "@/emails/welcome";


export async function login(formData: FormData) {
    const supabase = await createClient();

    // extract email and password from formData
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    const { data: authUserData } = await supabase.auth.getUser();
    const loggedInEmail = authUserData.user?.email;

    let role: string | null = null;
    if (loggedInEmail) {
        const { data: roleData } = await supabase
            .from('users')
            .select('role')
            .eq('email', loggedInEmail.toLowerCase())
            .maybeSingle();
        role = roleData?.role || null;
    }

    revalidatePath("/", "layout");
    if (role === 'Admin' || role === 'Leader' || role === 'Operator') {
        redirect("/admin");
    }

    redirect("/profile");
}

export async function signUp(formData: FormData) {
    const supabase = await createClient();
    const siteUrl = resolvePublicSiteUrl();

    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    
    console.log(`[Auth] 🚀 Attempting signUp for: ${email} (Name: ${fullName})`);
    
    console.log(`[Auth] 🚀 Starting signUp for: ${email}`);
    const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: `${siteUrl}/api/auth/callback`,
        },
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Force a verification email resend to avoid missing initial delivery.
    const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
            emailRedirectTo: `${siteUrl}/api/auth/callback`,
        },
    });

    if (resendError) {
        console.warn(`[Auth] ⚠️ Verification resend warning for ${email}: ${resendError.message}`);
    } else {
        console.log(`[Auth] ✅ Verification email re-sent to: ${email}`);
    }

    // [New] Synchronize with the 'users' table for RBAC using Admin Client to bypass RLS
    try {
        console.log(`[Auth] 🔄 Syncing ${email} to users table via Admin Client...`);
        const adminSupabase = await createAdminClient();
        const { error: syncError } = await adminSupabase
            .from('users')
            .upsert({
                email: email,
                name: fullName,
                role: 'User', // Default role for new signups
                updated_at: new Date()
            }, { onConflict: 'email' });
            
        if (syncError) {
            console.warn(`[Auth] ⚠️ DB Sync Warning: ${syncError.message}`);
        } else {
            console.log(`[Auth] ✅ User ${email} synced to database.`);
        }
    } catch (syncExc) {
        console.error("[Auth] ❌ DB Sync Exception:", syncExc);
    }

    // Send Welcome Email immediately via Resend fallback
    try {
        console.log(`[Auth] 📧 Sending welcome email to: ${email}`);
        const loginUrl = `${siteUrl}/login`;
        const supportEmail = process.env.SMTP_USER || "iranianchurchdc.us@gmail.com";
        
        // Setup CID Attachments
        const logoPath = path.join(process.cwd(), "public/logo-transparent.png");
        const heroPath = path.join(process.cwd(), "public/images/email/jesus-hero.png");
        
        const attachments = [];
        if (fs.existsSync(heroPath)) {
            attachments.push({ filename: 'jesus-hero.png', path: heroPath, cid: 'jesus-hero' });
        }
        if (fs.existsSync(logoPath)) {
            attachments.push({ filename: 'logo-transparent.png', path: logoPath, cid: 'logo-premium' });
        }

        const html = await render(React.createElement(WelcomeEmail, {
            fullName,
            loginUrl,
        }));

        const text = await render(React.createElement(WelcomeEmail, {
            fullName,
            loginUrl,
        }), { plainText: true });

        const mailInfo = await sendMail({
            to: email,
            subject: "تایید حساب کاربری | Account Verification - Iranian Christian Church DC",
            replyTo: supportEmail,
            attachments: attachments.length > 0 ? attachments : undefined,
            text,
            html,
        });
        console.log(`[Auth] 📨 Premium Welcome email sent: ${mailInfo.messageId}`);
    } catch (mailError: any) {
        console.error("[Auth] ❌ Failed to send welcome email:", mailError.message || mailError);
        // We don't fail the signup if only the welcome email fails, as Supabase already sent its own
    }

    return { success: true };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
}

export async function requestPasswordReset(formData: FormData): Promise<{ success?: boolean; error?: string }> {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    if (!email) return { error: "لطفاً ایمیل را وارد کنید / Please enter your email." };

    const siteUrl = resolvePublicSiteUrl();

    // 1. Try to generate a recovery link using the Admin Client
    let resetLink: string | null = null;
    try {
        const adminSupabase = await createAdminClient();
        const { data, error: linkError } = await adminSupabase.auth.admin.generateLink({
            type: "recovery",
            email: email,
            options: {
                redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
            },
        });

        if (linkError) {
            console.error("[Auth] ❌ generateLink error:", linkError.message);
        } else if (data?.properties?.action_link) {
            resetLink = data.properties.action_link;
            console.log("[Auth] ✅ Generated reset link successfully via Admin Client");
        }
    } catch (err: any) {
        console.error("[Auth] ❌ Failed to generate reset link via Admin Client:", err.message || err);
    }

    // 2. Send the branded recovery email if link was generated successfully
    if (resetLink) {
        try {
            const logoPath = path.join(process.cwd(), "public/logo-transparent.png");
            const attachments: any[] = [];
            if (fs.existsSync(logoPath)) {
                attachments.push({ filename: "logo-transparent.png", path: logoPath, cid: "logo-premium" });
            }

            await sendMail({
                to: email,
                subject: "بازیابی رمز عبور | Password Reset — Iranian Christian Church DC",
                attachments: attachments.length > 0 ? attachments : undefined,
                text: `سلام،\n\nیک درخواست بازیابی رمز عبور برای حساب کاربری شما (${email}) ثبت شد.\nبرای تعیین رمز عبور جدید روی لینک زیر کلیک کنید:\n\n${resetLink}\n\nاگر این درخواست از شما نیست، آن را نادیده بگیرید.\n\n${siteUrl}`,
                html: `
                    <!DOCTYPE html>
                    <html lang="fa" dir="rtl">
                    <head>
                        <meta charset="UTF-8">
                        <title>بازیابی رمز عبور | Password Reset</title>
                    </head>
                    <body style="margin:0;padding:0;background-color:#0c0a09;color:#ffffff;font-family:Tahoma,Geneva,sans-serif;direction:rtl;">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0c0a09;padding:40px 10px;">
                            <tr><td align="center">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#1c1917;border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
                                    <tr><td style="padding:40px;text-align:right;">
                                        ${fs.existsSync(logoPath) ? `<img src="cid:logo-premium" alt="Iranian Christian Church DC" width="56" height="56" style="margin-bottom:24px;border:0;" />` : ""}
                                        <h1 style="font-size:22px;font-weight:bold;margin:0 0 8px 0;color:#ba955c;">بازیابی رمز عبور</h1>
                                        <h2 dir="ltr" style="font-size:14px;font-weight:600;margin:0 0 24px 0;color:#a8a29e;text-align:left;">Password Reset Request</h2>
                                        <p style="font-size:15px;line-height:1.8;margin:0 0 24px 0;color:#e7e5e4;">
                                            سلام،<br/>
                                            یک درخواست بازیابی رمز عبور برای حساب کاربری شما (<strong>${email}</strong>) ثبت شد.<br/>
                                            برای تعیین رمز عبور جدید روی دکمه زیر کلیک کنید:
                                        </p>
                                        <div style="text-align: center; margin: 32px 0;">
                                            <a href="${resetLink}" style="background-color: #ba955c; color: #000000; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; text-decoration: none; font-family: Tahoma, Geneva, sans-serif;">ورود و تغییر رمز عبور / Reset Password</a>
                                        </div>
                                        <p style="font-size:13px;line-height:1.6;color:#a8a29e;margin: 20px 0 0 0;">
                                            اگر دکمه بالا کار نمی‌کند، می‌توانید لینک زیر را کپی کرده و در مرورگر خود باز کنید:
                                        </p>
                                        <p dir="ltr" style="font-size:11px;color:#ba955c;word-break:break-all;text-align:left;margin: 8px 0 24px 0;">
                                            ${resetLink}
                                        </p>
                                        <p dir="ltr" style="font-size:13px;line-height:1.7;margin:0 0 24px 0;color:#a8a29e;text-align:left;font-style:italic;">
                                            If you did not request this, please ignore this email.
                                        </p>
                                        <div style="border:1px solid rgba(186,149,92,0.3);background-color:rgba(186,149,92,0.08);border-radius:12px;padding:16px;margin:0 0 28px 0;color:#d6d3d1;font-size:13px;line-height:1.6;">
                                            <strong>توجه:</strong> این لینک برای ۱ ساعت معتبر است.
                                        </div>
                                    </td></tr>
                                    <tr><td style="border-top:1px solid rgba(255,255,255,0.05);background-color:rgba(0,0,0,0.2);padding:20px;font-size:12px;color:#78716c;text-align:center;font-family:Arial,sans-serif;">
                                        © ${new Date().getFullYear()} Iranian Christian Church D.C. — ${siteUrl}
                                    </td></tr>
                                </table>
                            </td></tr>
                        </table>
                    </body>
                    </html>
                `,
            });
            console.log(`[Auth] 📧 Branded password reset email with link sent to ${email}`);
        } catch (mailErr: any) {
            console.error("[Auth] ❌ Failed to send branded reset email:", mailErr.message);
        }
    } else {
        // Fallback: If admin link generation failed, use standard Supabase reset password email flow
        console.log("[Auth] 🔄 Falling back to standard resetPasswordForEmail...");
        const supabase = await createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
        });

        if (error) {
            console.error("[Auth] ❌ resetPasswordForEmail error:", error.message);
            return { error: error.message };
        }
    }

    return { success: true };
}

