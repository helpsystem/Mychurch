// src/app/schedule/page.tsx
// Public Church Schedule — No auth required
import type { Metadata } from "next";
import { getPublicSchedule, getPublicCategories } from "@/actions/church-programs";
import ScheduleViewer from "./ScheduleViewer";

export const metadata: Metadata = {
    title: "برنامه‌های کلیسا | MyChurch",
    description: "برنامه‌های هفتگی کلیسای ایرانیان واشنگتن دی‌سی — جلسات، عبادت‌ها، و رویدادهای آینده",
    openGraph: {
        title: "برنامه‌های کلیسا | MyChurch",
        description: "جلسات هفتگی، عبادت‌ها و رویدادهای کلیسای ایرانیان",
        type: "website",
    },
};

// Revalidate every 5 minutes so updates appear quickly without a full rebuild
export const revalidate = 300;

export default async function SchedulePage() {
    const [programs, categories] = await Promise.all([
        getPublicSchedule(),
        getPublicCategories(),
    ]);

    return <ScheduleViewer programs={programs} categories={categories} />;
}
