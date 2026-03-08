"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Printer, CheckCircle, Clock, XCircle, Tv } from "lucide-react";

interface Invoice {
    id: string;
    invoice_number: string;
    to_company: string;
    freelancer_name: string;
    freelancer_address: string;
    invoice_date: string;
    due_date: string;
    items: { description: string; quantity: number; unit_price: number; total: number }[];
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

export default function ViewDejInvoice() {
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/dej/invoices/${id}`)
            .then(r => r.json())
            .then(data => { setInvoice(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

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

    const status = STATUS_BADGE[invoice.payment_status] ?? STATUS_BADGE.unpaid;
    const StatusIcon = status.icon;
    const discountAmount = invoice.subtotal * (invoice.discount_percent / 100);

    return (
        <>
            {/* Print toolbar - hidden on print */}
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
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm font-medium border border-white/10 text-white"
                        >
                            <Printer className="w-4 h-4" /> Print / Save PDF
                        </button>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto px-6 py-10">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
                        <PrintableInvoice invoice={invoice} />
                    </div>
                </div>
            </div>

            {/* Printable version rendered directly for print media */}
            <div className="hidden print:block">
                <PrintableInvoice invoice={invoice} />
            </div>
        </>
    );
}

function PrintableInvoice({ invoice }: { invoice: Invoice }) {
    const status = STATUS_BADGE[invoice.payment_status];
    const StatusIcon = status.icon;
    const discountAmount = invoice.subtotal * (invoice.discount_percent / 100);

    return (
        <div className="p-10 md:p-14 font-sans text-gray-900 bg-white min-h-screen print:min-h-0">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center print:hidden">
                            <Tv className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">DEJ TV</h1>
                    </div>
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

            {/* Bill To / From grid */}
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

            {/* Footer */}
            <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-300">
                <p>This invoice was generated by DEJ TV Invoice System. Thank you for your work.</p>
            </div>
        </div>
    );
}
