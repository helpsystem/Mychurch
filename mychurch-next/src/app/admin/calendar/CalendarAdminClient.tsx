"use client";

import React, { useState } from "react";
import { Calendar, Plus, Edit2, Trash2, X, Save, Loader2 } from "lucide-react";
import {
    type CalendarEvent,
    type CalendarEventType,
    saveCalendarEvent,
    deleteCalendarEvent,
} from "@/actions/calendar-events";

const TYPE_LABELS: Record<CalendarEventType, string> = {
    worship: "پرستش",
    prayer: "دعا",
    study: "مطالعه",
    special: "ویژه",
    youth: "جوانان",
};

type EditingEvent = {
    id?: string;
    event_date: string;
    title_fa: string;
    title_en: string;
    time_et: string;
    time_tehran: string;
    location: string;
    type: CalendarEventType;
};

const EMPTY_EVENT: EditingEvent = {
    event_date: "",
    title_fa: "",
    title_en: "",
    time_et: "",
    time_tehran: "",
    location: "",
    type: "special",
};

function toEditingEvent(e: CalendarEvent): EditingEvent {
    const mm = String(e.gm).padStart(2, "0");
    const dd = String(e.gd).padStart(2, "0");
    return {
        id: e.id,
        event_date: `${e.gy}-${mm}-${dd}`,
        title_fa: e.title,
        title_en: e.titleEn,
        time_et: e.timeET,
        time_tehran: e.timeTehran,
        location: e.location,
        type: e.type,
    };
}

export default function CalendarAdminClient({ initialEvents }: { initialEvents: CalendarEvent[] }) {
    const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
    const [editing, setEditing] = useState<EditingEvent | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const refresh = async () => {
        // Re-fetch is done via server revalidation + a light page reload of state.
        // Simplest reliable approach here: reload the events list from the server action.
        const { getAllCalendarEventsAdmin } = await import("@/actions/calendar-events");
        const fresh = await getAllCalendarEventsAdmin();
        setEvents(fresh);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;
        setIsSaving(true);
        try {
            const res = await saveCalendarEvent(editing);
            if (res.success) {
                setEditing(null);
                await refresh();
            } else {
                alert(res.error || "خطا در ذخیره رویداد");
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("آیا از حذف این رویداد اطمینان دارید؟")) return;
        const res = await deleteCalendarEvent(id);
        if (res.success) {
            setEvents(prev => prev.filter(ev => ev.id !== id));
        } else {
            alert(res.error || "خطا در حذف رویداد");
        }
    };

    const sorted = [...events].sort((a, b) => {
        const da = new Date(a.gy, a.gm - 1, a.gd).getTime();
        const db = new Date(b.gy, b.gm - 1, b.gd).getTime();
        return da - db;
    });

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6" dir="rtl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground">تقویم و رویدادهای ویژه</h1>
                        <p className="text-sm text-muted-foreground">
                            رویدادهای یک‌بارمصرف و تاریخ‌دار (جشن‌ها، برنامه‌های ویژه). برنامه‌های هفتگی تکرارشونده از بخش «برنامه‌های هفتگی» مدیریت می‌شوند.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setEditing({ ...EMPTY_EVENT })}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
                >
                    <Plus className="w-4 h-4" /> رویداد جدید
                </button>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {sorted.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>هنوز رویداد ویژه‌ای ثبت نشده است.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {sorted.map(ev => (
                            <div key={ev.id} className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-colors">
                                <div className="w-16 shrink-0 text-center">
                                    <div className="text-xs text-muted-foreground font-mono">{ev.gy}</div>
                                    <div className="text-lg font-black text-primary">{ev.gm}/{ev.gd}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-foreground truncate">{ev.title}</p>
                                    {ev.titleEn && <p className="text-xs text-muted-foreground truncate" dir="ltr">{ev.titleEn}</p>}
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <span className="px-2 py-0.5 rounded-full bg-secondary">{TYPE_LABELS[ev.type]}</span>
                                        {ev.location && <span>{ev.location}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => setEditing(toEditingEvent(ev))}
                                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                                        title="ویرایش"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ev.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleSave}
                        className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black">{editing.id ? "ویرایش رویداد" : "رویداد جدید"}</h2>
                            <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-secondary">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">تاریخ (میلادی)</label>
                            <input
                                type="date"
                                required
                                value={editing.event_date}
                                onChange={e => setEditing({ ...editing, event_date: e.target.value })}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">عنوان فارسی *</label>
                            <input
                                type="text"
                                required
                                value={editing.title_fa}
                                onChange={e => setEditing({ ...editing, title_fa: e.target.value })}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">عنوان انگلیسی</label>
                            <input
                                type="text"
                                dir="ltr"
                                value={editing.title_en}
                                onChange={e => setEditing({ ...editing, title_en: e.target.value })}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">ساعت (وقت آمریکا ET)</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    placeholder="10:30 AM"
                                    value={editing.time_et}
                                    onChange={e => setEditing({ ...editing, time_et: e.target.value })}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">ساعت (وقت تهران)</label>
                                <input
                                    type="text"
                                    dir="ltr"
                                    placeholder="19:00"
                                    value={editing.time_tehran}
                                    onChange={e => setEditing({ ...editing, time_tehran: e.target.value })}
                                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">محل برگزاری</label>
                            <input
                                type="text"
                                value={editing.location}
                                onChange={e => setEditing({ ...editing, location: e.target.value })}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-muted-foreground block mb-1">نوع رویداد</label>
                            <select
                                value={editing.type}
                                onChange={e => setEditing({ ...editing, type: e.target.value as CalendarEventType })}
                                className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-sm"
                            >
                                {(Object.keys(TYPE_LABELS) as CalendarEventType[]).map(t => (
                                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                ذخیره
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
