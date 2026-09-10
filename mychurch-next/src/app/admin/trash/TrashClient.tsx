"use client";

import React, { useState, useTransition } from "react";
import { 
    Trash2, RotateCcw, AlertTriangle, Search, Filter, 
    FileVideo, Music, Image as ImageIcon, MonitorPlay, HeartHandshake, 
    CheckCircle, ShieldAlert, Clock, User, HardDrive
} from "lucide-react";
import { TrashedItem, getTrashedItems, restoreItem, permanentlyDeleteItem } from "@/actions/trash";

interface TrashClientProps {
    initialItems: TrashedItem[];
    isAdmin: boolean;
}

export default function TrashClient({ initialItems, isAdmin }: TrashClientProps) {
    const [items, setItems] = useState<TrashedItem[]>(initialItems);
    const [filter, setFilter] = useState<'all' | 'media' | 'presentation' | 'prayer'>('all');
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; item: TrashedItem | null }>({
        isOpen: false,
        item: null
    });
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setStatusMessage({ type, text });
        setTimeout(() => setStatusMessage(null), 4000);
    };

    const handleFilterChange = (newFilter: 'all' | 'media' | 'presentation' | 'prayer') => {
        setFilter(newFilter);
        startTransition(async () => {
            const fresh = await getTrashedItems(newFilter);
            setItems(fresh);
        });
    };

    const handleRestore = async (item: TrashedItem) => {
        startTransition(async () => {
            const res = await restoreItem(item.resourceType, item.id);
            if (res.success) {
                setItems(prev => prev.filter(i => i.id !== item.id));
                showMessage('success', `آیتم "${item.title}" با موفقیت بازگردانی شد و به بخش مربوطه بازگشت.`);
            } else {
                showMessage('error', res.error || 'خطا در بازگردانی آیتم');
            }
        });
    };

    const handlePermanentDelete = async () => {
        if (!confirmModal.item) return;
        const item = confirmModal.item;
        setConfirmModal({ isOpen: false, item: null });

        startTransition(async () => {
            const res = await permanentlyDeleteItem(item.resourceType, item.id);
            if (res.success) {
                setItems(prev => prev.filter(i => i.id !== item.id));
                showMessage('success', `آیتم "${item.title}" برای همیشه از دیتابیس و استوریج ابری حذف شد.`);
            } else {
                showMessage('error', res.error || 'خطا در حذف دائمی');
            }
        });
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatPersianDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('fa-IR', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }).format(date);
        } catch {
            return dateString;
        }
    };

    const filteredItems = items.filter(i => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return i.title.toLowerCase().includes(s) || (i.deletedBy && i.deletedBy.toLowerCase().includes(s));
    });

    const getResourceIcon = (type: string) => {
        if (type === 'media') return <FileVideo className="w-5 h-5 text-indigo-400" />;
        if (type === 'presentation') return <MonitorPlay className="w-5 h-5 text-amber-400" />;
        if (type === 'prayer') return <HeartHandshake className="w-5 h-5 text-emerald-400" />;
        return <Trash2 className="w-5 h-5 text-rose-400" />;
    };

    const getResourceTitle = (type: string) => {
        if (type === 'media') return 'فایل مدیا';
        if (type === 'presentation') return 'پرزنتیشن / اسلاید';
        if (type === 'prayer') return 'درخواست دعا';
        return type;
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Status Alert Toast */}
            {statusMessage && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border ${
                    statusMessage.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                } font-[Vazirmatn] text-sm animate-fade-in`}>
                    {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Info Notice Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 font-[Vazirmatn] text-xs flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
                <p>
                    <strong>قابلیت بازگردانی امن (Safe Soft Delete):</strong> تمامی فایل‌ها، تصاویر، ویدئوها و پرزنتیشن‌هایی که توسط کاربران حذف می‌شوند در این بخش نگهداری شده و از استوریج ابری تلگرام و سرور پاک نمی‌شوند. در صورت نیاز می‌توانید فوراً آنها را «بازیابی» کنید. تنها با تائید مستقیم ادمین، اطلاعات برای همیشه پاکسازی خواهد شد.
                </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto">
                    <button
                        onClick={() => handleFilterChange('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-[Vazirmatn] transition-colors ${
                            filter === 'all' ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        همه ({items.length.toLocaleString('fa-IR')})
                    </button>
                    <button
                        onClick={() => handleFilterChange('media')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-[Vazirmatn] transition-colors ${
                            filter === 'media' ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        فایل‌های مدیا
                    </button>
                    <button
                        onClick={() => handleFilterChange('presentation')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-[Vazirmatn] transition-colors ${
                            filter === 'presentation' ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        پرزنتیشن‌ها
                    </button>
                    <button
                        onClick={() => handleFilterChange('prayer')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold font-[Vazirmatn] transition-colors ${
                            filter === 'prayer' ? 'bg-primary text-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        درخواست‌های دعا
                    </button>
                </div>

                <div className="flex flex-1 min-w-[240px] max-w-md relative">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در نام فایل، حذف‌کننده..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-muted-foreground/60 focus:outline-none focus:border-cyan-500 font-[Vazirmatn]"
                    />
                    <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5 pointer-events-none" />
                </div>
            </div>

            {/* Trash Items List */}
            <div className="rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-black/40 border-b border-white/10 text-muted-foreground font-[Vazirmatn] text-xs">
                            <tr>
                                <th className="p-4">نوع منبع</th>
                                <th className="p-4">عنوان یا نام فایل</th>
                                <th className="p-4">زمان انتقال</th>
                                <th className="p-4">توسط کاربر</th>
                                <th className="p-4">مشخصات</th>
                                <th className="p-4 text-center">عملیات مدیریت</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-[Vazirmatn]">
                            {isPending ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                        در حال پردازش زباله‌دان...
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-16 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground">
                                                <Trash2 className="w-7 h-7" />
                                            </div>
                                            <p className="text-sm font-bold text-white">زباله‌دان خالی است</p>
                                            <p className="text-xs text-muted-foreground">هیچ فایل یا آیتم حذفی در این دسته‌بندی وجود ندارد.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                                    {getResourceIcon(item.resourceType)}
                                                </div>
                                                <span className="text-xs font-bold text-white">
                                                    {getResourceTitle(item.resourceType)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col max-w-md">
                                                <span className="font-bold text-white text-sm truncate" title={item.title}>
                                                    {item.title}
                                                </span>
                                                {item.meta?.folder && (
                                                    <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                                                        folder: {item.meta.folder}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-mono text-muted-foreground whitespace-nowrap" dir="ltr">
                                            {formatPersianDate(item.deletedAt)}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-mono text-cyan-400">
                                                {item.deletedBy || 'اپراتور'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground">
                                            {item.meta?.size ? (
                                                <span className="font-mono">{formatBytes(item.meta.size)}</span>
                                            ) : item.meta?.slidesCount ? (
                                                <span>{item.meta.slidesCount} اسلاید</span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Restore Button */}
                                                <button
                                                    onClick={() => handleRestore(item)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold transition-colors"
                                                    title="بازگردانی به محل اصلی"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    <span>بازگردانی</span>
                                                </button>

                                                {/* Permanent Delete Button (Admin Only) */}
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, item })}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
                                                        title="حذف قطعی و پاکسازی کامل از استوریج"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>حذف دائم</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Permanent Delete Confirmation Modal */}
            {confirmModal.isOpen && confirmModal.item && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-neutral-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-right font-[Vazirmatn]">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="font-black text-lg text-white">تائید حذف قطعی و غیرقابل بازگشت</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                آیا از حذف کامل و دائمی آیتم <strong className="text-rose-400">"{confirmModal.item.title}"</strong> اطمینان دارید؟ 
                                این آیتم برای همیشه از استوریج تلگرام، دیتابیس و فایل سیستم پاک شده و هیچ امکانی برای بازگردانی آن وجود نخواهد داشت.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, item: null })}
                                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={handlePermanentDelete}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>بله، برای همیشه حذف شود</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
