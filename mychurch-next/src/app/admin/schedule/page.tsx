import React from "react";
import { getAllWeeklyProgramsAdmin } from "@/actions/weekly-programs";
import WeeklyScheduleAdminClient from "./WeeklyScheduleAdminClient";

export const metadata = {
    title: "مدیریت برنامه‌های هفتگی و جلسات | پنل مدیریت کلیسا",
    description: "حذف، اضافه، ویرایش و فعال/غیرفعال‌سازی برنامه‌های هفتگی کلیسا",
};

export const dynamic = "force-dynamic";

export default async function WeeklyScheduleAdminPage() {
    const programs = await getAllWeeklyProgramsAdmin();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <WeeklyScheduleAdminClient initialPrograms={programs} />
        </div>
    );
}
