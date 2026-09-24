"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { PageVisuals } from "@/components/ui/PageVisuals";
import { useLanguage } from "@/providers/LanguageProvider";

type PageState = "loading" | "form" | "success" | "no-session";

const localDict = {
    en: {
        logoAlt: "MyChurch Logo",
        verifyingTitle: "Verifying...",
        verifyingSubtitle: "Verifying session",
        setNewPasswordTitle: "Set New Password",
        passwordUpdatedTitle: "Password Updated!",
        invalidLinkTitle: "Invalid or Expired Link",
        invalidLinkBody: "The recovery link is invalid or has expired.",
        invalidLinkBodySub: "Please request a new one from the login page.",
        backToLogin: "Back to Login",
        passwordChangedTitle: "Password Updated Successfully!",
        redirectingToLogin: "Redirecting to login...",
        securityNotice: "Choose a strong, unique password.",
        newPasswordLabel: "New Password",
        newPasswordPlaceholder: "Min 8 characters",
        confirmPasswordLabel: "Confirm Password",
        confirmPasswordPlaceholder: "Repeat password",
        showPassword: "Show password",
        hidePassword: "Hide password",
        saving: "Saving...",
        savePassword: "Save Password",
        securityTipsTitle: "Security tips:",
        tipMinChars: "At least 8 characters",
        tipMixCase: "Mix of uppercase, lowercase, and numbers",
        tipNoReuse: "Don't reuse a previous password",
        strengthWeak: "Weak",
        strengthFair: "Fair",
        strengthGood: "Good",
        strengthStrong: "Strong",
        errorMinLength: "Password must be at least 8 characters.",
        errorMismatch: "Passwords do not match.",
        errorUnexpected: "Unexpected error.",
    },
    fa: {
        logoAlt: "لوگوی کلیسا",
        verifyingTitle: "در حال بررسی...",
        verifyingSubtitle: "بررسی نشست",
        setNewPasswordTitle: "تعیین رمز عبور جدید",
        passwordUpdatedTitle: "رمز تغییر کرد!",
        invalidLinkTitle: "لینک نامعتبر",
        invalidLinkBody: "لینک بازیابی نامعتبر یا منقضی شده است.",
        invalidLinkBodySub: "لطفاً دوباره از صفحه ورود درخواست بازیابی رمز عبور بدهید.",
        backToLogin: "بازگشت به ورود",
        passwordChangedTitle: "رمز عبور با موفقیت تغییر کرد!",
        redirectingToLogin: "در حال انتقال به صفحه ورود...",
        securityNotice: "یک رمز عبور قوی و منحصربه‌فرد انتخاب کنید.",
        newPasswordLabel: "رمز عبور جدید",
        newPasswordPlaceholder: "حداقل ۸ کاراکتر",
        confirmPasswordLabel: "تکرار رمز",
        confirmPasswordPlaceholder: "تکرار رمز عبور",
        showPassword: "نمایش رمز عبور",
        hidePassword: "مخفی کردن رمز عبور",
        saving: "در حال ذخیره...",
        savePassword: "ذخیره رمز عبور",
        securityTipsTitle: "نکات امنیتی:",
        tipMinChars: "حداقل ۸ کاراکتر",
        tipMixCase: "ترکیب حرف بزرگ، کوچک و عدد",
        tipNoReuse: "از رمزهای قبلی استفاده نکنید",
        strengthWeak: "ضعیف",
        strengthFair: "متوسط",
        strengthGood: "خوب",
        strengthStrong: "قوی",
        errorMinLength: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
        errorMismatch: "رمز عبور و تکرار آن یکسان نیستند.",
        errorUnexpected: "خطای غیرمنتظره.",
    },
    es: {
        logoAlt: "Logotipo de MyChurch",
        verifyingTitle: "Verificando...",
        verifyingSubtitle: "Verificando sesión",
        setNewPasswordTitle: "Establecer Nueva Contraseña",
        passwordUpdatedTitle: "¡Contraseña Actualizada!",
        invalidLinkTitle: "Enlace Inválido o Expirado",
        invalidLinkBody: "El enlace de recuperación es inválido o ha expirado.",
        invalidLinkBodySub: "Por favor solicita uno nuevo desde la página de inicio de sesión.",
        backToLogin: "Volver al Inicio de Sesión",
        passwordChangedTitle: "¡Contraseña Actualizada con Éxito!",
        redirectingToLogin: "Redirigiendo al inicio de sesión...",
        securityNotice: "Elige una contraseña fuerte y única.",
        newPasswordLabel: "Nueva Contraseña",
        newPasswordPlaceholder: "Mínimo 8 caracteres",
        confirmPasswordLabel: "Confirmar Contraseña",
        confirmPasswordPlaceholder: "Repite la contraseña",
        showPassword: "Mostrar contraseña",
        hidePassword: "Ocultar contraseña",
        saving: "Guardando...",
        savePassword: "Guardar Contraseña",
        securityTipsTitle: "Consejos de seguridad:",
        tipMinChars: "Al menos 8 caracteres",
        tipMixCase: "Combinación de mayúsculas, minúsculas y números",
        tipNoReuse: "No reutilices una contraseña anterior",
        strengthWeak: "Débil",
        strengthFair: "Regular",
        strengthGood: "Buena",
        strengthStrong: "Fuerte",
        errorMinLength: "La contraseña debe tener al menos 8 caracteres.",
        errorMismatch: "Las contraseñas no coinciden.",
        errorUnexpected: "Error inesperado.",
    },
};

export default function ResetPasswordPage() {
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;

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
            setError(d.errorMinLength);
            return;
        }
        if (password !== confirm) {
            setError(d.errorMismatch);
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
                setError(err.message || d.errorUnexpected);
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
        if (score <= 1) return { score, label: d.strengthWeak, color: "bg-red-500" };
        if (score <= 2) return { score, label: d.strengthFair, color: "bg-yellow-500" };
        if (score <= 3) return { score, label: d.strengthGood, color: "bg-blue-500" };
        return { score, label: d.strengthStrong, color: "bg-emerald-500" };
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
                            <Image src="/logo-transparent.png" alt={d.logoAlt} width={50} height={50} className="object-contain" />
                        </div>

                        {pageState === "loading" && (
                            <h1 className="text-xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                {d.verifyingTitle}
                                <span className="block text-sm font-medium text-white/60 mt-1 font-sans">{d.verifyingSubtitle}</span>
                            </h1>
                        )}
                        {pageState === "form" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                {d.setNewPasswordTitle}
                            </h1>
                        )}
                        {pageState === "success" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                {d.passwordUpdatedTitle}
                            </h1>
                        )}
                        {pageState === "no-session" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                {d.invalidLinkTitle}
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
                            <div className="bg-red-950/40 border border-red-400/30 rounded-xl p-4 text-sm text-red-200 font-[Vazirmatn] leading-relaxed text-right">
                                <p className="font-bold mb-1">{d.invalidLinkBody}</p>
                                <p className="text-red-300/70">{d.invalidLinkBodySub}</p>
                            </div>
                            <button
                                onClick={() => router.push("/login")}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-xl transition-all active:scale-[0.98] font-[Vazirmatn]"
                            >
                                {d.backToLogin}
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
                            <div className="space-y-2">
                                <p className="text-white font-black text-lg font-[Vazirmatn]">{d.passwordChangedTitle}</p>
                                <p className="text-white/60 text-sm font-[Vazirmatn]">
                                    {d.redirectingToLogin}
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-sans">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {d.redirectingToLogin}
                            </div>
                        </div>
                    )}

                    {/* ───── RESET FORM ───── */}
                    {pageState === "form" && (
                        <>
                            {/* Security notice */}
                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6">
                                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-sm text-white/80 font-[Vazirmatn]">
                                    {d.securityNotice}
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
                                        <span>{d.newPasswordLabel}</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                                        <input
                                            id="new-password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder={d.newPasswordPlaceholder}
                                            required
                                            minLength={8}
                                            autoFocus
                                            className="w-full bg-neutral-900/90 border border-white/25 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-all shadow-inner font-mono tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                                            aria-label={showPassword ? d.hidePassword : d.showPassword}
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
                                        <span>{d.confirmPasswordLabel}</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                                        <input
                                            id="confirm-password"
                                            name="confirm"
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder={d.confirmPasswordPlaceholder}
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
                                            aria-label={showConfirm ? d.hidePassword : d.showPassword}
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
                                            {d.saving}
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="w-5 h-5" />
                                            {d.savePassword}
                                        </>
                                    )}
                                </button>

                                {/* Password tips */}
                                <div className="bg-white/4 border border-white/8 rounded-xl p-4 text-xs text-white/50 font-[Vazirmatn] leading-relaxed">
                                    <p className="font-bold text-white/70 mb-1.5">{d.securityTipsTitle}</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>{d.tipMinChars}</li>
                                        <li>{d.tipMixCase}</li>
                                        <li>{d.tipNoReuse}</li>
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
