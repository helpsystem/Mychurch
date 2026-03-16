"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Youtube, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { FooterClock } from "@/components/ui/FooterClock";

export function PublicFooter() {
    const { t } = useLanguage();

    return (
        <footer className="border-t border-white/5 glass-strong pt-16 pb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" aria-hidden="true" />
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Brand */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="flex items-center gap-4">
                        <Image
                            src="/logo-transparent.png"
                            alt="Logo"
                            width={48}
                            height={48}
                            className="drop-shadow-lg"
                        />
                        <div className="flex flex-col">
                            <span className="font-black text-lg tracking-tight uppercase">ICC of D.C.</span>
                            <span className="text-xs text-primary font-bold">EST. 1990</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed max-w-sm">
                        {t?.footerDesc || "کلیسای ایرانیان مسیحی واشنگتن دی‌سی مکانی است برای پرستش، شراکت و رشد روحانی در خداوند عیسی مسیح."}
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" aria-label="YouTube Channel" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                            <Youtube className="w-5 h-5" />
                        </a>
                        <a href="#" aria-label="Instagram Page" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" aria-label="Send Email" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                            <Mail className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-6">
                    <h4 className="font-bold text-lg">{t?.quickLinks || "دسترسی سریع"}</h4>
                    <ul className="space-y-3 text-muted-foreground font-medium">
                        <li><Link href="/about" className="hover:text-primary transition-colors">{t?.about || "درباره ما"}</Link></li>
                        <li><Link href="/sermons" className="hover:text-primary transition-colors">{t?.sermons || "موعظه‌ها"}</Link></li>
                        <li><Link href="/worship" className="hover:text-primary transition-colors">{t?.worship || "پرستش"}</Link></li>
                        <li><Link href="/bible" className="hover:text-primary transition-colors">{t?.bible || "کتاب مقدس"}</Link></li>
                    </ul>
                </div>

                {/* Contact info */}
                <div className="space-y-6">
                    <h4 className="font-bold text-lg">{t?.contact || "ارتباط با ما"}</h4>
                    <ul className="space-y-4 text-sm font-medium text-muted-foreground">
                        <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary shrink-0" />
                            <span dir="ltr">10613 Georgia Ave, Silver Spring, MD 20902</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-primary shrink-0" />
                            <span dir="ltr">+1 (301) 649-7086</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-primary shrink-0" />
                            <span dir="ltr">info@iranianchristianchurchdc.com</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-16 pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between text-xs text-muted-foreground font-medium gap-6 pb-2">
                <p className="order-3 lg:order-1 text-center lg:text-right">© {new Date().getFullYear()} Iranian Christian Church of D.C. All rights reserved.</p>

                {/* Embedded Clock Widget */}
                <div className="order-1 lg:order-2 shrink-0">
                    <FooterClock />
                </div>

                <p className="order-2 lg:order-3 mt-2 md:mt-0 opacity-50 shrink-0">Designed by Saman Abyar</p>
            </div>
        </footer>
    );
}
