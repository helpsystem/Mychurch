// src/app/sermons/page.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useLanguage } from "@/providers/LanguageProvider";
import { Play, Calendar, Search, Filter } from "lucide-react";
import { PageVisuals } from "@/components/ui/PageVisuals";

export default function SermonsPage() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");

    // Placeholder data for the public sermons page
    const dummySermons = [
        { id: 1, title: "شادی در میان طوفان‌ها", pastor: "کشیش نام مشخص", date: "2024-11-20", series: "رساله فیلیپیان", image: "/logo-transparent.png", duration: "45:20" },
        { id: 2, title: "قدرت دعای متحد", pastor: "برادر / رهبر", date: "2024-11-13", series: "اصول کلیسای اولیه", image: "/logo-transparent.png", duration: "38:15" },
        { id: 3, title: "هویت ما در مسیح", pastor: "کشیش نام مشخص", date: "2024-11-06", series: "موعظه تکی", image: "/logo-transparent.png", duration: "51:00" },
        { id: 4, title: "غلبە بر ترس با ایمان", pastor: "کشیش نام مشخص", date: "2024-10-30", series: "رساله فیلیپیان", image: "/logo-transparent.png", duration: "42:10" },
        { id: 5, title: "محبت بی قید و شرط خدا", pastor: "برادر / رهبر", date: "2024-10-23", series: "مبنای ایمان", image: "/logo-transparent.png", duration: "49:30" },
    ];

    const filtered = dummySermons.filter(s => s.title.includes(searchQuery) || s.series.includes(searchQuery));

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 font-sans flex flex-col">
            <PublicHeader />

            <PageVisuals soft />

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 lg:px-12 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-white/10 pb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 shadow-sm backdrop-blur-md mb-6">
                            موعظه‌ها
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-foreground drop-shadow-sm mb-4">آرشیو تعلیم کلام خدا</h1>
                        <p className="text-muted-foreground font-medium text-lg max-w-xl">
                            مجموعه مواعظ و پیام‌های روحانی کلیسا با هدف بنای ایمانداران و تفحص عمیق در کلام خدا.
                        </p>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 shrink-0">
                        <div className="relative glass rounded-xl">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 bg-transparent border-none focus:ring-0 px-4 py-3 pl-12 text-sm font-medium"
                                placeholder="جستجوی پیام..."
                            />
                            <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                        <button className="glass px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-secondary/50 transition-colors">
                            <Filter className="w-4 h-4" />
                            فیلتر
                        </button>
                    </div>
                </div>

                {/* Highlight / Latest Sermon */}
                {!searchQuery && dummySermons[0] && (
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-2 h-6 bg-primary rounded-full"></span>
                            تازه‌ترین پیام
                        </h2>
                        <div className="glass rounded-3xl overflow-hidden flex flex-col lg:flex-row group cursor-pointer relative">
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-0" pointer-events-none></div>
                            <div className="lg:w-2/5 relative h-[300px] lg:h-auto bg-black shrink-0 relative z-10">
                                <Image src={dummySermons[0].image} alt={dummySermons[0].title} fill className="object-contain opacity-50 p-10" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center pl-2 shadow-2xl group-hover:scale-110 transition-transform">
                                        <Play className="w-8 h-8" />
                                    </div>
                                </div>
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold font-serif" dir="ltr">
                                    {dummySermons[0].duration}
                                </div>
                            </div>
                            <div className="p-8 lg:p-12 flex flex-col justify-center relative z-10 w-full">
                                <span className="text-primary font-bold text-sm mb-3 uppercase tracking-wider">{dummySermons[0].series}</span>
                                <h3 className="text-3xl md:text-4xl font-black mb-4 group-hover:text-primary transition-colors">{dummySermons[0].title}</h3>
                                <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground mt-auto pt-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">مو</div>
                                        {dummySermons[0].pastor}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span dir="ltr">{dummySermons[0].date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid of Sermons */}
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-2 h-6 bg-secondary rounded-full"></span>
                    آرشیو پیام‌ها
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(sermon => (
                        <div key={sermon.id} className="glass rounded-2xl overflow-hidden flex flex-col group cursor-pointer relative hover:-translate-y-1 transition-all hover:shadow-xl hover:border-primary/30">
                            <div className="h-48 bg-neutral-900 relative">
                                <Image src={sermon.image} alt={sermon.title} fill className="object-contain opacity-30 p-8 group-hover:opacity-50 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"></div>
                                <div className="absolute left-4 bottom-4 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary backdrop-blur-md group-hover:bg-primary group-hover:text-background transition-colors">
                                    <Play className="w-4 h-4 ml-1" />
                                </div>
                                <div className="absolute right-4 top-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold font-serif" dir="ltr">
                                    {sermon.duration}
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <span className="text-primary text-xs font-bold mb-2">{sermon.series}</span>
                                <h3 className="text-lg font-bold mb-3 leading-tight">{sermon.title}</h3>

                                <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground font-medium border-t border-white/5">
                                    <span>{sermon.pastor}</span>
                                    <span dir="ltr">{sermon.date}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center glass rounded-3xl">
                            <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-bold text-foreground">هیچ پیامی یافت نشد</h3>
                            <p className="text-muted-foreground mt-2">لطفا با کلمات کلیدی دیگری جستجو کنید.</p>
                        </div>
                    )}
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
