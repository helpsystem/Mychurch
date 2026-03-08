"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronLeft, Plus, Calendar, MapPin, Clock, Tag, Globe } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

// =============================
// Timezone Utilities
// =============================
function getLiveTime(timeZone: string) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(new Date());
}

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

const GREGORIAN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const GREGORIAN_MONTHS_FARSI = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const DAYS_SHORT = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه", "شنبه"];
const PERSIAN_NUMS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toPersianNum = (n: number) => String(n).split("").map(d => PERSIAN_NUMS[parseInt(d)] ?? d).join("");

// =============================
// Sample Church Events (Migrated to Gregorian)
// =============================
interface ChurchEvent {
    id: string;
    gy: number; gm: number; gd: number;
    title: string;
    titleEn: string;
    timeET: string;
    timeTehran: string;
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

// Generate sample events for current and next month based on today's date
const _today = new Date();
const _y = _today.getFullYear();
const _m = _today.getMonth() + 1; // 1-12

const SAMPLE_EVENTS: ChurchEvent[] = [
    { id: "1", gy: _y, gm: _m, gd: 3, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", timeET: "10:30 AM", timeTehran: "19:00", location: "Live Stream / Church", type: "worship", color: "" },
    { id: "2", gy: _y, gm: _m, gd: 5, title: "دعای بانوان", titleEn: "Women's Prayer", timeET: "8:00 AM", timeTehran: "16:30", location: "Online", type: "prayer", color: "" },
    { id: "3", gy: _y, gm: _m, gd: 8, title: "مطالعه کتاب مقدس", titleEn: "Bible Study", timeET: "7:00 PM", timeTehran: "03:30 (+1)", location: "Zoom", type: "study", color: "" },
    { id: "4", gy: _y, gm: _m, gd: 10, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", timeET: "10:30 AM", timeTehran: "19:00", location: "Live Stream / Church", type: "worship", color: "" },
    { id: "5", gy: _y, gm: _m, gd: 15, title: "شب پرستش جوانان", titleEn: "Youth Worship Night", timeET: "6:00 PM", timeTehran: "02:30 (+1)", location: "Church Setup", type: "youth", color: "" },
    { id: "6", gy: _y, gm: _m, gd: 17, title: "جلسه پرستشی یکشنبه", titleEn: "Sunday Worship", timeET: "10:30 AM", timeTehran: "19:00", location: "Live Stream / Church", type: "worship", color: "" },
    { id: "7", gy: _y, gm: _m, gd: 20, title: "دعا برای کلیسای ایران", titleEn: "Prayer for Iran", timeET: "9:00 PM", timeTehran: "05:30 (+1)", location: "Online", type: "prayer", color: "" },
    { id: "8", gy: _y, gm: _m === 12 ? 1 : _m + 1, gd: 1, title: "جشن ویژه ماهانه", titleEn: "Monthly Celebration", timeET: "10:30 AM", timeTehran: "19:00", location: "Main Hall", type: "special", color: "" },
];

// =============================
// Dual Calendar Component
// =============================
export default function DualCalendarPage() {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth() + 1); // 1-12
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Live Clocks
    const [timeET, setTimeET] = useState("");
    const [timeTehran, setTimeTehran] = useState("");

    useEffect(() => {
        const updateClocks = () => {
            setTimeET(getLiveTime('America/New_York'));
            setTimeTehran(getLiveTime('Asia/Tehran'));
        };
        updateClocks();
        const interval = setInterval(updateClocks, 60000);
        return () => clearInterval(interval);
    }, []);

    // Compute grid bounds
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sunday

    const prevMonth = () => {
        if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
        else setViewMonth(m => m - 1);
        setSelectedDate(null);
    };
    const nextMonth = () => {
        if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
        else setViewMonth(m => m + 1);
        setSelectedDate(null);
    };

    const eventsThisMonth = SAMPLE_EVENTS.filter(e => e.gy === viewYear && e.gm === viewMonth);
    const selectedEvents = selectedDate ? eventsThisMonth.filter(e => e.gd === selectedDate.getDate()) : [];
    const eventsForDay = (d: number) => eventsThisMonth.filter(e => e.gd === d);
    const isToday = (d: number) => d === today.getDate() && viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1;

    return (
        <div className="min-h-screen bg-background flex flex-col" dir="rtl">
            <PublicHeader />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-[120px]" />
            </div>

            <main className="flex-1 relative z-10 pt-32 pb-24 px-4 lg:px-12 max-w-7xl mx-auto w-full">
                {/* Header & Global Timezones */}
                <div className="mb-10 animate-fade-in-up flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm font-bold border border-purple-500/20 mb-4">
                            <Calendar className="w-4 h-4" /> تقویم بین‌المللی کلیسا
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 mb-3">
                            رویدادها و جلسات
                        </h1>
                        <p className="text-muted-foreground">با کلیک روی هر روز تقویم، ساعت دقیق جلسات را به تفکیک آمریکا و ایران مشاهده کنید.</p>
                    </div>

                    {/* Live Timezones Banner */}
                    <div className="flex gap-4 shrink-0">
                        <div className="glass rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-1 flex items-center gap-1.5">
                                <Globe className="w-3 h-3" /> US (ET)
                            </span>
                            <span className="text-2xl font-black text-primary font-mono" dir="ltr">{timeET || "--:--"}</span>
                        </div>
                        <div className="glass rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
                            <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono mb-1 flex items-center gap-1.5">
                                <Globe className="w-3 h-3" /> TEHRAN
                            </span>
                            <span className="text-2xl font-black text-primary font-mono" dir="ltr">{timeTehran || "--:--"}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Dual Calendar Grid */}
                    <div className="lg:col-span-2 glass rounded-3xl p-6 md:p-8 animate-fade-in-up">
                        {/* Month Nav */}
                        <div className="flex items-center justify-between mb-8">
                            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-secondary transition btn-lift" title="ماه بعد">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                            <div className="text-center">
                                <h2 className="text-2xl md:text-3xl font-black flex items-center justify-center gap-2" dir="ltr">
                                    {GREGORIAN_MONTHS[viewMonth - 1]} <span className="text-primary">{viewYear}</span>
                                </h2>
                                <p className="text-sm md:text-base text-muted-foreground font-medium mt-1">
                                    {GREGORIAN_MONTHS_FARSI[viewMonth - 1]} | تقویم میلادی
                                </p>
                            </div>
                            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-secondary transition btn-lift" title="ماه قبل">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className="grid grid-cols-7 mb-4">
                            {DAYS_SHORT.map((d, i) => (
                                <div key={i} className={`text-center text-xs md:text-sm font-bold py-2 ${i === 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid - Starting Sunday */}
                        <div className="grid grid-cols-7 gap-2 md:gap-3">
                            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-secondary/10" />
                            ))}

                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const dayEvents = eventsForDay(day);
                                const today_ = isToday(day);
                                const selected = selectedDate?.getDate() === day && selectedDate?.getMonth() + 1 === viewMonth;

                                // Calculate Dual Date (Jalali equivalent)
                                const [jy, jm, jd] = gregorianToJalali(viewYear, viewMonth, day);

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(selected ? null : new Date(viewYear, viewMonth - 1, day))}
                                        className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all group overflow-hidden border
                                            ${today_ ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20" : "bg-secondary/30 border-border/20"}
                                            ${selected && !today_ ? "ring-2 ring-primary/80 bg-secondary" : ""}
                                            ${!today_ && !selected ? "hover:bg-secondary/80 hover:border-primary/30" : ""}
                                        `}
                                    >
                                        {/* Gregorian Big Overlay */}
                                        <span className={`text-xl md:text-2xl font-black z-10 ${today_ ? "text-white" : "text-foreground"}`} dir="ltr">
                                            {day}
                                        </span>

                                        {/* Jalali Small Subtext */}
                                        <span className={`text-[10px] md:text-xs font-medium z-10 ${today_ ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                            {toPersianNum(jd)} {JALALI_MONTHS[jm - 1]}
                                        </span>

                                        {/* Event Dots */}
                                        {dayEvents.length > 0 && (
                                            <div className="absolute bottom-2 left-0 right-0 flex gap-1 justify-center z-10">
                                                {dayEvents.slice(0, 3).map(e => (
                                                    <span key={e.id} className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${EVENT_COLORS[e.type]} ${today_ ? "ring-1 ring-background/30" : ""}`} />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-border/10">
                            {(Object.keys(EVENT_LABELS) as ChurchEvent["type"][]).map(type => (
                                <div key={type} className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
                                    <span className={`w-2.5 h-2.5 rounded-full ${EVENT_COLORS[type]}`} />
                                    {EVENT_LABELS[type]}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Events Details Sidebar */}
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="glass rounded-3xl p-6 md:p-8 h-full">
                            <h3 className="font-black text-xl mb-6 flex flex-col gap-1 border-b border-border/10 pb-4">
                                {selectedDate ? (
                                    <>
                                        <span className="text-primary tracking-wide" dir="ltr">
                                            {selectedDate.getDate()} {GREGORIAN_MONTHS[selectedDate.getMonth()]}
                                        </span>
                                        <span className="text-sm text-muted-foreground font-normal">
                                            رویدادهای این روز
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span>رویدادهای این ماه</span>
                                        <span className="text-sm text-muted-foreground font-normal" dir="ltr">
                                            {GREGORIAN_MONTHS[viewMonth - 1]} {viewYear}
                                        </span>
                                    </>
                                )}
                            </h3>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                {(selectedDate ? selectedEvents : eventsThisMonth).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                        <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="font-medium">در این تاریخ رویدادی ثبت نشده است.</p>
                                    </div>
                                ) : (
                                    (selectedDate ? selectedEvents : eventsThisMonth).map(event => (
                                        <div key={event.id} className="relative bg-background/50 backdrop-blur-sm rounded-2xl p-5 hover:bg-secondary/60 transition-all card-hover border border-border/20 group overflow-hidden">
                                            {/* Type Color Accent line */}
                                            <div className={`absolute right-0 top-0 bottom-0 w-1 ${EVENT_COLORS[event.type]} opacity-50 group-hover:opacity-100 transition-opacity`} />

                                            <div className="pr-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-black text-base md:text-lg leading-tight text-foreground">{event.title}</p>
                                                    {!selectedDate && (
                                                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0" dir="ltr">
                                                            {GREGORIAN_MONTHS[event.gm - 1].substring(0, 3)} {event.gd}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-serif tracking-wide mb-3" dir="ltr">{event.titleEn}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 bg-secondary/30 p-3 rounded-xl border border-border/10">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">USA (ET)</span>
                                                        <span className="flex items-center gap-1.5 text-sm font-bold text-foreground" dir="ltr">
                                                            <Clock className="w-3.5 h-3.5 text-primary" />{event.timeET}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Tehran</span>
                                                        <span className="flex items-center gap-1.5 text-sm font-bold text-foreground" dir="ltr">
                                                            <Clock className="w-3.5 h-3.5 text-primary" />{event.timeTehran}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 pt-2 mt-1 border-t border-border/10">
                                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <MapPin className="w-3 h-3 text-red-400" />{event.location}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex justify-end">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm ${EVENT_COLORS[event.type]}`}>
                                                        <Tag className="w-3 h-3" />{EVENT_LABELS[event.type]}
                                                    </span>
                                                </div>
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
