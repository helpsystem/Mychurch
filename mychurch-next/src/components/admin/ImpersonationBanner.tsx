"use client";

import React from "react";
import { Eye, X } from "lucide-react";
import { clearImpersonationRole } from "@/actions/impersonation";
import { useRouter } from "next/navigation";

export function ImpersonationBanner({ currentRole, realRole }: { currentRole: string, realRole: string }) {
    const router = useRouter();

    if (currentRole === realRole) {
        return null;
    }

    const handleClear = async () => {
        await clearImpersonationRole();
        router.refresh();
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-black px-4 py-2 flex items-center justify-center gap-4 text-sm font-bold shadow-lg">
            <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                شما در حال مشاهده سایت به عنوان <span className="bg-black/10 px-2 py-0.5 rounded-md">{currentRole}</span> هستید.
                نقش اصلی شما <span className="bg-black/10 px-2 py-0.5 rounded-md">{realRole}</span> است.
            </span>
            <button 
                onClick={handleClear}
                className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-3 py-1 rounded-lg transition-colors text-xs"
            >
                <X className="w-3.5 h-3.5" />
                بازگشت به نقش اصلی
            </button>
        </div>
    );
}
