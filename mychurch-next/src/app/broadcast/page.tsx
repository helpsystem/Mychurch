import React, { Suspense } from "react";
import LiveConsole from "@/components/broadcast/LiveConsole";
import { requireRole } from "@/utils/rbac";

export const metadata = {
    title: "Broadcast Console | MyChurch",
    description: "Live streaming and presentation control center.",
};

export default async function BroadcastPage() {
    await requireRole(["Admin", "Leader", "Operator"]);
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-4 font-[Vazirmatn]">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-lg text-indigo-300">در حال بارگذاری کنسول پخش...</p>
            </div>
        }>
            <LiveConsole />
        </Suspense>
    );
}
