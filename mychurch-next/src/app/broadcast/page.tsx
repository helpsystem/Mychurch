import dynamic from "next/dynamic";
import { requireRole } from "@/utils/rbac";

export const metadata = {
    title: "Broadcast Console | MyChurch",
    description: "Live streaming and presentation control center.",
};

// Dynamic import with ssr:false is the correct pattern for components that use
// useSearchParams() in Next.js 13+. This prevents React #185 errors caused by
// useSearchParams suspending during server-side rendering without a proper boundary.
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

export default async function BroadcastPage() {
    await requireRole(["Admin", "Leader", "Operator"]);
    return <LiveConsole />;
}
