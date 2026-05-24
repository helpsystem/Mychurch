"use client";

import dynamic from "next/dynamic";

// This Client Component wrapper is required because `next/dynamic` with `ssr: false`
// is only allowed in Client Components in the Next.js App Router.
// LiveConsole uses `useSearchParams()` which must be client-only to avoid React #185.
const LiveConsole = dynamic(
    () => import("@/components/broadcast/LiveConsole"),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-4 font-[Vazirmatn]">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-lg text-indigo-300">در حال بارگذاری کنسول پخش...</p>
            </div>
        ),
    }
);

export default function BroadcastPageClient() {
    return <LiveConsole />;
}
