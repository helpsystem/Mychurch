"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { getConferenceConfig } from "./conference-config";

export interface ChurchEvent {
    id: string;
    title: string;
    start_time: string;
    duration_minutes: number;
    presentation_id: string | null;
    fcc_join_url: string | null;
    fcc_dial_in: string | null;
    fcc_access_code: string | null;
    status: 'scheduled' | 'live' | 'ended';
    notified: boolean;
}

export async function getUpcomingEvents(): Promise<ChurchEvent[]> {
    try {
        const res = await query(`
            SELECT * FROM church_events 
            WHERE status != 'ended' AND start_time >= NOW() - INTERVAL '4 hours'
            ORDER BY start_time ASC
        `);
        return res.rows as ChurchEvent[];
    } catch (e) {
        console.error("Error fetching upcoming events:", e);
        return [];
    }
}

export async function scheduleEvent(
    title: string, 
    startTimeStr: string, 
    presentationId: string | null
) {
    try {
        const config = await getConferenceConfig();
        
        let joinUrl = "";
        if (config.enabled && config.dial_in_number && config.access_code) {
            // Standard FCC web viewer format: https://join.freeconferencecall.com/[OnlineMeetingID]
            // We'll use the access code or a default ID. Usually FCC provides an online meeting ID. 
            // We'll just construct a generic join link if we don't have the explicit ID, or use the access_code as a fallback.
            // Many users use their dial-in as their meeting ID or a custom string. We will just use join.freeconferencecall.com
            joinUrl = `https://join.freeconferencecall.com/${config.access_code}`; 
        }

        const res = await query(`
            INSERT INTO church_events (title, start_time, presentation_id, fcc_join_url, fcc_dial_in, fcc_access_code, status, notified)
            VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', false)
            RETURNING *
        `, [
            title, 
            startTimeStr, 
            presentationId, 
            joinUrl, 
            config.dial_in_number, 
            config.access_code
        ]);

        const newEvent = res.rows[0];

        // Fetch subscribers
        const subRes = await query("SELECT email FROM church_subscribers WHERE active = true");
        const subscribers = subRes.rows.map(r => r.email);

        if (subscribers.length > 0) {
            const dateStr = new Date(startTimeStr).toLocaleString('fa-IR');
            const html = `
                <div dir="rtl" style="font-family: Tahoma, sans-serif; padding: 20px; line-height: 1.6;">
                    <h2 style="color: #4f46e5;">دعوت به مراسم جدید: ${title}</h2>
                    <p>با سلام و برکت،</p>
                    <p>مراسم جدیدی در تاریخ <strong>${dateStr}</strong> برنامه‌ریزی شده است.</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">اطلاعات اتصال آنلاین</h3>
                        <p><strong>لینک ورود:</strong> <a href="${joinUrl}">${joinUrl}</a></p>
                        <p><strong>شماره تماس:</strong> <span dir="ltr">${config.dial_in_number || '-'}</span></p>
                        <p><strong>کد دسترسی:</strong> <span dir="ltr">${config.access_code || '-'}</span></p>
                    </div>
                    
                    <p>منتظر حضور شما هستیم.</p>
                </div>
            `;
            
            await sendEmail({
                to: subscribers,
                subject: `دعوتنامه: ${title}`,
                html
            });

            await query("UPDATE church_events SET notified = true WHERE id = $1", [newEvent.id]);
        }

        revalidatePath("/", "layout");
        return { success: true, event: newEvent };
    } catch (e: any) {
        console.error("Error scheduling event:", e);
        return { success: false, error: e.message };
    }
}

export async function deleteEvent(id: string) {
    try {
        await query("DELETE FROM church_events WHERE id = $1", [id]);
        revalidatePath("/", "layout");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
