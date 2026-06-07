"use client";

import React, { useState, useMemo } from "react";
import {
    Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight,
    Search, Filter, Monitor, ExternalLink, Church
} from "lucide-react";
import type { ChurchProgram, ChurchProgramCategory } from "@/types/church-programs";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(t?: string): string {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function formatDateLabel(dateStr: string): { fa: string; en: string; dayFa: string; dayEn: string; dayNumFa: string; monthFa: string } {
    const date = new Date(dateStr + "T00:00:00");
    const fa = date.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
    const en = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    const dayFa = date.toLocaleDateString("fa-IR", { weekday: "long" });
    const dayEn = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayNumFa = date.toLocaleDateString("fa-IR", { day: "numeric" });
    const monthFa = date.toLocaleDateString("fa-IR", { month: "long" });
    return { fa, en, dayFa, dayEn, dayNumFa, monthFa };
}

function isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split("T")[0];
}

function isTomorrow(dateStr: string): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split("T")[0];
}

function getDayBadge(dateStr: string): { label: string; className: string } | null {
    if (isToday(dateStr)) return { label: "امروز", className: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" };
    if (isTomorrow(dateStr)) return { label: "فردا", className: "bg-emerald-600/80 text-white" };
    return null;
}

// ─── Category Filter Chip ────────────────────────────────────────────────────

interface CategoryChipProps {
    label: string;
    icon?: string;
    color?: string;
    count: number;
    active: boolean;
    onClick: () => void;
}

function CategoryChip({ label, icon, color, count, active, onClick }: CategoryChipProps) {
    return (
        <button
            onClick={onClick}
            style={active && color ? { borderColor: color, backgroundColor: color + "22" } : {}}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold font-[Vazirmatn] transition-all duration-200 whitespace-nowrap",
                active
                    ? "text-white shadow-sm"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/25 hover:bg-white/8"
            )}
        >
            {icon && <span className="text-base leading-none">{icon}</span>}
            <span>{label}</span>
            <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md font-sans font-semibold",
                active ? "bg-white/20" : "bg-white/10 text-white/40"
            )}>{count}</span>
        </button>
    );
}

// ─── Program Card ────────────────────────────────────────────────────────────

interface ProgramCardProps {
    program: ChurchProgram;
    category?: ChurchProgramCategory;
    index: number;
}

function ProgramCard({ program, category, index }: ProgramCardProps) {
    const accentColor = category?.color ?? "#6366f1";

    return (
        <div
            className="group relative glass-strong rounded-2xl border border-white/8 hover:border-white/20 transition-all duration-300 overflow-hidden card-hover"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Color accent bar */}
            <div
                className="absolute top-0 right-0 h-full w-1 rounded-r-2xl"
                style={{ backgroundColor: accentColor }}
            />

            {/* Subtle glow on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
                style={{ background: `radial-gradient(circle at 20% 50%, ${accentColor}12 0%, transparent 70%)` }}
            />

            <div className="relative p-5">
                {/* Category badge */}
                {category && (
                    <div className="mb-3">
                        <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg font-[Vazirmatn]"
                            style={{ color: accentColor, backgroundColor: accentColor + "20" }}
                        >
                            <span className="text-sm">{category.icon}</span>
                            {category.name_fa}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h3 className="font-black text-lg text-white font-[Vazirmatn] leading-tight mb-1">
                    {program.title_fa}
                </h3>
                {program.title_en && (
                    <p className="text-xs text-white/35 font-sans mt-0.5 mb-3" dir="ltr">
                        {program.title_en}
                    </p>
                )}

                {/* Meta details */}
                <div className="space-y-2 text-sm text-white/55 font-[Vazirmatn]">
                    {/* Time */}
                    <div className="flex items-center gap-2.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-white/40" />
                        <span className="font-semibold" dir="ltr">
                            {formatTime(program.start_time)}
                            {program.end_time ? ` — ${formatTime(program.end_time)}` : ""}
                        </span>
                    </div>

                    {/* Organizer */}
                    {program.organizer_fa && (
                        <div className="flex items-center gap-2.5">
                            <User className="w-3.5 h-3.5 shrink-0 text-white/40" />
                            <span>{program.organizer_fa}</span>
                        </div>
                    )}

                    {/* Location */}
                    {program.location_fa && (
                        <div className="flex items-center gap-2.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-white/40" />
                            <span>{program.location_fa}</span>
                        </div>
                    )}
                </div>

                {/* Description */}
                {program.description_fa && (
                    <p className="text-xs text-white/40 mt-3.5 leading-relaxed line-clamp-2 font-[Vazirmatn]">
                        {program.description_fa}
                    </p>
                )}

                {/* Linked presentation badge */}
                {program.presentation_id && (
                    <div className="mt-4 pt-3 border-t border-white/6">
                        <span className="inline-flex items-center gap-1.5 text-[11px] bg-indigo-500/15 text-indigo-400 px-2.5 py-1.5 rounded-lg font-bold font-[Vazirmatn]">
                            <Monitor className="w-3 h-3" />
                            ارائه آنلاین موجود
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Date Section Header ──────────────────────────────────────────────────────

interface DateHeaderProps {
    dateStr: string;
    count: number;
}

function DateHeader({ dateStr, count }: DateHeaderProps) {
    const { fa, en, dayFa, dayNumFa, monthFa } = formatDateLabel(dateStr);
    const badge = getDayBadge(dateStr);

    return (
        <div className="flex items-center gap-4 mb-5">
            {/* Visual date block */}
            <div className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0 border",
                isToday(dateStr)
                    ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/25"
                    : "bg-white/6 border-white/10"
            )}>
                <span className="text-xs font-bold text-white/60 font-[Vazirmatn] leading-none">{monthFa}</span>
                <span className={cn(
                    "text-2xl font-black leading-tight font-sans",
                    isToday(dateStr) ? "text-white" : "text-white"
                )}>
                    {/* Show English day number for clarity */}
                    {new Date(dateStr + "T00:00:00").getDate()}
                </span>
            </div>

            {/* Date text */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-black text-base text-white font-[Vazirmatn]">{dayFa}</h2>
                    {badge && (
                        <span className={cn("text-[11px] font-black px-2.5 py-0.5 rounded-full font-[Vazirmatn]", badge.className)}>
                            {badge.label}
                        </span>
                    )}
                    <span className="text-xs text-white/30 font-sans">{en}</span>
                </div>
                <p className="text-xs text-white/40 font-[Vazirmatn] mt-0.5">{fa}</p>
            </div>

            {/* Divider line + count */}
            <div className="hidden sm:flex items-center gap-3">
                <div className="flex-1 h-px bg-white/6 min-w-[40px]" />
                <span className="text-xs text-white/30 font-sans shrink-0">
                    {count} برنامه
                </span>
            </div>
        </div>
    );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-5xl animate-float">
                    📅
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-lg">
                    {hasFilter ? "🔍" : "✨"}
                </div>
            </div>
            <h3 className="text-xl font-black text-white font-[Vazirmatn] mb-2">
                {hasFilter ? "برنامه‌ای یافت نشد" : "برنامه‌ای تنظیم نشده"}
            </h3>
            <p className="text-sm text-white/40 font-[Vazirmatn] max-w-xs leading-relaxed">
                {hasFilter
                    ? "فیلتر را تغییر دهید یا همه برنامه‌ها را مشاهده کنید"
                    : "برنامه‌های آینده کلیسا به زودی اینجا نمایش داده می‌شوند"}
            </p>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ScheduleViewerProps {
    programs: ChurchProgram[];
    categories: ChurchProgramCategory[];
}

export default function ScheduleViewer({ programs, categories }: ScheduleViewerProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    // ── Filter logic ──────────────────────────────────────────────────────
    const filteredPrograms = useMemo(() => {
        return programs.filter((p) => {
            if (selectedCategoryId && p.category_id !== selectedCategoryId) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches =
                    p.title_fa.toLowerCase().includes(q) ||
                    p.title_en?.toLowerCase().includes(q) ||
                    p.organizer_fa?.toLowerCase().includes(q) ||
                    p.location_fa?.toLowerCase().includes(q) ||
                    p.description_fa?.toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [programs, selectedCategoryId, searchQuery]);

    // ── Group by date ─────────────────────────────────────────────────────
    const grouped = useMemo(() => {
        return filteredPrograms.reduce<Record<string, ChurchProgram[]>>((acc, prog) => {
            const key = prog.event_date;
            if (!acc[key]) acc[key] = [];
            acc[key].push(prog);
            return acc;
        }, {});
    }, [filteredPrograms]);

    const sortedDates = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // Category counts (based on ALL programs, not filtered)
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        programs.forEach((p) => {
            counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
        });
        return counts;
    }, [programs]);

    const hasFilter = !!selectedCategoryId || !!searchQuery.trim();
    const totalShown = filteredPrograms.length;

    return (
        <div className="min-h-screen bg-background" dir="rtl">

            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-background to-background pointer-events-none" />
                <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />

                {/* Floating orbs */}
                <div className="absolute top-8 left-8 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
                <div className="absolute top-16 right-16 w-48 h-48 rounded-full bg-purple-600/8 blur-3xl pointer-events-none" />

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-10">
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-8 animate-fade-in-down">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                            <Church className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-sm font-bold text-white/50 font-[Vazirmatn]">
                            کلیسای ایرانیان واشنگتن دی‌سی
                        </span>
                    </div>

                    {/* Title */}
                    <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
                        <h1 className="text-4xl sm:text-5xl font-black text-white font-[Vazirmatn] leading-tight mb-3">
                            برنامه‌های{" "}
                            <span className="text-gradient">کلیسا</span>
                        </h1>
                        <p className="text-white/50 font-[Vazirmatn] text-base leading-relaxed max-w-md">
                            جلسات هفتگی، عبادت‌ها و رویدادهای آینده کلیسا
                        </p>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center gap-6 mt-6 animate-fade-in" style={{ animationDelay: "160ms" }}>
                        <div className="flex items-center gap-2 text-sm text-white/40 font-[Vazirmatn]">
                            <Calendar className="w-4 h-4" />
                            <span>{programs.length} برنامه پیش رو</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2 text-sm text-white/40 font-[Vazirmatn]">
                            <Filter className="w-4 h-4" />
                            <span>{categories.length} دسته‌بندی</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">

                {/* Sticky filter bar */}
                <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-white/5 mb-8">
                    <div className="flex flex-col gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                            <input
                                id="schedule-search"
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="جستجو در برنامه‌ها..."
                                aria-label="جستجو در برنامه‌ها"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40 transition-all font-[Vazirmatn]"
                            />
                        </div>

                        {/* Category filters */}
                        {categories.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                <CategoryChip
                                    label="همه"
                                    count={programs.length}
                                    active={!selectedCategoryId}
                                    onClick={() => setSelectedCategoryId(null)}
                                />
                                {categories.map((cat) => (
                                    <CategoryChip
                                        key={cat.id}
                                        label={cat.name_fa}
                                        icon={cat.icon}
                                        color={cat.color}
                                        count={categoryCounts[cat.id] ?? 0}
                                        active={selectedCategoryId === cat.id}
                                        onClick={() => setSelectedCategoryId(
                                            selectedCategoryId === cat.id ? null : cat.id
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Results count (when filtered) */}
                {hasFilter && (
                    <div className="flex items-center justify-between mb-6 animate-fade-in">
                        <p className="text-sm text-white/40 font-[Vazirmatn]">
                            {totalShown > 0 ? `${totalShown} برنامه یافت شد` : "نتیجه‌ای یافت نشد"}
                        </p>
                        <button
                            onClick={() => { setSelectedCategoryId(null); setSearchQuery(""); }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-[Vazirmatn] transition-colors"
                        >
                            پاک کردن فیلتر ←
                        </button>
                    </div>
                )}

                {/* Programs list */}
                {sortedDates.length === 0 ? (
                    <EmptyState hasFilter={hasFilter} />
                ) : (
                    <div className="space-y-12 stagger animate-fade-in-up">
                        {sortedDates.map((dateStr) => {
                            const dayPrograms = grouped[dateStr];
                            return (
                                <section key={dateStr} aria-label={dateStr}>
                                    <DateHeader dateStr={dateStr} count={dayPrograms.length} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {dayPrograms.map((prog, i) => {
                                            const cat = categories.find((c) => c.id === prog.category_id)
                                                ?? prog.category;
                                            return (
                                                <ProgramCard
                                                    key={prog.id}
                                                    program={prog}
                                                    category={cat}
                                                    index={i}
                                                />
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-20 pt-8 border-t border-white/6 text-center">
                    <p className="text-xs text-white/25 font-[Vazirmatn]">
                        برای اطلاعات بیشتر با کلیسا تماس بگیرید
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-400/70 hover:text-indigo-400 font-[Vazirmatn] transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        بازگشت به صفحه اصلی
                    </Link>
                </div>
            </div>
        </div>
    );
}
