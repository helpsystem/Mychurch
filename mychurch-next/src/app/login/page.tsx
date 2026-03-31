"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Lock, Mail, Loader2 } from "lucide-react";
import { login } from "@/actions/auth";
import { PageVisuals } from "@/components/ui/PageVisuals";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [headerError, setHeaderError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        const { createClient } = await import("@/utils/supabase/client");
        const supabase = createClient();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${siteUrl}/api/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setHeaderError(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await login(formData);
            if (result && !result.success) {
                setHeaderError(result.error || "خطا در ورود به سیستم / Login failed");
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
                            <Image src="/logo-transparent.png" alt="MyChurch Logo" width={50} height={50} className="object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                            ورود به پنل مدیریت
                            <span className="block text-sm font-medium text-white/80 mt-1 font-sans">Admin Portal Login</span>
                        </h1>
                    </div>

                    {/* Error Banner */}
                    {headerError && (
                        <div className="mb-6 bg-red-950/70 border border-red-400/40 text-red-200 px-4 py-3 rounded-xl text-sm font-bold text-center font-[Vazirmatn] animate-in slide-in-from-top-2">
                            {headerError}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" dir="ltr">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-white/90 flex justify-between font-[Vazirmatn]" htmlFor="email">
                                <span className="font-sans text-white/90">Email Address</span>
                                <span className="text-white/90">ایمیل</span>
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
                                <span className="font-sans text-white/90">Password</span>
                                <span className="text-white/90">رمز عبور</span>
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
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg py-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-4 flex items-center justify-center gap-3 font-[Vazirmatn]"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    در حال ورود... / Authenticating
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    ورود به سیستم / Sign In
                                </>
                            )}
                        </button>

                        <div className="relative my-6 text-center">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10"></span>
                            </div>
                            <span className="relative px-4 text-xs font-bold text-white/80 bg-neutral-900 uppercase tracking-widest font-[Vazirmatn]">یا / OR</span>
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
                            ادامه با گوگل / Continue with Google
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-white/85 font-[Vazirmatn]">
                            حساب کاربری ندارید؟ / Don't have an account?{" "}
                            <Link href="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
                                ثبت‌نام / Sign Up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 text-center text-xs text-white/70 font-medium border-t border-white/10 pt-6">
                        <p>© {new Date().getFullYear()} Iranian Christian Church of D.C.</p>
                        <p className="mt-1 text-white/60">Secured by Supabase Auth</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
