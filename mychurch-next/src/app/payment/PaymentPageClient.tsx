"use client";

import React, { useState } from "react";
import { PaymentConfigClient } from "@/actions/payment-config";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, ShieldCheck, Heart, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/providers/LanguageProvider";

interface PaymentPageClientProps {
    config: PaymentConfigClient;
    status: string | null;
}

const localDict = {
    en: {
        invalidAmount: "Please enter a valid amount.",
        checkoutFailed: "Failed to start payment flow.",
        checkoutFailedGeneric: "Could not start payment flow.",
        paymentSuccessTitle: "Payment Completed Successfully",
        paymentSuccessDesc: "Thank you for your support. A payment receipt will be sent to your email.",
        paymentCancelledTitle: "Payment Cancelled",
        paymentCancelledDesc: "The payment process was stopped. You can try again at any time.",
        gatewayDisabledTitle: "Payment Gateway Disabled",
        gatewayDisabledDesc: "Online gift processing is currently unavailable. Please check back later.",
        amountLabel: "Amount Paid (USD)",
        subscriptionMode: "Monthly (Recurring) Payment",
        oneTimeMode: "One-Time Payment",
        messageLabel: "Your Inspiring Message or Blessing",
        messagePlaceholder: "Write a message of love or a prayer of blessing...",
        gatewayNoticeTitle: "Payment Gateway Notice",
        gatewayNoticeBody: "The MyStudioInk payment gateway is temporarily active on the site and is fully secure and verified. It will soon be replaced by the church's official gateway.",
        gatewayNoticeSub: "Note: The MyStudioInk payment gateway is temporarily active and fully secure. The official church gateway will be placed here soon.",
        secureTitle: "Secure, Encrypted Payment",
        secureDesc: "All transactions are processed by the secure gateway with the highest level of security.",
        privacyTitle: "Privacy Protected",
        privacyDesc: "Your bank card information is never stored on the church's servers.",
        redirecting: "Redirecting to secure gateway...",
        proceedToSecurePayment: "Proceed to Secure Payment",
        backToHome: "Back to Church Homepage",
        customPlaceholder: "Custom",
    },
    fa: {
        invalidAmount: "لطفاً یک مبلغ معتبر وارد کنید / Please enter a valid amount",
        checkoutFailed: "Failed to start payment flow",
        checkoutFailedGeneric: "Could not start payment flow",
        paymentSuccessTitle: "پرداخت با موفقیت انجام شد",
        paymentSuccessDesc: "از حمایت شما سپاسگزاریم. رسید پرداخت به ایمیل شما ارسال خواهد شد.",
        paymentCancelledTitle: "پرداخت لغو شد",
        paymentCancelledDesc: "فرآیند پرداخت متوقف شد. شما می‌توانید در هر زمان دوباره تلاش کنید.",
        gatewayDisabledTitle: "درگاه پرداخت غیرفعال است",
        gatewayDisabledDesc: "در حال حاضر امکان دریافت هدایا از طریق سیستم آنلاین وجود ندارد. لطفاً بعداً مراجعه کنید.",
        amountLabel: "مبلغ پرداختی (دلار) / Amount (USD)",
        subscriptionMode: "پرداخت ماهانه (تکرار شونده)",
        oneTimeMode: "پرداخت یک‌باره",
        messageLabel: "پیام الهام‌بخش یا دعای برکت شما / Your Inspiring Message",
        messagePlaceholder: "پیام محبت‌آمیز یا دعای برکت خود را بنویسید... / Write your message of blessing...",
        gatewayNoticeTitle: "توجه درگاه پرداخت",
        gatewayNoticeBody: "در حال حاضر درگاه پرداخت MyStudioInk به صورت موقت روی سایت فعال است و کاملاً امن و تایید شده می‌باشد. به زودی درگاه رسمی کلیسا جایگزین آن خواهد شد.",
        gatewayNoticeSub: "Note: The MyStudioInk payment gateway is temporarily active and fully secure. The official church gateway will be placed here soon.",
        secureTitle: "پرداخت امن و رمزنگاری شده",
        secureDesc: "تمامی تراکنش‌ها توسط درگاه امن {provider} با بالاترین سطح امنیت پردازش می‌شوند.",
        privacyTitle: "حفظ حریم خصوصی",
        privacyDesc: "اطلاعات کارت بانکی شما هرگز در سرورهای کلیسا ذخیره نخواهد شد.",
        redirecting: "در حال انتقال به درگاه امن...",
        proceedToSecurePayment: "ورود به صفحه پرداخت امن",
        backToHome: "بازگشت به صفحه اصلی کلیسا",
        customPlaceholder: "Custom",
    },
    es: {
        invalidAmount: "Por favor ingrese un monto válido.",
        checkoutFailed: "No se pudo iniciar el proceso de pago.",
        checkoutFailedGeneric: "No se pudo iniciar el proceso de pago.",
        paymentSuccessTitle: "Pago Realizado con Éxito",
        paymentSuccessDesc: "Gracias por su apoyo. Se enviará un recibo de pago a su correo electrónico.",
        paymentCancelledTitle: "Pago Cancelado",
        paymentCancelledDesc: "El proceso de pago se detuvo. Puede intentarlo de nuevo en cualquier momento.",
        gatewayDisabledTitle: "Pasarela de Pago Deshabilitada",
        gatewayDisabledDesc: "Actualmente no es posible recibir donaciones a través del sistema en línea. Por favor, vuelva más tarde.",
        amountLabel: "Monto a Pagar (USD)",
        subscriptionMode: "Pago Mensual (Recurrente)",
        oneTimeMode: "Pago Único",
        messageLabel: "Su Mensaje Inspirador o Bendición",
        messagePlaceholder: "Escriba un mensaje de amor o una oración de bendición...",
        gatewayNoticeTitle: "Aviso de la Pasarela de Pago",
        gatewayNoticeBody: "La pasarela de pago MyStudioInk está activa temporalmente en el sitio y es completamente segura y verificada. Pronto será reemplazada por la pasarela oficial de la iglesia.",
        gatewayNoticeSub: "Nota: La pasarela de pago MyStudioInk está activa temporalmente y es completamente segura. La pasarela oficial de la iglesia se colocará aquí pronto.",
        secureTitle: "Pago Seguro y Cifrado",
        secureDesc: "Todas las transacciones son procesadas por la pasarela segura {provider} con el más alto nivel de seguridad.",
        privacyTitle: "Privacidad Protegida",
        privacyDesc: "La información de su tarjeta bancaria nunca se almacena en los servidores de la iglesia.",
        redirecting: "Redirigiendo a la pasarela segura...",
        proceedToSecurePayment: "Ir a la Página de Pago Segura",
        backToHome: "Volver a la Página Principal de la Iglesia",
        customPlaceholder: "Personalizado",
    },
};

export default function PaymentPageClient({ config, status }: PaymentPageClientProps) {
    const { language, isRTL } = useLanguage();
    const d = localDict[language] || localDict.fa;
    const searchParams = useSearchParams();
    const initialMessage = searchParams?.get("message") || "";

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [amountInput, setAmountInput] = useState(String(config.monthly_amount || "25"));
    const [message, setMessage] = useState(initialMessage);

    const handleCheckout = async () => {
        const amt = Number(amountInput);
        if (!amt || isNaN(amt) || amt <= 0) {
            toast.error(d.invalidAmount);
            return;
        }

        setIsRedirecting(true);
        try {
            const response = await fetch("/api/payments/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: amt, message: message })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || d.checkoutFailed);
            }

            if (data.url) {
                window.location.href = data.url;
                return;
            }

            throw new Error("Payment URL not returned");
        } catch (error: any) {
            toast.error(error.message || d.checkoutFailedGeneric);
            setIsRedirecting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative flex flex-col font-sans overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
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
                                <p className="font-bold text-lg text-emerald-200">{d.paymentSuccessTitle}</p>
                                <p className="text-sm text-emerald-100/70 mt-1">{d.paymentSuccessDesc}</p>
                            </div>
                        </div>
                    )}

                    {status === "cancelled" && (
                        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4 shadow-lg shadow-amber-500/5 animate-fade-in-up">
                            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-amber-200">{d.paymentCancelledTitle}</p>
                                <p className="text-sm text-amber-100/70 mt-1">{d.paymentCancelledDesc}</p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-[2.5rem] border border-white/10 bg-secondary/40 backdrop-blur-xl shadow-2xl p-8 relative overflow-hidden">
                        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px]" />
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-pink-500/10 blur-[80px]" />
                        
                        {!config.enabled && (
                            <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem]">
                                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                                <h3 className="text-2xl font-bold mb-2">{d.gatewayDisabledTitle}</h3>
                                <p className="text-muted-foreground font-medium">{d.gatewayDisabledDesc}</p>
                            </div>
                        )}

                        <div className="text-center mb-8 relative z-10">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">{d.amountLabel}</p>
                            
                            {/* Preset Buttons Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
                                {[10, 25, 50, 100, 250, 500].map((preset) => {
                                    const isSelected = Number(amountInput) === preset;
                                    return (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setAmountInput(String(preset))}
                                            className={`py-3.5 px-4 rounded-2xl text-lg font-black font-sans transition-all duration-300 border ${
                                                isSelected
                                                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-[1.03]"
                                                    : "bg-neutral-950/40 border-white/5 hover:border-white/20 text-white/70 hover:text-white"
                                            }`}
                                        >
                                            ${preset}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Amount Input container */}
                            <div className="relative max-w-xs mx-auto mb-6">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <span className="text-xl font-bold text-muted-foreground font-sans">$</span>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={amountInput}
                                    onChange={(e) => setAmountInput(e.target.value)}
                                    className="w-full bg-neutral-950/60 border border-white/10 rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-2xl font-black text-white text-center font-sans tracking-wide"
                                    placeholder={d.customPlaceholder}
                                />
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/80">
                                {config.checkout_mode === "subscription" ? d.subscriptionMode : d.oneTimeMode}
                            </div>
                        </div>

                        {/* Inspiring Message Input */}
                        <div className="space-y-2 mb-6 relative z-10 text-right">
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mr-1 mb-1">
                                {d.messageLabel}
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={d.messagePlaceholder}
                                rows={3}
                                className="w-full bg-neutral-950/60 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium leading-relaxed font-sans"
                            />
                        </div>

                        {/* Gateway Disclaimer Notice */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-right mb-6 relative z-10">
                            <AlertCircle className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-bold text-sm text-amber-200">{d.gatewayNoticeTitle}</p>
                                <p className="text-xs text-amber-100/70 mt-1 leading-relaxed font-medium">
                                    {d.gatewayNoticeBody}
                                </p>
                                <p className="text-[10px] text-amber-100/50 mt-1 leading-relaxed font-sans" dir="ltr">
                                    {d.gatewayNoticeSub}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 relative z-10">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">{d.secureTitle}</p>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">{d.secureDesc.replace("{provider}", config.provider === "square" ? "Square" : "Stripe")}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-background/50 border border-white/5">
                                <Lock className="w-6 h-6 text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold text-sm">{d.privacyTitle}</p>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">{d.privacyDesc}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={!config.enabled || isRedirecting}
                            className="w-full relative z-10 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 font-black text-white transition-all hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-indigo-600/20"
                        >
                            {isRedirecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                            {isRedirecting ? d.redirecting : d.proceedToSecurePayment}
                        </button>
                    </div>
                    
                    <div className="mt-8 text-center flex items-center justify-center gap-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-bold">
                            <ArrowRight className="w-4 h-4" /> {d.backToHome}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
