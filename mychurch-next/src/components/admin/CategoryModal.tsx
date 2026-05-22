"use client";

import React, { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { upsertCategory, Category } from "@/actions/categories";

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: Category | null;
    onSuccess: () => void;
}

export function CategoryModal({ isOpen, onClose, category, onSuccess }: CategoryModalProps) {
    const [title, setTitle] = useState(category?.title || "");
    const [type, setType] = useState<Category['type']>(category?.type || "SERMON");
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("عنوان دسته‌بندی الزامی است");
            return;
        }

        startTransition(async () => {
            const res = await upsertCategory({
                id: category?.id,
                title,
                type,
            });

            if (res.success) {
                toast.success(category ? "دسته‌بندی با موفقیت ویرایش شد" : "دسته‌بندی با موفقیت ایجاد شد");
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || "خطا در ذخیره دسته‌بندی");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            {/* Modal */}
            <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 relative z-10">
                    <h2 className="text-lg font-bold">
                        {category ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی جدید"}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4 relative z-10 font-[Vazirmatn]">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">عنوان دسته‌بندی</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: موعظه‌های یکشنبه"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">نوع دسته‌بندی</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as Category['type'])}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                            disabled={isPending}
                        >
                            <option value="SERMON">موعظه (SERMON)</option>
                            <option value="GALLERY">گالری (GALLERY)</option>
                            <option value="NEWS">اخبار (NEWS)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-muted-foreground hover:text-white font-medium transition-colors"
                            disabled={isPending}
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            {category ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
