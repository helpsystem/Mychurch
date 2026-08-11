import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import VerificationClient from './VerificationClient';

export default async function VerifyCertificatePage({ params }: { params: { certificateNumber: string } }) {
  const supabase = await createClient();
  const certNum = params.certificateNumber;

  const { data: cert, error } = await supabase
    .from('baptism_certificates')
    .select('*')
    .eq('certificate_number', certNum)
    .single();

  if (error || !cert) {
    return (
      <div className="min-h-screen font-sans flex flex-col">
        <PublicHeader />
        <VerificationClient status="INVALID" />
        <PublicFooter />
      </div>
    );
  }

  const isIssued = cert.status === 'ISSUED';
  const isRevoked = cert.status === 'REVOKED';

  const status = isIssued ? 'ISSUED' : isRevoked ? 'REVOKED' : 'INVALID';

  return (
    <div className="min-h-screen bg-[#080D1A] relative font-sans flex flex-col text-white">
      <PublicHeader />
      
      <main className="flex-1">
        <VerificationClient cert={cert} status={status} />
      </main>

      <PublicFooter />
    </div>
  );
}
