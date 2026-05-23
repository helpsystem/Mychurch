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

        // Try to schedule via FreeConferenceCall API v4 if enabled
        if (config.enabled) {
            console.log("[FCC API] Fetching valid FreeConferenceCall Access Token...");
            try {
                const { getValidFccAccessToken } = await import("./conference-config");
                const token = await getValidFccAccessToken();
                
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
                } else {
                    console.warn(`[FCC API] No valid access token found or token could not be refreshed.`);
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
                <!DOCTYPE html>
                <html lang="fa" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>دعوتنامه: ${title}</title>
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
                                <h2 style="color: #4f46e5; font-size: 20px; margin-top: 0; margin-bottom: 20px; font-family: Tahoma, Geneva, sans-serif;">دعوت به مراسم جدید: ${title}</h2>
                                <p style="margin: 0 0 10px 0;">با سلام و برکت،</p>
                                <p style="margin: 0 0 15px 0;">مراسم جدیدی در تاریخ <strong>${dateStr}</strong> برنامه‌ریزی شده است.</p>
                                
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin: 25px 0; padding: 20px;">
                                  <tr>
                                    <td style="text-align: right; font-family: Tahoma, Geneva, sans-serif;">
                                      <h3 style="margin-top: 0; color: #1e293b; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-family: Tahoma, Geneva, sans-serif;">اطلاعات اتصال آنلاین</h3>
                                      <p style="margin: 10px 0; font-size: 14px;">
                                        <strong>لینک ورود آنلاین:</strong> 
                                        <a href="${joinUrl}" style="color: #4f46e5; text-decoration: underline; word-break: break-all;">${joinUrl}</a>
                                      </p>
                                      <p style="margin: 10px 0; font-size: 14px;">
                                        <strong>شماره تماس صوتی (Phone dial-in):</strong> 
                                        <span dir="ltr" style="font-family: monospace; color: #0f172a; font-weight: bold;">${config.dial_in_number || '-'}</span>
                                      </p>
                                      <p style="margin: 10px 0; font-size: 14px;">
                                        <strong>کد دسترسی (Access Code):</strong> 
                                        <span dir="ltr" style="font-family: monospace; color: #0f172a; font-weight: bold;">${config.access_code || '-'}</span>
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                                
                                <p style="margin: 0 0 10px 0;">منتظر حضور گرم شما به صورت آنلاین و حضوری هستیم.</p>
                                <p style="margin: 0 0 15px 0; margin-bottom: 0;">با آرزوی فیض و برکت الهی،</p>
                                <strong style="color: #4f46e5; font-family: Tahoma, Geneva, sans-serif;">کلیسای ایرانی دی‌سی</strong>
                              </td>
                            </tr>
                            <!-- Footer -->
                            <tr style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                              <td style="padding: 20px 30px; font-size: 12px; color: #64748b; line-height: 1.6; font-family: Arial, sans-serif;">
                                <p style="margin: 0 0 10px 0; font-family: Tahoma, Geneva, sans-serif;">این ایمیل به دلیل عضویت شما در خبرنامه کلیسا ارسال شده است.</p>
                                <p style="margin: 0 0 15px 0;">Iranian Christian Church of Washington D.C.<br/>Address: Iranian Christian Church, Washington D.C., USA</p>
                                <p style="margin: 0;">
                                  <a href="https://www.iranianchurchdc.com/unsubscribe" style="color: #4f46e5; text-decoration: underline;">لغو عضویت (Unsubscribe)</a>
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
