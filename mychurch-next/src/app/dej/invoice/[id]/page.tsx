"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
    ArrowLeft, Printer, CheckCircle, Clock, XCircle, Tv,
    Pencil, Save, X, Plus, Trash2
} from "lucide-react";

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
    freelancer_address: string;
    invoice_date: string;
    due_date: string;
    items: InvoiceItem[];
    subtotal: number;
    discount_percent: number;
    total_amount: number;
    currency: string;
    wallet_tether: string;
    payment_status: "unpaid" | "paid" | "partial" | "cancelled";
    payment_date: string;
    notes: string;
}

const STATUS_BADGE = {
    unpaid: { label: "UNPAID", cls: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
    paid: { label: "PAID", cls: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
    partial: { label: "PARTIAL", cls: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock },
    cancelled: { label: "CANCELLED", cls: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
};

const newItem = (): InvoiceItem => ({ description: "", quantity: 1, unit_price: 0, total: 0 });

export default function ViewDejInvoice() {
    const params = useParams();
    const id = typeof params?.id === "string" ? params.id : undefined;
    const router = useRouter();
    const searchParams = useSearchParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState<Invoice | null>(null);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/dej/invoices/${id}`)
            .then(r => r.json())
            .then(data => {
                setInvoice(data);
                setLoading(false);
                // Auto-enter edit mode if ?edit=1 in URL
                if (searchParams && searchParams.get("edit") === "1") {
                    setEditData(JSON.parse(JSON.stringify(data)));
                    setEditing(true);
                    // Clean the URL without reload
                    window.history.replaceState({}, "", `/dej/invoice/${id}`);
                }
            })
            .catch(() => setLoading(false));
    }, [id, searchParams]);

    const startEdit = () => {
        if (!invoice) return;
        setEditData(JSON.parse(JSON.stringify(invoice)));
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        setEditData(null);
    };

    const updateEditItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
        if (!editData) return;
        const items = [...editData.items];
        const item = { ...items[i], [field]: value };
        if (field === "quantity" || field === "unit_price") {
            item.total = parseFloat((item.quantity * item.unit_price).toFixed(2));
        }
        items[i] = item;
        const subtotal = items.reduce((s, it) => s + it.total, 0);
        const discountAmount = subtotal * ((editData.discount_percent || 0) / 100);
        setEditData({ ...editData, items, subtotal, total_amount: subtotal - discountAmount });
    };

    const addEditItem = () => {
        if (!editData) return;
        setEditData({ ...editData, items: [...editData.items, newItem()] });
    };

    const removeEditItem = (i: number) => {
        if (!editData) return;
        const items = editData.items.filter((_, idx) => idx !== i);
        const subtotal = items.reduce((s, it) => s + it.total, 0);
        const discountAmount = subtotal * ((editData.discount_percent || 0) / 100);
        setEditData({ ...editData, items, subtotal, total_amount: subtotal - discountAmount });
    };

    const updateDiscount = (val: number) => {
        if (!editData) return;
        const discountAmount = editData.subtotal * (val / 100);
        setEditData({ ...editData, discount_percent: val, total_amount: editData.subtotal - discountAmount });
    };

    const handleSave = async () => {
        if (!editData) return;
        const validItems = editData.items.filter(it => it.description.trim());
        if (!validItems.length) { alert("At least one item is required."); return; }
        if (!editData.freelancer_name.trim()) { alert("Freelancer name is required."); return; }
        setSaving(true);
        try {
            const payload = {
                to_company: editData.to_company,
                freelancer_name: editData.freelancer_name,
                freelancer_address: editData.freelancer_address || null,
                invoice_date: editData.invoice_date,
                due_date: editData.due_date || null,
                items: validItems,
                subtotal: editData.subtotal,
                discount_percent: editData.discount_percent,
                total_amount: editData.total_amount,
                currency: editData.currency,
                wallet_tether: editData.wallet_tether || null,
                payment_status: editData.payment_status,
                notes: editData.notes || null,
            };
            const res = await fetch(`/api/dej/invoices/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(await res.text());
            const updated = await res.json();
            setInvoice(updated);
            setEditing(false);
            setEditData(null);
        } catch (err) {
            alert(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white/30">
            Loading invoice...
        </div>
    );

    if (!invoice) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
            <p className="text-white/50 mb-4">Invoice not found.</p>
            <Link href="/dej" className="text-orange-400 underline text-sm">← Back to Dashboard</Link>
        </div>
    );

    const displayInvoice = editing && editData ? editData : invoice;

    return (
        <>
            {/* ── Screen view (hidden on print) ── */}
            <div className="print:hidden min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dej" className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition">
                                <ArrowLeft className="w-4 h-4 text-white" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                                    <Tv className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <div className="text-base font-black">{invoice.invoice_number}</div>
                                    <div className="text-xs text-white/40 font-mono">{invoice.freelancer_name}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {editing ? (
                                <>
                                    <button onClick={cancelEdit}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm font-medium border border-white/10 text-white">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition text-sm font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                                        <Save className="w-4 h-4" />
                                        {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={startEdit}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm font-medium border border-white/10 text-white">
                                        <Pencil className="w-4 h-4" /> Edit
                                    </button>
                                    <button onClick={() => window.print()}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm font-medium border border-white/10 text-white">
                                        <Printer className="w-4 h-4" /> Print / Save PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto px-6 py-10">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
                        {editing && editData ? (
                            <EditableInvoice
                                data={editData}
                                setData={setEditData}
                                onUpdateItem={updateEditItem}
                                onAddItem={addEditItem}
                                onRemoveItem={removeEditItem}
                                onUpdateDiscount={updateDiscount}
                            />
                        ) : (
                            <PrintableInvoice invoice={invoice} />
                        )}
                    </div>
                </div>
            </div>

            {/* ── Printable version: stripped of all UI chrome ── */}
            <div className="hidden print:block">
                <PrintableInvoice invoice={displayInvoice} />
            </div>
        </>
    );
}

/* ─────────────────────── Editable Form ─────────────────────── */
function EditableInvoice({
    data, setData, onUpdateItem, onAddItem, onRemoveItem, onUpdateDiscount
}: {
    data: Invoice;
    setData: (d: Invoice) => void;
    onUpdateItem: (i: number, field: keyof InvoiceItem, value: string | number) => void;
    onAddItem: () => void;
    onRemoveItem: (i: number) => void;
    onUpdateDiscount: (v: number) => void;
}) {
    const field = (key: keyof Invoice, label: string, type = "text", dir = "") => (
        <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">{label}</label>
            <input
                type={type}
                dir={dir}
                value={(data[key] as string) ?? ""}
                onChange={e => setData({ ...data, [key]: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
        </div>
    );

    return (
        <div className="p-10 md:p-14 font-sans text-gray-900 bg-white">
            {/* Header */}
            <div className="flex justify-between items-start mb-10">
                <div>
                    <p className="text-3xl font-black text-gray-900 tracking-tight">DEJ TV</p>
                    <p className="text-sm text-gray-400">Digital Entertainment & Journalism</p>
                </div>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tight">
                    INVOICE
                </p>
            </div>

            {/* Editable billing details */}
            <div className="grid grid-cols-2 gap-5 mb-8">
                {field("to_company", "Bill To")}
                {field("invoice_date", "Invoice Date", "date")}
                {field("freelancer_name", "Freelancer Name *")}
                {field("due_date", "Due Date", "date")}
                <div className="col-span-2">
                    {field("freelancer_address", "Freelancer Address")}
                </div>
            </div>

            {/* Status */}
            <div className="mb-6">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Payment Status</label>
                <select
                    title="Payment status"
                    value={data.payment_status}
                    onChange={e => setData({ ...data, payment_status: e.target.value as Invoice["payment_status"] })}
                    className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Items Table */}
            <div className="mb-6 border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-900 text-white text-xs uppercase tracking-widest">
                            <th className="text-left py-3 px-4 w-8">#</th>
                            <th className="text-left py-3 px-3">Description</th>
                            <th className="text-center py-3 px-3 w-16">Qty</th>
                            <th className="text-right py-3 px-3 w-24">Unit $</th>
                            <th className="text-right py-3 px-4 w-24">Total</th>
                            <th className="w-8" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.items.map((item, i) => (
                            <tr key={i} className="group">
                                <td className="py-2 px-4 text-gray-400 text-xs">{i + 1}</td>
                                <td className="py-2 px-3">
                                    <input value={item.description}
                                        onChange={e => onUpdateItem(i, "description", e.target.value)}
                                        className="w-full border-0 border-b border-transparent hover:border-gray-200 focus:border-orange-400 py-1 focus:outline-none text-sm text-gray-900"
                                        placeholder="Description..."
                                    />
                                </td>
                                <td className="py-2 px-3">
                                    <input type="number" min={1} value={item.quantity || ""}
                                        onChange={e => onUpdateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                                        className="w-full text-center border-0 border-b border-transparent hover:border-gray-200 focus:border-orange-400 py-1 focus:outline-none text-sm text-gray-900"
                                    />
                                </td>
                                <td className="py-2 px-3">
                                    <input type="number" min={0} step={0.01} value={item.unit_price || ""}
                                        onChange={e => onUpdateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                                        dir="ltr"
                                        className="w-full text-right border-0 border-b border-transparent hover:border-gray-200 focus:border-orange-400 py-1 focus:outline-none text-sm text-gray-900"
                                    />
                                </td>
                                <td className="py-2 px-4 text-right font-bold text-gray-900 tabular-nums">${item.total.toFixed(2)}</td>
                                <td className="py-2 px-2">
                                    <button onClick={() => onRemoveItem(i)}
                                        className="p-1 rounded text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-4 py-3 border-t border-gray-100">
                    <button onClick={onAddItem}
                        className="flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-orange-600 transition">
                        <Plus className="w-4 h-4" /> Add Row
                    </button>
                </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
                <div className="w-72 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span className="tabular-nums font-medium" dir="ltr">${data.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500">
                        <span>Discount</span>
                        <div className="flex items-center gap-2">
                            <input type="number" min={0} max={100} step={1}
                                value={data.discount_percent}
                                onChange={e => onUpdateDiscount(parseFloat(e.target.value) || 0)}
                                className="w-14 border border-gray-200 rounded px-2 py-0.5 text-center text-sm focus:outline-none"
                            />
                            <span>%</span>
                            <span className="tabular-nums text-red-500 font-medium" dir="ltr">
                                -${(data.subtotal * (data.discount_percent / 100)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between text-xl font-black border-t-2 border-gray-900 pt-3 mt-3">
                        <span>Total</span>
                        <span className="tabular-nums text-orange-500" dir="ltr">${data.total_amount.toFixed(2)} {data.currency}</span>
                    </div>
                </div>
            </div>

            {/* Wallet */}
            <div className="mb-5">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">USDT Wallet (TRC20)</label>
                <input value={data.wallet_tether ?? ""}
                    onChange={e => setData({ ...data, wallet_tether: e.target.value })}
                    dir="ltr"
                    placeholder="T... (TRC20)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
            </div>

            {/* Notes */}
            <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Notes</label>
                <textarea value={data.notes ?? ""}
                    onChange={e => setData({ ...data, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
            </div>
        </div>
    );
}

/* ─────────────────────── Read-Only / Printable View ─────────────────────── */
function PrintableInvoice({ invoice }: { invoice: Invoice }) {
    const status = STATUS_BADGE[invoice.payment_status] ?? STATUS_BADGE.unpaid;
    const StatusIcon = status.icon;
    const discountAmount = invoice.subtotal * (invoice.discount_percent / 100);

    return (
        <div className="p-10 md:p-14 font-sans text-gray-900 bg-white min-h-screen print:min-h-0">
            {/* Invoice Header — no logos, brand only */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">DEJ TV</h1>
                    <p className="text-sm text-gray-400">Digital Entertainment & Journalism</p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 tracking-tight">INVOICE</p>
                    <p className="text-sm font-mono font-bold text-gray-500 mt-1">#{invoice.invoice_number}</p>
                    <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 text-xs font-bold uppercase border rounded-full ${status.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                    </div>
                </div>
            </div>

            {/* Bill To / From */}
            <div className="grid grid-cols-2 gap-12 mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
                    <p className="font-bold text-lg text-gray-900">{invoice.to_company}</p>
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">From</p>
                    <p className="font-bold text-lg text-gray-900">{invoice.freelancer_name}</p>
                    {invoice.freelancer_address && <p className="text-sm text-gray-500 mt-1">{invoice.freelancer_address}</p>}
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Invoice Date</p>
                    <p className="font-semibold">{format(new Date(invoice.invoice_date), "MMMM dd, yyyy")}</p>
                </div>
                {invoice.due_date && (
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Due Date</p>
                        <p className="font-semibold">{format(new Date(invoice.due_date), "MMMM dd, yyyy")}</p>
                    </div>
                )}
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-8">
                <thead>
                    <tr className="bg-gray-900 text-white text-xs uppercase tracking-widest">
                        <th className="text-left py-3 px-4 rounded-l-xl w-8">#</th>
                        <th className="text-left py-3 px-3">Description</th>
                        <th className="text-center py-3 px-3 w-16">Qty</th>
                        <th className="text-right py-3 px-3 w-24">Unit $</th>
                        <th className="text-right py-3 px-4 rounded-r-xl w-24">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {invoice.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                            <td className="py-3 px-3 font-medium text-gray-900">{item.description}</td>
                            <td className="py-3 px-3 text-center text-gray-600">{item.quantity}</td>
                            <td className="py-3 px-3 text-right text-gray-600 tabular-nums" dir="ltr">${item.unit_price.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right font-bold text-gray-900 tabular-nums" dir="ltr">${item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-10">
                <div className="w-72 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span className="tabular-nums font-medium" dir="ltr">${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {invoice.discount_percent > 0 && (
                        <div className="flex justify-between text-red-500">
                            <span>Discount ({invoice.discount_percent}%)</span>
                            <span className="tabular-nums font-medium" dir="ltr">-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-black border-t-2 border-gray-900 pt-3 mt-3">
                        <span>Total</span>
                        <span className="tabular-nums text-orange-500" dir="ltr">${invoice.total_amount.toFixed(2)} {invoice.currency}</span>
                    </div>
                </div>
            </div>

            {/* USDT Wallet */}
            {invoice.wallet_tether && (
                <div className="mb-8 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">USDT Payment (TRC20)</p>
                    <p className="font-mono text-sm text-gray-800 break-all bg-white/60 p-3 rounded-xl border border-emerald-100" dir="ltr">
                        {invoice.wallet_tether}
                    </p>
                </div>
            )}

            {/* Notes */}
            {invoice.notes && (
                <div className="mb-8 p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{invoice.notes}</p>
                </div>
            )}

            {/* Clean footer — no church branding */}
            <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-300">
                <p>DEJ TV · Invoice #{invoice.invoice_number} · Thank you for your work.</p>
            </div>
        </div>
    );
}
