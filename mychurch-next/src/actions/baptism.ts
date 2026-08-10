'use server';

import { createClient } from '@/utils/supabase/server';
import type { CertificateData } from '@/app/admin/documents/CertificateTemplate';

export async function getBaptismCertificates(page: number = 1, limit: number = 20) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const offset = (page - 1) * limit;
  const { data: certificates, count, error } = await supabase
    .from('baptism_certificates')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { error: error.message, status: 500 };

  return {
    data: {
      certificates,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    },
    error: null
  };
}

export async function createBaptismCertificate(data: Partial<CertificateData> & { status?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: inserted, error } = await supabase
    .from('baptism_certificates')
    .insert({
      ...data,
      created_by: user.id
    })
    .select()
    .single();

  if (error) return { error: error.message, status: 500 };
  return { data: inserted, error: null };
}

export async function updateBaptismCertificate(id: string, updates: Partial<CertificateData> & { status?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: updated, error } = await supabase
    .from('baptism_certificates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message, status: 500 };
  return { data: updated, error: null };
}

export async function getBaptismSettings() {
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from('certificate_settings')
    .select('*')
    .limit(1)
    .single();

  // Return default empty object if not found (RLS might block or empty table)
  if (error) return { data: null, error: error.message };
  return { data: settings, error: null };
}

export async function updateBaptismSettings(updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  // Just fetch the ID first to update it
  const { data: existing } = await supabase.from('certificate_settings').select('id').limit(1).single();

  if (existing) {
    const { error } = await supabase.from('certificate_settings').update(updates).eq('id', existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('certificate_settings').insert(updates);
    if (error) return { error: error.message };
  }
  return { error: null };
}
