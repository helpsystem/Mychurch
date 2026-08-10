import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default async function VerifyCertificatePage({ params }: { params: { certificateNumber: string } }) {
  const supabase = await createClient();
  const certNum = params.certificateNumber;

  const { data: cert, error } = await supabase
    .from('baptism_certificates')
    .select('*')
    .eq('certificate_number', certNum)
    .single();

  if (error || !cert) {
    return notFound();
  }

  // We only show verification for ISSUED certificates
  const isIssued = cert.status === 'ISSUED';
  const isRevoked = cert.status === 'REVOKED';

  return (
    <div className="min-h-screen bg-[#080D1A] relative font-sans flex flex-col text-white">
      <PublicHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl backdrop-blur-lg">
          
          {isIssued && (
            <>
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <ShieldCheck className="w-12 h-12 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-black text-emerald-400 mb-2 tracking-tight">CERTIFICATE VERIFIED</h1>
              <p className="text-emerald-400/80 mb-8 font-bold text-lg">گواهی معتبر و تایید شده است</p>
            </>
          )}

          {isRevoked && (
            <>
              <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              <h1 className="text-3xl font-black text-red-400 mb-2 tracking-tight">CERTIFICATE REVOKED</h1>
              <p className="text-red-400/80 mb-8 font-bold text-lg">این گواهی باطل شده است</p>
            </>
          )}

          {!isIssued && !isRevoked && (
            <>
              <div className="w-24 h-24 rounded-full bg-slate-500/20 border border-slate-500/50 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-slate-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-400 mb-2 tracking-tight">CERTIFICATE INVALID</h1>
              <p className="text-slate-400/80 mb-8 font-bold text-lg">وضعیت گواهی نامشخص است</p>
            </>
          )}

          <div className="bg-black/40 rounded-2xl p-6 text-left space-y-4 border border-white/5">
            <div>
              <span className="block text-xs text-white/50 uppercase tracking-widest mb-1">Certificate No</span>
              <span className="font-mono text-amber-400 text-lg">{cert.certificate_number}</span>
            </div>

            <div>
              <span className="block text-xs text-white/50 uppercase tracking-widest mb-1">Recipient Name</span>
              <span className="font-bold text-white text-lg block">{cert.recipient_name_en}</span>
              <span className="text-white/70 block" dir="rtl">{cert.recipient_name_fa}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-4">
              <div>
                <span className="block text-xs text-white/50 uppercase tracking-widest mb-1">Baptism Date</span>
                <span className="font-bold text-white block">{cert.baptism_date || "---"}</span>
              </div>
              <div>
                <span className="block text-xs text-white/50 uppercase tracking-widest mb-1">Minister</span>
                <span className="font-bold text-white block">{cert.minister_name_en || "---"}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
              <span className="block text-xs text-white/50 uppercase tracking-widest mb-1">Issuing Church</span>
              <span className="font-bold text-white block">{cert.church_name_en}</span>
              <span className="text-white/70 block" dir="rtl">{cert.church_name_fa}</span>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
