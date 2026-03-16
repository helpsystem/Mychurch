"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendMail } from "@/lib/mailer";
import path from "path";


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

    revalidatePath("/", "layout");
    redirect("/admin");
}

export async function signUp(formData: FormData) {
    const supabase = await createClient();

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
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://samanabyar.online'}/api/auth/callback`,
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
                full_name: fullName,
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
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samanabyar.online';
        
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
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { margin: 0; padding: 0; background-color: #0c0a09; color: #ffffff; font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, sans-serif; -webkit-font-smoothing: antialiased; }
                        .body-wrap { background-color: #0c0a09; width: 100%; padding: 40px 0; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #1c1917; border-radius: 32px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
                        .hero-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
                        .content { padding: 48px; }
                        .logo { width: 64px; height: 64px; margin-bottom: 32px; filter: drop-shadow(0 0 10px rgba(186,149,92,0.3)); }
                        .header-farsi { font-size: 32px; font-weight: 900; color: #ba955c; margin: 0 0 8px 0; text-align: right; line-height: 1.2; }
                        .header-english { font-size: 20px; font-weight: 700; color: #e7e5e4; margin: 0 0 32px 0; text-align: left; line-height: 1.2; letter-spacing: -0.02em; }
                        .message-farsi { font-size: 18px; line-height: 1.8; color: #d6d3d1; margin-bottom: 24px; text-align: right; }
                        .message-english { font-size: 16px; line-height: 1.6; color: #a8a29e; margin-bottom: 40px; text-align: left; font-style: italic; }
                        .cta-wrap { text-align: center; margin-bottom: 40px; }
                        .cta-button { display: inline-block; background-color: #ba955c; color: #000000; padding: 18px 36px; border-radius: 16px; font-weight: 900; text-decoration: none; font-size: 18px; transition: transform 0.2s; }
                        .footer { padding: 32px 48px; background-color: rgba(0,0,0,0.2); text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
                        .footer-text { font-size: 12px; color: #78716c; margin: 4px 0; }
                        .social-links { margin-top: 20px; }
                        .social-link { color: #ba955c; text-decoration: none; font-weight: bold; margin: 0 10px; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="body-wrap" dir="rtl">
                        <div class="container">
                            <img src="cid:jesus-hero" alt="Welcome" class="hero-image">
                            <div class="content">
                                <img src="cid:logo-premium" alt="MyChurch" class="logo">
                                
                                <h1 class="header-farsi">به کلیسای متی خوش آمدید</h1>
                                <h2 class="header-english" dir="ltr">Welcome Home to MyChurch</h2>
                                
                                <div class="message-farsi">
                                    <p>سلام <strong>${fullName}</strong> عزیز،</p>
                                    <p>بسیار خوشحالیم که شما به جمع صمیمی ما پیوستید. ما باور داریم که کلیسا یک خانواده است و هر عضو جدید، هدیه‌ای از جانب خداوند برای این خانواده است.</p>
                                    <p>لطفاً با کلیک بر روی دکمه زیر، ایمیل خود را تایید کنید تا دسترسی کامل به تمامی امکانات پلتفرم برای شما فعال شود.</p>
                                </div>
                                
                                <div class="message-english" dir="ltr">
                                    <p>Dear ${fullName},</p>
                                    <p>We are thrilled to have you join our community. We believe the church is a family, and every new member is a gift from God. Please verify your account to unlock full access to our platform.</p>
                                </div>

                                <div class="cta-wrap">
                                    <a href="${siteUrl}/api/auth/callback" class="cta-button">تایید حساب کاربری / Verify Account</a>
                                </div>
                            </div>
                            <div class="footer">
                                <p class="footer-text">Iranian Christian Church D.C.</p>
                                <p class="footer-text">© ${new Date().getFullYear()} All Rights Reserved</p>
                                <div class="social-links">
                                    <a href="https://samanabyar.online" class="social-link">Website</a>
                                    <a href="#" class="social-link">Instagram</a>
                                </div>
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
