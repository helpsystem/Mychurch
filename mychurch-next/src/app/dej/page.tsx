"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Plus, Download, Trash2, Eye, TrendingUp, FileText, DollarSign,
    Clock, CheckCircle, XCircle, Search, Filter, RefreshCw, Tv,
    Link2, Copy, Check, ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

interface Invoice {
    id: string;
    invoice_number: string;
    to_company: string;
    freelancer_name: string;
    invoice_date: string;
    total_amount: number;
    payment_status: "unpaid" | "paid" | "partial" | "cancelled";
    currency: string;
    items: InvoiceItem[];
    created_at: string;
}

interface SubmissionLink {
    id: string;
    token: string;
    label: string;
    to_company: string;
    hourly_rate: number | null;
    is_used: boolean;
    expires_at: string | null;
    created_at: string;
}

const STATUS_CONFIG = {
    unpaid: { label: "Unpaid", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    paid: { label: "Paid", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
    partial: { label: "Partial", color: "bg-blue-100 text-blue-800 border-blue-200", icon: TrendingUp },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export default function DejDashboard() {
    const [tab, setTab] = useState<"invoices" | "links">("invoices");

    // ─── Invoices state ────────────────────────────────
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [error, setError] = useState<string | null>(null);

    // ─── Links state ───────────────────────────────────
    const [links, setLinks] = useState<SubmissionLink[]>([]);
    const [linksLoading, setLinksLoading] = useState(false);
    const [newLinkLabel, setNewLinkLabel] = useState("");
    const [newLinkRate, setNewLinkRate] = useState("");
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [creatingLink, setCreatingLink] = useState(false);

    // ─── Fetch invoices ────────────────────────────────
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/dej/invoices");
            if (!res.ok) throw new Error("Failed to fetch invoices");
            setInvoices(await res.json());
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error loading invoices");
        } finally {
            setLoading(false);
        }
    };

    // ─── Fetch links ───────────────────────────────────
    const fetchLinks = async () => {
        setLinksLoading(true);
        try {
            const res = await fetch("/api/dej/links");
            setLinks(await res.json());
        } finally {
            setLinksLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, []);
    useEffect(() => { if (tab === "links") fetchLinks(); }, [tab]);

    const handleDelete = async (id: string, invNum: string) => {
        if (!confirm(`Delete invoice ${invNum}? This cannot be undone.`)) return;
        try {
            await fetch(`/api/dej/invoices/${id}`, { method: "DELETE" });
            setInvoices(prev => prev.filter(i => i.id !== id));
        } catch { alert("Failed to delete invoice."); }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/dej/invoices/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_status: status, payment_date: status === "paid" ? new Date().toISOString().split("T")[0] : null })
            });
            if (!res.ok) throw new Error();
            const updated = await res.json();
            setInvoices(prev => prev.map(i => i.id === id ? { ...i, payment_status: updated.payment_status } : i));
        } catch { alert("Failed to update status."); }
    };

    const exportCSV = () => {
        const headers = ["Invoice #", "Freelancer", "Date", "Total", "Currency", "Status"];
        const rows = filteredInvoices.map(inv => [
            inv.invoice_number, inv.freelancer_name,
            format(new Date(inv.invoice_date), "MMM dd, yyyy"),
            inv.total_amount, inv.currency, inv.payment_status
        ]);
        const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const a = document.createElement("a");
        a.href = encodeURI(csv);
        a.download = `dej_invoices_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    };

    const handleCreateLink = async () => {
        if (!newLinkLabel.trim()) { alert("Please enter a label for this link."); return; }
        setCreatingLink(true);
        try {
            const res = await fetch("/api/dej/links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    label: newLinkLabel,
                    hourly_rate: newLinkRate ? parseFloat(newLinkRate) : null,
                }),
            });
            if (!res.ok) throw new Error("Failed to create link");
            setNewLinkLabel("");
            setNewLinkRate("");
            await fetchLinks();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Error");
        } finally {
            setCreatingLink(false);
        }
    };

    const copyLink = (token: string) => {
        const url = `${window.location.origin}/dej/submit/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const filteredInvoices = invoices
        .filter(inv => statusFilter === "all" || inv.payment_status === statusFilter)
        .filter(inv =>
            search === "" ||
            inv.freelancer_name.toLowerCase().includes(search.toLowerCase()) ||
            inv.invoice_number.toLowerCase().includes(search.toLowerCase())
        );

    const stats = {
        total: invoices.length,
        unpaid: invoices.filter(i => i.payment_status === "unpaid").length,
        paid: invoices.filter(i => i.payment_status === "paid").length,
        totalValue: invoices.reduce((sum, i) => sum + i.total_amount, 0),
        unpaidValue: invoices.filter(i => i.payment_status === "unpaid").reduce((sum, i) => sum + i.total_amount, 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                            <Tv className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter">DEJ TV</h1>
                            <p className="text-xs text-white/50 font-mono">Invoice Manager</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchInvoices} disabled={loading}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10" title="Refresh">
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-white/40" : "text-white"}`} />
                        </button>
                        <button onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm font-medium border border-white/10">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <Link href="/dej/create"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition text-sm font-bold shadow-lg shadow-red-500/25">
                            <Plus className="w-4 h-4" /> New Invoice
                        </Link>
                    </div>
                </div>
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0 border-t border-white/5">
                    {[
                        { key: "invoices", label: "Invoices", icon: FileText },
                        { key: "links", label: "Send Links", icon: Link2 },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as "invoices" | "links")}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.key
                                    ? "border-orange-500 text-orange-400"
                                    : "border-transparent text-white/40 hover:text-white/70"
                                }`}>
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
                {/* ─── INVOICES TAB ─── */}
                {tab === "invoices" && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "Total Invoices", value: stats.total, icon: FileText, color: "from-purple-500/20 to-purple-600/5", border: "border-purple-500/20", text: "text-purple-400" },
                                { label: "Total Value", value: `$${stats.totalValue.toFixed(2)}`, icon: DollarSign, color: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/20", text: "text-emerald-400" },
                                { label: "Unpaid", value: stats.unpaid, icon: Clock, color: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/20", text: "text-yellow-400" },
                                { label: "Outstanding", value: `$${stats.unpaidValue.toFixed(2)}`, icon: TrendingUp, color: "from-red-500/20 to-red-600/5", border: "border-red-500/20", text: "text-red-400" },
                            ].map((stat, i) => (
                                <div key={i} className={`rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.border} p-5`}>
                                    <stat.icon className={`w-5 h-5 mb-3 ${stat.text}`} />
                                    <div className="text-2xl font-black">{stat.value}</div>
                                    <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by name or invoice number..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pl-9 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/30"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-white/40" />
                                <select title="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer">
                                    <option value="all">All Statuses</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                            {error ? (
                                <div className="text-center py-16 text-red-400">
                                    <XCircle className="mx-auto w-10 h-10 mb-3 opacity-50" />
                                    <p className="font-medium">{error}</p>
                                    <button onClick={fetchInvoices} className="mt-4 text-sm underline opacity-60">Try Again</button>
                                </div>
                            ) : loading ? (
                                <div className="text-center py-16 text-white/40">
                                    <RefreshCw className="mx-auto w-8 h-8 mb-3 animate-spin opacity-50" />
                                    <p>Loading invoices...</p>
                                </div>
                            ) : filteredInvoices.length === 0 ? (
                                <div className="text-center py-16 text-white/30">
                                    <FileText className="mx-auto w-10 h-10 mb-3 opacity-30" />
                                    <p className="font-medium">No invoices found.</p>
                                    <Link href="/dej/create" className="mt-4 inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition">
                                        <Plus className="w-4 h-4" /> Create your first invoice
                                    </Link>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                                            <th className="text-left py-4 px-5 font-semibold">Invoice #</th>
                                            <th className="text-left py-4 px-3 font-semibold">Freelancer</th>
                                            <th className="text-left py-4 px-3 font-semibold">Date</th>
                                            <th className="text-right py-4 px-3 font-semibold">Amount</th>
                                            <th className="text-center py-4 px-3 font-semibold">Status</th>
                                            <th className="text-right py-4 px-5 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredInvoices.map(inv => {
                                            const s = STATUS_CONFIG[inv.payment_status];
                                            return (
                                                <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="py-4 px-5">
                                                        <span className="font-mono font-bold text-orange-400">{inv.invoice_number}</span>
                                                    </td>
                                                    <td className="py-4 px-3 font-medium">{inv.freelancer_name}</td>
                                                    <td className="py-4 px-3 text-white/60">{format(new Date(inv.invoice_date), "MMM dd, yyyy")}</td>
                                                    <td className="py-4 px-3 text-right font-bold tabular-nums">
                                                        ${inv.total_amount.toFixed(2)} <span className="text-white/30 text-xs">{inv.currency}</span>
                                                    </td>
                                                    <td className="py-4 px-3">
                                                        <div className="flex justify-center">
                                                            <select title="Update payment status"
                                                                value={inv.payment_status}
                                                                onChange={e => handleUpdateStatus(inv.id, e.target.value)}
                                                                className={`text-xs font-bold px-3 py-1 rounded-full border cursor-pointer ${s.color} bg-transparent`}>
                                                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                                    <option key={key} value={key}>{cfg.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-5">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link href={`/dej/invoice/${inv.id}`}
                                                                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition" title="View Invoice">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => handleDelete(inv.id, inv.invoice_number)}
                                                                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-400 transition" title="Delete Invoice">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* ─── LINKS TAB ─── */}
                {tab === "links" && (
                    <div className="space-y-6">
                        {/* Create new link */}
                        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Link2 className="w-5 h-5 text-indigo-400" />
                                <h2 className="font-bold text-indigo-300">Generate Freelancer Submission Link</h2>
                            </div>
                            <p className="text-xs text-white/40">
                                Create a private one-time link. The freelancer opens it, fills in their hours and rate, and gets an invoice receipt automatically. The submission appears in your Invoices tab.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="text-xs text-white/40 block mb-1.5">Link Label (internal)</label>
                                    <input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)}
                                        placeholder="e.g. March 2026 – Ahmad – Video Editing"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 block mb-1.5">Default Rate/hr $ (optional)</label>
                                    <input type="number" min={0} step={1} value={newLinkRate} onChange={e => setNewLinkRate(e.target.value)}
                                        placeholder="e.g. 25"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-white/20"
                                    />
                                </div>
                            </div>
                            <button onClick={handleCreateLink} disabled={creatingLink || !newLinkLabel.trim()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition text-sm font-bold">
                                <Plus className="w-4 h-4" />
                                {creatingLink ? "Creating..." : "Generate Link"}
                            </button>
                        </div>

                        {/* Links list */}
                        <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                            {linksLoading ? (
                                <div className="text-center py-12 text-white/30">
                                    <RefreshCw className="mx-auto w-6 h-6 mb-2 animate-spin" />
                                    <p className="text-sm">Loading links...</p>
                                </div>
                            ) : links.length === 0 ? (
                                <div className="text-center py-12 text-white/20">
                                    <Link2 className="mx-auto w-8 h-8 mb-2 opacity-30" />
                                    <p className="text-sm">No links generated yet.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                                            <th className="text-left py-4 px-5 font-semibold">Label</th>
                                            <th className="text-left py-4 px-3 font-semibold">Rate/hr</th>
                                            <th className="text-center py-4 px-3 font-semibold">Status</th>
                                            <th className="text-left py-4 px-3 font-semibold">Created</th>
                                            <th className="text-right py-4 px-5 font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {links.map(link => (
                                            <tr key={link.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-5 font-medium max-w-xs truncate">{link.label}</td>
                                                <td className="py-4 px-3 text-white/60 tabular-nums">
                                                    {link.hourly_rate ? `$${link.hourly_rate}/hr` : "—"}
                                                </td>
                                                <td className="py-4 px-3 text-center">
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${link.is_used
                                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                                        }`}>
                                                        {link.is_used ? "✓ Used" : "Pending"}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3 text-white/40 text-xs">
                                                    {format(new Date(link.created_at), "MMM dd, yyyy HH:mm")}
                                                </td>
                                                <td className="py-4 px-5">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!link.is_used && (
                                                            <>
                                                                <button onClick={() => copyLink(link.token)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition text-xs font-bold"
                                                                    title="Copy Link">
                                                                    {copiedToken === link.token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                                    {copiedToken === link.token ? "Copied!" : "Copy Link"}
                                                                </button>
                                                                <a href={`/dej/submit/${link.token}`} target="_blank" rel="noreferrer"
                                                                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition" title="Open Link">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
