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


# 2. Re-write the InvoiceDoc Component with strict LTR logic for English
invoice_doc_code = """// ─── Invoice Document ─────────────────────────────────────────────────────────
export function InvoiceDoc({ invoiceTo, invoiceName, invoiceDate, invoiceItems, invoiceTotalAmount, invoiceWallet, invoiceNo, church, lang, isPdf }: {
  invoiceTo: string; invoiceName: string; invoiceDate: string; invoiceItems: any[]; invoiceTotalAmount: number; invoiceWallet: string; invoiceNo: string; church: typeof DEFAULT_CHURCH; lang: "en" | "fa"; isPdf?: boolean;
}) {
  const isRtl = lang === "fa";
  // The layout direction relies on the language
  const dirClass = isRtl ? "rtl" : "ltr";
  const paperClass = isPdf ? "w-full min-h-[1056px]" : (PAPER_SIZES[church.paperSize as keyof typeof PAPER_SIZES] || PAPER_SIZES.A4);
  const design = church.designEn; 

  return (
    <div className={`${paperClass} bg-white text-slate-800 p-[15mm] flex flex-col font-sans text-sm relative overflow-hidden mx-auto print:shadow-none ${isPdf ? "" : "shadow-xl border border-slate-200"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
      {church.showWatermark && <Watermark logo={church.logo} opacity={church.watermarkOpacity} />}
      
      {/* Decorative header element */}
      <div className={`absolute top-0 ${isRtl ? "left-0" : "right-0"} w-48 h-48 bg-purple-50 rounded-full -mt-24 ${isRtl ? "-ml-24" : "-mr-24"} z-0`}></div>

      <div className="flex justify-between items-start border-b-2 border-purple-500 pb-6 mb-8 relative z-10" dir={dirClass}>
        <div className="flex items-center gap-4">
           {church.logo ? (
             <img src={church.logo} alt="Logo" className="w-16 h-16 object-contain" />
           ) : (
             <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <DollarSign className="w-8 h-8" />
             </div>
           )}
           <div>
             <h1 className="text-3xl font-black text-purple-900 tracking-tight">
               {isRtl ? "فاکتور الکترونیکی" : "Invoice"}
             </h1>
             <p className="text-sm text-purple-600 mt-1 uppercase font-bold tracking-widest" dir="ltr">
               INV-{invoiceNo}
             </p>
           </div>
        </div>
        <div className={isRtl ? "text-left" : "text-right"}>
          <h2 className="text-2xl font-black text-slate-900">{church.nameEn}</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-[200px] leading-tight flex-wrap">{church.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 relative z-10" dir={dirClass}>
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 border-b border-slate-200 pb-1 w-fit">{isRtl ? "صورتحساب به:" : "Bill To:"}</p>
          <p className="font-black text-xl text-slate-900 mt-2">{invoiceTo}</p>
        </div>
        <div className={isRtl ? "text-left" : "text-right"}>
          <div className={`grid grid-cols-2 gap-2 text-sm ${isRtl ? "justify-start" : "justify-end"} bg-slate-50/80 p-4 rounded-xl border border-slate-100`}>
            <p className="font-bold text-slate-400 uppercase">{isRtl ? "تاریخ:" : "Date:"}</p>
            <p className="font-bold text-slate-900">{new Date(invoiceDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            <p className="font-bold text-slate-400 uppercase">{isRtl ? "نام:" : "Name:"}</p>
            <p className="font-bold text-slate-900">{invoiceName}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative z-10" dir={dirClass}>
        <div className="rounded-xl overflow-hidden border border-slate-200">
          <table className="w-full text-base border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs">
                <th className={`py-3 px-4 ${isRtl ? "text-right" : "text-left"} font-black uppercase tracking-widest w-16 border-b border-slate-200`}>{isRtl ? "ردیف" : "No"}</th>
                <th className={`py-3 px-4 ${isRtl ? "text-right" : "text-left"} font-black uppercase tracking-widest border-b border-slate-200`}>{isRtl ? "شرح" : "Description"}</th>
                <th className={`py-3 px-4 ${isRtl ? "text-left" : "text-right"} font-black uppercase tracking-widest border-b border-slate-200`}>{isRtl ? "مبلغ" : "Total"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoiceItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                  <td className="py-4 px-4 text-slate-400 font-mono text-xs">{index + 1}</td>
                  <td className="py-4 px-4 text-slate-900">{item.description}</td>
                  <td className={`py-4 px-4 ${isRtl ? "text-left" : "text-right"} text-slate-900 font-bold`} dir="ltr">${Number(item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 bg-slate-50">
                <td colSpan={2} className={`py-5 px-4 ${isRtl ? "text-left" : "text-right"} font-black text-slate-900 text-xl uppercase tracking-widest`}>
                  {isRtl ? "جمع کل" : "Total Due"}
                </td>
                <td className={`py-5 px-4 ${isRtl ? "text-left" : "text-right"} font-black text-purple-700 text-2xl bg-purple-50 border-l border-slate-200`} dir="ltr">
                  ${invoiceTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {invoiceWallet && (
          <div className="mt-8 pt-6 border-t border-dashed border-slate-200" dir={dirClass}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>
              {isRtl ? "کیف پول تتر:" : "Wallet Tether (TRC20):"}
            </p>
            <p className="font-mono text-sm break-all bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-600 shadow-inner" dir="ltr">
              {invoiceWallet}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between items-end relative z-10 border-t border-slate-100 pt-6">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest max-w-[250px] leading-tight">
            Generated via {church.nameEn} Document System. Thank you for your business.
          </div>
          {church.showVerifyQR && (
            <div className="flex flex-col items-center gap-1">
              <DocumentQR data={typeof window !== "undefined" ? window.location.origin + `/documents/view/INV-${invoiceNo}` : `INV-${invoiceNo}`} />
              <span className="text-[8px] text-slate-400 font-mono tracking-widest uppercase bg-slate-100 px-2 py-0.5 rounded-full">Scan to Verify</span>
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
  const [historyCat, setHistoryCat] = useState<"all" | "letter" | "receipt" | "inkind" | "invoice">("all");

  const handleAddInvoiceItem = () => setInvoiceItems(prev => [...prev, { id: crypto.randomUUID(), description: "", total: 0 }]);
  const handleRemoveInvoiceItem = (id: string) => setInvoiceItems(prev => prev.filter(item => item.id !== id));
  const handleInvoiceItemChange = (id: string, field: "description" | "total", value: any) => {
    setInvoiceItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const invoiceTotalAmount = invoiceItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const handleCopyLink = (item: DocHistoryItem) => {
    // Generates a link to the new Public Viewer Route
    const link = `${window.location.origin}/documents/view/${item.id}`;
    navigator.clipboard.writeText(link);
    alert(isRtl ? "لینک کپی شد" : "Link copied to clipboard!");
  };

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
    setDocHistory(prev => {
      const updated = [newItem, ...prev];
      localStorage.setItem("church_doc_history", JSON.stringify(updated));
      return updated;
    });
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

# 7. Replace the entire Tabs Section to ensure the invoice tab is included
new_tabs = """        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8 glass p-1 rounded-2xl w-fit overflow-x-auto">
          {[
            { id: "letters", icon: <FileSignature className="w-4 h-4" />, en: "Official Letters", fa: "نامه‌های اداری" },
            { id: "receipts", icon: <CreditCard className="w-4 h-4" />, en: "Donation Receipt", fa: "رسید کمک مالی" },
            { id: "inkind", icon: <Package className="w-4 h-4" />, en: "In-Kind Receipt", fa: "رسید لوازم" },
            { id: "invoice", icon: <DollarSign className="w-4 h-4" />, en: "Invoice", fa: "فاکتور / هزینه" },
            { id: "history", icon: <HistoryIcon className="w-4 h-4" />, en: "History & Sent", fa: "تاریخچه و آرشیو" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}{isRtl ? tab.fa : tab.en}
            </button>
          ))}
        </div>"""
code = re.sub(r"\{\/\* ── Tabs ── \*\/\}[\s\S]*?\<\/div\>", new_tabs, code, count=1)


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

                  <div className="flex gap-3 mt-4">
                    <button onClick={handlePrintInvoice} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 rounded-xl font-black text-sm shadow-xl shadow-purple-500/20 hover:scale-[1.02] transition-transform">
                      <Printer className="w-4 h-4" /> {isRtl ? "چاپ فاکتور" : "Print Invoice"}
                    </button>
                    <button onClick={() => {
                        const newItem: DocHistoryItem = {
                          id: crypto.randomUUID(), type: "invoice", date: invoiceDate, timestamp: Date.now(),
                          refNo: `INV-${invoiceNo}`, recipient: invoiceTo, subject: `Invoice for ${invoiceName}`,
                          amount: invoiceTotalAmount, invoiceItems: invoiceItems, invoiceWallet: invoiceWallet,
                        };
                        setDocHistory(prev => {
                          const updated = [newItem, ...prev];
                          localStorage.setItem("church_doc_history", JSON.stringify(updated));
                          return updated;
                        });
                        alert(isRtl ? "در تاریخچه ذخیره شد" : "Saved to History");
                    }} className="glass border border-white/10 px-4 py-3 rounded-xl text-sm font-bold hover:border-white/20 transition-all">
                      {isRtl ? "فقط ذخیره" : "Archive"}
                    </button>
                  </div>
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


# 9. Update History Section to include categories and instant detailed text search
new_history = """        {/* ══ HISTORY TAB ══ */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
               {/* Search Bar */}
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <input
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder={isRtl ? "جستجو در تاریخچه (شماره، گیرنده، موضوع پرداختی، مبلغ...)" : "Instant Search (Ref, Recipient, Subject, Amount...)"}
                   className="w-full glass border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50"
                 />
               </div>
               
               {/* Category Chips and Clear */}
               <div className="flex items-center justify-between flex-wrap gap-4">
                 <div className="flex gap-2 flex-wrap text-xs">
                   <button onClick={() => setHistoryCat("all")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "all" ? "bg-primary border-primary text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "همه" : "All"}</button>
                   <button onClick={() => setHistoryCat("letter")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "letter" ? "bg-blue-500 border-blue-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "نامه‌ها" : "Letters"}</button>
                   <button onClick={() => setHistoryCat("receipt")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "receipt" ? "bg-green-500 border-green-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "رسید نقدی" : "Cash Receipts"}</button>
                   <button onClick={() => setHistoryCat("inkind")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "inkind" ? "bg-amber-500 border-amber-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "رسید کالا" : "In-Kind Receipts"}</button>
                   <button onClick={() => setHistoryCat("invoice")} className={`px-4 py-1.5 rounded-full border transition-all ${historyCat === "invoice" ? "bg-purple-500 border-purple-500 text-white" : "glass border-white/10 text-muted-foreground hover:border-white/20"}`}>{isRtl ? "فاکتورها" : "Invoices"}</button>
                 </div>
                 
                 <button onClick={() => { if(confirm(isRtl ? "آیا از پاکسازی کل تاریخچه اطمینان دارید؟" : "Are you sure you want to clear all history?")) { setDocHistory([]); localStorage.removeItem("church_doc_history"); } }} 
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" /> {isRtl ? "پاکسازی تاریخچه" : "Clear All History"}
                 </button>
               </div>
            </div>

            <div className="glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" dir={isRtl ? "rtl" : "ltr"}>
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/10">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "تاریخ" : "Date"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "شماره" : "Ref No"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "نوع" : "Type"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "گیرنده / درخواست‌کننده" : "Recipient / Donor"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "موضوع" : "Subject"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isRtl ? "مبلغ" : "Amount"}</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">{isRtl ? "عملیات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {docHistory
                      .filter(item => historyCat === "all" || item.type === historyCat)
                      .filter(item =>
                        [item.refNo, item.recipient, item.subject, item.date, item.amount?.toString() || ""].some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map(item => (
                        <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group text-sm">
                          <td className="px-6 py-4 font-mono text-muted-foreground whitespace-nowrap">{item.date}</td>
                          <td className="px-6 py-4 font-black flex items-center gap-2">
                             {item.type === "letter" && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                             {item.type === "receipt" && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                             {item.type === "inkind" && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                             {item.type === "invoice" && <span className="w-2 h-2 rounded-full bg-purple-500"></span>}
                             <span className="text-primary">{item.refNo}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase ${
                              item.type === "letter" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                              item.type === "inkind" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              item.type === "invoice" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                              "bg-green-500/10 text-green-400 border-green-500/20"
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">{item.recipient}</td>
                          <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{item.subject}</td>
                          <td className="px-6 py-4 font-mono font-bold">{item.amount ? `$${item.amount.toLocaleString()}` : "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center gap-2 text-right rtl:text-left">
                              <button
                                onClick={() => handleCopyLink(item)}
                                title={isRtl ? "کپی لینک عمومی (ارسال)" : "Copy Public Link (Send)"}
                                className="p-2.5 rounded-xl glass border border-white/10 text-blue-400 hover:bg-blue-500/20 transition-all shadow-lg"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRePrint(item)}
                                title={isRtl ? "مشاهده و چاپ مجدد" : "View & Re-print"}
                                className="p-2.5 rounded-xl glass border border-white/10 text-primary hover:bg-primary/20 hover:text-primary transition-all shadow-lg"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => { if(confirm(isRtl ? "حذف شود؟" : "Delete?")) { setDocHistory(prev => { const updated = prev.filter(i => i.id !== item.id); localStorage.setItem("church_doc_history", JSON.stringify(updated)); return updated; }); } }}
                                  title={isRtl ? "حذف" : "Delete"}
                                  className="p-2.5 rounded-xl glass border border-white/10 text-red-500 hover:bg-red-500/20 transition-all shadow-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {docHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-10">
                            <HistoryIcon className="w-16 h-16" />
                            <p className="text-lg font-black uppercase tracking-widest">{isRtl ? "تاریخچه خالی است" : "History is empty"}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}"""

code = re.sub(r"\{\/\* ══ HISTORY TAB ══ \*\/\}.*", new_history, code, flags=re.DOTALL)

# Re-link 'Copy' icon if not imported
if "Copy," not in code and "Copy " not in code:
    code = code.replace("History as HistoryIcon, Search, Trash2", "History as HistoryIcon, Search, Trash2, Copy")

with open("src/app/documents/page.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("done")
