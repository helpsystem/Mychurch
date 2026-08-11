"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { CertificateData } from '@/app/admin/documents/CertificateTemplate';

export default function VerificationClient({ 
  cert, 
  status 
}: { 
  cert?: CertificateData; 
  status: 'ISSUED' | 'REVOKED' | 'INVALID'; 
}) {
  
  return (
    <div className="min-h-[80vh] bg-[#080D1A] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border-t-4 ${
          status === 'ISSUED' ? 'border-emerald-500' : 
          status === 'REVOKED' ? 'border-red-500' : 'border-slate-500'
        }`}
      >
        {status === 'ISSUED' && cert && (
          <>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={64} />
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-slate-800 mb-2"
            >
              گواهی معتبر است
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-slate-500 text-sm mb-6 font-semibold"
            >
              این سند توسط کلیسا صادر شده و اصالت آن تأیید می‌گردد.
            </motion.p>

            {/* Certificate Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-slate-50 rounded-xl p-5 text-right space-y-3 mb-6 border border-slate-200 shadow-sm"
              dir="rtl"
            >
              <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-500">شماره شناسایی:</span>
                <span className="font-mono font-medium text-slate-800">{cert.certificate_number}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-500">نام صاحب گواهی:</span>
                <span className="font-bold text-slate-800" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  {cert.recipient_name_fa || cert.recipient_name_en}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">تاریخ صدور:</span>
                <span className="font-bold text-slate-800">{cert.baptism_date}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 py-2.5 rounded-lg font-medium"
            >
              <ShieldCheck size={18} />
              <span>سیستم اعتبارسنجی امن کلیسای ایرانیان</span>
            </motion.div>
          </>
        )}

        {status === 'REVOKED' && (
          <>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <div className="bg-red-100 p-4 rounded-full text-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <XCircle size={64} />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">گواهی باطل شده است</h1>
            <p className="text-slate-500 text-sm mb-6">این سند دیگر اعتبار ندارد.</p>
          </>
        )}

        {status === 'INVALID' && (
          <>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <div className="bg-slate-100 p-4 rounded-full text-slate-600">
                <XCircle size={64} />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">گواهی نامعتبر</h1>
            <p className="text-slate-500 text-sm mb-6">سندی با این مشخصات یافت نشد.</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
