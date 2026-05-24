import React from "react";
import { Gift, Bell, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { requireRole } from "@/utils/rbac";
import { getGiftEvents } from "@/actions/gift-events";
import GiftsDashboardTabs from "./GiftsDashboardTabs";

export const dynamic = "force-dynamic";

export default async function AdminGiftsPage() {
    await requireRole(["Admin", "Leader"]);

    // Fetch up to 500 events to ensure comprehensive reporting datasets for tax years
    const events = await getGiftEvents(500);

    const summary = {
        last_24h: events.filter(e => new Date(e.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000).length,
        total_success: events.filter(e => e.status === "success").length,
        total_cancelled: events.filter(e => e.status === "cancelled").length,
        total: events.length
    };

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/40 p-6 print:hidden">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                        <Gift className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Gifts Display & Notifications</h1>
                        <p className="text-sm text-white/60">Admin/Leader gift activity feed and tax report center</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 print:hidden">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Last 24h Notifications</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-emerald-400 font-sans">
                        <Bell className="h-5 w-5" /> {summary.last_24h || 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Successful Gifts</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-emerald-300 font-sans">
                        <CheckCircle2 className="h-5 w-5" /> {summary.total_success || 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Cancelled Gifts</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-amber-300 font-sans">
                        <XCircle className="h-5 w-5" /> {summary.total_cancelled || 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Total Events</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-white font-sans">
                        <Clock3 className="h-5 w-5" /> {summary.total || 0}
                    </p>
                </div>
            </div>

            {/* Client-side Tabs Control Container */}
            <GiftsDashboardTabs events={events} />
        </div>
    );
}
