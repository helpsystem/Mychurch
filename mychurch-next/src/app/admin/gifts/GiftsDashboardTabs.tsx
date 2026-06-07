"use client";

import React, { useState } from "react";
import { GiftEvent } from "@/actions/gift-events";
import ResendEmailButton from "./ResendEmailButton";
import GiftReportsPanel from "./GiftReportsPanel";
import { Activity, Receipt } from "lucide-react";

interface GiftsDashboardTabsProps {
    events: GiftEvent[];
}

function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: (currency || "USD").toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(amount || 0));
}

export default function GiftsDashboardTabs({ events }: GiftsDashboardTabsProps) {
    const [activeTab, setActiveTab] = useState<"feed" | "reports">("feed");

    return (
        <div className="space-y-6">
            {/* Tab navigation */}
            <div className="flex border-b border-white/10 gap-6 print:hidden">
                <button
                    onClick={() => setActiveTab("feed")}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "feed"
                            ? "border-indigo-500 text-white font-black"
                            : "border-transparent text-white/50 hover:text-white"
                    }`}
                >
                    <Activity className="w-4 h-4" /> Live Activity Feed
                </button>
                <button
                    onClick={() => setActiveTab("reports")}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === "reports"
                            ? "border-indigo-500 text-white font-black"
                            : "border-transparent text-white/50 hover:text-white"
                    }`}
                >
                    <Receipt className="w-4 h-4" /> Tax & Financial Reports
                </button>
            </div>

            {/* Tab contents */}
            {activeTab === "feed" ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 print:hidden">
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
                                        <tr key={event.id} className="border-t border-white/5 text-white/80 hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">{new Date(event.created_at).toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                    event.status === "success" 
                                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
                                                        : event.status === "cancelled" 
                                                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400" 
                                                        : event.status === "error"
                                                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                                                        : "border-white/10 bg-white/5 text-white/60"
                                                }`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-white">{payerName}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{payerEmail}</td>
                                            <td className="px-4 py-3">{formatAmount(Number(event.amount), event.currency)}</td>
                                            <td className="px-4 py-3 uppercase text-xs">{event.provider}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1 max-w-[220px]">
                                                    {receiptUrl ? (
                                                        <a 
                                                            href={receiptUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-emerald-400 hover:underline inline-flex items-center gap-1 w-fit"
                                                        >
                                                            Receipt / رسید ↗
                                                        </a>
                                                    ) : (
                                                        <span className="truncate">{event.source}</span>
                                                    )}
                                                    {metadata.message && (
                                                        <span 
                                                            className="text-xs text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg w-fit max-w-full truncate" 
                                                            title={String(metadata.message)}
                                                        >
                                                            💬 {String(metadata.message)}
                                                        </span>
                                                    )}
                                                </div>
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
            ) : (
                <GiftReportsPanel events={events} />
            )}
        </div>
    );
}
