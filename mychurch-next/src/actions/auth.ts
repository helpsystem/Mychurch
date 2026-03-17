"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendMail } from "@/lib/mailer";
import path from "path";

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

    // [New] Synchronize with the 'users' table for RBAC
    try {
        console.log(`[Auth] 🔄 Syncing ${email} to users table...`);
        const { error: syncError } = await supabase
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
        
        const mailInfo = await sendMail({
            to: email,
            subject: "به کلیسای متی خوش آمدید | Welcome to MyChurch",
            attachments: [
                {
                    filename: 'jesus-hero.png',
                    path: path.join(process.cwd(), "public/images/email/jesus-hero.png"),
                    cid: 'jesus-hero'
                },
                {
                    filename: 'logo-transparent.png',
                    path: path.join(process.cwd(), "public/logo-transparent.png"),
                    cid: 'logo-premium'
                }

            ],
            html: `
                <!DOCTYPE html>
                <html lang="fa" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { margin: 0; padding: 0; background-color: #f3f4f6; color: #111827; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                        .body-wrap { width: 100%; padding: 28px 12px; }
                        .container { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e7eb; }
                        .hero-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
                        .content { padding: 30px 24px; }
                        .logo { width: 58px; height: 58px; margin-bottom: 20px; }
                        .header-fa { font-size: 28px; font-weight: 800; color: #111827; margin: 0 0 6px 0; text-align: right; }
                        .header-en { font-size: 16px; font-weight: 600; color: #4b5563; margin: 0 0 18px 0; text-align: left; }
                        .lead-fa { font-size: 16px; line-height: 1.9; color: #1f2937; margin: 0 0 12px 0; text-align: right; }
                        .lead-en { font-size: 14px; line-height: 1.7; color: #4b5563; margin: 0 0 22px 0; text-align: left; }
                        .note { border: 1px solid #dbeafe; background: #eff6ff; border-radius: 12px; padding: 12px; margin: 14px 0 22px; color: #1e3a8a; font-size: 13px; }
                        .cta-wrap { text-align: center; margin: 24px 0 14px; }
                        .cta-button { display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; }
                        .footer { padding: 18px 24px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb; }
                        .footer-text { font-size: 12px; color: #6b7280; margin: 2px 0; }
                    </style>
                </head>
                <body>
                    <div class="body-wrap" dir="rtl">
                        <div class="container">
                            <img src="cid:jesus-hero" alt="Welcome" class="hero-image">
                            <div class="content">
                                <img src="cid:logo-premium" alt="MyChurch" class="logo">
                                
                                <h1 class="header-fa">به کلیسای متی خوش آمدید</h1>
                                <h2 class="header-en" dir="ltr">Welcome to MyChurch</h2>
                                
                                <div class="lead-fa">
                                    سلام <strong>${fullName}</strong> عزیز،<br/>
                                    ثبت‌نام شما انجام شد. ایمیل تأیید حساب از طرف Supabase برای شما ارسال می‌شود.
                                    بعد از تأیید، از دکمه زیر وارد حساب خود شوید.
                                </div>
                                
                                <div class="lead-en" dir="ltr">
                                    Dear ${fullName}, your account has been created successfully.
                                    Please confirm your email using the verification mail sent by Supabase, then sign in from the button below.
                                </div>

                                <div class="note" dir="ltr">If verification email doesn't arrive, check spam/junk folder or contact support.</div>

                                <div class="cta-wrap">
                                    <a href="${loginUrl}" class="cta-button">ورود به حساب / Sign In</a>
                                </div>
                            </div>
                            <div class="footer">
                                <p class="footer-text">Iranian Christian Church D.C.</p>
                                <p class="footer-text">© ${new Date().getFullYear()} All Rights Reserved</p>
                                <p class="footer-text" dir="ltr">${siteUrl}</p>
                            </div>
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
