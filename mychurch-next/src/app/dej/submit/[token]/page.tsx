"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, Send, CheckCircle, Printer, Tv, Clock, DollarSign, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface WorkItem {
    id: string;
    description: string;
    hours: number;
    rate: number;
    total: number;
}

interface LinkData {
    label: string;
    to_company: string;
    hourly_rate: number | null;
}

const newItem = (defaultRate = 0): WorkItem => ({
    id: crypto.randomUUID(),
    description: "",
    hours: 1,
    rate: defaultRate,
    total: defaultRate,
});

export default function FreelancerSubmitPage() {
    const params = useParams();
    const token = params ? (params.token as string) : "";
    const [linkData, setLinkData] = useState<LinkData | null>(null);
    const [linkError, setLinkError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [freelancerName, setFreelancerName] = useState("");
    const [freelancerAddress, setFreelancerAddress] = useState("");
    const [walletTether, setWalletTether] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<WorkItem[]>([]);

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [resultInvoiceId, setResultInvoiceId] = useState<string | null>(null);
    const [resultInvoiceNum, setResultInvoiceNum] = useState<string | null>(null);

    const printRef = useRef<HTMLDivElement>(null);

    // Validate token on mount
    useEffect(() => {
        if (!token) return;
        fetch(`/api/dej/submit/${token}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setLinkError(data.error); }
                else {
                    setLinkData(data);
                    setItems([newItem(data.hourly_rate || 0)]);
                }
                setLoading(false);
            })
            .catch(() => { setLinkError("Failed to load. Please try again."); setLoading(false); });
    }, [token]);

    const updateItem = (id: string, field: keyof WorkItem, value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const next = { ...item, [field]: value };
            if (field === "hours" || field === "rate") {
                next.total = parseFloat((next.hours * next.rate).toFixed(2));
            }
            return next;
        }));
    };

    const subtotal = items.reduce((s, i) => s + i.total, 0);

    const handleSubmit = async () => {
        if (!freelancerName.trim()) { alert("Please enter your full name."); return; }
        const valid = items.filter(i => i.description.trim() && i.hours > 0);
        if (!valid.length) { alert("Please add at least one work item."); return; }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/dej/submit/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    freelancer_name: freelancerName,
                    freelancer_address: freelancerAddress,
                    wallet_tether: walletTether,
                    notes,
                    items: valid,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResultInvoiceId(data.invoice_id);
            setResultInvoiceNum(data.invoice_number);
            setSubmitted(true);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Loading ───────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-white/40 text-sm animate-pulse">Loading your form...</div>
        </div>
    );

    // ─── Error ─────────────────────────────────────────
    if (linkError) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-6">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h1 className="text-2xl font-black mb-2">Link Unavailable</h1>
            <p className="text-white/50 text-center max-w-sm">{linkError}</p>
        </div>
    );

    // ─── Success ───────────────────────────────────────
    if (submitted) return (
        <div className="min-h-screen bg-slate-900 text-white px-6">
            {/* Success Header */}
            <div className="max-w-2xl mx-auto pt-16 pb-10 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-black mb-2">Submitted Successfully!</h1>
                <p className="text-white/50 mb-1">Your timesheet has been received by DEJ TV.</p>
                <p className="font-mono text-sm text-orange-400 mt-2">{resultInvoiceNum}</p>
            </div>

            {/* Printable Receipt */}
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm font-bold border border-white/10 print:hidden"
                    >
                        <Printer className="w-4 h-4" /> Print / Download PDF
                    </button>
                </div>

                <div ref={printRef} className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/30 print:shadow-none">
                    <div className="p-10 md:p-14 font-sans text-gray-900">
                        {/* Receipt Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center print:hidden">
                                        <Tv className="w-4 h-4 text-white" />
                                    </div>
                                    <h1 className="text-2xl font-black text-gray-900">DEJ TV</h1>
                                </div>
                                <p className="text-xs text-gray-400">Freelancer Timesheet Receipt</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">INVOICE</p>
                                <p className="text-sm font-mono text-gray-500">{resultInvoiceNum}</p>
                                <p className="text-xs text-gray-400 mt-1">{format(new Date(), "MMMM dd, yyyy")}</p>
                            </div>
                        </div>

                        {/* From / To */}
                        <div className="grid grid-cols-2 gap-8 mb-10 p-5 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Bill To</p>
                                <p className="font-bold">{linkData?.to_company}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">From</p>
                                <p className="font-bold">{freelancerName}</p>
                                {freelancerAddress && <p className="text-sm text-gray-500 mt-0.5">{freelancerAddress}</p>}
                            </div>
                        </div>

                        {/* Items */}
                        <table className="w-full text-sm mb-8">
                            <thead>
                                <tr className="bg-gray-900 text-white text-xs uppercase tracking-widest">
                                    <th className="text-left py-3 px-4 rounded-l-xl">Description</th>
                                    <th className="text-center py-3 px-3 w-20">Hours</th>
                                    <th className="text-right py-3 px-3 w-24">Rate/hr</th>
                                    <th className="text-right py-3 px-4 rounded-r-xl w-24">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.filter(i => i.description && i.hours > 0).map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-3 px-4 font-medium">{item.description}</td>
                                        <td className="py-3 px-3 text-center text-gray-600">{item.hours}h</td>
                                        <td className="py-3 px-3 text-right text-gray-600" dir="ltr">${item.rate.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right font-bold" dir="ltr">${item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Total */}
                        <div className="flex justify-end mb-8">
                            <div className="text-xl font-black border-t-2 border-gray-900 pt-3 flex gap-12">
                                <span>Total</span>
                                <span className="text-orange-500" dir="ltr">${subtotal.toFixed(2)} USD</span>
                            </div>
                        </div>

                        {/* Wallet */}
                        {walletTether && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">USDT (TRC20)</p>
                                <p className="font-mono text-sm break-all" dir="ltr">{walletTether}</p>
                            </div>
                        )}

                        <p className="text-center text-xs text-gray-300">Thank you — DEJ TV</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── Main Form ─────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Tv className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight">DEJ TV · Timesheet</h1>
                        <p className="text-xs text-white/40 font-mono">{linkData?.label}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
                {/* Info Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-sm text-blue-300">
                    Fill in your work details below and submit. You'll receive a downloadable invoice receipt immediately after.
                </div>

                {/* Personal Info */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                    <h2 className="font-bold text-white/60 text-xs uppercase tracking-widest">Your Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-white/40 block mb-1.5">Full Name *</label>
                            <input value={freelancerName} onChange={e => setFreelancerName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/60 placeholder:text-white/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/40 block mb-1.5">Location (Optional)</label>
                            <input value={freelancerAddress} onChange={e => setFreelancerAddress(e.target.value)}
                                placeholder="City, Country"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-white/40 block mb-1.5">USDT Wallet (TRC20) – For Payment</label>
                            <input value={walletTether} onChange={e => setWalletTether(e.target.value)}
                                placeholder="T... (optional)"
                                dir="ltr"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 placeholder:text-white/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Work Items */}
                <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <h2 className="font-bold text-sm">Work Items</h2>
                        </div>
                        <button
                            onClick={() => setItems(p => [...p, newItem(linkData?.hourly_rate || 0)])}
                            className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition"
                        >
                            <Plus className="w-4 h-4" /> Add Row
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-white/30 text-xs uppercase tracking-widest border-b border-white/10">
                                    <th className="text-left py-3 px-4">What did you work on?</th>
                                    <th className="text-center py-3 px-3 w-20">Hours</th>
                                    <th className="text-right py-3 px-3 w-24">Rate/hr $</th>
                                    <th className="text-right py-3 px-4 w-24">Total</th>
                                    <th className="w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map(item => (
                                    <tr key={item.id} className="group">
                                        <td className="p-2 px-4">
                                            <input value={item.description}
                                                onChange={e => updateItem(item.id, "description", e.target.value)}
                                                placeholder="Video editing, voiceover, report..."
                                                className="w-full bg-transparent border-0 border-b border-transparent hover:border-white/20 focus:border-orange-500/60 py-1 focus:outline-none text-sm placeholder:text-white/20"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" min={0.5} step={0.5} value={item.hours || ""}
                                                onChange={e => updateItem(item.id, "hours", parseFloat(e.target.value) || 0)}
                                                className="w-full bg-transparent text-center border-0 border-b border-transparent hover:border-white/20 focus:border-orange-500/60 py-1 focus:outline-none text-sm"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" min={0} step={0.01} value={item.rate || ""}
                                                onChange={e => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                                                dir="ltr"
                                                className="w-full bg-transparent text-right border-0 border-b border-transparent hover:border-white/20 focus:border-orange-500/60 py-1 focus:outline-none text-sm"
                                            />
                                        </td>
                                        <td className="p-2 px-4 text-right font-bold text-white/80 tabular-nums">
                                            ${item.total.toFixed(2)}
                                        </td>
                                        <td className="p-2">
                                            {items.length > 1 && (
                                                <button onClick={() => setItems(p => p.filter(i => i.id !== item.id))}
                                                    className="p-1 rounded text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total row */}
                    <div className="px-5 py-4 border-t border-white/10 flex justify-end items-center gap-12" dir="ltr">
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                            <DollarSign className="w-4 h-4" />
                            <span>Total Due</span>
                        </div>
                        <span className="text-2xl font-black text-orange-400 tabular-nums">${subtotal.toFixed(2)}</span>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="text-xs text-white/40 block mb-1.5">Additional Notes (Optional)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                        placeholder="Any additional information..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none placeholder:text-white/20"
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 disabled:opacity-50 transition font-black text-lg shadow-xl shadow-red-500/20 flex items-center justify-center gap-3"
                >
                    <Send className="w-5 h-5" />
                    {submitting ? "Submitting..." : "Submit Timesheet & Get Invoice"}
                </button>

                <p className="text-center text-xs text-white/20">
                    This link is private and can only be used once. After submission, you'll receive your invoice receipt.
                </p>
            </main>
        </div>
    );
}
