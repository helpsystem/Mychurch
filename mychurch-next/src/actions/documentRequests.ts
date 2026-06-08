'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DocumentRequestData {
  id?: string;
  user_email: string;
  user_name: string;
  document_type: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Check if the user has permission to manage document requests (Admin, Leader, or custom permission)
 */
async function canManageRequests(userEmail: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: userRecord } = await supabase
    .from('users')
    .select('role, permissions')
    .eq('email', userEmail)
    .single();

  if (!userRecord) return false;
  return (
    userRecord.role === 'Admin' ||
    userRecord.role === 'Leader' ||
    userRecord.permissions?.canManageDocuments === true ||
    userRecord.permissions?.canManageDocumentRequests === true
  );
}

/**
 * Create a new document request
 */
export async function createDocumentRequest(documentType: string, details: string) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's name
    const { data: userRecord } = await supabase
      .from('users')
      .select('name')
      .eq('email', user.email)
      .single();

    const userName = userRecord?.name || user.email?.split('@')[0] || 'Unknown User';

    const { data, error } = await supabase
      .from('document_requests')
      .insert({
        user_email: user.email,
        user_name: userName,
        document_type: documentType,
        details: details,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[DocumentRequests] Create error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/profile');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all requests submitted by the logged-in user
 */
export async function getMyDocumentRequests() {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('document_requests')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DocumentRequests] Fetch my requests error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all document requests for Admin / Authorized Leader
 */
export async function getAllDocumentRequests() {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const hasAccess = await canManageRequests(user.email!);
    if (!hasAccess) {
      return { success: false, error: 'Forbidden' };
    }

    const { data, error } = await supabase
      .from('document_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DocumentRequests] Fetch all requests error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update request status (Approve / Reject)
 */
export async function updateRequestStatus(requestId: string, status: 'approved' | 'rejected', adminNotes?: string) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const hasAccess = await canManageRequests(user.email!);
    if (!hasAccess) {
      return { success: false, error: 'Forbidden' };
    }

    const { data, error } = await supabase
      .from('document_requests')
      .update({
        status,
        admin_notes: adminNotes || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('[DocumentRequests] Update error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/profile');
    revalidatePath('/admin/documents');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
