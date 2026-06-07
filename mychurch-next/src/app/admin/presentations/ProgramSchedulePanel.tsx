"use client";

import React, { useState, useTransition, useCallback } from "react";
import {
    Plus, Trash2, Edit2, Loader2, Calendar, Clock, User,
    MapPin, Monitor, Eye, EyeOff, Tag, ChevronRight, X,
    Check, Link as LinkIcon, Palette, Grip
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    getCategories, saveCategory, deleteCategory,
    getPrograms, saveProgram, deleteProgram,
} from "@/actions/church-programs";
import type { ChurchProgramCategory, ChurchProgram } from "@/types/church-programs";
import type { BroadcastSession } from "@/types/broadcast";

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#06b6d4",
    "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
];

const PRESET_ICONS = ["🕍", "📖", "🎵", "🙏", "✨", "🎯", "📢", "🌟", "🔥", "💫"];

function formatTime(t?: string): string {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

// ─── Category Modal ──────────────────────────────────────────────────────────

interface CategoryModalProps {
    initial?: Partial<ChurchProgramCategory>;
    onSave: (cat: Partial<ChurchProgramCategory> & { name_fa: string }) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}

function CategoryModal({ initial, onSave, onClose, isSaving }: CategoryModalProps) {
    const [name_fa, setNameFa] = useState(initial?.name_fa ?? "");
    const [name_en, setNameEn] = useState(initial?.name_en ?? "");
    const [icon, setIcon] = useState(initial?.icon ?? "📅");
    const [color, setColor] = useState(initial?.color ?? "#6366f1");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name_fa.trim()) return;
        await onSave({ ...initial, name_fa: name_fa.trim(), name_en: name_en.trim(), icon, color });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black font-[Vazirmatn]">
                        {initial?.id ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Icon Picker */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">آیکون</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_ICONS.map((ic) => (
                                <button
                                    key={ic} type="button"
                                    onClick={() => setIcon(ic)}
                                    className={cn("w-10 h-10 rounded-xl text-lg transition-all", icon === ic ? "bg-white/20 ring-2 ring-white/40 scale-110" : "bg-white/5 hover:bg-white/10")}
                                >{ic}</button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">رنگ</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c} type="button"
                                    onClick={() => setColor(c)}
                                    style={{ backgroundColor: c }}
                                    className={cn("w-8 h-8 rounded-lg transition-all", color === c ? "ring-2 ring-white scale-110" : "hover:scale-105")}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">نام (فارسی) *</label>
                        <input
                            value={name_fa} onChange={(e) => setNameFa(e.target.value)}
                            required placeholder="مثال: سه‌شنبه شب"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-[Vazirmatn]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2">Name (English)</label>
                        <input
                            value={name_en} onChange={(e) => setNameEn(e.target.value)}
                            placeholder="e.g. Tuesday Night" dir="ltr"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl">
                        <span className="text-2xl">{icon}</span>
                        <span className="font-bold font-[Vazirmatn]" style={{ color }}>{name_fa || "پیش‌نمایش دسته‌بندی"}</span>
                    </div>

                    <button
                        type="submit" disabled={isSaving || !name_fa.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 font-[Vazirmatn]"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {initial?.id ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Program Modal ───────────────────────────────────────────────────────────

interface ProgramModalProps {
    initial?: Partial<ChurchProgram>;
    categories: ChurchProgramCategory[];
    presentations: BroadcastSession[];
    onSave: (prog: Omit<ChurchProgram, "category">) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}

function ProgramModal({ initial, categories, presentations, onSave, onClose, isSaving }: ProgramModalProps) {
    const [category_id, setCategoryId] = useState(initial?.category_id ?? categories[0]?.id ?? "");
    const [title_fa, setTitleFa] = useState(initial?.title_fa ?? "");
    const [title_en, setTitleEn] = useState(initial?.title_en ?? "");
    const [organizer_fa, setOrganizerFa] = useState(initial?.organizer_fa ?? "");
    const [organizer_en, setOrganizerEn] = useState(initial?.organizer_en ?? "");
    const [description_fa, setDescFa] = useState(initial?.description_fa ?? "");
    const [description_en, setDescEn] = useState(initial?.description_en ?? "");
    const [event_date, setEventDate] = useState(initial?.event_date ?? new Date().toISOString().split("T")[0]);
    const [start_time, setStartTime] = useState(initial?.start_time ?? "10:00");
    const [end_time, setEndTime] = useState(initial?.end_time ?? "");
    const [location_fa, setLocFa] = useState(initial?.location_fa ?? "");
    const [location_en, setLocEn] = useState(initial?.location_en ?? "");
    const [presentation_id, setPresentationId] = useState<string | null>(initial?.presentation_id ?? null);
    const [is_public, setIsPublic] = useState(initial?.is_public ?? true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title_fa.trim() || !category_id || !event_date || !start_time) return;
        await onSave({
            id: initial?.id ?? "",
            category_id, title_fa: title_fa.trim(), title_en: title_en.trim(),
            organizer_fa: organizer_fa.trim(), organizer_en: organizer_en.trim(),
            description_fa: description_fa.trim(), description_en: description_en.trim(),
            event_date, start_time, end_time: end_time || undefined,
            location_fa: location_fa.trim(), location_en: location_en.trim(),
            presentation_id: presentation_id || null, is_public,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h3 className="text-lg font-black font-[Vazirmatn]">
                        {initial?.id ? "ویرایش برنامه" : "برنامه جدید"}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">دسته‌بندی *</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id} type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    style={category_id === cat.id ? { borderColor: cat.color, backgroundColor: cat.color + "20" } : {}}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold font-[Vazirmatn] transition-all",
                                        category_id === cat.id ? "text-white" : "border-white/10 text-white/50 hover:border-white/30"
                                    )}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name_fa}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3 sm:col-span-1">
                            <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">تاریخ *</label>
                            <input type="date" required value={event_date} onChange={(e) => setEventDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50" dir="ltr" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">شروع *</label>
                            <input type="time" required value={start_time} onChange={(e) => setStartTime(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50" dir="ltr" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">پایان</label>
                            <input type="time" value={end_time} onChange={(e) => setEndTime(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-indigo-500/50" dir="ltr" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">عنوان برنامه (فارسی) *</label>
                            <input required value={title_fa} onChange={(e) => setTitleFa(e.target.value)}
                                placeholder="جلسه تعلیمی"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-[Vazirmatn]" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2">Title (English)</label>
                            <input value={title_en} onChange={(e) => setTitleEn(e.target.value)}
                                placeholder="Teaching Session" dir="ltr"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                    </div>

                    {/* Organizer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">برگزارکننده (فارسی)</label>
                            <input value={organizer_fa} onChange={(e) => setOrganizerFa(e.target.value)}
                                placeholder="کشیش یوسف"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-[Vazirmatn]" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2">Organizer (English)</label>
                            <input value={organizer_en} onChange={(e) => setOrganizerEn(e.target.value)}
                                placeholder="Pastor Joseph" dir="ltr"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">مکان (فارسی)</label>
                            <input value={location_fa} onChange={(e) => setLocFa(e.target.value)}
                                placeholder="سالن اصلی کلیسا"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-[Vazirmatn]" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2">Location (English)</label>
                            <input value={location_en} onChange={(e) => setLocEn(e.target.value)}
                                placeholder="Main Hall" dir="ltr"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50" />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">توضیحات (فارسی)</label>
                            <textarea rows={3} value={description_fa} onChange={(e) => setDescFa(e.target.value)}
                                placeholder="جزئیات برنامه..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-[Vazirmatn]" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2">Description (English)</label>
                            <textarea rows={3} value={description_en} onChange={(e) => setDescEn(e.target.value)}
                                placeholder="Event details..." dir="ltr"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none" />
                        </div>
                    </div>

                    {/* Link to Presentation */}
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 font-[Vazirmatn]">اتصال به ارائه (اختیاری)</label>
                        <select
                            value={presentation_id ?? ""}
                            onChange={(e) => setPresentationId(e.target.value || null)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 font-[Vazirmatn]"
                        >
                            <option value="">— بدون اتصال به ارائه —</option>
                            {presentations.map((p) => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                        {presentation_id && (
                            <p className="text-xs text-indigo-400 mt-1.5 font-[Vazirmatn]">
                                📺 اعضا می‌توانند ارائه را از صفحه عمومی مشاهده کنند
                            </p>
                        )}
                    </div>

                    {/* Public toggle */}
                    <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5">
                        <div>
                            <p className="font-bold font-[Vazirmatn] text-sm">نمایش عمومی</p>
                            <p className="text-xs text-white/50 font-[Vazirmatn]">در صفحه برنامه‌های کلیسا (schedule/) نمایش داده شود</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPublic(!is_public)}
                            className={cn(
                                "relative w-12 h-6 rounded-full transition-all",
                                is_public ? "bg-indigo-600" : "bg-white/10"
                            )}
                        >
                            <span className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
                                is_public ? "right-1" : "left-1"
                            )} />
                        </button>
                    </div>

                    <button
                        type="submit" disabled={isSaving || !title_fa.trim() || !category_id}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 font-[Vazirmatn]"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {initial?.id ? "ذخیره تغییرات" : "ثبت برنامه"}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ProgramSchedulePanelProps {
    initialCategories: ChurchProgramCategory[];
    initialPrograms: ChurchProgram[];
    presentations: BroadcastSession[];
}

export default function ProgramSchedulePanel({ initialCategories, initialPrograms, presentations }: ProgramSchedulePanelProps) {
    const [categories, setCategories] = useState(initialCategories);
    const [programs, setPrograms] = useState(initialPrograms);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [filterDate, setFilterDate] = useState("");

    // Modal state
    const [editingCategory, setEditingCategory] = useState<Partial<ChurchProgramCategory> | null>(null);
    const [editingProgram, setEditingProgram] = useState<Partial<ChurchProgram> | null>(null);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [showNewProgram, setShowNewProgram] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [isSavingCat, setIsSavingCat] = useState(false);
    const [isSavingProg, setIsSavingProg] = useState(false);

    // ── Filtered programs ──────────────────────────────────────────────────
    const filteredPrograms = programs.filter((p) => {
        if (selectedCategoryId && p.category_id !== selectedCategoryId) return false;
        if (filterDate && p.event_date !== filterDate) return false;
        return true;
    });

    // Group by date
    const grouped = filteredPrograms.reduce<Record<string, ChurchProgram[]>>((acc, prog) => {
        const key = prog.event_date;
        if (!acc[key]) acc[key] = [];
        acc[key].push(prog);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // ── Category Handlers ──────────────────────────────────────────────────

    const handleSaveCategory = async (cat: Partial<ChurchProgramCategory> & { name_fa: string }) => {
        setIsSavingCat(true);
        const res = await saveCategory(cat);
        if (res.success) {
            toast.success(cat.id ? "دسته‌بندی ویرایش شد" : "دسته‌بندی ایجاد شد");
            // Refresh list
            const fresh = await getCategories();
            setCategories(fresh);
            setEditingCategory(null);
            setShowNewCategory(false);
        } else {
            toast.error(res.error ?? "خطا در ذخیره");
        }
        setIsSavingCat(false);
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!confirm(`آیا از حذف دسته‌بندی «${name}» مطمئن هستید؟`)) return;
        const res = await deleteCategory(id);
        if (res.success) {
            toast.success("دسته‌بندی حذف شد");
            setCategories((prev) => prev.filter((c) => c.id !== id));
            if (selectedCategoryId === id) setSelectedCategoryId(null);
        } else {
            toast.error(res.error ?? "خطا در حذف");
        }
    };

    // ── Program Handlers ───────────────────────────────────────────────────

    const handleSaveProgram = async (prog: Omit<ChurchProgram, "category">) => {
        setIsSavingProg(true);
        const res = await saveProgram(prog);
        if (res.success) {
            toast.success(prog.id ? "برنامه ویرایش شد" : "برنامه ثبت شد");
            const fresh = await getPrograms();
            setPrograms(fresh);
            setEditingProgram(null);
            setShowNewProgram(false);
        } else {
            toast.error(res.error ?? "خطا در ذخیره");
        }
        setIsSavingProg(false);
    };

    const handleDeleteProgram = async (id: string, title: string) => {
        if (!confirm(`آیا از حذف برنامه «${title}» مطمئن هستید؟`)) return;
        const res = await deleteProgram(id);
        if (res.success) {
            toast.success("برنامه حذف شد");
            setPrograms((prev) => prev.filter((p) => p.id !== id));
        } else {
            toast.error(res.error ?? "خطا در حذف");
        }
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6" dir="rtl">

            {/* Categories Bar */}
            <div className="glass-strong border border-white/10 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-black text-base font-[Vazirmatn] flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-400" /> دسته‌بندی‌های برنامه
                    </h2>
                    <button
                        onClick={() => setShowNewCategory(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all font-[Vazirmatn]"
                    >
                        <Plus className="w-3.5 h-3.5" /> دسته‌بندی جدید
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* All filter */}
                    <button
                        onClick={() => setSelectedCategoryId(null)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold font-[Vazirmatn] transition-all",
                            !selectedCategoryId
                                ? "bg-white/20 border-white/30 text-white"
                                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                        )}
                    >
                        همه برنامه‌ها ({programs.length})
                    </button>

                    {categories.map((cat) => {
                        const count = programs.filter((p) => p.category_id === cat.id).length;
                        const isSelected = selectedCategoryId === cat.id;
                        return (
                            <div key={cat.id} className="flex items-center gap-1 group">
                                <button
                                    onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                                    style={isSelected ? { borderColor: cat.color, backgroundColor: cat.color + "25" } : {}}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold font-[Vazirmatn] transition-all",
                                        isSelected ? "text-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                                    )}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name_fa}</span>
                                    <span className={cn("text-xs px-1.5 py-0.5 rounded-md font-sans", isSelected ? "bg-white/20" : "bg-white/10")}>{count}</span>
                                </button>
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingCategory(cat)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="ویرایش">
                                        <Edit2 className="w-3 h-3 text-white/50" />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat.id, cat.name_fa)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="حذف">
                                        <Trash2 className="w-3 h-3 text-red-400/70" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Programs Controls Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-neutral-900/50 border border-white/10 rounded-xl pr-9 pl-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
                            dir="ltr"
                        />
                    </div>
                    {filterDate && (
                        <button onClick={() => setFilterDate("")} className="text-xs text-indigo-400 hover:text-white font-[Vazirmatn]">
                            ← پاک کردن فیلتر
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowNewProgram(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 font-[Vazirmatn] active:scale-95"
                >
                    <Plus className="w-4 h-4" /> برنامه جدید
                </button>
            </div>

            {/* Programs List — Grouped by Date */}
            {sortedDates.length === 0 ? (
                <div className="glass-strong border border-dashed border-white/15 rounded-3xl p-16 text-center">
                    <div className="text-5xl mb-4">📅</div>
                    <p className="text-white/50 font-[Vazirmatn] text-lg font-bold mb-2">هیچ برنامه‌ای یافت نشد</p>
                    <p className="text-white/30 font-[Vazirmatn] text-sm">برای شروع، یک برنامه جدید ایجاد کنید</p>
                    <button
                        onClick={() => setShowNewProgram(true)}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all font-[Vazirmatn]"
                    >
                        <Plus className="w-4 h-4" /> برنامه جدید
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedDates.map((date) => {
                        const dateObj = new Date(date + "T00:00:00");
                        const dateLabel = dateObj.toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                        const dateLabelEn = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
                        const isToday = date === new Date().toISOString().split("T")[0];

                        return (
                            <div key={date}>
                                {/* Date Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn("px-4 py-2 rounded-2xl font-black font-[Vazirmatn] text-sm",
                                        isToday ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-white/5 text-white/70"
                                    )}>
                                        {isToday && <span className="ml-1">امروز — </span>}
                                        {dateLabel}
                                    </div>
                                    <div className="flex-1 h-px bg-white/5" />
                                    <span className="text-xs text-white/30 font-sans">{dateLabelEn}</span>
                                </div>

                                {/* Program Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {grouped[date].map((prog) => {
                                        const cat = categories.find((c) => c.id === prog.category_id);
                                        const linkedPres = presentations.find((p) => p.id === prog.presentation_id);
                                        return (
                                            <div
                                                key={prog.id}
                                                className="glass-strong rounded-2xl border border-white/8 hover:border-white/20 transition-all group relative overflow-hidden"
                                            >
                                                {/* Color accent */}
                                                <div
                                                    className="absolute top-0 right-0 h-full w-1 rounded-r-2xl"
                                                    style={{ backgroundColor: cat?.color ?? "#6366f1" }}
                                                />

                                                <div className="p-5">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            {cat && (
                                                                <span
                                                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg mb-2 font-[Vazirmatn]"
                                                                    style={{ color: cat.color, backgroundColor: cat.color + "20" }}
                                                                >
                                                                    {cat.icon} {cat.name_fa}
                                                                </span>
                                                            )}
                                                            <h3 className="font-black text-base text-white font-[Vazirmatn] truncate">{prog.title_fa}</h3>
                                                            {prog.title_en && <p className="text-xs text-white/40 font-sans mt-0.5 truncate" dir="ltr">{prog.title_en}</p>}
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                            <button onClick={() => setEditingProgram(prog)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="ویرایش">
                                                                <Edit2 className="w-3.5 h-3.5 text-white/60" />
                                                            </button>
                                                            <button onClick={() => handleDeleteProgram(prog.id, prog.title_fa)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="حذف">
                                                                <Trash2 className="w-3.5 h-3.5 text-red-400/70" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Meta Info */}
                                                    <div className="space-y-1.5 text-xs text-white/50 font-[Vazirmatn]">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                                            <span>{formatTime(prog.start_time)}{prog.end_time ? ` — ${formatTime(prog.end_time)}` : ""}</span>
                                                        </div>
                                                        {prog.organizer_fa && (
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-3.5 h-3.5 shrink-0" />
                                                                <span>{prog.organizer_fa}</span>
                                                            </div>
                                                        )}
                                                        {prog.location_fa && (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                                <span>{prog.location_fa}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Description */}
                                                    {prog.description_fa && (
                                                        <p className="text-xs text-white/40 mt-3 line-clamp-2 leading-relaxed font-[Vazirmatn]">{prog.description_fa}</p>
                                                    )}

                                                    {/* Footer badges */}
                                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                                        <div className="flex items-center gap-2">
                                                            {linkedPres && (
                                                                <span className="flex items-center gap-1 text-[10px] bg-indigo-500/15 text-indigo-400 px-2 py-1 rounded-lg font-bold font-[Vazirmatn]">
                                                                    <Monitor className="w-3 h-3" /> ارائه متصل
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={cn(
                                                            "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-bold font-[Vazirmatn]",
                                                            prog.is_public ? "bg-emerald-500/15 text-emerald-400" : "bg-neutral-500/15 text-neutral-400"
                                                        )}>
                                                            {prog.is_public ? <><Eye className="w-3 h-3" /> عمومی</> : <><EyeOff className="w-3 h-3" /> خصوصی</>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {(showNewCategory || editingCategory) && (
                <CategoryModal
                    initial={editingCategory ?? undefined}
                    onSave={handleSaveCategory}
                    onClose={() => { setEditingCategory(null); setShowNewCategory(false); }}
                    isSaving={isSavingCat}
                />
            )}

            {(showNewProgram || editingProgram) && (
                <ProgramModal
                    initial={editingProgram ?? undefined}
                    categories={categories}
                    presentations={presentations}
                    onSave={handleSaveProgram}
                    onClose={() => { setEditingProgram(null); setShowNewProgram(false); }}
                    isSaving={isSavingProg}
                />
            )}
        </div>
    );
}
