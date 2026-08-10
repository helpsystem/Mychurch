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
      // A4 Landscape dimension 1123x794 at 96 DPI
      className="bg-white text-slate-900 relative shadow-2xl mx-auto overflow-hidden print:shadow-none"
      style={{ 
        width: "1123px", 
        height: "794px", 
        fontFamily: "serif",
        // Assumes the user copies the template to public/certificate-bg.webp
        backgroundImage: "url('/certificate-bg.webp')",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat"
      }}
    >
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
