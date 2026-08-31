"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Plus, Printer, CheckCircle2, ArrowLeft, Loader2, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { DonationReceiptDoc, InvoiceDoc, DEFAULT_CHURCH, toEnglishDigits, type DocHistoryItem } from "../DocumentsClient";
import { getDocumentSettings } from "@/actions/documentSettings";
import { saveDocument, getDocuments } from "@/actions/documents";

export default function InvoicesClient() {
  const [activeTab, setActiveTab] = useState<"receipts" | "invoice">("receipts");
  const [church, setChurch] = useState(DEFAULT_CHURCH);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // References for Printing
  const receiptRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const onPrintReceipt = useReactToPrint({ contentRef: receiptRef });
  const onPrintInvoice = useReactToPrint({ contentRef: invoiceRef });

  // Receipt State
  const [receiptNo, setReceiptNo] = useState(() => String(Math.floor(Math.random() * 90000 + 10000)));
  const [receipt, setReceipt] = useState<Record<string, string | number>>({
    donorName: "", donorAddress: "", amount: 0, method: "cash",
    date: new Date().toISOString().split("T")[0],
  });
  const [isInKind, setIsInKind] = useState(false);
  const [inKindItems, setInKindItems] = useState([{ name: "", qty: 1, value: 0 }]);

  // Invoice State
  const [invoiceNo, setInvoiceNo] = useState(() => String(Math.floor(Math.random() * 90000 + 10000)));
  const [invoiceTo, setInvoiceTo] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceItems, setInvoiceItems] = useState([{ id: crypto.randomUUID(), description: "", total: 0 }]);
  const [invoiceWallet, setInvoiceWallet] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");

  const invoiceTotalAmount = invoiceItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const receiptTotalAmount = isInKind ? inKindItems.reduce((sum, item) => sum + (item.value * item.qty), 0) : Number(receipt.amount || 0);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const dbSettings = await getDocumentSettings();
        if (dbSettings) setChurch(prev => ({ ...prev, ...dbSettings }));
      } catch (e) {
        console.warn("Failed to load church settings", e);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleSaveReceipt = async () => {
    if (!receipt.donorName) {
      toast.error("Donor name is required.");
      return;
    }
    setSaving(true);
    
    const item: DocHistoryItem = {
      id: crypto.randomUUID(),
      type: isInKind ? "inkind" : "receipt",
      date: String(receipt.date),
      timestamp: Date.now(),
      refNo: `RCP-${receiptNo}`,
      recipient: String(receipt.donorName),
      subject: isInKind ? "In-Kind Donation" : "Charitable Contribution",
      donorName: String(receipt.donorName),
      donorAddress: String(receipt.donorAddress),
      amount: receiptTotalAmount,
      inKindItems: isInKind ? inKindItems : undefined
    };

    const result = await saveDocument({
      document_type: item.type === "inkind" ? "receipt" : "receipt",
      title: item.subject,
      description: `Reference: ${item.refNo}`,
      document_content: item,
      recipient_name: item.recipient,
      tags: [item.type],
      is_draft: false
    }, false);

    if (result.error) toast.error("Failed to save receipt to registry.");
    else toast.success("Receipt saved to registry successfully!");
    setSaving(false);
  };

  const handleSaveInvoice = async () => {
    if (!invoiceTo) {
      toast.error("Billed To (Client Name) is required.");
      return;
    }
    setSaving(true);

    const item: DocHistoryItem = {
      id: crypto.randomUUID(),
      type: "invoice",
      date: invoiceDate,
      timestamp: Date.now(),
      refNo: `INV-${invoiceNo}`,
      recipient: invoiceTo,
      subject: `Invoice for ${invoiceName || invoiceTo}`,
      invoiceItems,
      invoiceWallet,
      invoiceNotes,
      amount: invoiceTotalAmount
    };

    const result = await saveDocument({
      document_type: "invoice",
      title: item.subject,
      description: `Reference: ${item.refNo}`,
      document_content: item,
      recipient_name: item.recipient,
      tags: ["invoice"],
      is_draft: false
    }, false);

    if (result.error) toast.error("Failed to save invoice to registry.");
    else toast.success("Invoice saved to registry successfully!");
    setSaving(false);
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-tertiary" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto relative z-10 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-display-xl font-display-xl text-on-surface mb-2">Financial Documents</h2>
            <p className="text-body-base font-body-base text-on-surface-variant font-scripture-calligraphy italic">Manage and generate IRS-compliant documentation.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.location.href = '/admin/documents'} className="glass-panel text-on-surface-variant px-4 py-2 rounded-lg font-body-bold flex items-center gap-2 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Registry
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10">
          <button 
            onClick={() => setActiveTab("receipts")} 
            className={`px-4 py-3 text-body-bold font-body-bold transition-all ${activeTab === 'receipts' ? 'text-secondary border-b-2 border-secondary text-glow-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Donation Receipts
          </button>
          <button 
            onClick={() => setActiveTab("invoice")} 
            className={`px-4 py-3 text-body-bold font-body-bold transition-all ${activeTab === 'invoice' ? 'text-secondary border-b-2 border-secondary text-glow-secondary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Service Invoices
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Form Area */}
        <div className="lg:col-span-8 glass-panel rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          {activeTab === "receipts" && (
            <>
              <h3 className="font-headline-md text-headline-md text-secondary mb-6 border-b border-white/10 pb-4">Donor Information</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Donor Full Name</label>
                    <input value={receipt.donorName as string} onChange={e => setReceipt({...receipt, donorName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-secondary transition-colors" placeholder="Full Legal Name" type="text"/>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Date Received</label>
                    <input type="date" value={receipt.date as string} onChange={e => setReceipt({...receipt, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Donation Type</label>
                  <div className="flex gap-4">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${!isInKind ? 'bg-secondary/10 border border-secondary text-secondary' : 'bg-transparent border border-white/10 text-on-surface-variant hover:border-white/20'}`}>
                      <input type="radio" checked={!isInKind} onChange={() => setIsInKind(false)} className="hidden" />
                      <DollarSign className="w-4 h-4" /> Monetary
                    </label>
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${isInKind ? 'bg-secondary/10 border border-secondary text-secondary' : 'bg-transparent border border-white/10 text-on-surface-variant hover:border-white/20'}`}>
                      <input type="radio" checked={isInKind} onChange={() => setIsInKind(true)} className="hidden" />
                      <Package className="w-4 h-4" /> In-Kind
                    </label>
                  </div>
                </div>

                {!isInKind ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Amount (USD)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-on-surface-variant">$</span>
                        <input value={receipt.amount || ""} onChange={e => setReceipt({...receipt, amount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-on-surface focus:outline-none focus:border-secondary transition-colors" placeholder="0.00" type="number"/>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">In-Kind Items</label>
                    {inKindItems.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <input value={item.name} onChange={e => {
                          const newItems = [...inKindItems];
                          newItems[idx].name = e.target.value;
                          setInKindItems(newItems);
                        }} placeholder="Description" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-secondary" />
                        <input value={item.qty} type="number" onChange={e => {
                          const newItems = [...inKindItems];
                          newItems[idx].qty = Number(e.target.value);
                          setInKindItems(newItems);
                        }} placeholder="Qty" className="w-24 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-secondary" />
                        <input value={item.value} type="number" onChange={e => {
                          const newItems = [...inKindItems];
                          newItems[idx].value = Number(e.target.value);
                          setInKindItems(newItems);
                        }} placeholder="Value" className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-secondary" />
                      </div>
                    ))}
                    <button onClick={() => setInKindItems([...inKindItems, { name: "", qty: 1, value: 0 }])} className="text-sm text-secondary hover:underline">+ Add Item</button>
                  </div>
                )}

                <div className="bg-surface-container p-4 rounded-lg border border-white/10 flex gap-4 items-start">
                  <p className="text-sm text-on-surface-variant">
                    <strong className="text-white">IRS Disclosure (501c3):</strong> No goods or services were provided in exchange for this contribution. This receipt serves as official tax documentation.
                  </p>
                </div>
                
                <div className="pt-4 border-t border-white/10 flex justify-end">
                   <button onClick={handleSaveReceipt} disabled={saving} className="px-6 py-2.5 bg-secondary text-on-secondary font-bold rounded-lg hover:bg-secondary/90 transition flex items-center gap-2">
                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save to Registry
                   </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "invoice" && (
            <>
              <h3 className="font-headline-md text-headline-md text-secondary mb-6 border-b border-white/10 pb-4">Invoice Details</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Billed To (Client)</label>
                    <input value={invoiceTo} onChange={e => setInvoiceTo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-secondary transition-colors" placeholder="Company or Name" />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Issue Date</label>
                    <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-secondary transition-colors" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">Line Items</label>
                  {invoiceItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <input value={item.description} onChange={e => {
                        const newItems = [...invoiceItems];
                        newItems[idx].description = e.target.value;
                        setInvoiceItems(newItems);
                      }} placeholder="Service Description" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-on-surface focus:outline-none focus:border-secondary" />
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-on-surface-variant">$</span>
                        <input value={item.total} type="number" onChange={e => {
                          const newItems = [...invoiceItems];
                          newItems[idx].total = Number(e.target.value);
                          setInvoiceItems(newItems);
                        }} placeholder="Amount" className="w-32 bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-on-surface focus:outline-none focus:border-secondary" />
                      </div>
                      <button onClick={() => setInvoiceItems(invoiceItems.filter(i => i.id !== item.id))} className="text-error hover:text-error/80 p-2">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setInvoiceItems([...invoiceItems, { id: crypto.randomUUID(), description: "", total: 0 }])} className="text-sm text-secondary hover:underline">+ Add Line Item</button>
                </div>
                
                <div className="pt-4 border-t border-white/10 flex justify-end">
                   <button onClick={handleSaveInvoice} disabled={saving} className="px-6 py-2.5 bg-secondary text-on-secondary font-bold rounded-lg hover:bg-secondary/90 transition flex items-center gap-2">
                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save Invoice
                   </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel rounded-xl p-6 flex flex-col items-center">
            <h3 className="w-full font-headline-md text-headline-md text-secondary mb-4 border-b border-white/10 pb-4 flex justify-between items-center">
              <span>Preview</span>
              {/* @ts-ignore */}
              <button onClick={activeTab === 'receipts' ? onPrintReceipt : onPrintInvoice} className="px-3 py-1.5 bg-secondary/20 text-secondary rounded hover:bg-secondary/30 transition text-sm flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print
              </button>
            </h3>
            
            <div className="w-full flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10 mb-6">
              <span className="font-label-caps text-on-surface-variant">Document ID</span>
              <span className="font-mono text-on-surface">{activeTab === 'receipts' ? `RCP-${receiptNo}` : `INV-${invoiceNo}`}</span>
            </div>

            <div className="w-full flex justify-between items-center p-4 bg-secondary/10 rounded-lg border border-secondary/20 mb-6">
              <span className="font-label-caps text-secondary uppercase font-bold tracking-wider">Total Amount</span>
              <span className="font-mono text-secondary font-black text-xl">
                ${activeTab === 'receipts' ? receiptTotalAmount.toLocaleString() : invoiceTotalAmount.toLocaleString()}
              </span>
            </div>

            {/* Hidden render for React-To-Print */}
            <div className="hidden">
              <div ref={receiptRef}>
                <DonationReceiptDoc 
                  receipt={receipt} 
                  receiptNo={receiptNo} 
                  isInKind={isInKind} 
                  inKindItems={inKindItems} 
                  church={church} 
                />
              </div>
              <div ref={invoiceRef}>
                <InvoiceDoc 
                  invoiceTo={invoiceTo} 
                  invoiceAddress={invoiceAddress} 
                  invoiceName={invoiceName} 
                  invoiceDate={invoiceDate} 
                  invoiceItems={invoiceItems} 
                  invoiceTotalAmount={invoiceTotalAmount} 
                  invoiceWallet={invoiceWallet} 
                  invoiceNotes={invoiceNotes} 
                  invoiceNo={invoiceNo} 
                  church={church} 
                  lang="en" 
                />
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
