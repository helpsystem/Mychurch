"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Shield } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { createClient } from "@/utils/supabase/client";
import { Session } from "@supabase/supabase-js";

export function PublicHeader() {
    const { t } = useLanguage();
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data }) => setSession(data.session));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <nav className="fixed top-0 inset-x-0 h-20 glass-strong border-b border-white/5 z-50 flex items-center justify-between px-6 lg:px-12 shadow-lg shadow-black/10">
            <Link href="/" className="flex items-center gap-4 group">
                <div className="w-14 items-center justify-center flex">
                    <Image
                        src="/logo-transparent.png"
                        alt="Church Logo"
                        width={56}
                        height={56}
                        className="object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-xl tracking-tight leading-none text-gradient uppercase drop-shadow-sm group-hover:opacity-90 transition-all">Iranian Christian Church</span>
                    <span className="text-xs font-bold text-primary tracking-widest uppercase">{t.heroTitle || "Of Washington D.C."}</span>
                </div>
            </Link>

            <div className="hidden md:flex items-center gap-6 font-medium">
                <Link href="/" className="hover:text-primary transition-colors cursor-pointer">
                    {t?.home || "خانه"}
                </Link>
                <Link href="/about" className="hover:text-primary transition-colors cursor-pointer">
                    {t?.about || "درباره ما"}
                </Link>
                <Link href="/gallery" className="hover:text-primary transition-colors cursor-pointer">
                    {t?.gallery || "گالری"}
                </Link>
                <Link href="/sermons" className="hover:text-primary transition-colors cursor-pointer">
                    {t?.sermons || "موعظه‌ها"}
                </Link>
                <Link href="/worship" className="hover:text-primary transition-colors cursor-pointer">
                    🎵 {t?.worship || "سرودهای پرستشی"}
                </Link>
                <Link href="/prayers" className="hover:text-primary transition-colors cursor-pointer">
                    🙏 {t?.prayers || "درخواست دعا"}
                </Link>
                <Link href="/payment" className="hover:text-primary transition-colors cursor-pointer">
                    💳 {t?.payment || "پرداخت آنلاین"}
                </Link>
                <Link href="/bible" className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-bold relative group">
                    📖 {t?.bible || "کتاب مقدس"}
                    <span className="absolute -top-2 -right-3 text-[9px] bg-amber-400 text-black font-black px-1.5 rounded-full">NEW</span>
                </Link>
                <Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">
                    {t?.contact || "تماس"}
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <LanguageSwitcher />

                {session ? (
                    <div className="flex items-center gap-2">
                        <Link href="/profile" className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold transition-colors shadow-sm cursor-pointer border border-indigo-500/20" title={language === 'fa' ? 'پروفایل من' : 'My Profile'}>
                            <User className="w-4 h-4" /> {language === 'fa' ? 'پروفایل من' : 'My Profile'}
                        </Link>
                        <Link href="/admin" className="hidden md:flex items-center gap-2 p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary font-medium transition-colors shadow-sm cursor-pointer border border-border/10" title={language === 'fa' ? 'داشبورد مدیریت' : 'Admin Dashboard'}>
                            <Shield className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <Link href="/login" className="hidden md:flex items-center gap-2 p-2 rounded-xl bg-secondary/50 text-foreground hover:bg-secondary font-medium transition-colors shadow-sm cursor-pointer border border-border/10" title={language === 'fa' ? 'ورود اعضا' : 'Member Login'}>
                        <User className="w-5 h-5" />
                    </Link>
                )}
            </div>
        </nav>
    );
}
