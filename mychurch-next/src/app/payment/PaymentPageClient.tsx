"use client";

import React, { useState } from "react";
import { PaymentConfigClient } from "@/actions/payment-config";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface PaymentPageClientProps {
    config: PaymentConfigClient;
    status: string | null;
}

export default function PaymentPageClient({ config, status }: PaymentPageClientProps) {
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleCheckout = async () => {
        setIsRedirecting(true);
        try {
            const response = await fetch("/api/payments/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    const amountLabel = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: config.currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(config.monthly_amount);

    return (
        <div className="min-h-[100dvh] bg-[#050816] text-white px-4 py-10 flex items-center justify-center">
            <div className="w-full max-w-3xl space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/30 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">{config.display_name_fa} / {config.display_name_en}</h1>
                            <p className="text-white/60 mt-1">پرداخت ماهانه امن / Secure monthly payment</p>
                        </div>
                    </div>

                    {status === "success" && (
                        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 mt-0.5" />
                            <div>
                                <p className="font-bold">پرداخت با موفقیت شروع/تکمیل شد</p>
                                <p className="text-sm text-emerald-100/80">Your payment was completed or confirmed successfully.</p>
                            </div>
                        </div>
                    )}

                    {status === "cancelled" && (
                        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5" />
                            <div>
                                <p className="font-bold">پرداخت لغو شد</p>
                                <p className="text-sm text-amber-100/80">Payment was cancelled. You can try again anytime.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Amount / مبلغ</p>
                            <p className="text-3xl font-black text-emerald-400">{amountLabel}</p>
                            <p className="text-sm text-white/60 mt-2">{config.checkout_mode === "subscription" ? "Recurring monthly" : "One-time payment"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-2">Status / وضعیت</p>
                            <p className={`text-2xl font-black ${config.enabled ? "text-emerald-400" : "text-red-400"}`}>
                                {config.enabled ? "Active / فعال" : "Inactive / غیرفعال"}
                            </p>
                            <p className="text-sm text-white/60 mt-2">{config.description_fa} / {config.description_en}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={!config.enabled || isRedirecting}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 font-black text-black transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRedirecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                        {isRedirecting ? "Redirecting..." : "Subscribe Monthly / پرداخت ماهانه"}
                    </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                    <p className="font-bold text-white mb-2">Security note / نکته امنیتی</p>
                    <p>Provider secret keys stay on the server. Use sandbox tokens for testing and update the admin settings to switch providers.</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-100/90">
                    <p className="font-bold mb-2">Gift Display Status / وضعیت نمایشی هدایا</p>
                    <p>After gift checkout starts and when payment returns, events are logged for Admin and Leader notifications in the Gifts section.</p>
                </div>
            </div>
        </div>
    );
}
