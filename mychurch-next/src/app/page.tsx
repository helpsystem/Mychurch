import "@/lib/react-polyfill";
import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";
import MinistriesSection from "@/components/home/MinistriesSection";
import WeeklyProgramsSection from "@/components/home/WeeklyProgramsSection";
import SermonsSection from "@/components/home/SermonsSection";
import GospelStorySection from "@/components/home/GospelStorySection";
import PrayerSection from "@/components/home/PrayerSection";
import LeadershipSection from "@/components/home/LeadershipSection";
import { getActiveWeeklyPrograms } from "@/actions/weekly-programs";

// The Sunday service time shown in the hero/stats/sermons sections below is fetched
// here, server-side, from the same admin-editable schedule (church_weekly_programs /
// /admin/schedule) that drives WeeklyProgramsSection — so changing it in ONE place
// (the schedule admin panel) updates it everywhere on the home page, instead of each
// section carrying its own independent, easily-stale hardcoded time string.
async function getSundayServiceTime(): Promise<{ fa: string; en: string } | null> {
  try {
    const programs = await getActiveWeeklyPrograms();
    const sunday = programs.find((p) => p.day_of_week === "sunday");
    if (!sunday?.time_fa || !sunday?.time_en) return null;
    return { fa: sunday.time_fa, en: sunday.time_en };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const sundayTime = await getSundayServiceTime();

  return (
    <div className="min-h-screen bg-[#0a0e18] flex flex-col text-white overflow-x-hidden">
      <PublicHeader />

      <main id="main-content" className="flex-1">
        <HeroSection sundayTime={sundayTime} />
        <FeaturesSection />
        <WeeklyProgramsSection />
        <StatsSection sundayTime={sundayTime} />
        <MinistriesSection />
        <SermonsSection sundayTime={sundayTime} />
        <GospelStorySection />
        <PrayerSection />
        <LeadershipSection />
      </main>

      <PublicFooter />
    </div>
  );
}
