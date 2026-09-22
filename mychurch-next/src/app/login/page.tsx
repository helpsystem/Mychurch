"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Lock, Mail, Loader2, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { login, requestPasswordReset } from "@/actions/auth";
import { PageVisuals } from "@/components/ui/PageVisuals";
import { resolvePublicSiteUrl } from "@/lib/site-url";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

type Step = "login" | "forgot" | "sent";

const localDict = {
    en: {
        logoAlt: "MyChurch Logo",
        adminPortalTitle: "Admin Portal Login",
        adminPortalSubtitle: "Admin Panel",
        forgotTitle: "Forgot Password",
        forgotSubtitle: "Password Recovery",
        sentTitle: "Email Sent",
        sentSubtitle: "Recovery Email Sent",
        resetSuccessBanner: "Password updated successfully.",
        emailLabel: "Email Address",
        passwordLabel: "Password",
        forgotPasswordLink: "Forgot your password?",
        authenticating: "Authenticating",
        signIn: "Sign In",
        orDivider: "OR",
        continueWithGoogle: "Continue with Google",
        forgotIntro: "Enter your account email to receive a reset link.",
        sendingLink: "Sending...",
        sendResetLink: "Send Reset Link",
        backToLogin: "Back to Login",
        emailSentHeading: "Email Sent!",
        recoveryLinkSentTo: "The password recovery link was sent to the address below:",
        spamNoticeLabel: "Note:",
        spamNoticeText: "If you don't see the email, check your Spam or Junk folder. The recovery link is valid for 1 hour.",
        dontHaveAccount: "Don't have an account?",
        signUpLink: "Sign Up",
        googleSignInError: "Google sign-in failed",
        loginFailedError: "Login failed",
    },
    fa: {
        logoAlt: "لوگوی کلیسا",
        adminPortalTitle: "ورود به پنل مدیریت",
        adminPortalSubtitle: "پنل مدیریت",
        forgotTitle: "فراموشی رمز عبور",
        forgotSubtitle: "بازیابی رمز عبور",
        sentTitle: "ایمیل ارسال شد",
        sentSubtitle: "ایمیل بازیابی",
        resetSuccessBanner: "رمز عبور با موفقیت تغییر کرد.",
        emailLabel: "ایمیل",
        passwordLabel: "رمز عبور",
        forgotPasswordLink: "رمز عبور را فراموش کردید؟",
        authenticating: "در حال ورود...",
        signIn: "ورود به سیستم",
        orDivider: "یا",
        continueWithGoogle: "ادامه با گوگل",
        forgotIntro: "ایمیل حساب خود را وارد کنید.",
        sendingLink: "در حال ارسال...",
        sendResetLink: "ارسال لینک بازیابی",
        backToLogin: "بازگشت به صفحه ورود",
        emailSentHeading: "ایمیل ارسال شد!",
        recoveryLinkSentTo: "لینک بازیابی رمز عبور به آدرس زیر ارسال شد:",
        spamNoticeLabel: "توجه:",
        spamNoticeText: "اگر ایمیل را دریافت نکردید، پوشه Spam یا Junk را بررسی کنید. لینک بازیابی برای ۱ ساعت معتبر است.",
        dontHaveAccount: "حساب کاربری ندارید؟",
        signUpLink: "ثبت‌نام",
        googleSignInError: "خطا در ورود با گوگل",
        loginFailedError: "خطا در ورود به سیستم",
    },
    es: {
        logoAlt: "Logotipo de MyChurch",
        adminPortalTitle: "Acceso al Panel de Administración",
        adminPortalSubtitle: "Panel de Administración",
        forgotTitle: "Contraseña Olvidada",
        forgotSubtitle: "Recuperación de Contraseña",
        sentTitle: "Correo Enviado",
        sentSubtitle: "Correo de Recuperación Enviado",
        resetSuccessBanner: "Contraseña actualizada con éxito.",
        emailLabel: "Correo Electrónico",
        passwordLabel: "Contraseña",
        forgotPasswordLink: "¿Olvidaste tu contraseña?",
        authenticating: "Autenticando",
        signIn: "Iniciar Sesión",
        orDivider: "O",
        continueWithGoogle: "Continuar con Google",
        forgotIntro: "Ingresa el correo de tu cuenta para recibir un enlace de restablecimiento.",
        sendingLink: "Enviando...",
        sendResetLink: "Enviar Enlace de Restablecimiento",
        backToLogin: "Volver al Inicio de Sesión",
        emailSentHeading: "¡Correo Enviado!",
        recoveryLinkSentTo: "El enlace de recuperación de contraseña se envió a la siguiente dirección:",
        spamNoticeLabel: "Nota:",
        spamNoticeText: "Si no ves el correo, revisa tu carpeta de Spam o Correo no deseado. El enlace de recuperación es válido por 1 hora.",
        dontHaveAccount: "¿No tienes una cuenta?",
        signUpLink: "Regístrate",
        googleSignInError: "Error al iniciar sesión con Google",
        loginFailedError: "Error al iniciar sesión",
    },
};

function LoginContent() {
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;

    const searchParams = useSearchParams();
    const resetSuccess = searchParams?.get("reset") === "success";

    const [isPending, startTransition] = useTransition();
    const [headerError, setHeaderError] = useState<string | null>(null);
    const [step, setStep] = useState<Step>("login");
    const [forgotEmail, setForgotEmail] = useState("");

    const handleGoogleLogin = async () => {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const siteUrl = resolvePublicSiteUrl();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${siteUrl}/api/auth/callback`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (error) {
            setHeaderError(error.message || d.googleSignInError);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setHeaderError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await login(formData);
            if (result && !result.success) {
                setHeaderError(result.error || d.loginFailedError);
            }
        });
    };

    const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setHeaderError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await requestPasswordReset(formData);
            if (result?.error) {
                setHeaderError(result.error);
            } else {
                setStep("sent");
            }
        });
    };

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 font-sans relative overflow-hidden selection:bg-primary/30 px-4 py-8">
            <PageVisuals />

            <div className="relative z-10 w-full max-w-md">
                <div className="glass-strong rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Logo & Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 mb-6 ring-1 ring-white/10 shadow-inner">
                            <Image src="/logo-transparent.png" alt={d.logoAlt} width={50} height={50} className="object-contain" />
                        </div>
                        {step === "login" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                {d.adminPortalTitle}
                                <span className="block text-sm font-medium text-white/80 mt-1 font-sans">{d.adminPortalSubtitle}</span>
                            </h1>
                        )}
                        {step === "forgot" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                {d.forgotTitle}
                                <span className="block text-sm font-medium text-white/80 mt-1 font-sans">{d.forgotSubtitle}</span>
                            </h1>
                        )}
                        {step === "sent" && (
                            <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                                {d.sentTitle}
                                <span className="block text-sm font-medium text-white/80 mt-1 font-sans">{d.sentSubtitle}</span>
                            </h1>
                        )}
                    </div>

                    {/* Password Reset Success Banner (from /reset-password redirect) */}
                    {resetSuccess && step === "login" && (
                        <div className="mb-6 bg-emerald-950/70 border border-emerald-400/40 text-emerald-200 px-4 py-3 rounded-xl text-sm font-bold text-center font-[Vazirmatn] animate-in slide-in-from-top-2 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            {d.resetSuccessBanner}
                        </div>
                    )}

                    {/* Error Banner */}
                    {headerError && (
                        <div className="mb-6 bg-red-950/70 border border-red-400/40 text-red-200 px-4 py-3 rounded-xl text-sm font-bold text-center font-[Vazirmatn] animate-in slide-in-from-top-2">
                            {headerError}
                        </div>
                    )}

                    {/* ───── STEP: LOGIN ───── */}
                    {step === "login" && (
                        <form onSubmit={handleLoginSubmit} className="space-y-5" dir="ltr">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-white/90 flex justify-between font-[Vazirmatn]" htmlFor="email">
                                    <span>{d.emailLabel}</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@iranianchristianchurch.com"
                                        required
                                        className="w-full bg-neutral-900/90 border border-white/25 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-white/90 flex justify-between font-[Vazirmatn]" htmlFor="password">
                                    <span>{d.passwordLabel}</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-neutral-900/90 border border-white/25 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-all shadow-inner font-mono tracking-widest"
                                    />
                                </div>
                                {/* Forgot Password Link */}
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setHeaderError(null); setStep("forgot"); }}
                                        className="text-xs text-primary/80 hover:text-primary font-bold font-[Vazirmatn] transition-colors underline-offset-2 hover:underline"
                                    >
                                        {d.forgotPasswordLink}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-4 flex items-center justify-center gap-3 font-[Vazirmatn]"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {d.authenticating}
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        {d.signIn}
                                    </>
                                )}
                            </button>

                            <div className="relative my-6 text-center">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10"></span>
                                </div>
                                <span className="relative px-4 text-xs font-bold text-white/80 bg-neutral-900 uppercase tracking-widest font-[Vazirmatn]">{d.orDivider}</span>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full bg-white hover:bg-neutral-200 text-black font-black text-lg py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 font-[Vazirmatn] shadow-lg shadow-white/5"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.23.81-.61z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {d.continueWithGoogle}
                            </button>
                        </form>
                    )}

                    {/* ───── STEP: FORGOT PASSWORD ───── */}
                    {step === "forgot" && (
                        <form onSubmit={handleForgotSubmit} className="space-y-5" dir="ltr">
                            <p className="text-sm text-white/70 font-[Vazirmatn] text-center leading-relaxed mb-2">
                                {d.forgotIntro}
                            </p>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-white/90 flex justify-between font-[Vazirmatn]" htmlFor="forgot-email">
                                    <span>{d.emailLabel}</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                                    <input
                                        id="forgot-email"
                                        name="email"
                                        type="email"
                                        value={forgotEmail}
                                        onChange={e => setForgotEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        autoFocus
                                        className="w-full bg-neutral-900/90 border border-white/25 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-3 font-[Vazirmatn]"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {d.sendingLink}
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="w-5 h-5" />
                                        {d.sendResetLink}
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setHeaderError(null); setStep("login"); }}
                                className="w-full flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white/90 font-[Vazirmatn] transition-colors mt-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {d.backToLogin}
                            </button>
                        </form>
                    )}

                    {/* ───── STEP: EMAIL SENT ───── */}
                    {step === "sent" && (
                        <div className="text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-emerald-950/60 border-2 border-emerald-500/40 flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-black text-lg font-[Vazirmatn]">{d.emailSentHeading}</p>
                                <p className="text-white/70 text-sm font-[Vazirmatn] leading-relaxed">
                                    {d.recoveryLinkSentTo}
                                </p>
                                <p className="text-primary font-bold text-sm font-mono break-all">{forgotEmail}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/60 font-[Vazirmatn] leading-relaxed text-right">
                                <strong className="text-white/80">{d.spamNoticeLabel}</strong> {d.spamNoticeText}
                            </div>
                            <button
                                type="button"
                                onClick={() => { setHeaderError(null); setStep("login"); setForgotEmail(""); }}
                                className="w-full flex items-center justify-center gap-2 text-sm text-white/60 hover:text-white/90 font-[Vazirmatn] transition-colors border border-white/10 hover:border-white/20 rounded-xl py-3"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {d.backToLogin}
                            </button>
                        </div>
                    )}

                    {/* Bottom Links */}
                    {step === "login" && (
                        <div className="mt-8 text-center">
                            <p className="text-sm text-white/85 font-[Vazirmatn]">
                                {d.dontHaveAccount}{" "}
                                <Link href="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
                                    {d.signUpLink}
                                </Link>
                            </p>
                        </div>
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

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-[100dvh] w-full bg-neutral-950" />}>
            <LoginContent />
        </Suspense>
    );
}
