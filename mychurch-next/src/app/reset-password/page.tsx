"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { PageVisuals } from "@/components/ui/PageVisuals";

type PageState = "loading" | "form" | "success" | "no-session";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [pageState, setPageState] = useState<PageState>("loading");
    const [isPending, startTransition] = useTransition();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const checkSession = async () => {
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!isMounted) return;
            if (session) {
                setPageState("form");
            } else {
                setPageState("no-session");
            }
        };
        void checkSession();
        return () => { isMounted = false; };
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("رمز عبور باید حداقل ۸ کاراکتر باشد / Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("رمز عبور و تکرار آن یکسان نیستند / Passwords do not match.");
            return;
        }

        startTransition(async () => {
            try {
                const { createClient } = await import("@/utils/supabase/client");
                const supabase = createClient();
                const { error: updateError } = await supabase.auth.updateUser({ password });

                if (updateError) {
                    setError(updateError.message);
                    return;
                }

                // Sign out after password reset for security
                await supabase.auth.signOut();
                setPageState("success");

                setTimeout(() => {
                    router.push("/login?reset=success");
                }, 3000);
            } catch (err: any) {
                setError(err.message || "خطای غیرمنتظره / Unexpected error.");
            }
        });
    };

    // Password strength indicator
    const getStrength = (pw: string): { score: number; label: string; color: string } => {
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { score, label: "ضعیف / Weak", color: "bg-red-500" };
        if (score <= 2) return { score, label: "متوسط / Fair", color: "bg-yellow-500" };
        if (score <= 3) return { score, label: "خوب / Good", color: "bg-blue-500" };
        return { score, label: "قوی / Strong", color: "bg-emerald-500" };
    };

    const strength = getStrength(password);

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 font-sans relative overflow-hidden selection:bg-primary/30 px-4 py-8">
            <PageVisuals />

            <div className="relative z-10 w-full max-w-md">
                <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 mb-6 ring-1 ring-white/10 shadow-inner">
                            <Image src="/logo-transparent.png" alt="MyChurch Logo" width={50} height={50} className="object-contain" />
                        </div>

                        {pageState === "loading" && (
                            <h1 className="text-xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                در حال بررسی...
                                <span className="block text-sm font-medium text-white/60 mt-1 font-sans">Verifying session</span>
                            </h1>
                        )}
                        {pageState === "form" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                تعیین رمز عبور جدید
                                <span className="block text-sm font-medium text-white/80 mt-1 font-sans">Set New Password</span>
                            </h1>
                        )}
                        {pageState === "success" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                رمز تغییر کرد!
                                <span className="block text-sm font-medium text-emerald-400 mt-1 font-sans">Password Updated!</span>
                            </h1>
                        )}
                        {pageState === "no-session" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                لینک نامعتبر
                                <span className="block text-sm font-medium text-red-400 mt-1 font-sans">Invalid or Expired Link</span>
                            </h1>
                        )}
                    </div>

                    {/* ───── LOADING ───── */}
                    {pageState === "loading" && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    )}

                    {/* ───── NO SESSION ───── */}
                    {pageState === "no-session" && (
                        <div className="text-center space-y-5 animate-in fade-in duration-500">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-red-950/60 border-2 border-red-500/40 flex items-center justify-center">
                                    <AlertCircle className="w-10 h-10 text-red-400" />
                                </div>
                            </div>
                            <div className="bg-red-950/40 border border-red-400/30 rounded-xl p-4 text-sm text-red-200 font-[Vazirmatn] leading-relaxed text-right" dir="rtl">
                                <p className="font-bold mb-1">لینک بازیابی نامعتبر یا منقضی شده است.</p>
                                <p className="text-red-300/70">لطفاً دوباره از صفحه ورود درخواست بازیابی رمز عبور بدهید.</p>
                            </div>
                            <p className="text-xs text-white/40 font-sans" dir="ltr">
                                The recovery link is invalid or has expired. Please request a new one from the login page.
                            </p>
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-xl transition-all active:scale-[0.98] font-[Vazirmatn]"
                            >
                                بازگشت به ورود / Back to Login
                            </button>
                        </div>
                    )}

                    {/* ───── SUCCESS ───── */}
                    {pageState === "success" && (
                        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-emerald-950/60 border-2 border-emerald-500/40 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                            </div>
                            <div className="space-y-2" dir="rtl">
                                <p className="text-white font-black text-lg font-[Vazirmatn]">رمز عبور با موفقیت تغییر کرد!</p>
                                <p className="text-white/60 text-sm font-[Vazirmatn]">
                                    در حال انتقال به صفحه ورود...
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-sans">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Redirecting to login...
                            </div>
                        </div>
                    )}

                    {/* ───── RESET FORM ───── */}
                    {pageState === "form" && (
                        <>
                            {/* Security notice */}
                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6">
                                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-sm text-white/80 font-[Vazirmatn]" dir="rtl">
                                    یک رمز عبور قوی و منحصربه‌فرد انتخاب کنید.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-5 bg-red-950/70 border border-red-400/40 text-red-200 px-4 py-3 rounded-xl text-sm font-bold text-center font-[Vazirmatn] animate-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5" dir="ltr">
                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-white/90 flex justify-between font-[Vazirmatn]" htmlFor="new-password">
                                        <span className="font-sans text-white/90">New Password</span>
                                        <span>رمز عبور جدید</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                                        <input
                                            id="new-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="حداقل ۸ کاراکتر / Min 8 characters"
                                            required
                                            minLength={8}
                                            autoFocus
                                            className="w-full bg-neutral-900/90 border border-white/25 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-all shadow-inner font-mono tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Strength meter */}
                                    {password.length > 0 && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-white/10"}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className={`text-xs font-bold font-sans ${strength.score <= 1 ? "text-red-400" : strength.score <= 2 ? "text-yellow-400" : strength.score <= 3 ? "text-blue-400" : "text-emerald-400"}`}>
                                                {strength.label}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-white/90 flex justify-between font-[Vazirmatn]" htmlFor="confirm-password">
                                        <span className="font-sans text-white/90">Confirm Password</span>
                                        <span>تکرار رمز</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                                        <input
                                            id="confirm-password"
                                            name="confirm"
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder="تکرار رمز عبور / Repeat password"
                                            required
                                            className={`w-full bg-neutral-900/90 border rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all shadow-inner font-mono tracking-widest ${
                                                confirm.length > 0
                                                    ? confirm === password
                                                        ? "border-emerald-500/50 focus:ring-emerald-500/40"
                                                        : "border-red-500/50 focus:ring-red-500/40"
                                                    : "border-white/25 focus:ring-primary/60 focus:border-primary"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                                            aria-label={showConfirm ? "Hide password" : "Show password"}
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        {/* Match indicator */}
                                        {confirm.length > 0 && (
                                            <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                                {confirm === password
                                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    : <AlertCircle className="w-4 h-4 text-red-400" />
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isPending || password.length < 8 || password !== confirm}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-3 font-[Vazirmatn]"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            در حال ذخیره...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            ذخیره رمز عبور / Save Password
                                        </>
                                    )}
                                </button>

                                {/* Password tips */}
                                <div className="bg-white/4 border border-white/8 rounded-xl p-4 text-xs text-white/50 font-[Vazirmatn] leading-relaxed" dir="rtl">
                                    <p className="font-bold text-white/70 mb-1.5">نکات امنیتی:</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>حداقل ۸ کاراکتر</li>
                                        <li>ترکیب حرف بزرگ، کوچک و عدد</li>
                                        <li>از رمزهای قبلی استفاده نکنید</li>
                                    </ul>
                                </div>
                            </form>
                        </>
                    )}

                    <div className="mt-8 text-center text-xs text-white/70 font-medium border-t border-white/10 pt-6">
                        <p>© {new Date().getFullYear()} Iranian Presbyterian Church of D.C.</p>
                        <p className="mt-1 text-white/60">Secured by Supabase Auth</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
