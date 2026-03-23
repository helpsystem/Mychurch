"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendMail } from "@/lib/mailer";
import path from "path";
import fs from "fs";

function resolvePublicSiteUrl() {
    const raw = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    const fallback = "https://samanabyar.online";

    if (!raw) return fallback;

    try {
        const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        const host = parsed.hostname.toLowerCase();
        const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
        if (isLocal) return fallback;
        return parsed.origin;
    } catch {
        return fallback;
    }
}


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
            .eq('email', loggedInEmail)
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

    const email = formData.get("email") as string;
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

        const mailInfo = await sendMail({
            to: email,
            subject: "تایید حساب کاربری | Account Verification - Iranian Christian Church DC",
            replyTo: supportEmail,
            attachments: attachments.length > 0 ? attachments : undefined,
            text: `سلام ${fullName} عزیز،

ثبت‌نام شما در Iranian Christian Church DC انجام شد.
برای فعال‌سازی حساب، ایمیل تایید Supabase را باز کنید و روی لینک تایید بزنید.

ورود به سایت:
${loginUrl}

در صورت عدم دریافت ایمیل تایید، پوشه Spam/Junk را بررسی کنید یا با ما تماس بگیرید:
${supportEmail}
`,
            html: `
                <!DOCTYPE html>
                <html lang="fa" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
                        body { margin: 0; padding: 0; background-color: #0c0a09; color: #ffffff; font-family: 'Vazirmatn', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
                        .wrap { width: 100%; padding: 40px 10px; background-color: #0c0a09; }
                        .card { max-width: 600px; margin: 0 auto; background-color: #1c1917; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
                        .hero { width: 100%; display: block; aspect-ratio: 16/9; object-fit: cover; }
                        .content { padding: 40px; }
                        .logo { width: 56px; height: 56px; margin-bottom: 24px; filter: drop-shadow(0 0 10px rgba(186,149,92,0.4)); }
                        .fa-title { font-size: 26px; font-weight: 900; margin: 0 0 8px; color: #ba955c; }
                        .en-title { font-size: 15px; font-weight: 600; margin: 0 0 24px; color: #a8a29e; font-family: sans-serif; letter-spacing: -0.01em; }
                        .fa-text { font-size: 16px; line-height: 1.9; margin: 0 0 16px; color: #e7e5e4; }
                        .en-text { font-size: 14px; line-height: 1.7; margin: 0 0 24px; color: #a8a29e; font-family: sans-serif; font-style: italic; }
                        .note { border: 1px solid rgba(186,149,92,0.3); background: rgba(186,149,92,0.1); border-radius: 12px; padding: 16px; margin: 20px 0 30px; color: #d6d3d1; font-size: 14px; text-align: right; }
                        .cta-wrap { text-align: center; margin: 30px 0 10px; }
                        .cta { display: inline-block; padding: 14px 28px; border-radius: 12px; background: #ba955c; color: #000000 !important; text-decoration: none; font-weight: 900; font-size: 15px; }
                        .meta { margin-top: 24px; font-size: 12px; color: #78716c; line-height: 1.8; text-align: center; }
                        .footer { border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); padding: 20px; font-size: 12px; color: #78716c; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="wrap" dir="rtl">
                        <div class="card">
                            ${fs.existsSync(heroPath) ? '<img src="cid:jesus-hero" alt="Welcome to Church" class="hero" />' : ''}
                            <div class="content">
                                ${fs.existsSync(logoPath) ? '<img src="cid:logo-premium" alt="Iranian Christian Church DC" class="logo" />' : ''}
                                
                                <h1 class="fa-title">به خانواده کلیسای ایرانی واشنگتن خوش آمدید</h1>
                                <h2 class="en-title" dir="ltr">Welcome to Iranian Christian Church D.C.</h2>
                                
                                <p class="fa-text">
                                    سلام <strong>${fullName}</strong> عزیز،<br/>
                                    ثبت‌نام شما انجام شد. برای فعال شدن حساب، ایمیل تایید Supabase را باز کنید و لینک تایید را بزنید.
                                </p>
                                
                                <p class="en-text" dir="ltr">
                                    Dear ${fullName}, your account was created successfully.
                                    Please confirm your email using the verification message sent by Supabase.
                                </p>

                                <div class="note">
                                    <strong>توجه / Note:</strong> در صورتی که ایمیل تاییدیه (Verification Email) را دریافت نکردید، لطفاً پوشه <strong>Spam</strong> یا <strong>Junk</strong> خود را بررسی کنید.
                                </div>

                                <div class="cta-wrap">
                                    <a href="${loginUrl}" class="cta">ورود به حساب / Sign In</a>
                                </div>

                                <div class="meta" dir="ltr">
                                    Website: ${siteUrl}<br/>
                                    Support: ${supportEmail}
                                </div>
                            </div>
                            <div class="footer">© ${new Date().getFullYear()} Iranian Christian Church D.C. — ${siteUrl}</div>
                        </div>
                    </div>
                </body>
                </html>
            `
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
