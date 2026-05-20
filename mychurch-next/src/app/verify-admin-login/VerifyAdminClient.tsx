"use client";

import React, { useState, useEffect } from "react";
import { sendAdminOTP, verifyAdminOTP } from "@/actions/otp";
import { Shield, Mail, ArrowRight, Loader2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function VerifyAdminClient({ email }: { email: string }) {
    const [code, setCode] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const router = useRouter();

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSendCode = async () => {
        setIsSending(true);
        try {
            const res = await sendAdminOTP();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("کد تایید به ایمیل شما ارسال شد.");
                setCooldown(60); // 60 seconds cooldown
            }
        } catch (err) {
            toast.error("خطا در ارتباط با سرور.");
        } finally {
            setIsSending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return toast.error("کد وارد شده باید ۶ رقم باشد.");

        setIsVerifying(true);
        try {
            const res = await verifyAdminOTP(code);
            if (res.error) {
                toast.error(res.error);
                setCode("");
            } else {
                toast.success("ورود موفقیت‌آمیز!");
                router.push("/admin");
            }
        } catch (err) {
            toast.error("خطا در تایید کد.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-[#1c1917] border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                    <Shield className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold mb-2">تاییدیه امنیتی پنل مدیریت</h1>
                <p className="text-muted-foreground text-sm">
                    جهت ورود به پنل، کد ارسال شده به ایمیل زیر را وارد کنید:
                </p>
                <div className="mt-4 px-4 py-2 rounded-xl bg-black/40 border border-white/5 font-mono text-sm text-emerald-400" dir="ltr">
                    {email}
                </div>
            </div>

            <button 
                onClick={handleSendCode} 
                disabled={isSending || cooldown > 0}
                className="w-full mb-6 py-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {cooldown > 0 ? \`ارسال مجدد کد (\${cooldown} ثانیه)\` : "ارسال کد تایید به ایمیل"}
            </button>

            <form onSubmit={handleVerify} className="space-y-4">
                <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="کد ۶ رقمی"
                        className="w-full bg-black/40 border border-white/10 focus:border-amber-500 rounded-xl px-12 py-4 text-center text-2xl font-mono tracking-widest outline-none transition-all placeholder:text-muted-foreground/30"
                        dir="ltr"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isVerifying || code.length < 6}
                    className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "تایید و ورود"}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
