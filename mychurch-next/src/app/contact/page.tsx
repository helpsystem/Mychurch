"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useLanguage } from "@/providers/LanguageProvider";
import { PageVisuals } from "@/components/ui/PageVisuals";
import {
    MapPin, Phone, Mail, Clock, Send, MessageSquare, Heart, Users
} from "lucide-react";

export default function ContactPage() {
    const { t } = useLanguage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formType, setFormType] = useState<"message" | "prayer">("message");
    const [selectedLeader, setSelectedLeader] = useState<string>("general");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            alert("پیام شما با موفقیت ارسال شد.");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30 font-sans flex flex-col">
            <PublicHeader />

            <PageVisuals soft />

            <main className="relative z-10 flex-1 pt-32 pb-24 px-6 lg:px-12 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="mb-16 text-center lg:text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 shadow-sm backdrop-blur-md mb-6 mx-auto lg:mr-0 lg:ml-auto">
                        ارتباط با ما
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 leading-[1.1] drop-shadow-sm mb-6">
                        با کلیسای خود <br className="hidden md:block" /> در تماس باشید
                    </h1>
                    <p className="text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed mx-auto lg:mr-0 lg:ml-auto">
                        ما همیشه مشتاق شنیدن صدای شما، دریافت درخواست‌های دعای شما و پاسخگویی به سوالات شما هستیم.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Contact Form */}
                    <div className="glass p-8 md:p-10 rounded-3xl relative overflow-hidden order-2 lg:order-1">
                        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-primary/10 blur-[50px] pointer-events-none" />
                        {/* Tab Switcher */}
                        <div className="flex bg-secondary/30 p-1.5 rounded-2xl mb-8 relative z-10 w-full">
                            <button
                                type="button"
                                onClick={() => setFormType("message")}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${formType === "message" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                ارسال پیام
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormType("prayer")}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${formType === "prayer" ? "bg-emerald-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
                            >
                                <Heart className="w-4 h-4" />
                                درخواست دعا
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {/* Message Type: Leader Selection */}
                            {formType === "message" && (
                                <div className="space-y-3 mb-6">
                                    <label className="text-sm font-medium text-muted-foreground">دریافت کننده پیام</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedLeader === "general" ? "border-primary bg-primary/10" : "border-white/10 bg-secondary/30 hover:bg-white/5"}`}>
                                            <input type="radio" name="leader" value="general" className="hidden" checked={selectedLeader === "general"} onChange={(e) => setSelectedLeader(e.target.value)} />
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <Users className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground">تیم پشتیبانی</span>
                                                <span className="text-xs text-muted-foreground">عمومی کلیسا</span>
                                            </div>
                                        </label>

                                        <label className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedLeader === "javad" ? "border-primary bg-primary/10" : "border-white/10 bg-secondary/30 hover:bg-white/5"}`}>
                                            <input type="radio" name="leader" value="javad" className="hidden" checked={selectedLeader === "javad"} onChange={(e) => setSelectedLeader(e.target.value)} />
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                                                <Image src="/images/pastor-javad-real.png" alt="Rev Javad" fill className="object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground">کشیش جواد</span>
                                                <span className="text-xs text-primary">شبان ارشد</span>
                                            </div>
                                        </label>

                                        <label className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedLeader === "nazi" ? "border-primary bg-primary/10" : "border-white/10 bg-secondary/30 hover:bg-white/5"}`}>
                                            <input type="radio" name="leader" value="nazi" className="hidden" checked={selectedLeader === "nazi"} onChange={(e) => setSelectedLeader(e.target.value)} />
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
                                                <Image src="/images/leader-nazi-real.png" alt="Nazi Rasti" fill className="object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground">نازی رستی</span>
                                                <span className="text-xs text-purple-400">امور بانوان</span>
                                            </div>
                                        </label>

                                        <label className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedLeader === "saman" ? "border-primary bg-primary/10" : "border-white/10 bg-secondary/30 hover:bg-white/5"}`}>
                                            <input type="radio" name="leader" value="saman" className="hidden" checked={selectedLeader === "saman"} onChange={(e) => setSelectedLeader(e.target.value)} />
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-white/10">
                                                <span className="text-emerald-500 font-bold text-sm">s.a</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground">سامان آبیار</span>
                                                <span className="text-xs text-emerald-500">مدیریت فنی</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Prayer Type: Category Selection */}
                            {formType === "prayer" && (
                                <div className="space-y-2 mb-6">
                                    <label className="text-sm font-medium text-muted-foreground">دسته‌بندی دعای شما</label>
                                    <select className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-foreground appearance-none">
                                        <option value="healing">شفا و مسیر درمان (Healing)</option>
                                        <option value="guidance">راهنمایی و تصمیم‌گیری (Guidance)</option>
                                        <option value="family">خانواده و ازدواج (Family)</option>
                                        <option value="thanksgiving">شکرگزاری و آرامش (Thanksgiving)</option>
                                        <option value="other">سایر نیازهای روحانی (Other)</option>
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">نام و نام خانوادگی</label>
                                    <input required type="text" className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground" placeholder="سامان آبیار" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">ایمیل کاربر</label>
                                    <input required type="email" className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground text-left" dir="ltr" placeholder="iman@example.com" />
                                </div>
                            </div>

                            {formType === "message" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">موضوع (اختیاری)</label>
                                    <input type="text" className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground" placeholder="سوال کلیسایی، پیشنهاد..." />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">{formType === "message" ? "متن پیام" : "درخواست دعای شما"}</label>
                                <textarea required rows={4} className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground resize-none" placeholder={formType === "message" ? "پیام خود را به رهبر مربوطه اینجا بنویسید..." : "با ایمان کامل، دعای خود را اینجا به اشتراک بگذارید تا با هم برای آن شفاعت کنیم..."}></textarea>
                            </div>

                            <button disabled={isSubmitting} type="submit" className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${formType === "prayer" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}>
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {formType === "message" ? "ارسال پیام" : "ثبت درخواست دعا"}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Info Blocks */}
                    <div className="space-y-6 order-1 lg:order-2">
                        <div className="glass p-8 rounded-3xl flex flex-col gap-6 items-start hover:border-primary/50 transition-colors">
                            <div className="flex gap-6 w-full items-start">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <MapPin className="w-7 h-7 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-2">آدرس کلیسا</h4>
                                    <p className="text-muted-foreground leading-relaxed italic font-serif" dir="ltr">
                                        10613 Georgia Ave,<br />Silver Spring, MD 20902, USA
                                    </p>
                                </div>
                            </div>

                            {/* Map Action Buttons */}
                            <div className="flex gap-3 mt-2 w-full rlt:mr-20 ltr:ml-20" dir="ltr">
                                <a href="https://www.google.com/maps/place/10613+Georgia+Ave,+Silver+Spring,+MD+20902/" target="_blank" rel="noopener" className="flex-1 bg-white/5 hover:bg-white/10 text-xs text-foreground py-2 px-3 rounded-xl border border-white/10 text-center transition-colors font-medium">Google Maps</a>
                                <a href="http://maps.apple.com/?q=10613+Georgia+Ave,+Silver+Spring,+MD+20902" target="_blank" rel="noopener" className="flex-1 bg-white/5 hover:bg-white/10 text-xs text-foreground py-2 px-3 rounded-xl border border-white/10 text-center transition-colors font-medium">Apple Maps</a>
                                <a href="https://waze.com/ul?ll=39.03362147954972,-77.03050181535492&navigate=yes" target="_blank" rel="noopener" className="flex-1 bg-white/5 hover:bg-white/10 text-xs text-foreground py-2 px-3 rounded-xl border border-white/10 text-center transition-colors font-medium">Waze</a>
                            </div>
                        </div>

                        <div className="glass p-8 rounded-3xl flex gap-6 items-start hover:border-primary/50 transition-colors">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Phone className="w-7 h-7 text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold mb-2">اطلاعات تماس</h4>
                                <p className="text-muted-foreground leading-relaxed font-serif" dir="ltr">
                                    +1 (301) 649-7086<br />
                                    info@iranianchristianchurchdc.com
                                </p>
                            </div>
                        </div>

                        <div className="glass p-8 rounded-3xl flex gap-6 items-start hover:border-primary/50 transition-colors relative overflow-hidden">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                                <Clock className="w-7 h-7 text-emerald-500" />
                            </div>
                            <div className="relative z-10 w-full">
                                <h4 className="text-xl font-bold mb-2">ساعات جلسات</h4>
                                <ul className="space-y-3 text-muted-foreground font-medium w-full">
                                    <li className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span>جلسه اصلی یکشنبه‌ها:</span>
                                        <span className="text-foreground bg-secondary/50 px-2 py-0.5 rounded text-sm" dir="ltr">1:00 PM (EST)</span>
                                    </li>
                                    <li className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span>مطالعه کتاب مقدس (هفتگی):</span>
                                        <span className="text-foreground bg-secondary/50 px-2 py-0.5 rounded text-sm min-w-max text-center" dir="ltr">7:30 PM (EST)</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="absolute right-0 bottom-0 top-0 w-1 bg-gradient-to-b from-emerald-500/50 to-transparent" />
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
