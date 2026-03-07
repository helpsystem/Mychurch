"use client";

import React, { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft, Plus, Calendar, MapPin, Clock, Tag } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

// =============================
// Jalali (Persian) Date Engine
// =============================
function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = gy <= 1600 ? 0 : 979;
    gy = gy <= 1600 ? gy - 621 : gy - 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return [jy, jm, jd];
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    jy += 1595;
    let days = -355779 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    const gd = days + 1;
    const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    let r = gd;
    for (let i = 1; i <= 12; i++) { if (r <= sal_a[i]) { gm = i; break; } r -= sal_a[i]; }
    return [gy, gm, r];
}

const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const JALALI_DAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const PERSIAN_NUMS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toPersianNum = (n: number) => String(n).split("").map(d => PERSIAN_NUMS[parseInt(d)] ?? d).join("");

// =============================
// Sample Church Events
// =============================
interface ChurchEvent {
    id: string;
    jy: number; jm: number; jd: number;
    title: string;
    titleEn: string;
    time: string;
    location: string;
    type: "worship" | "prayer" | "study" | "special" | "youth";
    color: string;
}

const EVENT_COLORS: Record<ChurchEvent["type"], string> = {
    worship: "bg-purple-500",
    prayer: "bg-blue-500",
    study: "bg-emerald-500",
    special: "bg-amber-500",
    youth: "bg-pink-500",
};
const EVENT_LABELS: Record<ChurchEvent["type"], string> = {
    worship: "پرستش",
    prayer: "دعا",
    study: "مطالعه",
    special: "ویژه",
    youth: "جوانان",
};

const SAMPLE_EVENTS: ChurchEvent[] = [
    { id: "1", jy: 1404, jm: 12, jd: 15, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", time: "11:00 AM", location: "سالن اصلی", type: "worship", color: "" },
    { id: "2", jy: 1404, jm: 12, jd: 17, title: "دعای بامدادی", titleEn: "Morning Prayer", time: "7:00 AM", location: "اتاق دعا", type: "prayer", color: "" },
    { id: "3", jy: 1404, jm: 12, jd: 19, title: "مطالعه کتاب مقدس", titleEn: "Bible Study", time: "7:30 PM", location: "سالن فرعی", type: "study", color: "" },
    { id: "4", jy: 1404, jm: 12, jd: 22, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", time: "11:00 AM", location: "سالن اصلی", type: "worship", color: "" },
    { id: "5", jy: 1404, jm: 12, jd: 24, title: "جلسه جوانان", titleEn: "Youth Meeting", time: "6:00 PM", location: "سالن جوانان", type: "youth", color: "" },
    { id: "6", jy: 1404, jm: 12, jd: 29, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", time: "11:00 AM", location: "سالن اصلی", type: "worship", color: "" },
    { id: "7", jy: 1405, jm: 1, jd: 1, title: "🌸 نوروز مبارک — جشن سال نو", titleEn: "Nowruz Celebration", time: "6:00 PM", location: "سالن اصلی", type: "special", color: "" },
    { id: "8", jy: 1405, jm: 1, jd: 5, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", time: "11:00 AM", location: "سالن اصلی", type: "worship", color: "" },
    { id: "9", jy: 1405, jm: 1, jd: 10, title: "دعا برای ایران", titleEn: "Prayer for Iran", time: "8:00 PM", location: "آنلاین", type: "prayer", color: "" },
    { id: "10", jy: 1405, jm: 1, jd: 12, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", time: "11:00 AM", location: "سالن اصلی", type: "worship", color: "" },
];

// =============================
// Calendar Component
// =============================
export default function PersianCalendarPage() {
    const today = new Date();
    const [todayJ] = useMemo(() => [gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate())], []);

    const [viewJY, setViewJY] = useState(todayJ[0]);
    const [viewJM, setViewJM] = useState(todayJ[1]);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Compute first day of month and days in month
    const firstDayGreg = jalaliToGregorian(viewJY, viewJM, 1);
    const firstDayOfWeek = new Date(firstDayGreg[0], firstDayGreg[1] - 1, firstDayGreg[2]).getDay(); // 0=Sun
    // Friday=0 in Iranian week (Sat=0 in Persian calendar)
    // Adjust: Persian week starts Saturday (index 6 in JS)
    const startOffset = (firstDayOfWeek + 1) % 7;
    const daysInMonth = viewJM <= 6 ? 31 : viewJM <= 11 ? 30 : 29;

    const prevMonth = () => {
        if (viewJM === 1) { setViewJY(y => y - 1); setViewJM(12); }
        else setViewJM(m => m - 1);
        setSelectedDay(null);
    };
    const nextMonth = () => {
        if (viewJM === 12) { setViewJY(y => y + 1); setViewJM(1); }
        else setViewJM(m => m + 1);
        setSelectedDay(null);
    };

    const eventsThisMonth = SAMPLE_EVENTS.filter(e => e.jy === viewJY && e.jm === viewJM);
    const selectedEvents = selectedDay ? eventsThisMonth.filter(e => e.jd === selectedDay) : [];
    const eventsForDay = (d: number) => eventsThisMonth.filter(e => e.jd === d);
    const isToday = (d: number) => d === todayJ[2] && viewJY === todayJ[0] && viewJM === todayJ[1];

    return (
        <div className="min-h-screen bg-background flex flex-col" dir="rtl">
            <PublicHeader />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-[120px]" />
            </div>

            <main className="flex-1 relative z-10 pt-32 pb-24 px-4 lg:px-12 max-w-6xl mx-auto w-full">
                {/* Header */}
                <div className="mb-10 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm font-bold border border-purple-500/20 mb-4">
                        <Calendar className="w-4 h-4" /> تقویم کلیسا
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 mb-3">
                        تقویم رویدادها
                    </h1>
                    <p className="text-muted-foreground">جلسات پرستشی، مطالعات کتاب مقدس و رویدادهای ویژه کلیسا</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar Grid */}
                    <div className="lg:col-span-2 glass rounded-3xl p-6 animate-fade-in-up">
                        {/* Month Nav */}
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-secondary transition btn-lift" title="ماه بعد">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <div className="text-center">
                                <h2 className="text-2xl font-black">{JALALI_MONTHS[viewJM - 1]}</h2>
                                <p className="text-sm text-muted-foreground">{toPersianNum(viewJY)} | {firstDayGreg[0]}</p>
                            </div>
                            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-secondary transition btn-lift" title="ماه قبل">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {JALALI_DAYS_SHORT.map((d, i) => (
                                <div key={i} className={`text-center text-xs font-bold py-2 ${i === 6 ? "text-red-400" : "text-muted-foreground"}`}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: startOffset }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const dayEvents = eventsForDay(day);
                                const today_ = isToday(day);
                                const selected = selectedDay === day;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDay(selected ? null : day)}
                                        className={`relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm font-bold transition-all
                                            ${today_ ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : ""}
                                            ${selected && !today_ ? "bg-secondary ring-2 ring-primary/50" : ""}
                                            ${!today_ && !selected ? "hover:bg-secondary/60" : ""}
                                        `}
                                    >
                                        <span className={today_ ? "text-base font-black" : ""}>{toPersianNum(day)}</span>
                                        {dayEvents.length > 0 && (
                                            <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                                                {dayEvents.slice(0, 3).map(e => (
                                                    <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[e.type]} ${today_ ? "opacity-70" : ""}`} />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-border/20">
                            {(Object.keys(EVENT_LABELS) as ChurchEvent["type"][]).map(type => (
                                <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className={`w-2.5 h-2.5 rounded-full ${EVENT_COLORS[type]}`} />
                                    {EVENT_LABELS[type]}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Events Sidebar */}
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="glass rounded-3xl p-5">
                            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                {selectedDay ? `رویدادهای ${toPersianNum(selectedDay)} ${JALALI_MONTHS[viewJM - 1]}` : "رویدادهای این ماه"}
                            </h3>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {(selectedDay ? selectedEvents : eventsThisMonth).length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-6">رویدادی یافت نشد</p>
                                ) : (
                                    (selectedDay ? selectedEvents : eventsThisMonth).map(event => (
                                        <div key={event.id} className="bg-secondary/40 rounded-2xl p-4 hover:bg-secondary/60 transition card-hover border border-border/20">
                                            <div className="flex items-start gap-3">
                                                <span className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${EVENT_COLORS[event.type]}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm leading-tight">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 font-serif" dir="ltr">{event.titleEn}</p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Clock className="w-3 h-3" />{event.time}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin className="w-3 h-3" />{event.location}
                                                        </span>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${EVENT_COLORS[event.type]}`}>
                                                        <Tag className="w-2.5 h-2.5" />{EVENT_LABELS[event.type]}
                                                    </span>
                                                </div>
                                                {!selectedDay && (
                                                    <span className="text-xs font-bold text-muted-foreground bg-secondary/80 px-2 py-1 rounded-lg shrink-0">
                                                        {toPersianNum(event.jd)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
