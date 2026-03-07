import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-950 font-sans p-6">
            <div className="text-center max-w-md w-full bg-neutral-900 border border-border/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/20">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-2xl font-black text-white font-[Vazirmatn] mb-2">
                    عدم دسترسی
                </h1>
                <p className="text-muted-foreground font-[Vazirmatn] mb-6 text-sm">
                    شما سطح دسترسی لازم برای مشاهده‌ی این صفحه را ندارید. (Access Denied: Insufficient Permissions)
                </p>

                <Link href="/" className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition border border-white/5 text-sm font-[Vazirmatn]">
                    بازگشت به صفحه اصلی / Return Home <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </div>
        </div>
    );
}
