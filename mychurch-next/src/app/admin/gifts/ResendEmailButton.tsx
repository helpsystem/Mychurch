"use client";

import React, { useState } from "react";
import { resendGiftEmailAction } from "@/actions/gift-events";
import { Mail, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function ResendEmailButton({ giftRef, email }: { giftRef: string; email: string }) {
    const [isSending, setIsSending] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const handleResend = async () => {
        const defaultEmail = (!email || email === "-") ? "" : email;
        const targetEmail = prompt(
            "لطفاً ایمیل گیرنده را برای ارسال رسید تشکر وارد کنید:\nPlease enter the recipient email to send the thank-you receipt to:",
            defaultEmail
        );

        if (targetEmail === null) return; // Cancelled

        const trimmedEmail = targetEmail.trim();
        if (!trimmedEmail || !trimmedEmail.includes("@")) {
            toast.error("لطفاً یک آدرس ایمیل معتبر وارد کنید / Please enter a valid email address");
            return;
        }

        setIsSending(true);
        try {
            const res = await resendGiftEmailAction(giftRef, trimmedEmail);
            if (res?.error) {
                throw new Error(res.error);
            }
            toast.success("ایمیل تشکر با موفقیت ارسال شد");
            setIsDone(true);
            setTimeout(() => setIsDone(false), 2000);
        } catch (error: any) {
            toast.error(error.message || "خطا در ارسال ایمیل");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <button
            onClick={handleResend}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300 hover:bg-indigo-500/25 hover:border-indigo-500/40 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
            title="ارسال مجدد ایمیل تشکر"
        >
            {isSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isDone ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
                <Mail className="w-3.5 h-3.5" />
            )}
            {isDone ? "ارسال شد" : "ارسال مجدد"}
        </button>
    );
}
