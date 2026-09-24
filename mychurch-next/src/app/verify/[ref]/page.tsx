"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, FileText, Search, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/providers/LanguageProvider";

type VerifyResult = {
  found: boolean;
  type?: "receipt" | "invoice" | "letter";
  ref?: string;
  valid?: boolean;
  donor?: string;
  amount?: number;
  currency?: string;
  date?: string;
  to?: string;
  recipient?: string;
  subject?: string;
  church_ein?: string;
  error?: string;
};

const localDict = {
  en: {
    churchName: "Iranian Presbyterian Church",
    churchLocation: "of Washington, D.C.",
    portalLabel: "OFFICIAL DOCUMENT VERIFICATION PORTAL",
    docAuth: "Document Authentication",
    verifying: "Verifying Document...",
    validTitle: "Authentic & Valid",
    validDesc: "This document is officially issued by the Iranian Presbyterian Church of Washington, D.C.",
    docType: "Document Type",
    receiptType: "Official Donation Receipt",
    invoiceType: "Official Invoice",
    letterType: "Official Letter",
    refNo: "Reference No.",
    donorName: "Donor Name",
    issuedTo: "Issued To",
    recipient: "Recipient",
    subject: "Subject",
    amount: "Amount",
    issueDate: "Issue Date",
    churchEIN: "Church EIN",
    revokedTitle: "Document Revoked",
    revokedDesc: "This document has been revoked or is no longer valid. Please contact the church for more information.",
    notFoundTitle: "Document Not Found",
    notFoundDesc: "No matching document was found. If you believe this is an error, please contact the church administration.",
    unavailableTitle: "Verification Unavailable",
    unavailableDesc: "Could not verify this document right now. Please try again later or contact us directly.",
    verifiedAt: "VERIFIED AT",
    issuingAuthority: "ISSUING AUTHORITY",
    disclaimer: "This verification page is provided for authentication purposes only. Any unauthorized alteration of church-issued documents is a federal offense. For questions, email: admin@iccdc.org or call (202) 000-0000.",
    returnHome: "← Return to Church Website",
  },
  fa: {
    churchName: "کلیسای انجیلی ایرانیان",
    churchLocation: "واشنگتن دی‌سی",
    portalLabel: "پرتال رسمی تأیید اعتبار اسناد",
    docAuth: "احراز هویت سند",
    verifying: "در حال بررسی سند...",
    validTitle: "معتبر و اصیل",
    validDesc: "این سند رسماً توسط کلیسای انجیلی ایرانیان واشنگتن دی‌سی صادر شده است.",
    docType: "نوع سند",
    receiptType: "رسید رسمی اعانه",
    invoiceType: "فاکتور رسمی",
    letterType: "نامه رسمی",
    refNo: "شماره پیگیری",
    donorName: "نام اهداکننده",
    issuedTo: "صادر شده برای",
    recipient: "گیرنده",
    subject: "موضوع",
    amount: "مبلغ",
    issueDate: "تاریخ صدور",
    churchEIN: "شناسه مالیاتی کلیسا (EIN)",
    revokedTitle: "سند باطل شده",
    revokedDesc: "این سند باطل شده یا دیگر معتبر نیست. لطفاً برای اطلاعات بیشتر با کلیسا تماس بگیرید.",
    notFoundTitle: "سند یافت نشد",
    notFoundDesc: "هیچ سند منطبقی یافت نشد. اگر فکر می‌کنید این یک اشتباه است، لطفاً با دفتر کلیسا تماس بگیرید.",
    unavailableTitle: "امکان تأیید وجود ندارد",
    unavailableDesc: "در حال حاضر امکان تأیید این سند وجود ندارد. لطفاً بعداً دوباره تلاش کنید یا مستقیماً با ما تماس بگیرید.",
    verifiedAt: "زمان تأیید",
    issuingAuthority: "مرجع صادرکننده",
    disclaimer: "این صفحه صرفاً برای احراز هویت اسناد در نظر گرفته شده است. هرگونه تغییر غیرمجاز در اسناد صادرشده توسط کلیسا جرم فدرال محسوب می‌شود. برای پرسش‌ها با ایمیل admin@iccdc.org یا شماره (202) 000-0000 تماس بگیرید.",
    returnHome: "← بازگشت به وب‌سایت کلیسا",
  },
  es: {
    churchName: "Iglesia Presbiteriana Iraní",
    churchLocation: "de Washington, D.C.",
    portalLabel: "PORTAL OFICIAL DE VERIFICACIÓN DE DOCUMENTOS",
    docAuth: "Autenticación de Documento",
    verifying: "Verificando documento...",
    validTitle: "Auténtico y Válido",
    validDesc: "Este documento ha sido emitido oficialmente por la Iglesia Presbiteriana Iraní de Washington, D.C.",
    docType: "Tipo de Documento",
    receiptType: "Recibo Oficial de Donación",
    invoiceType: "Factura Oficial",
    letterType: "Carta Oficial",
    refNo: "N.º de Referencia",
    donorName: "Nombre del Donante",
    issuedTo: "Emitido A",
    recipient: "Destinatario",
    subject: "Asunto",
    amount: "Monto",
    issueDate: "Fecha de Emisión",
    churchEIN: "EIN de la Iglesia",
    revokedTitle: "Documento Revocado",
    revokedDesc: "Este documento ha sido revocado o ya no es válido. Comuníquese con la iglesia para más información.",
    notFoundTitle: "Documento No Encontrado",
    notFoundDesc: "No se encontró ningún documento coincidente. Si cree que se trata de un error, comuníquese con la administración de la iglesia.",
    unavailableTitle: "Verificación No Disponible",
    unavailableDesc: "No se pudo verificar este documento en este momento. Inténtelo de nuevo más tarde o contáctenos directamente.",
    verifiedAt: "VERIFICADO EL",
    issuingAuthority: "AUTORIDAD EMISORA",
    disclaimer: "Esta página de verificación se ofrece únicamente con fines de autenticación. Cualquier alteración no autorizada de documentos emitidos por la iglesia constituye un delito federal. Para preguntas, escriba a admin@iccdc.org o llame al (202) 000-0000.",
    returnHome: "← Volver al Sitio Web de la Iglesia",
  },
};

export default function VerifyDocPage() {
  const params = useParams();
  const rawRef = params?.ref as string ?? "";
  const ref = decodeURIComponent(rawRef);
  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;

  const [status, setStatus] = useState<"loading" | "found-valid" | "found-invalid" | "not-found" | "error">("loading");
  const [data, setData] = useState<VerifyResult | null>(null);
  const verifyTs = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  useEffect(() => {
    if (!ref) { setStatus("error"); return; }
    fetch(`/api/verify-doc/${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then((d: VerifyResult) => {
        setData(d);
        if (!d.found) setStatus("not-found");
        else if (d.valid) setStatus("found-valid");
        else setStatus("found-invalid");
      })
      .catch(() => setStatus("error"));
  }, [ref]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir="ltr">
      {/* Header */}
      <div className="w-full max-w-xl">
        {/* Church Brand */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Image src="/logo-transparent.png" alt="Logo" width={40} height={40} className="object-contain invert" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">{d.churchName}</h2>
            <p className="text-blue-700 font-bold tracking-widest text-xs mt-0.5">{d.churchLocation}</p>
            <p className="text-slate-500 text-xs font-mono mt-0.5">{d.portalLabel}</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl overflow-hidden">
          {/* Top Bar */}
          <div className="bg-slate-900 px-8 py-5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">{d.docAuth}</p>
              <p className="text-white font-mono text-sm font-black">{ref || "—"}</p>
            </div>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* Loading */}
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <p className="text-slate-600 font-bold tracking-widest uppercase text-xs">{d.verifying}</p>
              </div>
            )}

            {/* Valid */}
            {status === "found-valid" && data && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border-2 border-emerald-200 shrink-0">
                    <CheckCircle className="w-8 h-8 text-emerald-600 fill-emerald-100" />
                  </div>
                  <div>
                    <p className="font-black text-emerald-700 text-xl uppercase tracking-tight">{d.validTitle}</p>
                    <p className="text-slate-500 text-sm font-medium">{d.validDesc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: d.docType, value: data.type === "receipt" ? d.receiptType : data.type === "invoice" ? d.invoiceType : d.letterType },
                    { label: d.refNo, value: data.ref || ref },
                    ...(data.donor ? [{ label: d.donorName, value: data.donor }] : []),
                    ...(data.to ? [{ label: d.issuedTo, value: data.to }] : []),
                    ...(data.recipient ? [{ label: d.recipient, value: data.recipient }] : []),
                    ...(data.subject ? [{ label: d.subject, value: data.subject }] : []),
                    ...(data.amount != null ? [{ label: d.amount, value: `$${Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${data.currency || "USD"}` }] : []),
                    ...(data.date ? [{ label: d.issueDate, value: new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }] : []),
                    ...(data.church_ein ? [{ label: d.churchEIN, value: data.church_ein }] : []),
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="font-bold text-slate-900 text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invalid */}
            {status === "found-invalid" && (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border-2 border-red-200 shrink-0">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <p className="font-black text-red-700 text-xl uppercase tracking-tight">{d.revokedTitle}</p>
                  <p className="text-slate-500 text-sm">{d.revokedDesc}</p>
                </div>
              </div>
            )}

            {/* Not Found */}
            {status === "not-found" && (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center border-2 border-amber-200 shrink-0">
                  <Search className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-amber-700 text-xl uppercase tracking-tight">{d.notFoundTitle}</p>
                  <p className="text-slate-500 text-sm">{d.notFoundDesc}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-slate-200 shrink-0">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="font-black text-slate-700 text-xl uppercase tracking-tight">{d.unavailableTitle}</p>
                  <p className="text-slate-500 text-sm">{d.unavailableDesc}</p>
                </div>
              </div>
            )}

            {/* Footer Metadata */}
            <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>{d.verifiedAt}</span>
                <span>{verifyTs} (EDT)</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>{d.issuingAuthority}</span>
                <span>ICCDC · EIN 46-XXXXXXX</span>
              </div>
              <p className="text-[9px] text-slate-300 leading-tight uppercase tracking-wider pt-2">
                {d.disclaimer}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
            {d.returnHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
