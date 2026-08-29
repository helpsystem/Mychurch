"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

export async function subscribeUser(email: string, name: string) {
    if (!email) return { success: false, error: "Email is required" };

    try {
        const res = await query(`
            INSERT INTO church_subscribers (email, name)
            VALUES ($1, $2)
            ON CONFLICT (email) DO UPDATE SET active = true
            RETURNING *
        `, [email, name]);

        // Send a welcome email
        const html = `
            <!DOCTYPE html>
            <html lang="fa" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>به خبرنامه کلیسا خوش آمدید</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f6f9fc; color: #333333; font-family: Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
                <table dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0; font-family: Tahoma, Geneva, sans-serif;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
                        <!-- Header -->
                        <tr style="background-color: #4f46e5; text-align: center;">
                          <td style="padding: 30px 20px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px; font-family: Tahoma, Geneva, sans-serif;">کلیسای ایرانی دی‌سی | MyChurch</h1>
                          </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 30px; text-align: right; color: #333333; line-height: 1.8; font-size: 16px; font-family: Tahoma, Geneva, sans-serif;">
                            <h2 style="color: #4f46e5; font-size: 20px; margin-top: 0; margin-bottom: 20px; font-family: Tahoma, Geneva, sans-serif;">به خبرنامه و اطلاعیه‌های کلیسا خوش آمدید</h2>
                            <p style="margin: 0 0 10px 0;">سلام ${name || ''} عزیز،</p>
                            <p style="margin: 0 0 15px 0;">عضویت شما با موفقیت ثبت شد. از این پس لینک جلسات زنده، مراسم‌ها، و رویدادهای کلیسا مستقیماً برای شما ارسال خواهد شد.</p>
                            <p style="margin: 0 0 10px 0; margin-bottom: 0;">با آرزوی برکت و شادی،</p>
                            <strong style="color: #4f46e5; font-family: Tahoma, Geneva, sans-serif;">مدیریت کلیسای انجیلی ایرانیان واشنگتن دی‌سی</strong>
                          </td>
                        </tr>
                        <!-- Footer -->
                        <tr style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                          <td style="padding: 20px 30px; font-size: 12px; color: #64748b; line-height: 1.6; font-family: Arial, sans-serif;">
                            <p style="margin: 0 0 10px 0; font-family: Tahoma, Geneva, sans-serif;">این ایمیل به دلیل عضویت شما در خبرنامه کلیسا ارسال شده است.</p>
                            <p style="margin: 0 0 15px 0;">Iranian Presbyterian Church of Washington D.C.<br/>Address: Iranian Presbyterian Church, Washington D.C., USA</p>
                            <p style="margin: 0;">
                              <a href="https://www.iranianchurchdc.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #4f46e5; text-decoration: underline;">لغو عضویت (Unsubscribe)</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
            </body>
            </html>
        `;
        
        await sendEmail({
            to: [email],
            subject: "عضویت موفق در خبرنامه کلیسا",
            html
        });

        revalidatePath("/", "layout");
        return { success: true };
    } catch (e: any) {
        console.error("Error subscribing:", e);
        return { success: false, error: e.message || "Failed to subscribe" };
    }
}
