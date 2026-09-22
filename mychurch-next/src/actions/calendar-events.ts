"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/utils/rbac";

export type CalendarEventType = "worship" | "prayer" | "study" | "special" | "youth";

export interface CalendarEvent {
    id: string;
    gy: number;
    gm: number;
    gd: number;
    title: string;
    titleEn: string;
    timeET: string;
    timeTehran: string;
    location: string;
    type: CalendarEventType;
    color: string;
}

export interface CalendarEventInput {
    event_date: string; // "YYYY-MM-DD"
    title_fa: string;
    title_en?: string;
    time_et?: string;
    time_tehran?: string;
    location?: string;
    type: CalendarEventType;
}

async function ensureSchema(): Promise<void> {
    await query(`
        CREATE TABLE IF NOT EXISTS church_calendar_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_date DATE NOT NULL,
            title_fa VARCHAR(255) NOT NULL,
            title_en VARCHAR(255) NOT NULL DEFAULT '',
            time_et VARCHAR(100) NOT NULL DEFAULT '',
            time_tehran VARCHAR(100) NOT NULL DEFAULT '',
            location VARCHAR(255) NOT NULL DEFAULT '',
            type VARCHAR(20) NOT NULL DEFAULT 'special',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
}

let schemaReady: Promise<void> | null = null;
function ensureSchemaOnce(): Promise<void> {
    if (!schemaReady) {
        schemaReady = ensureSchema().catch((err) => {
            schemaReady = null;
            throw err;
        });
    }
    return schemaReady;
}

function mapRow(r: any): CalendarEvent {
    // r.event_date comes back as a JS Date (UTC midnight) from node-postgres — read the
    // UTC fields directly so the calendar day doesn't shift across timezones.
    const d: Date = r.event_date instanceof Date ? r.event_date : new Date(r.event_date);
    return {
        id: r.id,
        gy: d.getUTCFullYear(),
        gm: d.getUTCMonth() + 1,
        gd: d.getUTCDate(),
        title: r.title_fa,
        titleEn: r.title_en || "",
        timeET: r.time_et || "",
        timeTehran: r.time_tehran || "",
        location: r.location || "",
        type: (r.type as CalendarEventType) || "special",
        color: "",
    };
}

// Public read — powers the /calendar page.
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    try {
        await ensureSchemaOnce();
        const { rows } = await query(`
            SELECT * FROM church_calendar_events
            ORDER BY event_date ASC
        `);
        return rows.map(mapRow);
    } catch (err) {
        console.error("[calendar-events] getCalendarEvents error:", err);
        return [];
    }
}

export async function getAllCalendarEventsAdmin(): Promise<CalendarEvent[]> {
    await requireRole(["Admin", "Leader", "Operator"]);
    return getCalendarEvents();
}

export async function saveCalendarEvent(
    input: CalendarEventInput & { id?: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
    await requireRole(["Admin", "Leader", "Operator"]);

    if (!input.event_date || !input.title_fa?.trim()) {
        return { success: false, error: "تاریخ و عنوان رویداد الزامی است." };
    }

    try {
        await ensureSchemaOnce();

        if (input.id) {
            await query(
                `UPDATE church_calendar_events SET
                    event_date = $1, title_fa = $2, title_en = $3,
                    time_et = $4, time_tehran = $5, location = $6, type = $7,
                    updated_at = NOW()
                 WHERE id = $8`,
                [
                    input.event_date,
                    input.title_fa.trim(),
                    input.title_en || "",
                    input.time_et || "",
                    input.time_tehran || "",
                    input.location || "",
                    input.type,
                    input.id,
                ]
            );

            revalidatePath("/calendar");
            revalidatePath("/admin/calendar");
            return { success: true, id: input.id };
        }

        const { rows } = await query(
            `INSERT INTO church_calendar_events
                (event_date, title_fa, title_en, time_et, time_tehran, location, type)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                input.event_date,
                input.title_fa.trim(),
                input.title_en || "",
                input.time_et || "",
                input.time_tehran || "",
                input.location || "",
                input.type,
            ]
        );

        revalidatePath("/calendar");
        revalidatePath("/admin/calendar");
        return { success: true, id: rows[0]?.id };
    } catch (err: any) {
        console.error("[calendar-events] saveCalendarEvent error:", err);
        return { success: false, error: err.message || "خطا در ذخیره رویداد" };
    }
}

export async function deleteCalendarEvent(id: string): Promise<{ success: boolean; error?: string }> {
    await requireRole(["Admin", "Leader", "Operator"]);

    try {
        await ensureSchemaOnce();
        await query("DELETE FROM church_calendar_events WHERE id = $1", [id]);
        revalidatePath("/calendar");
        revalidatePath("/admin/calendar");
        return { success: true };
    } catch (err: any) {
        console.error("[calendar-events] deleteCalendarEvent error:", err);
        return { success: false, error: err.message || "خطا در حذف رویداد" };
    }
}
