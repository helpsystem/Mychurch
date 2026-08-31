"use client";

import React, { useEffect } from "react";
import { useCart } from "@/providers/CartProvider";
import { useLanguage } from "@/providers/LanguageProvider";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
    const { clearCart } = useCart();
    const { isRTL, language } = useLanguage();
    const searchParams = useSearchParams();
    const sessionId = searchParams?.get("session_id");

    // Clear cart on mount
    useEffect(() => {
        clearCart();
    }, []);

    const d = {
        en: {
            title: "Thank You for Your Order!",
            subtitle: "Your payment was processed successfully. We are preparing your package.",
            orderId: "Stripe Session Reference:",
            desc: "A receipt containing order details and shipping tracking information has been sent to your email address.",
            backToStore: "Continue Shopping",
        },
        fa: {
            title: "با تشکر از خرید شما!",
            subtitle: "پرداخت شما با موفقیت انجام شد. ما در حال آماده‌سازی بسته شما هستیم.",
            orderId: "کد پیگیری پرداخت:",
            desc: "رسید خرید شما شامل جزئیات سفارش و اطلاعات رهگیری مرسوله پستی به آدرس ایمیل شما ارسال گردیده است.",
            backToStore: "بازگشت به فروشگاه",
        }
    }[language] || {
        en: {
            title: "Thank You for Your Order!",
            subtitle: "Your payment was processed successfully. We are preparing your package.",
            orderId: "Stripe Session Reference:",
            desc: "A receipt containing order details and shipping tracking information has been sent to your email address.",
            backToStore: "Continue Shopping",
        },
        fa: {
            title: "با تشکر از خرید شما!",
            subtitle: "پرداخت شما با موفقیت انجام شد. ما در حال آماده‌سازی بسته شما هستیم.",
            orderId: "کد پیگیری پرداخت:",
            desc: "رسید خرید شما شامل جزئیات سفارش و اطلاعات رهگیری مرسوله پستی به آدرس ایمیل شما ارسال گردیده است.",
            backToStore: "بازگشت به فروشگاه",
        }
    }.fa;

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
            <div className="max-w-md w-full space-y-8 bg-zinc-900 border border-zinc-800 p-8 sm:p-10 rounded-3xl text-center shadow-2xl">
                <div className="flex flex-col items-center">
                    <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                    <h2 className="mt-6 text-3xl font-extrabold text-white font-[Vazirmatn]">
                        {d.title}
                    </h2>
                    <p className="mt-3 text-sm text-zinc-400 font-[Vazirmatn]">
                        {d.subtitle}
                    </p>
                </div>

                <div className="mt-8 border-t border-b border-zinc-800 py-6 space-y-4">
                    {sessionId && (
                        <div className="text-[10px] text-zinc-500 font-mono text-center overflow-x-auto whitespace-nowrap scrollbar-thin max-w-full">
                            <span className="font-semibold block text-zinc-400 mb-1 font-[Vazirmatn]">{d.orderId}</span>
                            {sessionId}
                        </div>
                    )}
                    <p className="text-sm text-zinc-300 leading-relaxed font-[Vazirmatn]">
                        {d.desc}
                    </p>
                </div>

                <div className="mt-8">
                    <Link
                        href="/store"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg font-[Vazirmatn]"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span>{d.backToStore}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
