"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Lock, Mail, Loader2 } from "lucide-react";
import { login } from "@/actions/auth";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [headerError, setHeaderError] = useState<string | null>(null);

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
        <div className="min-h-[100dvh] w-full flex items-center justify-center bg-neutral-950 font-sans relative overflow-hidden selection:bg-primary/30">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">

                    {/* Logo & Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 mb-6 ring-1 ring-white/10 shadow-inner">
                            <Image src="/logo-transparent.png" alt="MyChurch Logo" width={50} height={50} className="object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                            ورود به پنل مدیریت
                            <span className="block text-sm font-medium text-muted-foreground mt-1 font-sans">Admin Portal Login</span>
                        </h1>
                    </div>

                    {/* Error Banner */}
                    {headerError && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm font-bold text-center font-[Vazirmatn] animate-in slide-in-from-top-2">
                            {headerError}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5" dir="ltr">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-muted-foreground flex justify-between font-[Vazirmatn]" htmlFor="email">
                                <span className="font-sans">Email Address</span>
                                <span>ایمیل</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@iranianchristianchurch.com"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-muted-foreground flex justify-between font-[Vazirmatn]" htmlFor="password">
                                <span className="font-sans">Password</span>
                                <span>رمز عبور</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-mono tracking-widest"
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
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground font-[Vazirmatn]">
                            حساب کاربری ندارید؟ / Don't have an account?{" "}
                            <Link href="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
                                ثبت‌نام / Sign Up
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 text-center text-xs text-muted-foreground/60 font-medium border-t border-white/5 pt-6">
                        <p>© {new Date().getFullYear()} Iranian Christian Church of D.C.</p>
                        <p className="mt-1">Secured by Supabase Auth</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
