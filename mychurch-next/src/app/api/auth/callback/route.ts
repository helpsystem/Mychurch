import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resolveAuthCallbackOrigin } from "@/lib/site-url";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const tokenHash = requestUrl.searchParams.get("token_hash");
    const type = requestUrl.searchParams.get("type");
    const nextParam = requestUrl.searchParams.get("next");
    const next = nextParam && nextParam.startsWith("/") ? nextParam : "/profile";

    const supabase = await createClient();

    if (tokenHash && type) {
        await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change",
        });
    }

    if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        const user = data?.user;

        if (user) {
            // Synchronize with the 'users' table for RBAC using Admin Client
            try {
                const { createAdminClient } = await import("@/utils/supabase/server");
                const adminSupabase = await createAdminClient();
                await adminSupabase
                    .from('users')
                    .upsert({
                        email: user.email,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        role: 'User', // Default role for new signups
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'email' });
            } catch (syncError) {
                console.error("[AuthCallback] DB Sync Error:", syncError);
            }

            // [NEW] Send Welcome Email for New OAuth Signups (created within last 60 seconds)
            const isNewUser = user.created_at && (Date.now() - new Date(user.created_at).getTime()) < 60000;
            if (isNewUser) {
                try {
                    console.log(`[AuthCallback] 🌟 New Google Auth User detected, sending welcome email: ${user.email}`);
                    const { sendMail } = await import("@/lib/mailer");
                    const path = await import("path");
                    const fs = await import("fs");
                    
                    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0];
                    const supportEmail = process.env.SMTP_USER || "iranianchurchdc.us@gmail.com";
                    const origin = resolveAuthCallbackOrigin(requestUrl, request.headers);
                    const loginUrl = `${origin}/login`;
                    
                    const logoPath = path.join(process.cwd(), "public/logo-transparent.png");
                    const heroPath = path.join(process.cwd(), "public/images/email/jesus-hero.png");
                    
                    const attachments = [];
                    if (fs.existsSync(heroPath)) {
                        attachments.push({ filename: 'jesus-hero.png', path: heroPath, cid: 'jesus-hero' });
                    }
                    if (fs.existsSync(logoPath)) {
                        attachments.push({ filename: 'logo-transparent.png', path: logoPath, cid: 'logo-premium' });
                    }

                    await sendMail({
                        to: user.email!,
                        subject: "به خانواده کلیسای ایرانی واشنگتن خوش آمدید | Welcome",
                        replyTo: supportEmail,
                        attachments: attachments.length > 0 ? attachments : undefined,
                        text: `سلام ${fullName} عزیز،\nثبت‌نام شما با گوگل انجام شد.\n\nورود به پنل:\n${loginUrl}`,
                        html: `
                        <!DOCTYPE html>
                        <html lang="fa" dir="rtl">
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { margin: 0; background-color: #0c0a09; color: #ffffff; font-family: sans-serif; text-align: center; }
                                .card { max-width: 600px; margin: 40px auto; background-color: #1c1917; padding: 40px; border-radius: 20px; }
                                .title { color: #ba955c; font-size: 24px; font-weight: bold; }
                                .cta { display: inline-block; padding: 14px 28px; background: #ba955c; color: #000; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px; }
                                .hero { width: 100%; border-radius: 12px; margin-bottom: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="card">
                                ${fs.existsSync(heroPath) ? '<img src="cid:jesus-hero" class="hero" />' : ''}
                                <h1 class="title">خوش آمدید ${fullName}</h1>
                                <p>ثبت‌نام شما با حساب گوگل موفقیت‌آمیز بود.</p>
                                <p dir="ltr">Dear ${fullName}, your account was successfully created via Google.</p>
                                <a href="${loginUrl}" class="cta">ورود به حساب / Sign In</a>
                            </div>
                        </body>
                        </html>
                        `
                    });
                } catch (mailError) {
                    console.error("[AuthCallback] ❌ Failed to send welcome email:", mailError);
                }
            }
        }
    }

    const origin = resolveAuthCallbackOrigin(requestUrl, request.headers);
    return NextResponse.redirect(new URL(next, origin));
}