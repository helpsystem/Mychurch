"use client";

import React, { useState } from "react";
import { PaymentConfigClient } from "@/actions/payment-config";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, ShieldCheck, Heart, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface PaymentPageClientProps {
    config: PaymentConfigClient;
    status: string | null;
}

export default function PaymentPageClient({ config, status }: PaymentPageClientProps) {
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [amountInput, setAmountInput] = useState(String(config.monthly_amount || "25"));

    const handleCheckout = async () => {
        const amt = Number(amountInput);
        if (!amt || isNaN(amt) || amt <= 0) {
            toast.error("لطفاً یک مبلغ معتبر وارد کنید / Please enter a valid amount");
            return;
        }

        setIsRedirecting(true);
        try {
            const response = await fetch("/api/payments/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amt })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "Failed to start payment flow");
            }

            if (data.url) {
                window.location.href = data.url;
                return;
            }

            throw new Error("Payment URL not returned");
        } catch (error: any) {
            toast.error(error.message || "Could not start payment flow");
            setIsRedirecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative flex flex-col font-sans overflow-hidden" dir="rtl">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background" />
            <div className="absolute top-0 w-full h-full bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
            
            <div className="flex-1 flex items-center justify-center p-6 relative z-10 pt-24 pb-12">
                <div className="w-full max-w-xl mx-auto animate-fade-in-up">
                    
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 shadow-inner mb-6">
                            <Heart className="w-8 h-8 text-pink-500 animate-pulse-slow" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{config.display_name_fa}</h1>
                        <p className="text-lg text-muted-foreground">{config.display_name_en}</p>
                    </div>

                    {status === "success" && (
                        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex items-start gap-4 shadow-lg shadow-emerald-500/5 animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-emerald-200">پرداخت با موفقیت انجام شد</p>
                                <p className="text-sm text-emerald-100/70 mt-1">از حمایت شما سپاسگزاریم. رسید پرداخت به ایمیل شما ارسال خواهد شد.</p>
                            </div>
                        </div>
                    )}

                    {status === "cancelled" && (
                        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4 shadow-lg shadow-amber-500/5 animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-amber-200">پرداخت لغو شد</p>
                                <p className="text-sm text-amber-100/70 mt-1">فرآیند پرداخت متوقف شد. شما می‌توانید در هر زمان دوباره تلاش کنید.</p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-[2.5rem] border border-white/10 bg-secondary/40 backdrop-blur-xl shadow-2xl p-8 relative overflow-hidden">
                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px]" />
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-pink-500/10 blur-[80px]" />
                        
                        {!config.enabled && (
                            <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem]">
                                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                                <h3 className="text-2xl font-bold mb-2">درگاه پرداخت غیرفعال است</h3>
                                <p className="text-muted-foreground font-medium">در حال حاضر امکان دریافت هدایا از طریق سیستم آنلاین وجود ندارد. لطفاً بعداً مراجعه کنید.</p>
                            </div>
                        )}

                        <div className="text-center mb-8 relative z-10">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">مبلغ پرداختی (دلار) / Amount (USD)</p>
                            
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <span className="text-4xl md:text-5xl font-black text-muted-foreground font-sans">$</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    className="w-40 bg-neutral-950/60 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-3xl font-black text-white text-center font-sans"
                                    placeholder="25"
                                />
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/80">
                                {config.checkout_mode === "subscription" ? "پرداخت ماهانه (تکرار شونده)" : "پرداخت یک‌باره"}
                            </div>
                        </div>

                        {/* Gateway Disclaimer Notice */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-right mb-6 relative z-10">
                            <AlertCircle className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-bold text-sm text-amber-200">توجه درگاه پرداخت</p>
                                <p className="text-xs text-amber-100/70 mt-1 leading-relaxed font-medium">
                                    در حال حاضر درگاه پرداخت <strong>MyStudioInk</strong> به صورت موقت روی سایت فعال است و کاملاً امن و تایید شده می‌باشد. به زودی درگاه رسمی کلیسا جایگزین آن خواهد شد.
                                </p>
                                <p className="text-[10px] text-amber-100/50 mt-1 leading-relaxed font-sans" dir="ltr">
                                    Note: The MyStudioInk payment gateway is temporarily active and fully secure. The official church gateway will be placed here soon.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 relative z-10">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">پرداخت امن و رمزنگاری شده</p>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">تمامی تراکنش‌ها توسط درگاه امن {config.provider === "square" ? "Square" : "Stripe"} با بالاترین سطح امنیت پردازش می‌شوند.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
                                <Lock className="w-6 h-6 text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">حفظ حریم خصوصی</p>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">اطلاعات کارت بانکی شما هرگز در سرورهای کلیسا ذخیره نخواهد شد.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={!config.enabled || isRedirecting}
                            className="w-full relative z-10 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 font-black text-white transition-all hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-indigo-600/20"
                        >
                            {isRedirecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                            {isRedirecting ? "در حال انتقال به درگاه امن..." : "ورود به صفحه پرداخت امن"}
                        </button>
                    </div>
                    
                    <div className="mt-8 text-center flex items-center justify-center gap-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-bold">
                            <ArrowRight className="w-4 h-4" /> بازگشت به صفحه اصلی کلیسا
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
