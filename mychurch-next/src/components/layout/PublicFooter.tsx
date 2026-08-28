"use client";

// Footer — fixes applied:
// - Dead social href="#" replaced with real URLs
// - Logo alt text made descriptive (WCAG)
// - Contact list upgraded to semantic <address> with clickable links

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Youtube, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { FooterClock } from "@/components/ui/FooterClock";

export function PublicFooter() {
    const { t } = useLanguage();

    return (
        <footer className="border-t border-white/5 glass-strong pt-16 pb-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" aria-hidden="true" />
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
                {/* Brand */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <div className="flex items-center gap-4">
                        <Image
                            src="/logo-transparent.png"
                            alt="لوگوی کلیسای انجیلی ایرانیان واشنگتن دی‌سی"
                            width={48}
                            height={48}
                            className="drop-shadow-lg"
                        />
                        <div className="flex flex-col">
                            <span className="font-black text-lg tracking-tight uppercase">IPC of D.C.</span>
                            <span className="text-xs text-primary font-bold">EST. 1990</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed max-w-sm">
                        {t?.footerDesc || "کلیسای انجیلی ایرانیان واشنگتن دی‌سی مکانی است برای پرستش، شراکت و رشد روحانی در خداوند عیسی مسیح."}
                    </p>
                    <div className="flex items-center gap-4">
                        <a
                            href="https://www.youtube.com/@IranianChristianChurchDC"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="کانال یوتیوب کلیسا"
                            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                            <Youtube className="w-5 h-5" aria-hidden="true" />
                        </a>
                        <a
                            href="https://www.instagram.com/iranianchurchdc"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="صفحه اینستاگرام کلیسا"
                            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                            <Instagram className="w-5 h-5" aria-hidden="true" />
                        </a>
                        <a
                            href="mailto:info@iranianchristianchurchdc.com"
                            aria-label="ارسال ایمیل به کلیسا"
                            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                            <Mail className="w-5 h-5" aria-hidden="true" />
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
                        <li><Link href="/prayers" className="hover:text-primary transition-colors">{t?.prayers || "درخواست دعا"}</Link></li>
                        <li><Link href="/payment" className="hover:text-primary transition-colors">{t?.payment || "پرداخت آنلاین"}</Link></li>
                    </ul>
                </div>

                {/* Contact info */}
                <div className="space-y-6">
                    <h4 className="font-bold text-lg">{t?.contact || "ارتباط با ما"}</h4>
                    <address className="space-y-4 text-sm font-medium text-muted-foreground not-italic">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                            <span dir="ltr">10613 Georgia Ave, Silver Spring, MD 20902</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                            <a href="tel:+13016497086" dir="ltr" className="hover:text-primary transition-colors">+1 (301) 649-7086</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                            <a href="mailto:info@iranianchristianchurchdc.com" dir="ltr" className="hover:text-primary transition-colors">info@iranianchristianchurchdc.com</a>
                        </div>
                    </address>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-16 pt-8 border-t border-white/5 flex flex-col lg:flex-row items-center justify-between text-xs text-muted-foreground font-medium gap-6 pb-6 relative z-10">
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
