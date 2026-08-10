"use client";

import React, { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export interface CertificateData {
  certificate_number: string;
  recipient_name_en: string;
  recipient_name_fa: string;
  date_of_birth: string;
  parents_names_en: string;
  parents_names_fa: string;
  sponsor_name_en: string;
  sponsor_name_fa: string;
  baptism_date: string;
  church_name_en: string;
  church_name_fa: string;
  minister_name_en: string;
  minister_name_fa: string;
  logo_url?: string;
  seal_url?: string;
  pastor_signature_url?: string;
  certificate_text_en?: string;
  certificate_text_fa?: string;
}

interface Props {
  data: CertificateData;
}

// Ensure it maintains standard A4 aspect ratio (1 : 1.414) in Landscape
export const CertificateTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/certificate/${data.certificate_number}`;

  return (
    <div
      ref={ref}
      // A4 Landscape dimension roughly 1123x794 at 96 DPI
      // We use a fixed width container that scales via CSS transform where used
      className="bg-white text-slate-900 relative shadow-2xl mx-auto overflow-hidden"
      style={{ width: "1123px", height: "794px", fontFamily: "serif" }}
    >
      {/* Ornate Border Background */}
      <div className="absolute inset-4 border-[12px] border-double border-amber-600/60 rounded-xl" />
      <div className="absolute inset-6 border border-amber-800/30 rounded-lg" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-multiply pointer-events-none" />
      
      {/* Content Container */}
      <div className="relative w-full h-full p-16 flex flex-col justify-between z-10">
        
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="w-48">
            <QRCodeSVG value={verifyUrl} size={90} level="M" fgColor="#1e293b" />
            <div className="text-[10px] text-slate-500 mt-2 font-mono">{data.certificate_number}</div>
          </div>
          
          <div className="flex flex-col items-center flex-1">
            {data.logo_url ? (
              <img src={data.logo_url} alt="Church Logo" className="h-28 object-contain mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full border border-amber-600 flex items-center justify-center text-amber-600 mb-4">Logo</div>
            )}
            <h1 className="text-4xl font-black text-amber-900 tracking-widest uppercase" style={{ fontFamily: "Georgia, serif" }}>Certificate of Baptism</h1>
            <h2 className="text-3xl font-bold text-amber-800 mt-2" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>گواهی غسل تعمید</h2>
          </div>

          <div className="w-48 text-right">
            <div className="text-sm font-semibold text-slate-600 uppercase tracking-widest">Date / تاریخ</div>
            <div className="text-lg font-bold text-slate-900">{data.baptism_date || "---"}</div>
          </div>
        </div>

        {/* Body Section (Bilingual split) */}
        <div className="flex flex-1 mt-10 gap-12">
          {/* English Side */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4" dir="ltr">
            <p className="text-sm text-slate-600 mb-4">{data.certificate_text_en || "This is to certify that"}</p>
            <h3 className="text-3xl font-bold text-slate-900 border-b border-slate-300 pb-2 w-full mb-6 italic" style={{ fontFamily: "Georgia, serif" }}>
              {data.recipient_name_en || "[Recipient Name]"}
            </h3>
            
            <div className="w-full text-left space-y-4 text-sm mt-4">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Date of Birth:</span>
                <span className="font-semibold">{data.date_of_birth || "---"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Parents:</span>
                <span className="font-semibold">{data.parents_names_en || "---"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Sponsor/Godparent:</span>
                <span className="font-semibold">{data.sponsor_name_en || "---"}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-amber-900/20 my-8"></div>

          {/* Persian Side */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4" dir="rtl" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
            <p className="text-sm text-slate-600 mb-4">{data.certificate_text_fa || "بدین‌وسیله گواهی می‌شود"}</p>
            <h3 className="text-3xl font-bold text-slate-900 border-b border-slate-300 pb-2 w-full mb-6">
              {data.recipient_name_fa || "[نام گیرنده]"}
            </h3>

            <div className="w-full text-right space-y-4 text-sm mt-4">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">تاریخ تولد:</span>
                <span className="font-semibold">{data.date_of_birth || "---"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">نام والدین:</span>
                <span className="font-semibold">{data.parents_names_fa || "---"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">معرف / پدر و مادر تعمیدی:</span>
                <span className="font-semibold">{data.sponsor_name_fa || "---"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex justify-between items-end mt-12 px-12">
          {/* Minister Signature */}
          <div className="flex flex-col items-center w-64">
            {data.pastor_signature_url ? (
              <img src={data.pastor_signature_url} alt="Signature" className="h-16 object-contain mb-2 mix-blend-multiply" />
            ) : (
              <div className="h-16 w-full border-b border-slate-400 mb-2"></div>
            )}
            <div className="text-lg font-bold text-slate-900">{data.minister_name_en || "Minister Name"}</div>
            <div className="text-sm text-slate-600" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>{data.minister_name_fa || "نام کشیش"}</div>
          </div>

          {/* Church Seal */}
          <div className="flex flex-col items-center justify-center">
            {data.seal_url ? (
              <img src={data.seal_url} alt="Official Seal" className="w-32 h-32 object-contain mix-blend-multiply opacity-80" />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-amber-600/50 flex flex-col items-center justify-center text-amber-700/50 rotate-[-15deg]">
                <span className="text-xs font-bold uppercase tracking-widest">Official</span>
                <span className="text-xs font-bold uppercase tracking-widest">Seal</span>
              </div>
            )}
          </div>

          {/* Church Details */}
          <div className="flex flex-col items-center w-64">
            <div className="h-16 w-full border-b border-slate-400 mb-2 flex items-end justify-center pb-2">
              <span className="text-sm font-semibold uppercase text-slate-700">Official Record</span>
            </div>
            <div className="text-lg font-bold text-slate-900">{data.church_name_en}</div>
            <div className="text-sm text-slate-600" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>{data.church_name_fa}</div>
          </div>
        </div>

      </div>
    </div>
  );
});

CertificateTemplate.displayName = "CertificateTemplate";
