/**
 * Document Types — shared (no server dependency)
 * Safe to import in Server and Client components.
 */

export type DocumentType = 'letter' | 'receipt' | 'invoice' | 'membership' | 'generic';

export interface DocumentHistoryData {
  document_type: DocumentType;
  title: string;
  description?: string;
  template_name?: string;
  document_content: Record<string, any>;
  recipient_name?: string;
  recipient_email?: string;
  recipient_address?: string;
  tags?: string[];
  is_draft?: boolean;
  verification_qr_data?: string;
  church_seal_image_url?: string;
  notes?: string;
}
