"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface Announcement {
    id?: number;
    title: string;
    content: string;
    priority: "normal" | "high";
    status: "published" | "draft";
}

export async function createAnnouncement(announcement: Announcement): Promise<{ success: boolean; error?: string }> {
    try {
        await query(
            'INSERT INTO announcements (title, content, priority, status, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [announcement.title, announcement.content, announcement.priority, announcement.status]
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
        // Log the email broadcast intent to database
        await query(
            'INSERT INTO email_logs (subject, body, sent_at) VALUES ($1, $2, NOW())',
            [subject, body]
        );
        // In a real environment, trigger Resend / SendGrid / Supabase Edge function here.
        return { success: true };
    } catch (error) {
        console.error('[Action] Error logging mass email:', error);
        return { success: false, error: 'Failed to dispatch email broadcast.' };
    }
}
