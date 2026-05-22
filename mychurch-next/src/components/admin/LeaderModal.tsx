"use client";

import React, { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { upsertLeader, Leader } from "@/actions/leaders";

interface LeaderModalProps {
    isOpen: boolean;
    onClose: () => void;
    leader?: Leader | null;
    onSuccess: () => void;
}

export function LeaderModal({ isOpen, onClose, leader, onSuccess }: LeaderModalProps) {
    const [name, setName] = useState(leader?.name || "");
    const [role, setRole] = useState(leader?.role || "");
    const [email, setEmail] = useState(leader?.email || "");
    const [active, setActive] = useState(leader ? leader.active : true);
    const [isPending, startTransition] = useTransition();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !role.trim() || !email.trim()) {
            toast.error("تمام فیلدها الزامی هستند");
            return;
        }

        startTransition(async () => {
            const res = await upsertLeader({
                id: leader?.id,
                name,
                role,
                email,
                active,
            });

            if (res.success) {
                toast.success(leader ? "اطلاعات رهبر با موفقیت ویرایش شد" : "رهبر جدید با موفقیت اضافه شد");
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || "خطا در ذخیره اطلاعات رهبر");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            {/* Modal */}
            <div className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 relative z-10">
                    <h2 className="text-lg font-bold">
                        {leader ? "ویرایش رهبر" : "افزودن رهبر جدید"}
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
                        <label className="text-sm font-medium text-muted-foreground">نام (Name)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="نام و نام خانوادگی رهبر"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">مقام (Role)</label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="مثال: Senior Pastor یا Worship Leader"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">ایمیل (Email)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ایمیل جهت تماس"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            dir="ltr"
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex items-center gap-3 py-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                                disabled={isPending}
                            />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                        <span className="text-sm font-medium text-muted-foreground">رهبر فعال است (Active)</span>
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
                            {leader ? "ذخیره تغییرات" : "افزودن رهبر"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
