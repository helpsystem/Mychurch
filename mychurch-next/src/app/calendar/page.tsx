import React from "react";
import CalendarPageClient, { type ChurchEvent } from "./CalendarPageClient";
import { getActiveWeeklyPrograms } from "@/actions/weekly-programs";
import { getCalendarEvents } from "@/actions/calendar-events";
import type { ChurchWeeklyProgram } from "@/types/weekly-programs";

export const dynamic = "force-dynamic";

const WEEKDAY_INDEX: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

function inferEventType(program: ChurchWeeklyProgram): ChurchEvent["type"] {
    const text = `${program.category_fa} ${program.category_en} ${program.title_fa} ${program.title_en}`.toLowerCase();
    if (text.includes("youth") || text.includes("جوانان")) return "youth";
    if (text.includes("prayer") || text.includes("دعا")) return "prayer";
    if (text.includes("study") || text.includes("مطالعه") || text.includes("کتاب مقدس") || text.includes("bible")) return "study";
    if (text.includes("worship") || text.includes("service") || text.includes("عبادت") || text.includes("پرستش")) return "worship";
    return "special";
}

// Expands recurring weekly programs (e.g. "every Sunday") into concrete calendar
// occurrences across a window of months, so the calendar grid shows real recurring
// services alongside one-off dated events.
function expandWeeklyPrograms(programs: ChurchWeeklyProgram[], monthsBack: number, monthsForward: number): ChurchEvent[] {
    const events: ChurchEvent[] = [];
    const today = new Date();
    const rangeStart = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
    const rangeEnd = new Date(today.getFullYear(), today.getMonth() + monthsForward + 1, 0);

    for (const program of programs) {
        const weekday = WEEKDAY_INDEX[program.day_of_week?.toLowerCase()];
        if (weekday === undefined) continue; // skip "flexible" / non-weekly entries

        const type = inferEventType(program);
        const cursor = new Date(rangeStart);
        // Move cursor to the first matching weekday on/after rangeStart
        cursor.setDate(cursor.getDate() + ((weekday - cursor.getDay() + 7) % 7));

        while (cursor <= rangeEnd) {
            events.push({
                id: `wp-${program.id}-${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`,
                gy: cursor.getFullYear(),
                gm: cursor.getMonth() + 1,
                gd: cursor.getDate(),
                title: program.title_fa,
                titleEn: program.title_en || "",
                timeET: program.time_en || program.time_fa,
                timeTehran: "",
                location: program.location_fa,
                type,
                color: "",
            });
            cursor.setDate(cursor.getDate() + 7);
        }
    }

    return events;
}

export default async function CalendarPage() {
    const [programs, oneOffEvents] = await Promise.all([
        getActiveWeeklyPrograms(),
        getCalendarEvents(),
    ]);

    const recurringEvents = expandWeeklyPrograms(programs, 2, 6);
    const allEvents = [...recurringEvents, ...oneOffEvents];

    return <CalendarPageClient initialEvents={allEvents} />;
}
