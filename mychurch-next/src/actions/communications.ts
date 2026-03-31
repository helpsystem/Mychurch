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
