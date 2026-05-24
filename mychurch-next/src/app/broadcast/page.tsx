import React, { Suspense } from "react";
import LiveConsole from "@/components/broadcast/LiveConsole";
import { requireRole } from "@/utils/rbac";

export const metadata = {
    title: "Broadcast Console | MyChurch",
    description: "Live streaming and presentation control center.",
};

interface BroadcastPageProps {
    searchParams: Promise<{ id?: string; session?: string }>;
}

// In Next.js 15+ App Router, searchParams is a Promise in Server Components.
// We read it server-side and pass it as a prop to LiveConsole so that
// LiveConsole does NOT need useSearchParams() — this eliminates React #185 errors.
export default async function BroadcastPage({ searchParams }: BroadcastPageProps) {
    await requireRole(["Admin", "Leader", "Operator"]);
    const params = await searchParams;
    const presentationId = params.id || params.session || null;
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-4 font-[Vazirmatn]">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-lg text-indigo-300">در حال بارگذاری کنسول پخش...</p>
            </div>
        }>
            <LiveConsole initialPresentationId={presentationId} />
        </Suspense>
    );
}
