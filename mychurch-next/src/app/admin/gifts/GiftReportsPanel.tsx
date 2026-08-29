"use client";

import React, { useState, useMemo } from "react";
import { GiftEvent } from "@/actions/gift-events";
import { Search, Calendar, FileText, Download, Printer, DollarSign, ArrowUpDown } from "lucide-react";

interface GiftReportsPanelProps {
    events: GiftEvent[];
}

type DatePreset = "all" | "this_month" | "last_30_days" | "this_year" | "last_year" | "custom";

export default function GiftReportsPanel({ events }: GiftReportsPanelProps) {
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState<DatePreset>("this_year");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [providerFilter, setProviderFilter] = useState<"all" | "stripe" | "square">("all");

    // Only report successful payments for tax/accounting purposes
    const successEvents = useMemo(() => {
        return events.filter(e => e.status === "success");
    }, [events]);

    // Filter logic
    const filteredEvents = useMemo(() => {
        return successEvents.filter(e => {
            const metadata = (e.metadata || {}) as Record<string, any>;
            const payerName = (metadata.payer_name || "").toLowerCase();
            const payerEmail = (metadata.payer_email || "").toLowerCase();
            const giftRef = (e.gift_ref || "").toLowerCase();
            const provider = e.provider.toLowerCase();

            // 1. Search Query filter
            const query = search.toLowerCase();
            if (query && !payerName.includes(query) && !payerEmail.includes(query) && !giftRef.includes(query)) {
                return false;
            }

            // 2. Provider filter
            if (providerFilter !== "all" && provider !== providerFilter) {
                return false;
            }

            // 3. Date range filter
            const date = new Date(e.created_at);
            const now = new Date();

            if (dateFilter === "this_month") {
                if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
                    return false;
                }
            } else if (dateFilter === "last_30_days") {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                if (date < thirtyDaysAgo) return false;
            } else if (dateFilter === "this_year") {
                if (date.getFullYear() !== now.getFullYear()) return false;
            } else if (dateFilter === "last_year") {
                if (date.getFullYear() !== now.getFullYear() - 1) return false;
            } else if (dateFilter === "custom") {
                if (customStart) {
                    const start = new Date(customStart);
                    start.setHours(0, 0, 0, 0);
                    if (date < start) return false;
                }
                if (customEnd) {
                    const end = new Date(customEnd);
                    end.setHours(23, 59, 59, 999);
                    if (date > end) return false;
                }
            }

            return true;
        });
    }, [successEvents, search, dateFilter, customStart, customEnd, providerFilter]);

    // Financial Metrics
    const totalUSD = useMemo(() => {
        return filteredEvents.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    }, [filteredEvents]);

    // CSV Exporter
    const handleExportCSV = () => {
        if (filteredEvents.length === 0) return;

        const headers = ["Date", "Donor Name", "Email Address", "Amount (USD)", "Provider", "Reference ID"];
        const rows = filteredEvents.map(e => {
            const metadata = (e.metadata || {}) as Record<string, any>;
            return [
                new Date(e.created_at).toLocaleDateString("en-US"),
                metadata.payer_name || "Anonymous Supporter",
                metadata.payer_email || "-",
                e.amount.toFixed(2),
                e.provider.toUpperCase(),
                e.gift_ref
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Donations_Report_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print tax statement
    const handlePrint = () => {
        window.print();
    };

    // Format helpers
    const reportPeriodText = useMemo(() => {
        const now = new Date();
        switch (dateFilter) {
            case "this_month": return `This Month (${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()})`;
            case "last_30_days": return "Last 30 Days";
            case "this_year": return `Tax Year ${now.getFullYear()}`;
            case "last_year": return `Tax Year ${now.getFullYear() - 1}`;
            case "custom":
                return `Period: ${customStart || "Beginning"} to ${customEnd || "End"}`;
            default:
                return "All Time";
        }
    }, [dateFilter, customStart, customEnd]);

    return (
        <div className="space-y-6">
            {/* Screen layout: Filter and summary controls */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 space-y-4 print:hidden">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-white">Tax & Financial Reporting</h2>
                        <p className="text-xs text-white/50">Filter, summarize, and export donation records for 501(c)(3) tax deductions or accounting audits.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={filteredEvents.length === 0}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs font-bold text-white hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
                        >
                            <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={filteredEvents.length === 0}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/10"
                        >
                            <Printer className="w-3.5 h-3.5" /> Print Statement / PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    {/* Search query input */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                            <Search className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search name, email, ref..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-neutral-950/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>

                    {/* Date filter selector */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                            <Calendar className="w-4 h-4" />
                        </span>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DatePreset)}
                            className="w-full bg-neutral-950/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                        >
                            <option value="this_year">This Year (Tax Year)</option>
                            <option value="last_year">Last Year (Tax Year)</option>
                            <option value="this_month">This Month</option>
                            <option value="last_30_days">Last 30 Days</option>
                            <option value="all">All Time</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>

                    {/* Provider filter */}
                    <div>
                        <select
                            value={providerFilter}
                            onChange={(e) => setProviderFilter(e.target.value as any)}
                            className="w-full bg-neutral-950/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                            <option value="all">All Payment Gateways</option>
                            <option value="stripe">Stripe Gateway Only</option>
                            <option value="square">Square Gateway Only</option>
                        </select>
                    </div>

                    {/* Custom range display status */}
                    <div className="flex items-center text-xs text-white/50 font-bold bg-neutral-950/20 px-4 py-2 rounded-xl border border-white/5">
                        <FileText className="w-4 h-4 shrink-0 text-indigo-400 mr-2" />
                        <span>Filter matches: {filteredEvents.length} transactions</span>
                    </div>
                </div>

                {/* Custom Date Range Panel */}
                {dateFilter === "custom" && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-950/20 border border-white/5 animate-fade-in-up">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5">Start Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="w-full bg-neutral-950/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-white/40 mb-1.5">End Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="w-full bg-neutral-950/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Screen metrics layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                <div className="rounded-2xl border border-white/10 bg-emerald-500/5 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-emerald-400/70 uppercase">Total Exemption Sum / جمع کل پرداختی‌ها</p>
                        <p className="text-3xl font-black text-emerald-300 mt-2 font-sans">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalUSD)}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-indigo-500/5 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-indigo-400/70 uppercase">Total Gifts Count / تعداد هدایا</p>
                        <p className="text-3xl font-black text-indigo-300 mt-2 font-sans">
                            {filteredEvents.length}
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <ArrowUpDown className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Screen table representation */}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 print:hidden">
                <div className="border-b border-white/10 px-4 py-3 text-sm font-bold text-white flex justify-between items-center">
                    <span>Generated Report Results ({reportPeriodText})</span>
                    <span className="text-xs text-white/50">Successful Transactions Only</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
                            <tr>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-left">Donor</th>
                                <th className="px-4 py-3 text-left">Email Address</th>
                                <th className="px-4 py-3 text-left">Amount</th>
                                <th className="px-4 py-3 text-left">Provider</th>
                                <th className="px-4 py-3 text-left">Reference ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map((event) => {
                                const metadata = (event.metadata || {}) as Record<string, any>;
                                const payerName = metadata.payer_name || "Anonymous Supporter";
                                const payerEmail = metadata.payer_email || "-";

                                return (
                                    <tr key={event.id} className="border-t border-white/5 text-white/80 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3">{new Date(event.created_at).toLocaleDateString("en-US")}</td>
                                        <td className="px-4 py-3 font-semibold text-white">{payerName}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{payerEmail}</td>
                                        <td className="px-4 py-3 font-semibold text-emerald-400">
                                            {new Intl.NumberFormat("en-US", { style: "currency", currency: event.currency.toUpperCase() }).format(Number(event.amount))}
                                        </td>
                                        <td className="px-4 py-3 uppercase text-xs">{event.provider}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{event.gift_ref}</td>
                                    </tr>
                                );
                            })}
                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-white/40">
                                        No successful donations matched these filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PRINT-ONLY FORMAL DONATION STATEMENT */}
            <div className="hidden print:block p-10 bg-white text-black font-sans min-h-screen text-right" dir="rtl">
                {/* Header Statement */}
                <div className="text-center mb-10 border-b border-gray-300 pb-6 flex flex-col items-center">
                    <span className="text-4xl mb-2">💝</span>
                    <h1 className="text-2xl font-bold text-gray-900">کلیسای انجیلی ایرانیان واشنگتن دی‌سی</h1>
                    <h2 className="text-lg text-gray-700 font-sans tracking-wide mt-1" dir="ltr">Iranian Presbyterian Church of Washington DC</h2>
                    <p className="text-xs text-gray-500 mt-2">رسید معافیت مالیاتی هدایا / Official Tax Donation Statement</p>
                    <p className="text-xs text-gray-400 font-sans" dir="ltr">501(c)(3) Non-Profit Charitable Organization</p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-800 mb-8 border-b border-gray-200 pb-6">
                    <div>
                        <p><strong>تاریخ گزارش:</strong> {new Date().toLocaleDateString("fa-IR")} ({new Date().toLocaleDateString("en-US")})</p>
                        <p><strong>دوره گزارش:</strong> {reportPeriodText}</p>
                    </div>
                    <div className="text-left" dir="ltr">
                        <p><strong>Report Date:</strong> {new Date().toLocaleDateString("en-US")}</p>
                        <p><strong>Exemption Period:</strong> {reportPeriodText}</p>
                    </div>
                </div>

                {/* Table details */}
                <div className="mb-10">
                    <h3 className="text-md font-bold mb-4 border-b pb-2 text-gray-800">لیست هدایای دریافتی / Received Gifts Details</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 border-b border-gray-300">
                                <th className="p-2.5 text-right">تاریخ / Date</th>
                                <th className="p-2.5 text-right">نام پرداخت‌کننده / Donor</th>
                                <th className="p-2.5 text-right">ایمیل / Email</th>
                                <th className="p-2.5 text-left">مبلغ / Amount (USD)</th>
                                <th className="p-2.5 text-left">مرجع پرداخت / Reference</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map((event) => {
                                const metadata = (event.metadata || {}) as Record<string, any>;
                                return (
                                    <tr key={event.id} className="border-b border-gray-200 text-gray-800">
                                        <td className="p-2.5">{new Date(event.created_at).toLocaleDateString("fa-IR")}</td>
                                        <td className="p-2.5">{metadata.payer_name || "Anonymous Supporter"}</td>
                                        <td className="p-2.5 font-sans text-xs text-left" dir="ltr">{metadata.payer_email || "-"}</td>
                                        <td className="p-2.5 text-left font-bold" dir="ltr">${Number(event.amount).toFixed(2)}</td>
                                        <td className="p-2.5 font-sans text-xs text-left" dir="ltr">{event.gift_ref}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Totals Exemption Statement */}
                <div className="bg-gray-50 border border-gray-300 rounded-xl p-5 mb-10 flex justify-between items-center text-gray-900">
                    <div>
                        <p className="text-sm font-bold text-gray-700">مجموع مبالغ اهدایی معاف از مالیات:</p>
                        <p className="text-xl font-black text-emerald-700 mt-1" dir="ltr">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalUSD)}
                        </p>
                    </div>
                    <div className="text-left" dir="ltr">
                        <p className="text-sm font-bold text-gray-700">Total Tax-Deductible Donation Amount:</p>
                        <p className="text-xl font-black text-emerald-700 mt-1">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalUSD)}
                        </p>
                    </div>
                </div>

                {/* Formal statement of 501(c)(3) */}
                <div className="text-xs text-gray-500 leading-relaxed space-y-2 border-t border-gray-200 pt-6">
                    <p>کلیسای انجیلی ایرانیان واشنگتن دی‌سی یک سازمان غیرانتفاعی ثبت شده تحت بند ۵۰۱(c)(۳) قانون درآمدهای داخلی ایالات متحده آمریکا می‌باشد. هیچ کالا یا خدماتی در قبال دریافت این هدایا به اهداکننده ارائه نشده است، بنابراین کل مبلغ اهدایی فوق الذکر به عنوان کمک خیریه جهت کسر مالیاتی معاف می‌باشد.</p>
                    <p dir="ltr" className="text-left font-sans">The Iranian Presbyterian Church of Washington DC is a registered 501(c)(3) non-profit organization. No goods or services were provided in exchange for these contributions, rendering the full amount tax-deductible as charitable contributions under IRS regulations.</p>
                </div>

                {/* Sign-off section */}
                <div className="mt-16 flex justify-between items-start text-sm text-gray-800">
                    <div className="w-48 text-center border-t border-gray-400 pt-2 font-bold">
                        امضای خزانه‌دار کلیسا
                        <p className="text-xs text-gray-400 mt-4">(Signature & Stamp)</p>
                    </div>
                    <div className="w-48 text-center border-t border-gray-400 pt-2 font-bold font-sans" dir="ltr">
                        Church Treasurer
                        <p className="text-xs text-gray-400 mt-4">(Date)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
