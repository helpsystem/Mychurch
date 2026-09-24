"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, HeartHandshake, CloudDownload, Loader2 } from "lucide-react";
import { PrayerRequest } from "@/types/broadcast";
import { useBroadcastStore } from "@/store/useBroadcastStore";
import { getPrayers, createPrayer } from "@/actions/prayers";
import { toast } from "sonner";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
    en: {
        fillNameAndContent: "Please enter a name and prayer text.",
        savedToDbAndTicker: "Prayer request saved to database and shown on ticker.",
        addedToTicker: "Prayer request added to ticker.",
        deleted: "Prayer request deleted.",
        noNewFromDb: "No new prayer requests found in database.",
        churchMember: "Church member",
        prayerRequestFallback: "Prayer request",
        addedFromDb: (n: number) => `${n} prayer request(s) added from the database.`,
        dbConnectionError: "Error connecting to the prayer database.",
        modalTitle: "Manage Prayer Ticker List",
        itemsCount: (n: number) => `${n} items`,
        addNewPrompt: "Add a new prayer request for live display:",
        namePlaceholder: "Person's name (e.g. Brother Ramin)",
        contentPlaceholder: "Prayer topic / intention (e.g. health and guidance)",
        addToTicker: "Add to Ticker",
        autoLoadTitle: "Load automatically from church website",
        autoLoadDesc: "Fetch the latest prayer requests submitted by members on the site's prayer section",
        fetchFromDb: "Fetch from Database",
        currentlyActive: "Currently active items:",
        emptyTicker: "No prayer requests have been added to the ticker yet. Use the form above or the fetch-from-database button.",
        removeFromTicker: "Remove from ticker",
        tickerStatus: "Ticker status:",
        active: "Active and playing",
        inactive: "Inactive",
        confirmAndReturn: "Confirm & Return",
    },
    fa: {
        fillNameAndContent: "لطفاً نام و متن دعا را وارد نمایید.",
        savedToDbAndTicker: "درخواست دعا در دیتابیس ثبت و در تیکر فعال شد.",
        addedToTicker: "درخواست دعا به تیکر اضافه شد.",
        deleted: "درخواست دعا حذف شد.",
        noNewFromDb: "درخواست دعای جدیدی در دیتابیس یافت نشد.",
        churchMember: "عضو کلیسا",
        prayerRequestFallback: "درخواست دعا",
        addedFromDb: (n: number) => `${n} درخواست دعا از دیتابیس افزوده شد.`,
        dbConnectionError: "خطا در برقراری ارتباط با دیتابیس دعاها.",
        modalTitle: "مدیریت لیست تیکر درخواست‌های دعا",
        itemsCount: (n: number) => `${n} مورد`,
        addNewPrompt: "ثبت درخواست دعای جدید برای نمایش زنده:",
        namePlaceholder: "نام شخص (مثلاً برادر رامین)",
        contentPlaceholder: "موضوع / نیت دعا (مثلاً سلامتی و هدایت الهی)",
        addToTicker: "افزودن به تیکر",
        autoLoadTitle: "بارگذاری خودکار از وبسایت کلیسا",
        autoLoadDesc: "دریافت آخرین درخواست‌های ارسال شده توسط اعضا در بخش دعای سایت",
        fetchFromDb: "دریافت از دیتابیس",
        currentlyActive: "موارد فعال در حال حاضر:",
        emptyTicker: "هیچ درخواستی برای تیکر ثبت نشده است. از فرم بالا یا دکمه دریافت از دیتابیس استفاده کنید.",
        removeFromTicker: "حذف از تیکر",
        tickerStatus: "وضعیت تیکر:",
        active: "فعال و در حال پخش",
        inactive: "غیرفعال",
        confirmAndReturn: "تأیید و بازگشت",
    },
    es: {
        fillNameAndContent: "Por favor ingrese el nombre y el texto de la oración.",
        savedToDbAndTicker: "La petición de oración se guardó en la base de datos y se muestra en el ticker.",
        addedToTicker: "Petición de oración añadida al ticker.",
        deleted: "Petición de oración eliminada.",
        noNewFromDb: "No se encontraron nuevas peticiones de oración en la base de datos.",
        churchMember: "Miembro de la iglesia",
        prayerRequestFallback: "Petición de oración",
        addedFromDb: (n: number) => `${n} petición(es) de oración añadidas desde la base de datos.`,
        dbConnectionError: "Error al conectar con la base de datos de oraciones.",
        modalTitle: "Administrar lista del ticker de oración",
        itemsCount: (n: number) => `${n} elementos`,
        addNewPrompt: "Añadir una nueva petición de oración para mostrar en vivo:",
        namePlaceholder: "Nombre de la persona (p. ej. Hermano Ramin)",
        contentPlaceholder: "Tema / intención de oración (p. ej. salud y guía)",
        addToTicker: "Añadir al ticker",
        autoLoadTitle: "Cargar automáticamente desde el sitio web de la iglesia",
        autoLoadDesc: "Obtener las últimas peticiones de oración enviadas por los miembros en la sección de oración del sitio",
        fetchFromDb: "Obtener de la base de datos",
        currentlyActive: "Elementos activos actualmente:",
        emptyTicker: "No se han añadido peticiones de oración al ticker todavía. Use el formulario de arriba o el botón de obtener de la base de datos.",
        removeFromTicker: "Quitar del ticker",
        tickerStatus: "Estado del ticker:",
        active: "Activo y reproduciéndose",
        inactive: "Inactivo",
        confirmAndReturn: "Confirmar y volver",
    },
};

interface PrayerTickerManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrayerTickerManagerModal({ isOpen, onClose }: PrayerTickerManagerModalProps) {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;
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
            toast.error(d.fillNameAndContent);
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
            toast.success(d.savedToDbAndTicker);
        } catch (dbErr) {
            console.warn("DB save warning for prayer:", dbErr);
            toast.success(d.addedToTicker);
        }
    };

    const handleDeletePrayer = (id: string) => {
        updateConfig({
            prayerRequests: prayers.filter(p => p.id !== id)
        });
        toast.info(d.deleted);
    };

    const handleLoadFromDb = async () => {
        setIsLoadingFromDb(true);
        try {
            const dbPrayers = await getPrayers("all");
            if (!dbPrayers || dbPrayers.length === 0) {
                toast.info(d.noNewFromDb);
                return;
            }

            const formatted: PrayerRequest[] = dbPrayers.slice(0, 15).map(dp => ({
                id: dp.id || crypto.randomUUID(),
                user_id: dp.user_id || "",
                user_name: dp.user_name || dp.title || d.churchMember,
                email: dp.email || "",
                title: dp.title || d.prayerRequestFallback,
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

            toast.success(d.addedFromDb(newItems.length));
        } catch (err) {
            console.error("Error loading prayers from DB:", err);
            toast.error(d.dbConnectionError);
        } finally {
            setIsLoadingFromDb(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-[Vazirmatn]" dir={isRTL ? "rtl" : "ltr"}>
            <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-neutral-950/60">
                    <div className="flex items-center gap-2 text-white">
                        <HeartHandshake className="w-5 h-5 text-rose-400" />
                        <h2 className="text-base md:text-lg font-black">{d.modalTitle}</h2>
                        <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-0.5 rounded-full font-bold">
                            {d.itemsCount(prayers.length)}
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
                        <span className="text-xs font-bold text-amber-400 block">{d.addNewPrompt}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                                type="text"
                                placeholder={d.namePlaceholder}
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                            <input
                                type="text"
                                placeholder={d.contentPlaceholder}
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
                                <span>{d.addToTicker}</span>
                            </button>
                        </div>
                    </form>

                    {/* Database Import Action */}
                    <div className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-xl border border-white/5">
                        <div>
                            <span className="text-xs font-bold text-white block">{d.autoLoadTitle}</span>
                            <span className="text-[11px] text-neutral-400">{d.autoLoadDesc}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleLoadFromDb}
                            disabled={isLoadingFromDb}
                            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                            {isLoadingFromDb ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <CloudDownload className="w-3.5 h-3.5 text-amber-400" />}
                            <span>{d.fetchFromDb}</span>
                        </button>
                    </div>

                    {/* Prayers List */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-neutral-400 block">{d.currentlyActive}</span>
                        {prayers.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500 text-xs border border-dashed border-white/10 rounded-xl">
                                {d.emptyTicker}
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
                                            title={d.removeFromTicker}
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
                        {d.tickerStatus} {config.showPrayerTicker ? <span className="text-emerald-400 font-bold">{d.active}</span> : <span className="text-amber-400">{d.inactive}</span>}
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                    >
                        {d.confirmAndReturn}
                    </button>
                </div>
            </div>
        </div>
    );
}
