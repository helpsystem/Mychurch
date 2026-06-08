'use server';

import { createClient } from '@/utils/supabase/server';
import type { DocumentType, DocumentHistoryData } from '@/types/documents';


/**
 * Save a document to the database (replaces localStorage)
 * @param document - Document object to save
 * @param isDraft - Whether to save as draft (prevents auto-finalization)
 * @returns Inserted document object with ID, or error
 */
export async function saveDocument(
  document: DocumentHistoryData,
  isDraft: boolean = true
) {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Verify user role (Admins, Leaders, or users with canManageDocuments)
    const { data: userRecord, error: roleError } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('email', user.email)
      .single();

    if (roleError || !userRecord) {
      return { error: 'Forbidden', status: 403 };
    }
    
    const canManage = userRecord.role === 'Admin' || userRecord.role === 'Leader' || userRecord.permissions?.canManageDocuments;
    if (!canManage) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    // Insert document
    const { data: insertedDocument, error: insertError } = await supabase
      .from('document_history')
      .insert({
        user_id: user.email,
        document_type: document.document_type,
        title: document.title,
        description: document.description,
        template_name: document.template_name,
        document_content: document.document_content,
        recipient_name: document.recipient_name,
        recipient_email: document.recipient_email,
        recipient_address: document.recipient_address,
        tags: document.tags || [],
        is_draft: isDraft,
        verification_qr_data: document.verification_qr_data,
        church_seal_image_url: document.church_seal_image_url,
        notes: document.notes,
      })
      .select();

    if (insertError) {
      console.error('Error saving document:', insertError);
      return { error: 'Failed to save document', status: 500 };
    }

    // Log to audit table
    if (insertedDocument?.[0]) {
      await supabase
        .from('document_audit_log')
        .insert({
          document_id: insertedDocument[0].id,
          action: isDraft ? 'created' : 'created', // Can be extended to track draft→final transitions
          changed_by: user.email,
          change_details: { created_from: 'web_form' },
        })
        .then();
    }

    return { data: insertedDocument?.[0], error: null };
  } catch (err) {
    console.error('Unexpected error in saveDocument:', err);
    return { error: 'Unexpected error', status: 500 };
  }
}

/**
 * Get all documents for the current user (paginated)
 * @param page - Page number (starts at 1)
 * @param limit - Items per page
 * @param filters - Optional filters
 */
export async function getDocuments(
  page: number = 1,
  limit: number = 20,
  filters?: {
    document_type?: DocumentType;
    tags?: string[];
    is_draft?: boolean;
  }
) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Verify Admin/Leader role
    const { data: userRecord, error: roleError } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('email', user.email)
      .single();

    if (roleError || !userRecord) {
      return { error: 'Forbidden', status: 403 };
    }
    
    const canManage = userRecord.role === 'Admin' || userRecord.role === 'Leader' || userRecord.permissions?.canManageDocuments;
    if (!canManage) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    let query = supabase
      .from('document_history')
      .select('*', { count: 'exact' })
      .filter('deleted_at', 'is', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.document_type) {
      query = query.eq('document_type', filters.document_type);
    }
    if (filters?.is_draft !== undefined) {
      query = query.eq('is_draft', filters.is_draft);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    // Pagination
    const offset = (page - 1) * limit;
    const { data: documents, count, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching documents:', error);
      return { error: 'Failed to fetch documents', status: 500 };
    }

    return { 
      data: {
        documents,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
      error: null 
    };
  } catch (err) {
    console.error('Unexpected error in getDocuments:', err);
    return { error: 'Unexpected error', status: 500 };
  }
}

/**
 * Update an existing document
 * @param documentId - Document UUID
 * @param updates - Partial document updates
 */
export async function updateDocument(
  documentId: string,
  updates: Partial<DocumentHistoryData>
) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    // Verify Admin/Leader role
    const { data: userRecord } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('email', user.email)
      .single();

    if (!userRecord) {
      return { error: 'Forbidden', status: 403 };
    }
    
    const canManage = userRecord.role === 'Admin' || userRecord.role === 'Leader' || userRecord.permissions?.canManageDocuments;
    if (!canManage) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    // Verify document ownership/access
    const { data: existingDoc, error: fetchError } = await supabase
      .from('document_history')
      .select('id')
      .eq('id', documentId)
      .single();

    if (fetchError || !existingDoc) {
      return { error: 'Document not found', status: 404 };
    }

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('document_history')
      .update(updates)
      .eq('id', documentId)
      .select();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return { error: 'Failed to update document', status: 500 };
    }

    // Log audit
    await supabase
      .from('document_audit_log')
      .insert({
        document_id: documentId,
        action: 'updated',
        changed_by: user.email,
        change_details: updates,
      })
      .then();

    return { data: updatedDocument?.[0], error: null };
  } catch (err) {
    console.error('Unexpected error in updateDocument:', err);
    return { error: 'Unexpected error', status: 500 };
  }
}

/**
 * Mark document as finalized (not a draft)
 * @param documentId - Document UUID
 */
export async function finalizeDocument(documentId: string) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('email', user.email)
      .single();

    if (!userRecord) {
      return { error: 'Forbidden', status: 403 };
    }

    const canManage = userRecord.role === 'Admin' || userRecord.role === 'Leader' || userRecord.permissions?.canManageDocuments;
    if (!canManage) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    const { data: updated, error } = await supabase
      .from('document_history')
      .update({ is_draft: false })
      .eq('id', documentId)
      .select();

    if (error) {
      return { error: 'Failed to finalize', status: 500 };
    }

    // Log audit
    await supabase
      .from('document_audit_log')
      .insert({
        document_id: documentId,
        action: 'draft_to_final',
        changed_by: user.email,
        change_details: { finalized_at: new Date().toISOString() },
      })
      .then();

    return { data: updated?.[0], error: null };
  } catch (err) {
    console.error('Unexpected error in finalizeDocument:', err);
    return { error: 'Unexpected error', status: 500 };
  }
}

/**
 * Soft delete a document
 * @param documentId - Document UUID
 */
export async function deleteDocument(documentId: string) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    const { data: userRecord } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('email', user.email)
      .single();

    if (!userRecord) {
      return { error: 'Forbidden', status: 403 };
    }

    const canManage = userRecord.role === 'Admin' || userRecord.role === 'Leader' || userRecord.permissions?.canManageDocuments;
    if (!canManage) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    const { data: deleted, error } = await supabase
      .from('document_history')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', documentId)
      .select();

    if (error) {
      return { error: 'Failed to delete', status: 500 };
    }

    // Log audit
    await supabase
      .from('document_audit_log')
      .insert({
        document_id: documentId,
        action: 'deleted',
        changed_by: user.email,
        change_details: { deleted_at: new Date().toISOString() },
      })
      .then();

    return { data: deleted?.[0], error: null };
  } catch (err) {
    console.error('Unexpected error in deleteDocument:', err);
    return { error: 'Unexpected error', status: 500 };
  }
}

/**
 * Get all documents issued to the current logged-in user
 */
export async function getUserDocuments() {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized', status: 401 };
    }

    const { data: documents, error } = await supabase
      .from('document_history')
      .select('*')
      .eq('recipient_email', user.email)
      .filter('deleted_at', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user documents:', error);
      return { error: 'Failed to fetch documents', status: 500 };
    }

    return { data: documents, error: null };
  } catch (err) {
    console.error('Unexpected error in getUserDocuments:', err);
    return { error: 'Unexpected error', status: 500 };
  }
}
