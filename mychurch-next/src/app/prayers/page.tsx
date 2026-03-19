import React from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import PrayersClient from "./PrayersClient";
import { getPrayers } from "@/actions/prayers";

export const metadata = {
    title: "Prayer Wall | MyChurch",
    description: "Join us in praying for one another.",
};

export default async function PrayerWallPage() {
    // Fetch only public prayers (active + answered)
    const prayers = await getPrayers('public');

    return (
        <div className="min-h-screen bg-slate-950 font-[Vazirmatn] text-slate-200">
            <PublicHeader />
            
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-indigo-900/20" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" dir="rtl">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        دیوار <span className="text-indigo-400">دعا</span>
                    </h1>
                    <p className="text-lg md:text-xl text-indigo-100/80 max-w-2xl mx-auto font-medium leading-relaxed">
                        "پس برای یکدیگر اعتراف کنید و برای یکدیگر دعا کنید تا شفا یابید. دعای شخص عادل، قدرت و اثر بسیار دارد." (یعقوب 5:16)
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 -mt-10">
                <PrayersClient initialPrayers={prayers} />
            </main>
            
            <PublicFooter />
        </div>
    );
}
