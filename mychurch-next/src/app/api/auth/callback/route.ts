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
                
                // Check if user already exists
                const { data: existingUser } = await adminSupabase
                    .from('users')
                    .select('role')
                    .eq('email', user.email)
                    .maybeSingle();

                if (!existingUser) {
                    await adminSupabase
                        .from('users')
                        .insert({
                            email: user.email,
                            name: user.user_metadata?.full_name || user.email?.split('@')[0],
                            role: 'User', // Default role for new signups
                            updated_at: new Date().toISOString()
                        });
                } else {
                    // Update only metadata/timestamp, preserve the existing role!
                    await adminSupabase
                        .from('users')
                        .update({
                            name: user.user_metadata?.full_name || user.email?.split('@')[0],
                            updated_at: new Date().toISOString()
                        })
                        .eq('email', user.email);
                }
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
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>خوش آمدید | Welcome</title>
                        </head>
                        <body style="margin: 0; padding: 0; background-color: #0c0a09; color: #ffffff; font-family: Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0a09; padding: 40px 10px;">
                                <tr>
                                    <td align="center">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #1c1917; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; overflow: hidden;">
                                            ${fs.existsSync(heroPath) ? `
                                            <tr>
                                                <td>
                                                    <img src="cid:jesus-hero" alt="Welcome to Church" width="100%" style="display: block; width: 100%; max-width: 100%; border: 0;" />
                                                </td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td style="padding: 40px; text-align: right;">
                                                    ${fs.existsSync(logoPath) ? `
                                                    <img src="cid:logo-premium" alt="Iranian Christian Church DC" width="56" height="56" style="margin-bottom: 24px; border: 0;" />
                                                    ` : ''}
                                                    
                                                    <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0; color: #ba955c; font-family: Tahoma, Geneva, sans-serif;">خوش آمدید ${fullName}</h1>
                                                    <h2 dir="ltr" style="font-size: 15px; font-weight: 600; margin: 0 0 24px 0; color: #a8a29e; font-family: Arial, sans-serif; text-align: left;">Welcome to Iranian Christian Church D.C.</h2>
                                                    
                                                    <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px 0; color: #e7e5e4; font-family: Tahoma, Geneva, sans-serif;">
                                                        ثبت‌نام شما با حساب گوگل موفقیت‌آمیز بود.
                                                    </p>
                                                    
                                                    <p dir="ltr" style="font-size: 14px; line-height: 1.7; margin: 0 0 24px 0; color: #a8a29e; font-family: Arial, sans-serif; text-align: left; font-style: italic;">
                                                        Dear ${fullName}, your account was successfully created via Google.
                                                    </p>

                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                        <tr>
                                                            <td align="center" style="padding: 10px 0;">
                                                                <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; border-radius: 12px; background-color: #ba955c; color: #000000; text-decoration: none; font-weight: bold; font-size: 15px; font-family: Tahoma, Geneva, sans-serif;">ورود به حساب / Sign In</a>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <p dir="ltr" style="margin-top: 30px; font-size: 12px; color: #78716c; line-height: 1.8; text-align: center; font-family: Arial, sans-serif;">
                                                        Website: ${origin}<br/>
                                                        Support: ${supportEmail}<br/>
                                                        Address: Iranian Christian Church, Washington D.C., USA
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="border-top: 1px solid rgba(255, 255, 255, 0.05); background-color: rgba(0, 0, 0, 0.2); padding: 20px; font-size: 12px; color: #78716c; text-align: center; font-family: Arial, sans-serif;">
                                                    © ${new Date().getFullYear()} Iranian Christian Church D.C. — ${origin}
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
                } catch (mailError) {
                    console.error("[AuthCallback] ❌ Failed to send welcome email:", mailError);
                }
            }
        }
    }

    const origin = resolveAuthCallbackOrigin(requestUrl, request.headers);
    return NextResponse.redirect(new URL(next, origin));
}