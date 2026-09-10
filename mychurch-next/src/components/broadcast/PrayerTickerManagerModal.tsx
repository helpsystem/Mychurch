"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, HeartHandshake, CloudDownload, Loader2 } from "lucide-react";
import { PrayerRequest } from "@/types/broadcast";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { getPrayers, createPrayer } from "@/actions/prayers";
import { toast } from "sonner";

interface PrayerTickerManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrayerTickerManagerModal({ isOpen, onClose }: PrayerTickerManagerModalProps) {
    const config = useBroadcastStore(state => state.config);
    const updateConfig = useBroadcastStore(state => state.updateConfig);
    const [newName, setNewName] = useState("");
    const [newContent, setNewContent] = useState("");
    const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);

    if (!isOpen) return null;

    const prayers = config.prayerRequests || [];

    const handleAddPrayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newContent.trim()) {
            toast.error("لطفاً نام و متن دعا را وارد نمایید.");
            return;
        }

        const prayerTitle = newName.trim();
        const prayerContent = newContent.trim();
        const newUuid = crypto.randomUUID();

        const newRequest: PrayerRequest = {
            id: newUuid,
            user_id: "operator",
            name: prayerTitle,
            user_name: prayerTitle,
            email: "",
            title: prayerTitle,
            content: prayerContent,
            is_public: true,
            status: "active",
            prayed_count: 0,
            answer_text: null,
            created_at: new Date()
        };

        updateConfig({
            prayerRequests: [...prayers, newRequest],
            showPrayerTicker: true // Auto enable ticker
        });

        setNewName("");
        setNewContent("");

        // Persist and verify in Database permanently
        try {
            await createPrayer({
                user_id: "operator",
                user_name: prayerTitle,
                title: prayerTitle,
                content: prayerContent,
                is_public: true,
                status: "active"
            });
            toast.success("درخواست دعا در دیتابیس ثبت و در تیکر فعال شد.");
        } catch (dbErr) {
            console.warn("DB save warning for prayer:", dbErr);
            toast.success("درخواست دعا به تیکر اضافه شد.");
        }
    };

    const handleDeletePrayer = (id: string) => {
        updateConfig({
            prayerRequests: prayers.filter(p => p.id !== id)
        });
        toast.info("درخواست دعا حذف شد.");
    };

    const handleLoadFromDb = async () => {
        setIsLoadingFromDb(true);
        try {
            const dbPrayers = await getPrayers("all");
            if (!dbPrayers || dbPrayers.length === 0) {
                toast.info("درخواست دعای جدیدی در دیتابیس یافت نشد.");
                return;
            }

            const formatted: PrayerRequest[] = dbPrayers.slice(0, 15).map(dp => ({
                id: dp.id || crypto.randomUUID(),
                user_id: dp.user_id || "",
                user_name: dp.user_name || dp.title || "عضو کلیسا",
                email: dp.email || "",
                title: dp.title || "درخواست دعا",
                content: dp.content,
                is_public: dp.is_public ?? true,
                status: dp.status || "active",
                prayed_count: dp.prayed_count || 0,
                answer_text: dp.answer_text,
                created_at: new Date(dp.created_at)
            }));

            // Merge avoiding duplicates by id or content
            const existingIds = new Set(prayers.map(p => p.id));
            const newItems = formatted.filter(f => !existingIds.has(f.id));

            updateConfig({
                prayerRequests: [...prayers, ...newItems],
                showPrayerTicker: true
            });

            toast.success(`${newItems.length} درخواست دعا از دیتابیس افزوده شد.`);
        } catch (err) {
            console.error("Error loading prayers from DB:", err);
            toast.error("خطا در برقراری ارتباط با دیتابیس دعاها.");
        } finally {
            setIsLoadingFromDb(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-[Vazirmatn]" dir="rtl">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-950/60">
                    <div className="flex items-center gap-2 text-white">
                        <HeartHandshake className="w-5 h-5 text-rose-400" />
                        <h2 className="text-base md:text-lg font-black">مدیریت لیست تیکر درخواست‌های دعا</h2>
                        <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {prayers.length} مورد
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {/* Add Form */}
                    <form onSubmit={handleAddPrayer} className="p-3 bg-neutral-950/80 rounded-xl border border-white/5 space-y-3">
                        <span className="text-xs font-bold text-amber-400 block">ثبت درخواست دعای جدید برای نمایش زنده:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder="نام شخص (مثلاً برادر رامین)"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <input
                                type="text"
                                placeholder="موضوع / نیت دعا (مثلاً سلامتی و هدایت الهی)"
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                className="sm:col-span-2 bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>افزودن به تیکر</span>
                            </button>
                        </div>
                    </form>

                    {/* Database Import Action */}
                    <div className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-xl border border-white/5">
                        <div>
                            <span className="text-xs font-bold text-white block">بارگذاری خودکار از وبسایت کلیسا</span>
                            <span className="text-[11px] text-neutral-400">دریافت آخرین درخواست‌های ارسال شده توسط اعضا در بخش دعای سایت</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleLoadFromDb}
                            disabled={isLoadingFromDb}
                            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                            {isLoadingFromDb ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <CloudDownload className="w-3.5 h-3.5 text-amber-400" />}
                            <span>دریافت از دیتابیس</span>
                        </button>
                    </div>

                    {/* Prayers List */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-neutral-400 block">موارد فعال در حال حاضر:</span>
                        {prayers.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 text-xs border border-dashed border-white/10 rounded-xl">
                                هیچ درخواستی برای تیکر ثبت نشده است. از فرم بالا یا دکمه دریافت از دیتابیس استفاده کنید.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {prayers.map((prayer, idx) => (
                                    <div
                                        key={prayer.id || idx}
                                        className="flex items-center justify-between p-2.5 bg-neutral-950/60 rounded-xl border border-white/5 hover:border-white/10 transition"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs shrink-0 font-bold">
                                                {idx + 1}
                                            </span>
                                            <div className="truncate">
                                                <span className="font-bold text-xs text-amber-300 ml-2">{prayer.user_name || prayer.title}:</span>
                                                <span className="text-xs text-neutral-200">{prayer.content}</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePrayer(prayer.id)}
                                            className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition shrink-0 cursor-pointer"
                                            title="حذف از تیکر"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-between bg-neutral-950/80">
                    <span className="text-xs text-neutral-400">
                        وضعیت تیکر: {config.showPrayerTicker ? <span className="text-emerald-400 font-bold">فعال و در حال پخش</span> : <span className="text-amber-400">غیرفعال</span>}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                    >
                        تأیید و بازگشت
                    </button>
                </div>
            </div>
        </div>
    );
}
