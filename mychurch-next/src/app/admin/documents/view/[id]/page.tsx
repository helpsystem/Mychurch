"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { Printer, Loader2, ArrowLeft, ShieldCheck, Download } from "lucide-react";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { LetterDoc, DonationReceiptDoc, InvoiceDoc, DocHistoryItem } from "../../DocumentsClient";
import { getDocumentById } from "@/actions/documents";
import { getDocumentSettings, type ChurchDocSettings } from "@/actions/documentSettings";

// Configurable default church model as fallback.
const DEFAULT_CHURCH = {
  nameEn: "Iranian Presbyterian Church of Washington DC",
  nameFa: "کلیسای انجیلی ایرانیان واشنگتن دی‌سی",
  address: "Washington, DC Metropolitan Area",
  ein: "XX-XXXXXXX",
  phone: "+1 (XXX) XXX-XXXX",
  email: "info@iranianchurchdc.com",
  web: "www.iranianchurchdc.com",
  logo: "/logo-transparent.png",
  pastor: "Pastor Javad Pishghadamian",
  denomination: "Persian Presbyterian Church – 501(c)(3)",
  letterheadTheme: "modern",
  customHeaderImage: "",
  paperSize: "Letter",
  watermarkOpacity: 0.03,
  showWatermark: true,
  signatureImage: "",
  signatoryName: "Rev. Sam Yarebeygi",
  signatoryTitle: "Senior Pastor",
  showVerifyQR: true,
  designEn: {
    titleSize: 32, bodySize: 14, footerSize: 10, fontFamily: "Inter, sans-serif",
    logoSize: 100, headerPadding: 24, isBoldTitle: true, isItalicBody: false,
  },
  designFa: {
    titleSize: 28, bodySize: 15, footerSize: 11, fontFamily: "'Vazirmatn', sans-serif",
    logoSize: 90, headerPadding: 20, isBoldTitle: true, isItalicBody: false,
  },
};

export default function DocumentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id || "") as string;
  
  const [doc, setDoc] = useState<DocHistoryItem | null>(null);
  const [church, setChurch] = useState<any>(DEFAULT_CHURCH);
  const [loading, setLoading] = useState(true);
  
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        // 1. Fetch Church settings from the database
        const settings = await getDocumentSettings();
        if (settings) {
          setChurch(settings);
        }

        // 2. Fetch Document by ID from Supabase
        const result = await getDocumentById(id);
        
        if (result && result.data) {
          const dbDoc = result.data;
          const content = dbDoc.document_content && typeof dbDoc.document_content === "object" ? dbDoc.document_content : {};
          
          const docType: DocHistoryItem["type"] =
            content.type === "inkind"
              ? "inkind"
              : dbDoc.document_type === "letter"
                ? "letter"
                : dbDoc.document_type === "invoice"
                  ? "invoice"
                  : "receipt";

          const mappedItem: DocHistoryItem = {
            id: dbDoc.id,
            type: docType,
            date: content.date || new Date(dbDoc.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
            timestamp: new Date(dbDoc.created_at).getTime(),
            refNo: content.refNo || `DOC-${String(dbDoc.id).slice(0, 8).toUpperCase()}`,
            recipient: dbDoc.recipient_name || content.recipient || "Unspecified",
            subject: dbDoc.title || content.subject || "No Subject",
            bodyEn: content.bodyEn,
            bodyFa: content.bodyFa,
            amount: content.amount,
            donorName: content.donorName,
            donorAddress: content.donorAddress,
            inKindItems: content.inKindItems,
            invoiceItems: content.invoiceItems,
            invoiceWallet: content.invoiceWallet,
            toAddress: content.toAddress,
            invoiceAddress: content.invoiceAddress,
            invoiceNotes: content.invoiceNotes,
            lang: content.lang,
          };

          setDoc(mappedItem);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to load document from Supabase backend, trying localStorage fallback:", err);
      }

      // 3. Fallback to LocalStorage for offline/legacy client drafts
      const stored = localStorage.getItem("church_doc_history");
      if (stored) {
        try {
          const history: DocHistoryItem[] = JSON.parse(stored);
          const target = history.find(item => item.id === id);
          if (target) setDoc(target);
        } catch (e) {
          console.error("Failed to parse local history");
        }
      }
      setLoading(false);
    }

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
           <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
           <h1 className="text-2xl font-black text-slate-900 mb-2">Document Not Found</h1>
           <p className="text-slate-500 mb-6">This document link is invalid or has expired.</p>
           <button onClick={() => router.push("/")} className="glass text-primary px-6 py-3 rounded-xl font-bold border border-primary/20 hover:bg-primary/5 transition-all">
             Return Home
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <PublicHeader />

      {/* Sticky Toolbar */}
      <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-bold">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm">
                <Printer className="w-4 h-4" /> Print Document
              </button>
              <button onClick={() => handlePrint()} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:scale-105 transition-all text-sm">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
        </div>
      </div>

      <main className="flex-1 py-12 px-4 flex justify-center pb-32">
        <div className="scale-[0.8] sm:scale-90 md:scale-100 transform origin-top print:scale-100 print:shadow-none transition-transform" ref={printRef}>
          {doc.type === "letter" && (
             <div className="bg-white shadow-2xl overflow-hidden rounded-md border border-slate-200">
               <LetterDoc
                  bodyEn={doc.bodyEn || ""}
                  bodyFa={doc.bodyFa || ""}
                  editLang={doc.bodyEn ? "en" : "fa"}
                  to=""
                  toAddress=""
                  subject={doc.subject}
                  recipientName={doc.recipient}
                  refNo={doc.refNo.replace("ICW-", "")}
                  pageNum={1}
                  totalPages={1}
                  church={church}
               />
             </div>
          )}

          {(doc.type === "receipt" || doc.type === "inkind") && (
             <div className="bg-white shadow-2xl overflow-hidden rounded-md border border-slate-200">
               <DonationReceiptDoc
                  receipt={{
                    donorName: doc.donorName || doc.recipient || "",
                    donorAddress: doc.donorAddress || "",
                    amount: doc.amount || 0,
                    method: "Check/Cash",
                    description: doc.subject,
                    date: doc.date,
                  }}
                  receiptNo={doc.refNo.replace("RCP-", "")}
                  isInKind={doc.type === "inkind"}
                  inKindItems={doc.inKindItems || []}
                  church={church}
               />
             </div>
          )}

          {doc.type === "invoice" && (
             <div className="bg-white shadow-2xl overflow-hidden rounded-md border border-slate-200">
               <InvoiceDoc
                  invoiceNo={doc.refNo.replace("INV-", "")}
                  invoiceTo={doc.recipient}
                  invoiceName={doc.subject.replace("Invoice for ", "")}
                  invoiceDate={doc.date}
                  invoiceItems={doc.invoiceItems || []}
                  invoiceTotalAmount={doc.amount || 0}
                  invoiceWallet={doc.invoiceWallet || ""}
                  church={church}
                  lang="en" // Default to English LTR for invoices unless explicitly saved otherwise
                  isPdf={false}
               />
              </div>
          )}
          <style>{`@media print { body { background: #ffffff !important; } }`}</style>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
