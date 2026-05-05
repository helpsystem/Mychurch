"use client";

import React, { useState } from "react";
import { PaymentConfigClient, updatePaymentConfig } from "@/actions/payment-config";
import { AlertCircle, CheckCircle2, CreditCard, EyeOff, KeyRound, Save, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface PaymentSettingsClientProps {
    initialConfig: PaymentConfigClient;
}

export default function PaymentSettingsClient({ initialConfig }: PaymentSettingsClientProps) {
    const [config, setConfig] = useState<PaymentConfigClient>(initialConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [secretKeyInput, setSecretKeyInput] = useState("");

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePaymentConfig({
                ...config,
                stripe_secret_key: secretKeyInput || null,
            });
            setSecretKeyInput("");
            toast.success("Payment settings saved successfully");
        } catch (error: any) {
            toast.error(error.message || "Failed to save payment settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-8">
            <section className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12">
                    <CreditCard size={120} />
                </div>

                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Stripe Payments</h2>
                            <p className="text-sm text-muted-foreground">Temporary personal connection now, easy switch to church later.</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-bold ${config.enabled ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-white/60"}`}
                    >
                        {config.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {config.enabled ? "Enabled / فعال" : "Disabled / غیرفعال"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Connection Mode</label>
                        <select
                            value={config.checkout_mode}
                            onChange={(e) => setConfig({ ...config, checkout_mode: e.target.value as PaymentConfigClient["checkout_mode"] })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                        >
                            <option value="subscription">Monthly Subscription / اشتراک ماهانه</option>
                            <option value="payment">One-time Payment / پرداخت یک‌باره</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Currency</label>
                        <input
                            value={config.currency}
                            onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="usd"
                        />
                    </div>
                </div>
            </section>

            <section className="bg-neutral-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Monthly Amount</label>
                        <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={config.monthly_amount}
                            onChange={(e) => setConfig({ ...config, monthly_amount: Number(e.target.value) })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="25"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Payment Link URL</label>
                        <input
                            value={config.payment_link_url || ""}
                            onChange={(e) => setConfig({ ...config, payment_link_url: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="https://buy.stripe.com/..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Display Name - English</label>
                        <input
                            value={config.display_name_en}
                            onChange={(e) => setConfig({ ...config, display_name_en: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="Monthly Support"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Display Name - Farsi</label>
                        <input
                            value={config.display_name_fa}
                            onChange={(e) => setConfig({ ...config, display_name_fa: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="حمایت ماهانه"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Description - English</label>
                        <textarea
                            value={config.description_en}
                            onChange={(e) => setConfig({ ...config, description_en: e.target.value })}
                            rows={4}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="Secure monthly contribution"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Description - Farsi</label>
                        <textarea
                            value={config.description_fa}
                            onChange={(e) => setConfig({ ...config, description_fa: e.target.value })}
                            rows={4}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="پرداخت ماهانه امن و قابل تنظیم"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
                            <KeyRound className="w-3 h-3" /> Publishable Key
                        </label>
                        <input
                            type="password"
                            value={config.stripe_publishable_key || ""}
                            onChange={(e) => setConfig({ ...config, stripe_publishable_key: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white font-mono"
                            placeholder="pk_test_..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
                            <EyeOff className="w-3 h-3" /> Secret Key
                        </label>
                        <input
                            type="password"
                            value={secretKeyInput}
                            onChange={(e) => setSecretKeyInput(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white font-mono"
                            placeholder={config.stripe_secret_key_configured ? "Leave blank to keep existing secret" : "sk_test_..."}
                        />
                        <p className="text-[10px] text-muted-foreground pl-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Only admins can update this key. It is never shown back in the UI.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Success Path</label>
                        <input
                            value={config.success_path}
                            onChange={(e) => setConfig({ ...config, success_path: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="/payment?status=success"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">Cancel Path</label>
                        <input
                            value={config.cancel_path}
                            onChange={(e) => setConfig({ ...config, cancel_path: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm text-white"
                            placeholder="/payment?status=cancelled"
                        />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 space-y-2">
                    <p className="font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Deployment note</p>
                    <p>Use your personal Stripe now, then switch keys and payment link later for the church without changing the public page.</p>
                    <p className="text-white/60">برای جلوگیری از خطا، کلید secret فقط روی سرور نگه‌داری می‌شود و در UI نمایش داده نمی‌شود.</p>
                </div>
            </section>

            <div className="sticky bottom-8 z-30 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:scale-95"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    SAVE PAYMENT CONFIGURATION
                </button>
            </div>
        </div>
    );
}
