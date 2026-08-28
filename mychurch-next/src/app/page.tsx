"use client";

import "@/lib/react-polyfill";
import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";
import MinistriesSection from "@/components/home/MinistriesSection";
import SermonsSection from "@/components/home/SermonsSection";
import PrayerSection from "@/components/home/PrayerSection";
import LeadershipSection from "@/components/home/LeadershipSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050A0F] flex flex-col text-white overflow-x-hidden">
      <PublicHeader />

      <main id="main-content" className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <MinistriesSection />
        <SermonsSection />
        <PrayerSection />
        <LeadershipSection />
      </main>

      <PublicFooter />
    </div>
  );
}
