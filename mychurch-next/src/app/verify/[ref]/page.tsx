"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, FileText, Search, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

export default function VerifyDocPage() {
  const params = useParams();
  const rawRef = params?.ref as string ?? "";
  const ref = decodeURIComponent(rawRef);

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
            <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">Iranian Christian Church</h2>
            <p className="text-blue-700 font-bold tracking-widest text-xs mt-0.5">of Washington, D.C.</p>
            <p className="text-slate-500 text-xs font-mono mt-0.5">OFFICIAL DOCUMENT VERIFICATION PORTAL</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border-2 border-slate-900 shadow-2xl overflow-hidden">
          {/* Top Bar */}
          <div className="bg-slate-900 px-8 py-5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Document Authentication</p>
              <p className="text-white font-mono text-sm font-black">{ref || "—"}</p>
            </div>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* Loading */}
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                <p className="text-slate-600 font-bold tracking-widest uppercase text-xs">Verifying Document...</p>
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
                    <p className="font-black text-emerald-700 text-xl uppercase tracking-tight">Authentic & Valid</p>
                    <p className="text-slate-500 text-sm font-medium">This document is officially issued by the Iranian Christian Church of Washington, D.C.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Document Type", value: data.type === "receipt" ? "Official Donation Receipt" : data.type === "invoice" ? "Official Invoice" : "Official Letter" },
                    { label: "Reference No.", value: data.ref || ref },
                    ...(data.donor ? [{ label: "Donor Name", value: data.donor }] : []),
                    ...(data.to ? [{ label: "Issued To", value: data.to }] : []),
                    ...(data.recipient ? [{ label: "Recipient", value: data.recipient }] : []),
                    ...(data.subject ? [{ label: "Subject", value: data.subject }] : []),
                    ...(data.amount != null ? [{ label: "Amount", value: `$${Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${data.currency || "USD"}` }] : []),
                    ...(data.date ? [{ label: "Issue Date", value: new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }] : []),
                    ...(data.church_ein ? [{ label: "Church EIN", value: data.church_ein }] : []),
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
                  <p className="font-black text-red-700 text-xl uppercase tracking-tight">Document Revoked</p>
                  <p className="text-slate-500 text-sm">This document has been revoked or is no longer valid. Please contact the church for more information.</p>
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
                  <p className="font-black text-amber-700 text-xl uppercase tracking-tight">Document Not Found</p>
                  <p className="text-slate-500 text-sm">No matching document was found. If you believe this is an error, please contact the church administration.</p>
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
                  <p className="font-black text-slate-700 text-xl uppercase tracking-tight">Verification Unavailable</p>
                  <p className="text-slate-500 text-sm">Could not verify this document right now. Please try again later or contact us directly.</p>
                </div>
              </div>
            )}

            {/* Footer Metadata */}
            <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>VERIFIED AT</span>
                <span>{verifyTs} (EDT)</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
                <span>ISSUING AUTHORITY</span>
                <span>ICCDC · EIN 46-XXXXXXX</span>
              </div>
              <p className="text-[9px] text-slate-300 leading-tight uppercase tracking-wider pt-2">
                This verification page is provided for authentication purposes only. Any unauthorized alteration of church-issued documents is a federal offense. For questions, email: admin@iccdc.org or call (202) 000-0000.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
            ← Return to Church Website
          </Link>
        </div>
      </div>
    </div>
  );
}
