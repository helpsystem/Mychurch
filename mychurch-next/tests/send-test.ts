import { sendMail } from '../src/lib/mailer';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const testUser = {
    email: 'iranianchurchdc.us@gmail.com', // Change this to your real email for testing
    fullName: 'Test User (کابر تست)'
};

async function sendTestEmail() {
    console.log(`[Test] 📧 Sending premium test email to: ${testUser.email}`);
    const resendKey = process.env.RESEND_API_KEY;
    console.log(`[Test] Resend API Key loaded: ${resendKey ? 'YES (starts with ' + resendKey.substring(0, 5) + '...)' : 'NO'}`);
    
    if (!resendKey) {
        console.error('[Test] ❌ RESEND_API_KEY is missing!');
        return;
    }

    const siteUrl = 'https://samanabyar.online';
    
    try {
        await sendMail({
            to: testUser.email,
            subject: "تست ایمیل پریمیوم کلیسای متی | Premium Email Test",
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
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml" lang="fa" dir="rtl">
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <title>Welcome to MyChurch</title>
                    <style type="text/css">
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { margin: 0; padding: 0; min-width: 100%; background-color: #0c0a09; color: #ffffff; font-family: 'Inter', 'Tahoma', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
                        table { border-collapse: collapse; }
                        .content { width: 100%; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 40px; overflow: hidden; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5); }
                        .hero { width: 100%; height: auto; display: block; border-bottom: 2px solid #ba955c; }
                        .padding { padding: 48px; }
                        .logo { width: 100px; height: 100px; margin-bottom: 32px; border-radius: 20px; box-shadow: 0 10px 30px rgba(186,149,92,0.3); }
                        .header-farsi { font-size: 36px; font-weight: 900; color: #ba955c; margin: 0 0 12px 0; text-align: right; line-height: 1.2; }
                        .header-english { font-size: 22px; font-weight: 700; color: #e7e5e4; margin: 0 0 40px 0; text-align: left; line-height: 1.2; letter-spacing: -0.02em; }
                        .p-farsi { font-size: 18px; line-height: 2; color: #d6d3d1; margin-bottom: 32px; text-align: right; }
                        .p-english { font-size: 16px; line-height: 1.6; color: #a8a29e; margin-bottom: 48px; text-align: left; font-style: italic; border-left: 4px solid #ba955c; padding-left: 20px; margin-left: 4px; }
                        .cta-wrap { text-align: center; padding-bottom: 40px; }
                        .cta-btn { display: inline-block; background-color: #ba955c; color: #000000 !important; padding: 22px 50px; border-radius: 24px; font-weight: 900; text-decoration: none; font-size: 18px; box-shadow: 0 15px 35px rgba(186,149,92,0.4); text-transform: uppercase; letter-spacing: 0.05em; }
                        .footer { padding: 40px 48px; background-color: rgba(0,0,0,0.5); text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }
                        .footer-text { font-size: 13px; color: #78716c; margin: 4px 0; letter-spacing: 0.1em; text-transform: uppercase; }
                    </style>
                </head>
                <body style="margin: 0; padding: 40px 0; background-color: #0c0a09;" dir="rtl">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td align="center">
                                <table class="content" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td>
                                            <img src="cid:jesus-hero" alt="Jesus Christ Welcome" class="hero" width="600" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="padding">
                                            <img src="cid:logo-premium" alt="MyChurch" class="logo" width="100" />
                                            
                                            <h1 class="header-farsi">این یک ایمیل تست پریمیوم است</h1>
                                            <h2 class="header-english" dir="ltr">This is a Premium Test Email</h2>
                                            
                                            <div class="p-farsi">
                                                <p>سلام،</p>
                                                <p>این ایمیل جهت مشاهده ظاهر جدید و حرفه‌ای ایمیل‌های خوش‌آمدگویی کلیسای متی برای شما ارسال شده است.</p>
                                            </div>
                                            
                                            <div class="p-english" dir="ltr">
                                                <p>Hello,</p>
                                                <p>This email is sent to you to preview the new professional bilingual design of MyChurch welcome emails.</p>
                                            </div>

                                            <div class="cta-wrap">
                                                <a href="${siteUrl}" class="cta-btn">مشاهده وب‌سایت / View Website</a>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="footer">
                                            <p class="footer-text">Iranian Christian Church of D.C.</p>
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
        console.log('[Test] ✅ Test email sent successfully!');
    } catch (error) {
        console.error('[Test] ❌ Error sending test email:', error);
    }
}


sendTestEmail();
