"use client";

import "@/lib/react-polyfill";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Calendar, Clock, Sparkles, Flame, User, Users,
    Video, BookOpen, Heart, ArrowLeft, Globe, CheckCircle2,
    Radio, MapPin
} from "lucide-react";
import { ChurchWeeklyProgram } from "@/types/weekly-programs";
import { getActiveWeeklyPrograms } from "@/actions/weekly-programs";

interface WeeklyProgramsSectionProps {
    initialPrograms?: ChurchWeeklyProgram[];
}

export default function WeeklyProgramsSection({ initialPrograms }: WeeklyProgramsSectionProps) {
    const [programs, setPrograms] = useState<ChurchWeeklyProgram[]>(initialPrograms || []);
    const [isLoading, setIsLoading] = useState(!initialPrograms || initialPrograms.length === 0);
    const [lang, setLang] = useState<"fa" | "en">("fa");

    useEffect(() => {
        if (!initialPrograms || initialPrograms.length === 0) {
            getActiveWeeklyPrograms()
                .then((data) => {
                    if (data && data.length > 0) {
                        setPrograms(data);
                    }
                })
                .catch((err) => console.error("Error loading weekly programs:", err))
                .finally(() => setIsLoading(false));
        }
    }, [initialPrograms]);

    const isFa = lang === "fa";

    return (
        <section 
            id="weekly-schedule" 
            className="w-full py-20 px-4 max-w-[1280px] mx-auto relative" 
            dir={isFa ? "rtl" : "ltr"}
        >
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* ── Section Header ───────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-8">
                <div className="text-right flex-1">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300 text-[13px] font-bold mb-3 shadow-lg shadow-amber-500/5">
                        <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>
                            {isFa 
                                ? "برنامه‌ها و جلسات هفتگی کلیسای ایرانیان واشنگتن" 
                                : "Iranian Church D.C. Weekly Gatherings & Classes"}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                        {isFa ? (
                            <>
                                جلسات هفتگی و <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">کلاس‌های تدریس کتاب مقدس</span>
                            </>
                        ) : (
                            <>
                                Weekly Services & <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">Bible Study Classes</span>
                            </>
                        )}
                    </h2>

                    <p className="text-[15px] text-gray-300 mt-2.5 max-w-2xl leading-relaxed">
                        {isFa 
                            ? "تمامی جلسات و کلاس‌های تدریس کلام به وقت رسمی واشنگتن دی‌سی (EST) به صورت آنلاین و حضوری برگزار می‌گردد."
                            : "All fellowship gatherings and Bible study classes are held according to Washington D.C. Time (EST) both online and in-person."}
                    </p>
                </div>

                {/* Controls & Language Switcher */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center p-1 rounded-xl bg-neutral-900/90 border border-white/15 shadow-inner">
                        <button
                            onClick={() => setLang("fa")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isFa 
                                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" 
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            فارسی
                        </button>
                        <button
                            onClick={() => setLang("en")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isFa 
                                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" 
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            English
                        </button>
                    </div>

                    <Link
                        href="/broadcast/view"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-all group"
                    >
                        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        <span>{isFa ? "پخش زنده جلسات" : "Live Stream"}</span>
                    </Link>
                </div>
            </div>

            {/* ── Main Leader & Teacher Banner (روح‌القدس) ────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-purple-950/40 to-indigo-950/40 border border-amber-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                            <Flame className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-[12px] font-extrabold uppercase tracking-wider text-amber-400">
                                {isFa ? "محور و رهبری تمامی کلاس‌های کلام" : "Guiding Light of All Bible Classes"}
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                                {isFa 
                                    ? "با قدرت و رهبر و معلم اصلی: روح‌القدس" 
                                    : "Under the Power, Leadership & Main Teacher: The Holy Spirit"}
                            </h3>
                            <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
                                {isFa 
                                    ? "کلاس‌های درس کتاب مقدس در طول هفته با هدایت روح‌القدس و یاری خادمین کلیسا برگزار می‌گردد."
                                    : "Weekly Bible studies are taught through the power of the Holy Spirit, assisted by church leaders."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs font-mono font-bold text-gray-300 shrink-0">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>{isFa ? "وقت واشنگتن دی‌سی (EST)" : "Washington D.C. Time (EST)"}</span>
                    </div>
                </div>
            </motion.div>

            {/* ── Weekly Programs Cards Grid ───────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((prog, idx) => {
                    const isSunday = prog.day_of_week === "sunday";
                    const isTuesday = prog.day_of_week === "tuesday";
                    const isWednesday = prog.day_of_week === "wednesday";
                    const isThursday = prog.day_of_week === "thursday";

                    const cardGradient = isSunday
                        ? "from-[#1a1f38] to-[#121626] border-indigo-500/30 hover:border-indigo-400/60"
                        : isTuesday
                        ? "from-[#221836] to-[#141224] border-purple-500/30 hover:border-purple-400/60"
                        : isWednesday
                        ? "from-[#142332] to-[#0f1722] border-cyan-500/30 hover:border-cyan-400/60"
                        : isThursday
                        ? "from-[#27152b] to-[#160f1b] border-pink-500/30 hover:border-pink-400/60"
                        : "from-[#1a1c24] to-[#121319] border-white/15 hover:border-amber-400/50";

                    const badgeColor = isSunday
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : isTuesday
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : isWednesday
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                        : isThursday
                        ? "bg-pink-500/20 text-pink-300 border-pink-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30";

                    return (
                        <motion.div
                            key={prog.id}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.08, duration: 0.5 }}
                            className={`rounded-3xl bg-gradient-to-b ${cardGradient} p-6 border shadow-xl flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden`}
                        >
                            {/* Top Badge & Day */}
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <span className={`px-3.5 py-1 rounded-full text-[12px] font-extrabold border ${badgeColor}`}>
                                        {isFa ? prog.day_name_fa : (prog.day_name_en || prog.day_name_fa)}
                                    </span>
                                    <span className="text-[11px] font-semibold text-gray-400 bg-black/40 px-2.5 py-0.5 rounded-lg border border-white/5">
                                        {isFa ? prog.category_fa : (prog.category_en || prog.category_fa)}
                                    </span>
                                </div>

                                {/* Title */}
                                <h4 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors leading-snug mb-2">
                                    {isFa ? prog.title_fa : (prog.title_en || prog.title_fa)}
                                </h4>

                                {/* Time in Washington D.C. */}
                                <div className="flex items-center gap-2 p-3 rounded-2xl bg-black/40 border border-white/10 mb-4 text-amber-300 text-xs font-bold">
                                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span className="font-mono">
                                        {isFa ? prog.time_fa : (prog.time_en || prog.time_fa)}
                                    </span>
                                </div>

                                {/* Main Teacher (Holy Spirit or Pastor) */}
                                <div className="space-y-2 mb-4 text-xs">
                                    <div className="flex items-start gap-2 text-amber-200/90 font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-[10px] uppercase text-amber-400 block font-normal">
                                                {isFa ? "معلم و رهبر اصلی" : "Primary Leader & Teacher"}
                                            </span>
                                            <span>
                                                {isFa ? prog.main_teacher_fa : (prog.main_teacher_en || prog.main_teacher_fa)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Assistant Teacher */}
                                    {prog.assistant_fa && (
                                        <div className="flex items-center gap-2 text-gray-200 font-semibold bg-white/5 p-2.5 rounded-xl border border-white/10">
                                            <User className="w-4 h-4 text-cyan-400 shrink-0" />
                                            <div>
                                                <span className="text-[10px] text-gray-400 block font-normal">
                                                    {isFa ? "تدریس و یاری" : "Facilitated by"}
                                                </span>
                                                <span className="text-white font-bold">
                                                    {isFa ? prog.assistant_fa : (prog.assistant_en || prog.assistant_fa)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Location / Format */}
                                    <div className="flex items-center gap-2 text-gray-300 text-[11px] px-1">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span>{isFa ? prog.location_fa : (prog.location_en || prog.location_fa)}</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed mb-6">
                                    {isFa ? prog.description_fa : (prog.description_en || prog.description_fa)}
                                </p>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <Link
                                    href={prog.action_url || "/broadcast/view"}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black text-white text-xs font-bold transition-all duration-300 shadow-md group/btn"
                                >
                                    <span>
                                        {isFa 
                                            ? (prog.action_text_fa || "ورود به جلسه") 
                                            : (prog.action_text_en || "Join Session")}
                                    </span>
                                    <ArrowLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                                </Link>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
