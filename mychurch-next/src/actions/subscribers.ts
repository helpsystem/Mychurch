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
            <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px; line-height: 1.6;">
                <h2 style="color: #ec4899;">به خبرنامه و اطلاعیه‌های کلیسا خوش آمدید</h2>
                <p>سلام ${name || ''} عزیز،</p>
                <p>عضویت شما با موفقیت ثبت شد. از این پس لینک جلسات زنده، مراسم‌ها، و رویدادهای کلیسا مستقیماً برای شما ارسال خواهد شد.</p>
                <p>با آرزوی برکت،<br>مدیریت کلیسا</p>
            </div>
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
