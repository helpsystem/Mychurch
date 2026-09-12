"use client";

import React, { useState } from "react";
import { 
    ShieldAlert, BookOpen, Music, Calendar, QrCode, 
    LayoutTemplate, Settings2, Heart, Sparkles, 
    Layers, Power, CheckCircle2, Globe, Search
} from "lucide-react";
import { DashboardWidget } from "@/actions/widgets";
import { WidgetToggleCard } from "./WidgetToggleCard";

const iconMap: Record<string, any> = {
    BookOpen,
    Music,
    Calendar,
    QrCode,
    LayoutTemplate,
    Heart,
    Sparkles,
};

interface Props {
    widgets: DashboardWidget[];
}

export default function WidgetsAdminView({ widgets }: Props) {
    const [lang, setLang] = useState<"fa" | "en">("fa");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

    const isEn = lang === "en";

    const filteredWidgets = widgets.filter((w) => {
        const matchesFilter = 
            filter === "all" ? true : filter === "active" ? w.is_active : !w.is_active;

        const term = search.toLowerCase().trim();
        const matchesSearch = !term ||
            w.name?.toLowerCase().includes(term) ||
            w.name_fa?.toLowerCase().includes(term) ||
            w.name_en?.toLowerCase().includes(term) ||
            w.id.toLowerCase().includes(term) ||
            w.description?.toLowerCase().includes(term) ||
            w.description_fa?.toLowerCase().includes(term) ||
            w.description_en?.toLowerCase().includes(term);

        return matchesFilter && matchesSearch;
    });

    const activeCount = widgets.filter(w => w.is_active).length;

    return (
        <div className="flex-1 p-4 md:p-8 font-vazirmatn bg-background h-screen overflow-y-auto" dir={isEn ? "ltr" : "rtl"}>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-sm">
                                <Settings2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-amber-400 block mb-0.5">
                                    {isEn ? "System Extension Center" : "مرکز ماژول‌ها و افزونه‌های کلیسا"}
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                                    {isEn ? "Widget Management Ecosystem" : "اکوسیستم و مدیریت ویجت‌ها"}
                                </h1>
                            </div>
                        </div>
                        <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed max-w-2xl">
                            {isEn 
                                ? "Configure, customize, and toggle global church plugins. Inactive widgets are instantly hidden from the public website." 
                                : "مدیریت و پیکربندی ابزارهای یکپارچه سیستم کلیسا. ویجت‌های غیرفعال بلافاصله از دید عموم مخفی می‌شوند."}
                        </p>
                    </div>

                    {/* Controls & Language Switcher */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-white/15 shadow-inner">
                            <button
                                onClick={() => setLang("fa")}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    !isEn ? "bg-amber-500 text-black shadow-md font-black" : "text-gray-400 hover:text-white"
                                }`}
                            >
                                فارسی
                            </button>
                            <button
                                onClick={() => setLang("en")}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isEn ? "bg-amber-500 text-black shadow-md font-black" : "text-gray-400 hover:text-white"
                                }`}
                            >
                                English
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status KPI & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                filter === "all" 
                                    ? "bg-primary text-black border-primary font-black shadow-md" 
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            }`}
                        >
                            {isEn ? `All (${widgets.length})` : `همه ویجت‌ها (${widgets.length})`}
                        </button>
                        <button
                            onClick={() => setFilter("active")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                filter === "active" 
                                    ? "bg-emerald-500 text-black border-emerald-500 font-black shadow-md" 
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            }`}
                        >
                            {isEn ? `Active (${activeCount})` : `فعال روی سایت (${activeCount})`}
                        </button>
                        <button
                            onClick={() => setFilter("inactive")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                filter === "inactive" 
                                    ? "bg-rose-500 text-white border-rose-500 font-black shadow-md" 
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                            }`}
                        >
                            {isEn ? `Inactive (${widgets.length - activeCount})` : `غیرفعال (${widgets.length - activeCount})`}
                        </button>
                    </div>

                    {/* Search input */}
                    <div className="relative w-full sm:w-64">
                        <Search className={`w-4 h-4 text-gray-400 absolute top-1/2 -translate-y-1/2 ${isEn ? "left-3" : "right-3"}`} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isEn ? "Search widgets..." : "جستجوی ویجت..."}
                            className={`w-full bg-neutral-900 border border-white/15 rounded-xl py-1.5 text-xs text-white placeholder-gray-500 focus:border-amber-400 outline-none ${
                                isEn ? "pl-9 pr-3" : "pr-9 pl-3"
                            }`}
                        />
                    </div>
                </div>

                {/* Warning / Guidance Banner */}
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/30">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-400 mb-0.5">
                            {isEn ? "Live Production Notice (Admin / Leader)" : "نکته عملیاتی مهم (دسترسی مدیریت و رهبران)"}
                        </h3>
                        <p className="text-amber-200/80 text-xs leading-relaxed font-medium">
                            {isEn 
                                ? "Switching widget status directly controls live visibility on the website. Each widget includes a dedicated Settings button to customize its bilingual content, audio behavior, and timing." 
                                : "تغییر وضعیت ویجت‌ها مستقیماً روی وب‌سایت لایو اعمال می‌شود. برای هر ویجت دکمه تنظیمات اختصاصی جهت سفارشی‌سازی محتوای دو زبانه، رفتار صوتی و زمان‌بندی قرار دارد."}
                        </p>
                    </div>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredWidgets.map((widget) => {
                        const IconComponent = iconMap[widget.icon] || Settings2;
                        return (
                            <WidgetToggleCard
                                key={widget.id}
                                widget={widget}
                                icon={<IconComponent className={`w-7 h-7 ${widget.color}`} />}
                                lang={lang}
                            />
                        );
                    })}

                    {filteredWidgets.length === 0 && (
                        <div className="col-span-full py-16 text-center text-muted-foreground bg-secondary/15 rounded-3xl border border-white/10">
                            {isEn ? "No widgets matched your search." : "هیچ ویجتی مطابق با جستجوی شما یافت نشد."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
