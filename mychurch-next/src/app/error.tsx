"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary Caught:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="w-24 h-24 mb-6 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">مشکلی پیش آمد!</h2>

            <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                {error.message || "امکان پردازش درخواست شما در حال حاضر وجود ندارد. لطفاً دوباره تلاش کنید یا به صفحه اصلی بازگردید."}
            </p>

            <div className="flex items-center gap-4 flex-wrap justify-center">
                <button
                    onClick={() => reset()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
                >
                    <RefreshCcw className="w-5 h-5" />
                    تلاش مجدد
                </button>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-neutral-800 text-foreground hover:bg-neutral-700 border border-border/50 transition-all hover:scale-105 active:scale-95"
                >
                    <Home className="w-5 h-5" />
                    بازگشت به خانه
                </button>
            </div>
        </div>
    );
}
