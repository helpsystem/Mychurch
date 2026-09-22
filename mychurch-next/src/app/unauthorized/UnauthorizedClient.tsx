"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight, RotateCcw } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const localDict = {
    en: {
        title: "Access Denied",
        body: "You do not have the required permission level to view this page.",
        backToRealRole: "Return to actual role",
        returnHome: "Return Home",
    },
    fa: {
        title: "عدم دسترسی",
        body: "شما سطح دسترسی لازم برای مشاهده‌ی این صفحه را ندارید.",
        backToRealRole: "بازگشت به نقش واقعی",
        returnHome: "بازگشت به صفحه اصلی",
    },
    es: {
        title: "Acceso Denegado",
        body: "No tienes el nivel de acceso necesario para ver esta página.",
        backToRealRole: "Volver al rol real",
        returnHome: "Volver al Inicio",
    },
};

interface UnauthorizedClientProps {
    impersonatedRole: string | null;
    realRole: string | null;
    onReset: () => Promise<void>;
}

export default function UnauthorizedClient({ impersonatedRole, realRole, onReset }: UnauthorizedClientProps) {
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-neutral-950 font-sans p-6">
            <div className="text-center max-w-md w-full bg-neutral-900 border border-border/10 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/20">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-2xl font-black text-white font-[Vazirmatn] mb-2">
                    {d.title}
                </h1>
                <p className="text-muted-foreground font-[Vazirmatn] mb-6 text-sm">
                    {d.body}
                </p>

                {impersonatedRole && (
                    <form action={onReset} className="mb-4">
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-2 w-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold py-3.5 rounded-xl transition border border-yellow-500/20 text-sm font-[Vazirmatn] cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {d.backToRealRole} ({realRole || "Admin"})
                        </button>
                    </form>
                )}

                <Link href="/" className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition border border-white/5 text-sm font-[Vazirmatn]">
                    {d.returnHome} <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </div>
        </div>
    );
}
