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

  // Parse Date
  let dayStr = "";
  let monthStr = "";
  let yearStr = "";
  if (data.baptism_date) {
    const d = new Date(data.baptism_date);
    if (!isNaN(d.getTime())) {
      dayStr = d.getDate().toString();
      monthStr = d.toLocaleString('en-US', { month: 'long' });
      yearStr = d.getFullYear().toString();
    } else {
      // Fallback
      dayStr = data.baptism_date;
    }
  }

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div
        ref={ref}
        // A4 Landscape dimension 1123x794 at 96 DPI
        className="text-slate-900 relative shadow-2xl mx-auto overflow-hidden print:shadow-none select-none bg-[url('/certificate-bg.jpg')] bg-[length:100%_100%] bg-no-repeat print:bg-none print:bg-transparent"
        style={{ 
          width: "1123px", 
          height: "794px", 
        }}
      >
      {/* 
        The design has specific coordinates as requested by the user.
        We map the data exactly over the blank lines. 
      */}

      {/* Recipient Name */}
      <div 
        className="absolute w-[600px] text-center"
        style={{ 
          top: "320px", 
          left: "50%", 
          transform: "translateX(-40%)" // Slightly right due to left sidebar
        }}
      >
        <h2 className="text-[52px] font-bold tracking-wide" style={{ fontFamily: "var(--font-cormorant), serif", color: "#1a2b4c" }}>
          {data.recipient_name_en || data.recipient_name_fa}
        </h2>
      </div>

      {/* Date - Day/Month/Year */}
      {dayStr && monthStr && yearStr ? (
        <>
          <div className="absolute text-center" style={{ top: "480px", left: "420px", width: "120px", color: "#1a2b4c" }}>
            <div className="text-xl font-bold font-serif">{dayStr}</div>
          </div>
          <div className="absolute text-center" style={{ top: "480px", left: "600px", width: "120px", color: "#1a2b4c" }}>
            <div className="text-xl font-bold font-serif">{monthStr}</div>
          </div>
          <div className="absolute text-center" style={{ top: "480px", left: "770px", width: "120px", color: "#1a2b4c" }}>
            <div className="text-xl font-bold font-serif">{yearStr}</div>
          </div>
        </>
      ) : (
        <div className="absolute text-center" style={{ top: "480px", left: "420px", width: "470px", color: "#1a2b4c" }}>
            <div className="text-xl font-bold font-serif">{data.baptism_date}</div>
        </div>
      )}

      {/* Minister/Officiant */}
      <div 
        className="absolute font-semibold text-xl"
        style={{ 
          top: "542px", 
          left: "480px", 
          color: "#1a2b4c",
          fontFamily: "var(--font-cormorant), serif"
        }}
      >
        {data.minister_name_en || data.minister_name_fa}
      </div>

      {/* Godparents */}
      <div 
        className="absolute font-bold text-2xl"
        style={{ 
          top: "612px", 
          left: "440px", 
          color: "#1a2b4c",
          fontFamily: "var(--font-cormorant), serif"
        }}
      >
        {data.sponsor_name_en || data.sponsor_name_fa}
      </div>

      {/* Officiant Signature Image */}
      {data.pastor_signature_url && (
        <div 
          className="absolute flex justify-center items-end"
          style={{ 
            top: "640px", 
            left: "290px",
            width: "180px",
            height: "80px"
          }}
        >
          <img src={data.pastor_signature_url} alt="Signature" className="max-h-full max-w-full mix-blend-multiply" />
        </div>
      )}

      {/* Date (Bottom Right) */}
      <div 
        className="absolute text-center font-bold text-xl"
        style={{ 
          top: "675px", 
          left: "675px",
          width: "180px",
          color: "#1a2b4c",
          fontFamily: "var(--font-cormorant), serif"
        }}
      >
        {data.baptism_date || "---"}
      </div>

      {/* Verification QR Code (Bottom Left) */}
      <div 
        className="absolute bg-white/80 p-2 rounded-xl border border-slate-200/50 shadow-sm flex flex-col items-center justify-center opacity-90"
        style={{ 
          bottom: "40px", 
          right: "40px",
        }}
      >
        <QRCodeSVG value={verifyUrl} size={65} level="M" fgColor="#1a2b4c" />
        <span className="block text-[9px] text-center mt-1 text-slate-500 font-sans tracking-widest font-semibold uppercase">Verify</span>
      </div>

    </div>
    </>
  );
});

CertificateTemplate.displayName = "CertificateTemplate";
