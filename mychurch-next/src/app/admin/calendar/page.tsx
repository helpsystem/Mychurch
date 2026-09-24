import React from "react";
import { requireRole } from "@/utils/rbac";
import { getAllCalendarEventsAdmin } from "@/actions/calendar-events";
import CalendarAdminClient from "./CalendarAdminClient";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "تقویم و رویدادها | MyChurch Admin",
};

export default async function AdminCalendarPage() {
    await requireRole(["Admin", "Leader", "Operator"]);
    const events = await getAllCalendarEventsAdmin();

    return (
        <div className="min-h-[100dvh] bg-background">
            <CalendarAdminClient initialEvents={events} />
        </div>
    );
}
