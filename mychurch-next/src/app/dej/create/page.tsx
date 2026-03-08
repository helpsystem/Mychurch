"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
    ArrowLeft, Plus, Trash2, Save, Tv, FileText, Sparkles
} from "lucide-react";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

const newItem = (): InvoiceItem => ({
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unit_price: 0,
    total: 0,
});

export default function CreateDejInvoice() {
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [toCompany, setToCompany] = useState("DEJ TV");
    const [freelancerName, setFreelancerName] = useState("");
    const [freelancerAddress, setFreelancerAddress] = useState("");
    const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [dueDate, setDueDate] = useState("");
    const [walletTether, setWalletTether] = useState("");
    const [discountPercent, setDiscountPercent] = useState(0);
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<InvoiceItem[]>([newItem()]);
    const [aiText, setAiText] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const totalAmount = subtotal - discountAmount;

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(prev =>
            prev.map(item => {
                if (item.id !== id) return item;
                const next = { ...item, [field]: value };
                if (field === "quantity" || field === "unit_price") {
                    next.total = parseFloat((next.quantity * next.unit_price).toFixed(2));
                }
                return next;
            })
        );
    };

    const handleAI = async () => {
        if (!aiText.trim()) return;
        setAiLoading(true);
        try {
            // Use a simple pattern parser (no AI key needed)
            // Pattern: Description x Qty @ $Price
            const lines = aiText.trim().split("\n");
            const parsed: InvoiceItem[] = [];
            for (const line of lines) {
                if (!line.trim()) continue;
                const match = line.match(/(.+?)\s*x?\s*(\d+)\s*@?\$?\s*([\d.]+)/i);
                if (match) {
                    const qty = parseFloat(match[2]);
                    const price = parseFloat(match[3]);
                    parsed.push({ id: crypto.randomUUID(), description: match[1].trim(), quantity: qty, unit_price: price, total: parseFloat((qty * price).toFixed(2)) });
                } else {
                    // Treat as simple line with just a description and optional total at end
                    const totalMatch = line.match(/(.+?)\s+\$?([\d.]+)$/);
                    if (totalMatch) {
                        parsed.push({ id: crypto.randomUUID(), description: totalMatch[1].trim(), quantity: 1, unit_price: parseFloat(totalMatch[2]), total: parseFloat(totalMatch[2]) });
                    }
                }
            }
            if (parsed.length > 0) {
                const hasEmpty = items.length === 1 && !items[0].description;
                setItems(hasEmpty ? parsed : [...items, ...parsed]);
                setAiText("");
            } else {
                alert("Could not parse items. Format: 'Description x Qty @ $Price'");
            }
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async () => {
        if (!freelancerName.trim()) { alert("Freelancer name is required."); return; }
        const validItems = items.filter(i => i.description.trim());
        if (!validItems.length) { alert("At least one item is required."); return; }

        setSaving(true);
        try {
            const res = await fetch("/api/dej/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to_company: toCompany,
                    freelancer_name: freelancerName,
                    freelancer_address: freelancerAddress,
                    invoice_date: invoiceDate,
                    due_date: dueDate || null,
                    items: validItems.map(({ id: _id, ...rest }) => rest),
                    subtotal,
                    discount_percent: discountPercent,
                    total_amount: totalAmount,
                    wallet_tether: walletTether,
                    notes,
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const inv = await res.json();
            router.push(`/dej/invoice/${inv.id}`);
        } catch (err: unknown) {
            alert(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/dej" className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                                <Tv className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-black tracking-tight">New Invoice</h1>
                                <p className="text-xs text-white/40 font-mono">DEJ TV</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition text-sm font-bold shadow-lg shadow-red-500/25 disabled:opacity-50"
                    >
                        {saving ? <><FileText className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Invoice</>}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar: AI Parser */}
                    <div className="lg:col-span-1 space-y-5">
                        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-bold text-indigo-300">Quick Parse</h3>
                            </div>
                            <p className="text-xs text-white/40">
                                Paste items in free text. One item per line.<br />
                                Format: <span className="font-mono text-indigo-300">Description x Qty @ $Price</span>
                            </p>
                            <textarea
                                value={aiText}
                                onChange={e => setAiText(e.target.value)}
                                rows={6}
                                placeholder={"Video Editing x 3 @ $50\nVoice Over 1 @ $120\nReport $30"}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none placeholder:text-white/20 font-mono"
                            />
                            <button
                                onClick={handleAI}
                                disabled={aiLoading || !aiText.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl transition"
                            >
                                {aiLoading ? "Parsing..." : "→ Add Items"}
                            </button>
                        </div>

                        {/* Wallet */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">USDT Wallet</label>
                            <input
                                value={walletTether}
                                onChange={e => setWalletTether(e.target.value)}
                                placeholder="T... (TRC20)"
                                dir="ltr"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-white/20"
                            />
                        </div>

                        {/* Notes */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Payment terms, bank info..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 resize-none placeholder:text-white/20"
                            />
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Header Details */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
                            <h2 className="font-bold text-white/60 text-sm uppercase tracking-widest">Invoice Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 font-medium block mb-1.5">Billed To</label>
                                    <input value={toCompany} onChange={e => setToCompany(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 font-medium block mb-1.5">Invoice Date</label>
                                    <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 font-medium block mb-1.5">Freelancer Name *</label>
                                    <input value={freelancerName} onChange={e => setFreelancerName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 placeholder:text-white/20"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 font-medium block mb-1.5">Due Date (Optional)</label>
                                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="text-xs text-white/40 font-medium block mb-1.5">Freelancer Address (Optional)</label>
                                    <input value={freelancerAddress} onChange={e => setFreelancerAddress(e.target.value)}
                                        placeholder="City, Country"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                            <div className="flex justify-between items-center px-5 py-4 border-b border-white/10">
                                <h2 className="font-bold text-white/60 text-sm uppercase tracking-widest">Line Items</h2>
                                <button onClick={() => setItems(p => [...p, newItem()])}
                                    className="flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition">
                                    <Plus className="w-4 h-4" /> Add Row
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-white/30 text-xs uppercase tracking-widest border-b border-white/10">
                                            <th className="text-left py-3 px-4 w-[40%]">Description</th>
                                            <th className="text-center py-3 px-2 w-20">Qty</th>
                                            <th className="text-right py-3 px-2 w-24">Unit $</th>
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
                                                        placeholder="vid, report, photo..."
                                                        className="w-full bg-transparent border-0 border-b border-transparent hover:border-white/20 focus:border-orange-500/60 py-1 focus:outline-none text-sm placeholder:text-white/20"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input type="number" min={1} value={item.quantity || ""}
                                                        onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-transparent text-center border-0 border-b border-transparent hover:border-white/20 focus:border-orange-500/60 py-1 focus:outline-none text-sm"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input type="number" min={0} step={0.01} value={item.unit_price || ""}
                                                        onChange={e => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                                                        dir="ltr"
                                                        className="w-full bg-transparent text-right border-0 border-b border-transparent hover:border-white/20 focus:border-orange-500/60 py-1 focus:outline-none text-sm"
                                                    />
                                                </td>
                                                <td className="p-2 px-4 text-right font-bold text-white/80 tabular-nums">
                                                    ${item.total.toFixed(2)}
                                                </td>
                                                <td className="p-2">
                                                    <button onClick={() => setItems(p => p.filter(i => i.id !== item.id))}
                                                        className="p-1 rounded text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="px-5 py-4 border-t border-white/10 space-y-2 text-sm" dir="ltr">
                                <div className="flex justify-end gap-12 text-white/50">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-end gap-6 items-center text-white/50">
                                    <span>Discount</span>
                                    <div className="flex items-center gap-1">
                                        <input type="number" min={0} max={100} step={1} value={discountPercent}
                                            onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                                            className="w-14 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-center text-sm focus:outline-none"
                                        /> <span>%</span>
                                    </div>
                                    <span className="tabular-nums font-medium text-red-400">-${discountAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-end gap-12 text-lg font-black pt-2 border-t border-white/10">
                                    <span>Total</span>
                                    <span className="tabular-nums text-orange-400">${totalAmount.toFixed(2)} USD</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
