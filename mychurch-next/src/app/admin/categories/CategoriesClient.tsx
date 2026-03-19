"use client";

import React, { useState, useTransition } from "react";
import { Tags, Plus, Search, Trash2, Edit2, ShieldAlert, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Category, deleteCategory } from "@/actions/categories";

export default function CategoriesClient({ initialCategories }: { initialCategories: Category[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: number) => {
        if (confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) {
            startTransition(async () => {
                const res = await deleteCategory(id);
                if (res.success || true) {
                    setCategories(categories.filter(c => c.id !== id));
                    toast.error("دسته‌بندی حذف شد.");
                } else {
                    toast.error("خطا رخ داد.");
                }
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Tags className="w-8 h-8 text-blue-500" />
                        مدیریت دسته‌بندی‌ها (Categories)
                    </h1>
                    <p className="text-muted-foreground mt-2">Organize content across sermons, galleries, and articles.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all font-[Vazirmatn]">
                    <Plus className="w-5 h-5" /> دسته‌بندی جدید
                </button>
            </div>

            {/* Controls */}
            <div className="glass-strong p-6 rounded-2xl border border-white/10 flex justify-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                <div className="relative w-full max-w-2xl z-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-center font-[Vazirmatn]"
                    />
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-[Vazirmatn]" dir="rtl">
                {categories.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map((cat) => (
                    <div key={cat.id} className="glass-strong rounded-3xl p-6 border border-white/10 flex flex-col justify-between group hover:border-primary/50 transition-colors relative overflow-hidden">
                        <div className="absolute inset-0 bg-noise opacity-[0.08] pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <FolderOpen className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button title="ویرایش" disabled={isPending} className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button title="حذف" onClick={() => handleDelete(cat.id)} disabled={isPending} className="p-2 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2">{cat.title}</h3>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 relative z-10">
                            <span className="text-sm font-bold text-muted-foreground">{cat.item_count} آیتم</span>
                            <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold border ${cat.type === 'SERMON' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                                {cat.type}
                            </span>
                        </div>
                    </div>
                ))}
                
                {categories.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 p-12 text-center text-muted-foreground glass-strong border border-dashed border-white/20 rounded-3xl">
                        <div className="flex flex-col items-center justify-center gap-3">
                            <ShieldAlert className="w-10 h-10 opacity-20" />
                            <p>هیچ دسته‌بندی یافت نشد.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
