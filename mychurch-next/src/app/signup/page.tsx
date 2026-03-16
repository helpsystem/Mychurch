"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserPlus, Lock, Mail, Loader2, User, ArrowRight, CheckCircle } from "lucide-react";
import { signUp } from "@/actions/auth";
import { PageVisuals } from "@/components/ui/PageVisuals";

export default function SignupPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await signUp(formData);
            if (result && !result.success) {
                setError(result.error || "خطا در ثبت‌نام / Signup failed");
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
                        <h2 className="text-2xl font-black text-white mb-4 font-[Vazirmatn]">ثبت‌نام با موفقیت انجام شد!</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed font-[Vazirmatn]">
                            ایمیل تایید برای شما ارسال شد. لطفاً صندوق ورودی خود را چک کنید و روی لینک تایید کلیک کنید.
                            <span className="block text-xs mt-2 font-sans text-slate-500">A verification email has been sent. Please check your inbox and confirm your account.</span>
                        </p>
                        <Link 
                            href="/login" 
                            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            برو به صفحه ورود / Go to Login
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
                            <Image src="/logo-transparent.png" alt="MyChurch Logo" width={50} height={50} className="object-contain" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight text-center font-[Vazirmatn]">
                            عضویت در کلیسا
                            <span className="block text-sm font-medium text-muted-foreground mt-1 font-sans">Create a New Account</span>
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
                                <span className="font-sans">Full Name</span>
                                <span>نام کامل</span>
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
                                <span className="font-sans">Email Address</span>
                                <span>ایمیل</span>
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
                                    minLength={6}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner font-mono"
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
                                    در حال ثبت‌نام... / Processing
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    ثبت نام / Sign Up
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground font-[Vazirmatn]">
                            هم اکنون حساب دارید؟ / Already have an account?{" "}
                            <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
                                ورود / Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
