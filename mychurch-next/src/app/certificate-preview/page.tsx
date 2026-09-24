"use client";

import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CertificateTemplate, CertificateData } from '@/app/admin/documents/CertificateTemplate';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { useLanguage } from '@/providers/LanguageProvider';

const localDict = {
  en: {
    pageTitle: "Live Certificate Issuance & Preview System",
    formPanelTitle: "Certificate Information",
    recipientLabel: "Recipient Name (English/Persian):",
    baptismDateLabel: "Baptism Date (e.g. 2026-08-11):",
    ministerLabel: "Minister / Officiant Name:",
    sponsorLabel: "Godparents:",
    certNumberLabel: "Unique ID (QR Code Generation):",
    printButton: "Print Certificate",
  },
  fa: {
    pageTitle: "سیستم صدور و پیش‌نمایش زنده گواهی (Live Preview)",
    formPanelTitle: "اطلاعات گواهی",
    recipientLabel: "نام متقاضی (انگلیسی/فارسی):",
    baptismDateLabel: "تاریخ غسل تعمید (مثلاً 2026-08-11):",
    ministerLabel: "نام کشیش / مسئول:",
    sponsorLabel: "پدر و مادر تعمیدی (Godparents):",
    certNumberLabel: "شناسه یکتا (تولید QR کد):",
    printButton: "چاپ گواهی (Print)",
  },
  es: {
    pageTitle: "Sistema de Emisión y Vista Previa en Vivo de Certificados",
    formPanelTitle: "Información del Certificado",
    recipientLabel: "Nombre del Destinatario (Inglés/Persa):",
    baptismDateLabel: "Fecha de Bautismo (ej. 2026-08-11):",
    ministerLabel: "Nombre del Ministro / Oficiante:",
    sponsorLabel: "Padrinos:",
    certNumberLabel: "ID Único (Generación de Código QR):",
    printButton: "Imprimir Certificado",
  },
};

export default function LiveCertificatePreview() {
  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;

  // State for form info
  const [formData, setFormData] = useState<CertificateData>({
    certificate_number: 'CERT-998877',
    recipient_name_en: 'John Doe',
    recipient_name_fa: 'جان دو',
    date_of_birth: '1990-01-01',
    parents_names_en: 'Mr & Mrs Doe',
    parents_names_fa: '',
    sponsor_name_en: 'Pastor Javad Pishghadamian',
    sponsor_name_fa: '',
    baptism_date: '2026-08-11',
    church_name_en: 'Iranian Presbyterian Church',
    church_name_fa: 'کلیسای انجیلی ایرانیان',
    minister_name_en: 'Nazi joon',
    minister_name_fa: '',
    logo_url: '',
    seal_url: '',
    pastor_signature_url: '',
    certificate_text_en: '',
    certificate_text_fa: ''
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Certificate-${formData.certificate_number}`,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 p-8 flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold text-slate-800">{d.pageTitle}</h1>

        <div className="flex flex-col xl:flex-row gap-8 w-full items-start justify-center">

          {/* Form Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-md w-full xl:w-96 space-y-4 border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">{d.formPanelTitle}</h2>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{d.recipientLabel}</label>
              <input
                type="text"
                name="recipient_name_en"
                value={formData.recipient_name_en}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{d.baptismDateLabel}</label>
              <input
                type="date"
                name="baptism_date"
                value={formData.baptism_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{d.ministerLabel}</label>
              <input
                type="text"
                name="minister_name_en"
                value={formData.minister_name_en}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{d.sponsorLabel}</label>
              <input
                type="text"
                name="sponsor_name_en"
                value={formData.sponsor_name_en}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{d.certNumberLabel}</label>
              <input
                type="text"
                name="certificate_number"
                value={formData.certificate_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
              />
            </div>

            <button
              onClick={() => handlePrint()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm mt-4"
            >
              {d.printButton}
            </button>
          </div>

          {/* Live Preview Wrapper */}
          <div className="overflow-x-auto w-full max-w-[1200px] flex justify-center bg-slate-300/50 p-6 rounded-2xl border border-slate-300">
             {/* scale the certificate to fit if screen is smaller */}
             <div className="scale-100 xl:scale-90 origin-top">
                <CertificateTemplate data={formData} ref={printRef} />
             </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
