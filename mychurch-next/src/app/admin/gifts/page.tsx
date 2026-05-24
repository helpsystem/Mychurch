import React from "react";
import { Gift, Bell, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { requireRole } from "@/utils/rbac";
import { getGiftEvents, getGiftNotificationsSummary } from "@/actions/gift-events";
import ResendEmailButton from "./ResendEmailButton";

export const dynamic = "force-dynamic";

function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: (currency || "USD").toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

export default async function AdminGiftsPage() {
    await requireRole(["Admin", "Leader"]);

    const events = await getGiftEvents(150);

    const summary = {
        last_24h: events.filter(e => new Date(e.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000).length,
        total_success: events.filter(e => e.status === "success").length,
        total_cancelled: events.filter(e => e.status === "cancelled").length,
        total: events.length
    };

    return (
        <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/40 p-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400">
                        <Gift className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Gifts Display & Notifications</h1>
                        <p className="text-sm text-white/60">Admin/Leader gift activity feed from payment flow</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Last 24h Notifications</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-emerald-400">
                        <Bell className="h-5 w-5" /> {summary.last_24h || 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Successful Gifts</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-emerald-300">
                        <CheckCircle2 className="h-5 w-5" /> {summary.total_success || 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Cancelled Gifts</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-amber-300">
                        <XCircle className="h-5 w-5" /> {summary.total_cancelled || 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/50">Total Events</p>
                    <p className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
                        <Clock3 className="h-5 w-5" /> {summary.total || 0}
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80">
                <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white">Gift Activity Feed</div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
                            <tr>
                                <th className="px-4 py-3 text-left">Time</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Payer</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-left">Amount</th>
                                <th className="px-4 py-3 text-left">Provider</th>
                                <th className="px-4 py-3 text-left">Source</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => {
                                const metadata = (event.metadata || {}) as Record<string, any>;
                                const payerName = metadata.payer_name || "-";
                                const payerEmail = metadata.payer_email || "-";
                                const receiptUrl = metadata.receipt_url || null;

                                return (
                                    <tr key={event.id} className="border-t border-white/5 text-white/80">
                                        <td className="px-4 py-3">{new Date(event.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full border border-white/10 px-2 py-1 text-xs">
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-white">{payerName}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{payerEmail}</td>
                                        <td className="px-4 py-3">{formatAmount(Number(event.amount), event.currency)}</td>
                                        <td className="px-4 py-3 uppercase">{event.provider}</td>
                                        <td className="px-4 py-3">
                                            {receiptUrl ? (
                                                <a 
                                                    href={receiptUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                                                >
                                                    Receipt / رسید ↗
                                                </a>
                                            ) : (
                                                event.source
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {event.status === "success" && (
                                                <ResendEmailButton giftRef={event.gift_ref} email={payerEmail} />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {events.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-white/50">
                                        No gift events yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
