"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserPlus, Lock, Mail, Loader2, User, ArrowRight, CheckCircle } from "lucide-react";
import { signUp } from "@/actions/auth";
import { PageVisuals } from "@/components/ui/PageVisuals";
import { resolvePublicSiteUrl } from "@/lib/site-url";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
    en: {
        logoAlt: "MyChurch Logo",
        signupSuccessTitle: "Signup Successful!",
        signupSuccessBody: "A verification email has been sent. Please check your inbox and confirm your account.",
        goToLogin: "Go to Login",
        createAccountTitle: "Join the Church",
        createAccountSubtitle: "Create a New Account",
        fullNameLabel: "Full Name",
        emailLabel: "Email Address",
        passwordLabel: "Password",
        securityCheckLabel: "Security Check",
        processing: "Processing",
        signUp: "Sign Up",
        orDivider: "OR",
        continueWithGoogle: "Continue with Google",
        alreadyHaveAccount: "Already have an account?",
        loginLink: "Login",
        googleSignUpError: "Google sign-up failed",
        signupFailedError: "Signup failed",
        captchaError: "Security check failed",
    },
    fa: {
        logoAlt: "لوگوی کلیسا",
        signupSuccessTitle: "ثبت‌نام با موفقیت انجام شد!",
        signupSuccessBody: "ایمیل تایید برای شما ارسال شد. لطفاً صندوق ورودی خود را چک کنید و روی لینک تایید کلیک کنید.",
        goToLogin: "برو به صفحه ورود",
        createAccountTitle: "عضویت در کلیسا",
        createAccountSubtitle: "ایجاد حساب کاربری جدید",
        fullNameLabel: "نام کامل",
        emailLabel: "ایمیل",
        passwordLabel: "رمز عبور",
        securityCheckLabel: "سوال امنیتی",
        processing: "در حال ثبت‌نام...",
        signUp: "ثبت نام",
        orDivider: "یا",
        continueWithGoogle: "ادامه با گوگل",
        alreadyHaveAccount: "هم اکنون حساب دارید؟",
        loginLink: "ورود",
        googleSignUpError: "خطا در ثبت‌نام با گوگل",
        signupFailedError: "خطا در ثبت‌نام",
        captchaError: "پاسخ امنیتی اشتباه است",
    },
    es: {
        logoAlt: "Logotipo de MyChurch",
        signupSuccessTitle: "¡Registro Exitoso!",
        signupSuccessBody: "Se ha enviado un correo de verificación. Por favor revisa tu bandeja de entrada y confirma tu cuenta.",
        goToLogin: "Ir al Inicio de Sesión",
        createAccountTitle: "Únete a la Iglesia",
        createAccountSubtitle: "Crear una Nueva Cuenta",
        fullNameLabel: "Nombre Completo",
        emailLabel: "Correo Electrónico",
        passwordLabel: "Contraseña",
        securityCheckLabel: "Verificación de Seguridad",
        processing: "Procesando",
        signUp: "Registrarse",
        orDivider: "O",
        continueWithGoogle: "Continuar con Google",
        alreadyHaveAccount: "¿Ya tienes una cuenta?",
        loginLink: "Iniciar Sesión",
        googleSignUpError: "Error al registrarse con Google",
        signupFailedError: "Error al registrarse",
        captchaError: "La verificación de seguridad falló",
    },
};

export default function SignupPage() {
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // CAPTCHA State
    const [captchaQ, setCaptchaQ] = useState(() => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        return { a, b, answer: a + b };
    });

    const handleGoogleLogin = async () => {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const siteUrl = resolvePublicSiteUrl();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${siteUrl}/api/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) {
            setError(error.message || d.googleSignUpError);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);

        // 1. Honeypot Check
        const honeypot = formData.get("nickname");
        if (honeypot) {
            // Fake success for bots to drop them
            setIsSuccess(true);
            return;
        }

        // 2. Math CAPTCHA Check
        const userCaptcha = Number(formData.get("captcha"));
        if (userCaptcha !== captchaQ.answer) {
            setError(d.captchaError);
            // Generate a new question
            const a = Math.floor(Math.random() * 10) + 1;
            const b = Math.floor(Math.random() * 10) + 1;
            setCaptchaQ({ a, b, answer: a + b });
            return;
        }

        startTransition(async () => {
            const result = await signUp(formData);
            if (result && !result.success) {
                setError(result.error || d.signupFailedError);
            } else {
                setIsSuccess(true);
            }
        });
    };

    if (isSuccess) {
        return (
            <div className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 font-sans relative overflow-hidden">
                <PageVisuals />
                <div className="relative z-10 w-full max-w-md p-6 animate-in fade-in zoom-in duration-500">
                    <div className="glass-strong rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 mb-6 mx-auto shadow-lg shadow-emerald-500/10">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-4 font-[Vazirmatn]">{d.signupSuccessTitle}</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed font-[Vazirmatn]">
                            {d.signupSuccessBody}
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            {d.goToLogin}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 font-sans relative overflow-hidden selection:bg-primary/30">
            <PageVisuals />

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="glass-strong rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Logo & Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 mb-6 ring-1 ring-white/10 shadow-inner">
                            <Image src="/logo-transparent.png" alt={d.logoAlt} width={50} height={50} className="object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                            {d.createAccountTitle}
                            <span className="block text-sm font-medium text-muted-foreground mt-1 font-sans">{d.createAccountSubtitle}</span>
                        </h1>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold text-center font-[Vazirmatn] animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {/* Signup Form */}
                    <form onSubmit={handleSubmit} className="space-y-4" dir="ltr">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-muted-foreground flex justify-between font-[Vazirmatn]" htmlFor="fullName">
                                <span>{d.fullNameLabel}</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="John Doe / یحیی تعمید‌ دهنده"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-[Vazirmatn]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-muted-foreground flex justify-between font-[Vazirmatn]" htmlFor="email">
                                <span>{d.emailLabel}</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-muted-foreground flex justify-between font-[Vazirmatn]" htmlFor="password">
                                <span>{d.passwordLabel}</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-mono"
                                />
                            </div>
                        </div>

                        {/* Honeypot Field (Invisible to Humans) */}
                        <div className="absolute opacity-0 -z-10" aria-hidden="true">
                            <label htmlFor="nickname">Nickname (Do not fill)</label>
                            <input type="text" id="nickname" name="nickname" tabIndex={-1} autoComplete="off" />
                        </div>

                        {/* Math CAPTCHA */}
                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-bold text-muted-foreground flex justify-between font-[Vazirmatn]" htmlFor="captcha">
                                <span>{d.securityCheckLabel}</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-0 top-0 bottom-0 px-4 bg-white/10 border-r border-white/10 rounded-l-xl flex items-center justify-center font-bold text-white font-mono min-w-[80px]">
                                    {captchaQ.a} + {captchaQ.b} =
                                </div>
                                <input
                                    id="captcha"
                                    name="captcha"
                                    type="number"
                                    placeholder="?"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-[90px] pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-mono text-center text-lg"
                                />
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
                                    {d.processing}
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    {d.signUp}
                                </>
                            )}
                        </button>

                        <div className="relative my-6 text-center">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10"></span>
                            </div>
                            <span className="relative px-4 text-xs font-bold text-muted-foreground bg-[#0a0a0a] uppercase tracking-widest font-[Vazirmatn]">{d.orDivider}</span>
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

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground font-[Vazirmatn]">
                            {d.alreadyHaveAccount}{" "}
                            <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
                                {d.loginLink}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
