"use client";

import React, { useState, useTransition } from "react";
import { 
    Calendar, Clock, Plus, Trash2, Edit3, Power, 
    Flame, Sparkles, User, MapPin, CheckCircle2, 
    X, ArrowRight, RefreshCw, Layers
} from "lucide-react";
import { toast } from "sonner";
import { ChurchWeeklyProgram } from "@/types/weekly-programs";
import { 
    saveWeeklyProgram, 
    deleteWeeklyProgram, 
    toggleWeeklyProgramActive 
} from "@/actions/weekly-programs";

interface Props {
    initialPrograms: ChurchWeeklyProgram[];
}

export default function WeeklyScheduleAdminClient({ initialPrograms }: Props) {
    const [programs, setPrograms] = useState<ChurchWeeklyProgram[]>(initialPrograms);
    const [isPending, startTransition] = useTransition();
    const [editingProgram, setEditingProgram] = useState<Partial<ChurchWeeklyProgram> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<ChurchWeeklyProgram>>({
        day_of_week: "tuesday",
        day_name_fa: "سه‌شنبه شب‌ها",
        day_name_en: "Tuesday Nights",
        title_fa: "کلاس درس کتاب مقدس",
        title_en: "Tuesday Night Bible Study",
        category_fa: "تدریس کتاب مقدس",
        category_en: "Bible Study",
        main_teacher_fa: "با قدرت و رهبر و معلم اصلی: روح‌القدس",
        main_teacher_en: "Lead & Main Teacher: The Holy Spirit",
        assistant_fa: "",
        assistant_en: "",
        time_fa: "ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)",
        time_en: "8:00 PM – 9:00 PM Washington D.C. Time (EST)",
        location_fa: "آنلاین (پخش زنده و تعاملی)",
        location_en: "Online (Live & Interactive)",
        description_fa: "",
        description_en: "",
        badge_fa: "کلاس هفتگی",
        badge_en: "Weekly Class",
        action_url: "/broadcast/view",
        action_text_fa: "ورود به جلسه",
        action_text_en: "Join Session",
        is_active: true,
        sort_order: 0,
    });

    const openCreateModal = () => {
        setEditingProgram(null);
        setFormData({
            day_of_week: "tuesday",
            day_name_fa: "سه‌شنبه شب‌ها",
            day_name_en: "Tuesday Nights",
            title_fa: "کلاس درس کتاب مقدس",
            title_en: "Tuesday Night Bible Study",
            category_fa: "تدریس کتاب مقدس",
            category_en: "Bible Study",
            main_teacher_fa: "با قدرت و رهبر و معلم اصلی: روح‌القدس",
            main_teacher_en: "Lead & Main Teacher: The Holy Spirit",
            assistant_fa: "",
            assistant_en: "",
            time_fa: "ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن دی‌سی (EST)",
            time_en: "8:00 PM – 9:00 PM Washington D.C. Time (EST)",
            location_fa: "آنلاین (پخش زنده و تعاملی)",
            location_en: "Online (Live & Interactive)",
            description_fa: "",
            description_en: "",
            badge_fa: "کلاس هفتگی",
            badge_en: "Weekly Class",
            action_url: "/broadcast/view",
            action_text_fa: "ورود به جلسه",
            action_text_en: "Join Session",
            is_active: true,
            sort_order: programs.length,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (prog: ChurchWeeklyProgram) => {
        setEditingProgram(prog);
        setFormData({ ...prog });
        setIsModalOpen(true);
    };

    const handleToggle = (prog: ChurchWeeklyProgram) => {
        startTransition(async () => {
            const res = await toggleWeeklyProgramActive(prog.id, prog.is_active);
            if (res.success) {
                setPrograms(prev => prev.map(p => p.id === prog.id ? { ...p, is_active: !p.is_active } : p));
                toast.success(`برنامه "${prog.title_fa}" ${!prog.is_active ? 'فعال' : 'غیرفعال'} شد`);
            } else {
                toast.error(res.error || "خطا در تغییر وضعیت");
            }
        });
    };

    const handleDelete = (prog: ChurchWeeklyProgram) => {
        if (!confirm(`آیا از حذف برنامه "${prog.title_fa} (${prog.day_name_fa})" اطمینان دارید؟`)) return;

        startTransition(async () => {
            const res = await deleteWeeklyProgram(prog.id);
            if (res.success) {
                setPrograms(prev => prev.filter(p => p.id !== prog.id));
                toast.success(`برنامه "${prog.title_fa}" با موفقیت حذف شد`);
            } else {
                toast.error(res.error || "خطا در حذف برنامه");
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title_fa?.trim() || !formData.day_name_fa?.trim() || !formData.time_fa?.trim()) {
            toast.error("لطفاً عنوان، روز و ساعت برنامه را وارد کنید");
            return;
        }

        startTransition(async () => {
            const payload: any = {
                ...formData,
                id: editingProgram?.id,
            };
            const res = await saveWeeklyProgram(payload);
            if (res.success) {
                toast.success(editingProgram ? "برنامه با موفقیت به‌روزرسانی شد" : "برنامه جدید با موفقیت اضافه شد");
                setIsModalOpen(false);
                if (editingProgram) {
                    setPrograms(prev => prev.map(p => p.id === editingProgram.id ? { ...p, ...formData } as ChurchWeeklyProgram : p));
                } else if (res.id) {
                    setPrograms(prev => [...prev, { ...formData, id: res.id } as ChurchWeeklyProgram]);
                }
            } else {
                toast.error(res.error || "خطا در ذخیره برنامه");
            }
        });
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-neutral-900/60 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold mb-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>افزونه ماژولار برنامه‌های هفتگی سایت</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                        مدیریت جلسات هفتگی و کلاس‌های تدریس کتاب مقدس
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        قابلیت حذف، اضافه، ویرایش و فعال/غیرفعال‌سازی فوری برنامه‌های هفتگی روی صفحه اول سایت و صفحه تقویم
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                    <span>افزودن برنامه جدید</span>
                </button>
            </div>

            {/* Programs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((prog) => (
                    <div
                        key={prog.id}
                        className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                            prog.is_active 
                                ? "bg-neutral-900/90 border-white/15 shadow-xl hover:border-amber-500/40" 
                                : "bg-neutral-950/40 border-white/5 opacity-60 hover:opacity-80"
                        }`}
                    >
                        <div>
                            {/* Day & Active Switcher */}
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    {prog.day_name_fa}
                                </span>
                                
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(prog)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                                            prog.is_active
                                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                                : "bg-neutral-800 text-gray-400 border-white/10"
                                        }`}
                                        title="تغییر وضعیت فعال/غیرفعال"
                                    >
                                        <Power className="w-3.5 h-3.5" />
                                        <span>{prog.is_active ? "فعال" : "غیرفعال"}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-black text-white mb-2">
                                {prog.title_fa}
                            </h3>

                            {/* Time */}
                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 bg-black/40 p-2.5 rounded-xl border border-white/10 mb-3">
                                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>{prog.time_fa}</span>
                            </div>

                            {/* Main Teacher */}
                            <div className="text-xs text-amber-200/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 mb-2">
                                <span className="text-[10px] text-amber-400 block">رهبر و معلم اصلی:</span>
                                <span className="font-bold">{prog.main_teacher_fa}</span>
                            </div>

                            {/* Assistant */}
                            {prog.assistant_fa && (
                                <div className="text-xs text-cyan-200/90 bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 mb-2">
                                    <span className="text-[10px] text-cyan-400 block">تدریس / یاری:</span>
                                    <span className="font-bold">{prog.assistant_fa}</span>
                                </div>
                            )}

                            {/* Location */}
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{prog.location_fa}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                            <button
                                onClick={() => openEditModal(prog)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10"
                            >
                                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                <span>ویرایش</span>
                            </button>

                            <button
                                onClick={() => handleDelete(prog)}
                                className="flex items-center justify-center p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all border border-rose-500/20"
                                title="حذف برنامه"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-neutral-900 border border-white/15 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <h2 className="text-xl font-black text-white">
                                {editingProgram ? "ویرایش برنامه هفتگی" : "افزودن برنامه هفتگی جدید"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Day & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">روز هفته (فارسی)</label>
                                    <input
                                        type="text"
                                        value={formData.day_name_fa || ""}
                                        onChange={(e) => setFormData({ ...formData, day_name_fa: e.target.value })}
                                        placeholder="مثال: سه‌شنبه شب‌ها"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Day Name (English)</label>
                                    <input
                                        type="text"
                                        value={formData.day_name_en || ""}
                                        onChange={(e) => setFormData({ ...formData, day_name_en: e.target.value })}
                                        placeholder="e.g. Tuesday Nights"
                                        dir="ltr"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Title Fa & En */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">عنوان برنامه (فارسی)</label>
                                    <input
                                        type="text"
                                        value={formData.title_fa || ""}
                                        onChange={(e) => setFormData({ ...formData, title_fa: e.target.value })}
                                        placeholder="مثال: کلاس درس کتاب مقدس"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Program Title (English)</label>
                                    <input
                                        type="text"
                                        value={formData.title_en || ""}
                                        onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                                        placeholder="e.g. Tuesday Night Bible Study"
                                        dir="ltr"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Time (Washington D.C.) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">ساعت به وقت واشنگتن (فارسی)</label>
                                    <input
                                        type="text"
                                        value={formData.time_fa || ""}
                                        onChange={(e) => setFormData({ ...formData, time_fa: e.target.value })}
                                        placeholder="مثال: ساعت ۸:۰۰ تا ۹:۰۰ شب به وقت واشنگتن (EST)"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">Time in Washington D.C. (English)</label>
                                    <input
                                        type="text"
                                        value={formData.time_en || ""}
                                        onChange={(e) => setFormData({ ...formData, time_en: e.target.value })}
                                        placeholder="e.g. 8:00 PM – 9:00 PM Washington D.C. Time (EST)"
                                        dir="ltr"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Main Teacher */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-amber-400 mb-1.5">معلم و رهبر اصلی (فارسی)</label>
                                    <input
                                        type="text"
                                        value={formData.main_teacher_fa || ""}
                                        onChange={(e) => setFormData({ ...formData, main_teacher_fa: e.target.value })}
                                        placeholder="مثال: با قدرت و رهبر و معلم اصلی: روح‌القدس"
                                        className="w-full bg-black/40 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-cyan-400 mb-1.5">یاری و تدریس توسط (فارسی)</label>
                                    <input
                                        type="text"
                                        value={formData.assistant_fa || ""}
                                        onChange={(e) => setFormData({ ...formData, assistant_fa: e.target.value })}
                                        placeholder="مثال: با کمک خواهر اعظم / کشیش جواد / خواهر نازی"
                                        className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Location & Category */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">دسته‌بندی (فارسی)</label>
                                    <input
                                        type="text"
                                        value={formData.category_fa || ""}
                                        onChange={(e) => setFormData({ ...formData, category_fa: e.target.value })}
                                        placeholder="مثال: تدریس کتاب مقدس / جلسه عمومی / خدمت بانوان"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-300 mb-1.5">مکان / بستر برگزاری</label>
                                    <input
                                        type="text"
                                        value={formData.location_fa || ""}
                                        onChange={(e) => setFormData({ ...formData, location_fa: e.target.value })}
                                        placeholder="مثال: آنلاین (پخش زنده و تعاملی)"
                                        className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-300 mb-1.5">توضیحات برنامه (فارسی)</label>
                                <textarea
                                    rows={3}
                                    value={formData.description_fa || ""}
                                    onChange={(e) => setFormData({ ...formData, description_fa: e.target.value })}
                                    placeholder="شرح کوتاه درباره سرفصل‌ها و اهداف جلسه..."
                                    className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-400 outline-none resize-none"
                                />
                            </div>

                            {/* Active & Sort Order */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                <label className="flex items-center gap-2 text-sm text-white cursor-pointer font-bold">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(formData.is_active)}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded text-amber-500"
                                    />
                                    <span>فعال بودن برنامه در سایت</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-400 font-bold">ترتیب نمایش:</label>
                                    <input
                                        type="number"
                                        value={formData.sort_order ?? 0}
                                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                                        className="w-16 bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-sm text-white text-center"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-sm"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                                >
                                    {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                                    <span>{editingProgram ? "ذخیره تغییرات" : "افزودن برنامه"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
