"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/utils/rbac";

export interface Announcement {
    id?: number;
    title: string;
    content: string;
    priority: "normal" | "high";
    status: "published" | "draft";
}

export async function createAnnouncement(announcement: Announcement): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);

        if (!announcement.title?.trim() || !announcement.content?.trim()) {
            return { success: false, error: "Title and content are required." };
        }

        await query(
            'INSERT INTO announcements (title, content, priority, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [announcement.title.trim(), announcement.content.trim(), announcement.priority, announcement.status]
        );
        // Revalidate public layouts where announcements might be shown
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('[Action] Error creating announcement:', error);
        return { success: false, error: 'Failed to publish announcement. Database may be offline.' };
    }
}

export async function sendMassEmail(subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);

        const cleanedSubject = (subject || "").trim();
        const cleanedBody = (body || "").trim();
        if (!cleanedSubject || !cleanedBody) {
            return { success: false, error: "Subject and body are required." };
        }

        // Log the email broadcast intent to database
        await query(
            'INSERT INTO email_logs (subject, body, sent_at) VALUES ($1, $2, NOW())',
            [cleanedSubject.slice(0, 240), cleanedBody]
        );
        // In a real environment, trigger Resend / SendGrid / Supabase Edge function here.
        return { success: true };
    } catch (error) {
        console.error('[Action] Error logging mass email:', error);
        return { success: false, error: 'Failed to dispatch email broadcast.' };
    }
}

export async function sendTestMassEmail(subject: string, body: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireRole(["Admin"]);
        const { getUserEmail } = await import("@/utils/rbac");
        const email = await getUserEmail();

        if (!email) {
            return { success: false, error: "ایمیل مدیر یافت نشد." };
        }

        const cleanedSubject = (subject || "").trim();
        const cleanedBody = (body || "").trim();
        if (!cleanedSubject || !cleanedBody) {
            return { success: false, error: "Subject and body are required." };
        }

        // Just fake a short delay for sending
        await new Promise(res => setTimeout(res, 800));
        
        // In a real environment, trigger Resend directly to `email`
        console.log(`[Test Email] Sending to ${email}: ${cleanedSubject}`);

        return { success: true };
    } catch (error) {
        console.error('[Action] Error sending test email:', error);
        return { success: false, error: 'Failed to send test email.' };
    }
}

export async function getAnnouncements(): Promise<Announcement[]> {
    try {
        await requireRole(["Admin"]);
        const { rows } = await query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50');
        return rows as Announcement[];
    } catch (error) {
        console.error('[Action] Error fetching announcements:', error);
        return [];
    }
}

export async function getEmailLogs(): Promise<Array<{ id: number, subject: string, body: string, sent_at: string }>> {
    try {
        await requireRole(["Admin"]);
        const { rows } = await query('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 50');
        return rows;
    } catch (error) {
        console.error('[Action] Error fetching email logs:', error);
        return [];
    }
}
