import re

with open("src/app/documents/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update DocHistoryItem
history_item_code = """interface DocHistoryItem {
  id: string;
  type: "letter" | "receipt" | "inkind" | "invoice";"""
code = code.replace("""interface DocHistoryItem {
  id: string;
  type: "letter" | "receipt" | "inkind";""", history_item_code)

history_item_fields = """  donorAddress?: string;
  inKindItems?: { name: string; qty: number; value: number }[];
  invoiceItems?: { id: string; description: string; total: number }[];
  invoiceWallet?: string;
}"""
code = code.replace("""  donorAddress?: string;
  inKindItems?: { name: string; qty: number; value: number }[];
}""", history_item_fields)

# 2. Add InvoiceDoc Component before the PAGE main marker
invoice_doc_code = """// ─── Invoice Document ─────────────────────────────────────────────────────────
function InvoiceDoc({ invoiceTo, invoiceName, invoiceDate, invoiceItems, invoiceTotalAmount, invoiceWallet, invoiceNo, church, lang }: {
  invoiceTo: string; invoiceName: string; invoiceDate: string; invoiceItems: any[]; invoiceTotalAmount: number; invoiceWallet: string; invoiceNo: string; church: typeof DEFAULT_CHURCH; lang: "en" | "fa";
}) {
  const isRtl = lang === "fa";
  const paperClass = PAPER_SIZES[church.paperSize as keyof typeof PAPER_SIZES] || PAPER_SIZES.A4;
  const design = church.designEn; // Invoice is usually English/Numbers

  return (
    <div className={`${paperClass} bg-white text-black p-[15mm] flex flex-col font-sans text-sm relative border border-gray-100 overflow-hidden shadow-2xl mx-auto`} style={{ fontVariantNumeric: "tabular-nums" }}>
      {church.showWatermark && <Watermark logo={church.logo} opacity={church.watermarkOpacity} />}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8 relative z-10" dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">
            {isRtl ? "فاکتور" : "Invoice"}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-mono uppercase" dir="ltr">
            Invoice #INV-{invoiceNo}
          </p>
        </div>
        <div className={isRtl ? "text-left" : "text-right"}>
          <h2 className="text-2xl font-black text-gray-900 border-b-4 border-gray-900 inline-block pb-1">{church.nameEn}</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-[200px] leading-tight flex-wrap">{church.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 relative z-10" dir={isRtl ? "rtl" : "ltr"}>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{isRtl ? "صورتحساب به:" : "Bill To:"}</p>
          <p className="font-black text-xl text-gray-900">{invoiceTo}</p>
        </div>
        <div className={isRtl ? "text-left" : "text-right"}>
          <div className={`grid grid-cols-2 gap-2 text-sm ${isRtl ? "justify-start" : "justify-end"}`}>
            <p className="font-bold text-gray-400 uppercase">{isRtl ? "تاریخ:" : "Date:"}</p>
            <p className="font-bold text-gray-900">{new Date(invoiceDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p className="font-bold text-gray-400 uppercase">{isRtl ? "نام:" : "Name:"}</p>
            <p className="font-bold text-gray-900">{invoiceName}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10" dir={isRtl ? "rtl" : "ltr"}>
        <table className="w-full text-base">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className={`py-3 ${isRtl ? "text-right" : "text-left"} font-black text-gray-400 uppercase tracking-widest text-xs w-16`}>{isRtl ? "ردیف" : "No"}</th>
              <th className={`py-3 ${isRtl ? "text-right" : "text-left"} font-black text-gray-400 uppercase tracking-widest text-xs`}>{isRtl ? "شرح" : "Description"}</th>
              <th className={`py-3 ${isRtl ? "text-left" : "text-right"} font-black text-gray-400 uppercase tracking-widest text-xs`}>{isRtl ? "مبلغ" : "Total"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {invoiceItems.map((item, index) => (
              <tr key={item.id}>
                <td className="py-4 text-gray-400 font-mono text-xs">{index + 1}</td>
                <td className="py-4 text-gray-900">{item.description}</td>
                <td className={`py-4 ${isRtl ? "text-left" : "text-right"} text-gray-900 font-bold`} dir="ltr">${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-4 border-gray-900 bg-gray-50/50">
              <td colSpan={2} className={`py-5 ${isRtl ? "text-left" : "text-right"} font-black text-gray-900 text-xl uppercase tracking-widest pr-4`}>
                {isRtl ? "جمع کل" : "Total Due"}
              </td>
              <td className={`py-5 ${isRtl ? "text-left" : "text-right"} font-black text-blue-600 text-2xl pr-2`} dir="ltr">
                ${invoiceTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoiceWallet && (
          <div className="mt-8 pt-6 border-t border-dashed border-gray-200" dir={isRtl ? "rtl" : "ltr"}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{isRtl ? "کیف پول تتر:" : "Wallet Tether (TRC20):"}</p>
            <p className="font-mono text-sm break-all bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-600 shadow-inner" dir="ltr">
              {invoiceWallet}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between items-end relative z-10 border-t border-gray-100 pt-6">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest max-w-[250px] leading-tight">
            Generated via {church.nameEn} Document System. Thank you for your business.
          </div>
          {church.showVerifyQR && (
            <div className="flex flex-col items-center gap-1">
              <DocumentQR data={`INVOICE:INV-${invoiceNo}:${invoiceTotalAmount}:${church.ein}`} />
              <span className="text-[8px] text-gray-400 font-mono tracking-widest uppercase">Scan to Verify</span>
            </div>
          )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════"""
code = code.replace("// ═══════════════════════════════════════════════════════════════════════════════\n// MAIN PAGE", invoice_doc_code + "\n// MAIN PAGE")


# 3. Add Tab State
code = code.replace("""const [activeTab, setActiveTab] = useState<"letters" | "receipts" | "inkind" | "history">("letters");""", 
                    """const [activeTab, setActiveTab] = useState<"letters" | "receipts" | "inkind" | "invoice" | "history">("letters");""")

# 4. Add Invoice State Strings
invoice_states = """  const [receiptNo, setReceiptNo] = useState(() => String(Math.floor(Math.random() * 90000 + 10000)));

  // Invoice state
  const [invoiceTo, setInvoiceTo] = useState("DEJ TV");
  const [invoiceName, setInvoiceName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceWallet, setInvoiceWallet] = useState("");
  const [invoiceItems, setInvoiceItems] = useState([{ id: crypto.randomUUID(), description: "", total: 0 }]);
  const [aiInvoiceInput, setAiInvoiceInput] = useState("");
  const [invoiceNo, setInvoiceNo] = useState(() => String(Math.floor(Math.random() * 90000 + 10000)));

  const handleAddInvoiceItem = () => setInvoiceItems(prev => [...prev, { id: crypto.randomUUID(), description: "", total: 0 }]);
  const handleRemoveInvoiceItem = (id: string) => setInvoiceItems(prev => prev.filter(item => item.id !== id));
  const handleInvoiceItemChange = (id: string, field: "description" | "total", value: any) => {
    setInvoiceItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const invoiceTotalAmount = invoiceItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const [loadingInvoiceGen, setLoadingInvoiceGen] = useState(false);
  const handleGenerateInvoice = async () => {
    if (!aiInvoiceInput.trim()) return;
    setLoadingInvoiceGen(true);
    try {
      const res = await fetch("/api/ai/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: aiInvoiceInput })
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const newItems = data.items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.description,
        total: item.total
      }));
      if (invoiceItems.length === 1 && !invoiceItems[0].description && !invoiceItems[0].total) {
        setInvoiceItems(newItems);
      } else {
        setInvoiceItems([...invoiceItems, ...newItems]);
      }
      setAiInvoiceInput("");
    } catch (e) { alert("Failed to generate AI items"); }
    finally { setLoadingInvoiceGen(false); }
  };
"""
code = code.replace("""  const [receiptNo, setReceiptNo] = useState(() => String(Math.floor(Math.random() * 90000 + 10000)));""", invoice_states)


# 5. Add Print References & Functions
print_funcs = """  const receiptRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const onPrintLetter = useReactToPrint({ contentRef: letterRef });
  const onPrintReceipt = useReactToPrint({ contentRef: receiptRef });
  const onPrintInvoice = useReactToPrint({ contentRef: invoiceRef });

  const handlePrintInvoice = () => {
    const newItem: DocHistoryItem = {
      id: crypto.randomUUID(),
      type: "invoice",
      date: invoiceDate,
      timestamp: Date.now(),
      refNo: `INV-${invoiceNo}`,
      recipient: invoiceTo,
      subject: `Invoice for ${invoiceName}`,
      amount: invoiceTotalAmount,
      invoiceItems: invoiceItems,
      invoiceWallet: invoiceWallet,
    };
    setDocHistory(prev => [newItem, ...prev]);
    onPrintInvoice();
  };
"""
code = code.replace("""  const receiptRef = useRef<HTMLDivElement>(null);
  const onPrintLetter = useReactToPrint({ contentRef: letterRef });
  const onPrintReceipt = useReactToPrint({ contentRef: receiptRef });""", print_funcs)


# 6. Add handleRePrint logic for invoices
reprint_logic = """    } else if (item.type === "invoice") {
      setActiveTab("invoice");
      setInvoiceNo(item.refNo.replace("INV-", ""));
      setInvoiceTo(item.recipient);
      setInvoiceName(item.subject.replace("Invoice for ", ""));
      setInvoiceDate(item.date);
      setInvoiceItems(item.invoiceItems || [{ id: crypto.randomUUID(), description: "", total: 0 }]);
      setInvoiceWallet(item.invoiceWallet || "");
      setTimeout(() => onPrintInvoice(), 500);
    } else {
      setActiveTab(item.type === "inkind" ? "inkind" : "receipts");"""
code = code.replace("""    } else {
      setActiveTab(item.type === "inkind" ? "inkind" : "receipts");""", reprint_logic)

# 7. Add UI Navigation Tab
tab_ui_code = """              <button onClick={() => setActiveTab("inkind")} className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "inkind" ? "border-amber-500 text-amber-400" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                <Package className="w-4 h-4" /> {isRtl ? "رسید کالا" : "In-Kind Receipt"}
              </button>
              <button onClick={() => setActiveTab("invoice")} className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "invoice" ? "border-purple-500 text-purple-400" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                <DollarSign className="w-4 h-4" /> {isRtl ? "فاکتور / هزینه" : "Invoice"}
              </button>"""
code = code.replace("""              <button onClick={() => setActiveTab("inkind")} className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "inkind" ? "border-amber-500 text-amber-400" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                <Package className="w-4 h-4" /> {isRtl ? "رسید کالا" : "In-Kind Receipt"}
              </button>""", tab_ui_code)


# 8. Add Invoice Form
invoice_form_ui = """        {/* ══ INVOICE TAB ══ */}
        {activeTab === "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full pointer-events-none" />
                <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-purple-400">
                  <DollarSign className="w-5 h-5" /> {isRtl ? "فرم ساز فاکتور الکترونیک" : "Invoice Generator Form"}
                </h3>

                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "صورتحساب به" : "Bill To"}</label>
                      <input value={invoiceTo} onChange={e => setInvoiceTo(e.target.value)} placeholder="DEJ TV" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "تاریخ فاکتور" : "Invoice Date"}</label>
                      <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "نام شخص / سازمان (پیمانکار)" : "Name of Freelancer / Orgnization"}</label>
                    <input value={invoiceName} onChange={e => setInvoiceName(e.target.value)} placeholder="John Doe" className={inputCls} />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{isRtl ? "استخراج با هوش مصنوعی" : "AI Smart Parser"}</label>
                    </div>
                    <div className="relative">
                       <textarea 
                           value={aiInvoiceInput} onChange={e => setAiInvoiceInput(e.target.value)}
                           className={`${inputCls} pr-12`} rows={3}
                           placeholder={isRtl ? "لیست کارها را اینجا پیست کنید (مثال: ۲ تا ویدیو جمعا ۱۰۰ دلار)" : "Paste list of works here..."}
                       ></textarea>
                       <div className="absolute top-6 right-2">
                           <AIButton label="" onClick={handleGenerateInvoice} loading={loadingInvoiceGen} disabled={!aiInvoiceInput.trim()} icon={<Sparkles className="w-4 h-4 text-purple-400"/>} />
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <label className="text-xs text-muted-foreground">{isRtl ? "اقلام فاکتور" : "Invoice Items"}</label>
                       <button onClick={handleAddInvoiceItem} className="text-xs flex items-center gap-1 text-primary hover:text-primary/80">
                         <Plus className="w-3.5 h-3.5"/> {isRtl ? "افزودن" : "Add Row"}
                       </button>
                    </div>
                    <div className="space-y-2">
                      {invoiceItems.map(item => (
                        <div key={item.id} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl">
                           <input value={item.description} onChange={e => handleInvoiceItemChange(item.id, "description", e.target.value)} placeholder="Description" className="flex-1 bg-transparent text-sm min-w-0 outline-none px-2" />
                           <div className="text-muted-foreground text-sm">$</div>
                           <input type="number" dir="ltr" value={item.total || ""} onChange={e => handleInvoiceItemChange(item.id, "total", e.target.value)} placeholder="0.00" className="w-20 bg-transparent text-sm outline-none px-2 font-mono text-primary font-bold" />
                           <button onClick={() => handleRemoveInvoiceItem(item.id)} className="p-1 text-red-400 hover:bg-white/10 rounded-md shrink-0"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 px-2">
                      <span className="text-sm font-bold text-muted-foreground">{isRtl ? "جمع هزینه:" : "Total Amount:"}</span>
                      <span className="text-xl font-black text-purple-400 font-mono tracking-tighter">${invoiceTotalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="text-xs text-muted-foreground mb-1 block">{isRtl ? "کیف پول تتر (اختیاری)" : "Tether Wallet (TRC20 - Optional)"}</label>
                    <input dir="ltr" value={invoiceWallet} onChange={e => setInvoiceWallet(e.target.value)} placeholder="T..." className={`${inputCls} font-mono text-xs`} />
                  </div>

                  <button onClick={handlePrintInvoice} className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl font-black text-sm shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-transform">
                    <Printer className="w-4 h-4" /> {isRtl ? "پیش‌نمایش و چاپ فاکتور" : "Preview & Print Invoice"}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex justify-center sticky top-28 print:static">
              <div className="bg-white p-2 rounded-xl shadow-2xl scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 origin-top border border-white/20 transition-transform">
                <div ref={invoiceRef}>
                  <InvoiceDoc invoiceTo={invoiceTo} invoiceName={invoiceName} invoiceDate={invoiceDate} invoiceItems={invoiceItems} invoiceTotalAmount={invoiceTotalAmount} invoiceWallet={invoiceWallet} invoiceNo={invoiceNo} church={church} lang={editLang} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ HISTORY TAB ══ */}"""

code = code.replace("""        {/* ══ HISTORY TAB ══ */}""", invoice_form_ui)

with open("src/app/documents/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("done")
