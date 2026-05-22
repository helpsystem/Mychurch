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
        let dialIn = config.dial_in_number;
        let accessCode = config.access_code;
        let apiScheduled = false;

        // Try to schedule via FreeConferenceCall API v4 if enabled and keys are present
        if (config.enabled && config.fcc_public_key && config.fcc_private_key) {
            console.log("[FCC API] Authenticating with FreeConferenceCall API...");
            try {
                const auth = Buffer.from(`${config.fcc_public_key.trim()}:${config.fcc_private_key.trim()}`).toString('base64');
                const tokenRes = await fetch("https://www.freeconferencecall.com/api/v4/token", {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${auth}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: "grant_type=client_credentials"
                });

                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    const token = tokenData.access_token;
                    
                    if (token) {
                        console.log("[FCC API] Token obtained. Querying conferences...");
                        const confRes = await fetch("https://www.freeconferencecall.com/api/v4/conferences", {
                            method: "GET",
                            headers: {
                                "Authorization": `Bearer ${token}`
                            }
                        });

                        if (confRes.ok) {
                            const confData = await confRes.json();
                            // Handle list or single structure
                            const conferences = confData.conferences || (Array.isArray(confData) ? confData : null);
                            if (conferences && conferences.length > 0) {
                                const conf = conferences[0];
                                dialIn = conf.dial_number || conf.dial_in_number || dialIn;
                                accessCode = conf.access_code || accessCode;
                                const meetingId = conf.meeting_id || conf.access_code;
                                joinUrl = `https://join.freeconferencecall.com/${meetingId}`;
                                apiScheduled = true;
                                console.log("[FCC API] Live conference details loaded:", { dialIn, accessCode, joinUrl });
                            } else if (confData.dial_number || confData.access_code) {
                                dialIn = confData.dial_number || confData.dial_in_number || dialIn;
                                accessCode = confData.access_code || accessCode;
                                const meetingId = confData.meeting_id || confData.access_code;
                                joinUrl = `https://join.freeconferencecall.com/${meetingId}`;
                                apiScheduled = true;
                                console.log("[FCC API] Live conference details loaded:", { dialIn, accessCode, joinUrl });
                            }
                        } else {
                            console.warn(`[FCC API] Get conferences request failed: ${confRes.status}`);
                        }
                    }
                } else {
                    console.warn(`[FCC API] Authentication token request failed: ${tokenRes.status}`);
                }
            } catch (apiErr) {
                console.error("[FCC API] Error during live API communication:", apiErr);
            }
        }

        // If not scheduled via API, build standard fallback link
        if (!joinUrl && accessCode) {
            joinUrl = `https://join.freeconferencecall.com/${accessCode}`; 
        }

        const res = await query(`
            INSERT INTO church_events (title, start_time, presentation_id, fcc_join_url, fcc_dial_in, fcc_access_code, status, notified)
            VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', false)
            RETURNING *
        `, [
            title, 
            startTimeStr, 
            presentationId, 
            joinUrl || null, 
            dialIn || null, 
            accessCode || null
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
