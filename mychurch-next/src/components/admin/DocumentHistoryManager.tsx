'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  getDocuments,
  saveDocument,
  updateDocument,
  deleteDocument,
  finalizeDocument,
  type DocumentHistoryData,
  type DocumentType,
} from '@/actions/documents';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export interface DocumentHistoryItem {
  id: string;
  user_id: string;
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
  is_verified?: boolean;
  verification_qr_data?: string;
  church_seal_image_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DocumentHistoryManagerProps {
  onHistoryLoaded?: (documents: DocumentHistoryItem[]) => void;
  onHistoryError?: (error: string) => void;
  children?: React.ReactNode;
}

/**
 * Server-Side Document Manager
 * Replaces localStorage with Supabase-backed persistence
 */
export const DocumentHistoryManager = React.forwardRef<
  {
    addToHistory: (doc: DocumentHistoryData) => Promise<DocumentHistoryItem | null>;
    clearHistory: () => Promise<void>;
    removeFromHistory: (docId: string) => Promise<void>;
    refreshHistory: () => Promise<void>;
    getHistory: () => DocumentHistoryItem[];
  },
  DocumentHistoryManagerProps
>(({ onHistoryLoaded, onHistoryError, children }, ref) => {
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load documents from database on mount
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const result = await getDocuments(1, 100);
        if (result.error) {
          console.error('Failed to load documents:', result.error);
          // Fallback to localStorage if DB not available
          const localHistory = localStorage.getItem('church_doc_history');
          if (localHistory) {
            const parsed = JSON.parse(localHistory) as DocumentHistoryItem[];
            setHistory(parsed);
            onHistoryLoaded?.(parsed);
          } else {
            onHistoryError?.(result.error);
          }
        } else if (result.data?.documents) {
          setHistory(result.data.documents as DocumentHistoryItem[]);
          onHistoryLoaded?.(result.data.documents as DocumentHistoryItem[]);
        }
      } catch (err) {
        console.error('Unexpected error loading documents:', err);
        // Fallback fallback
        const localHistory = localStorage.getItem('church_doc_history');
        if (localHistory) {
          try {
            const parsed = JSON.parse(localHistory) as DocumentHistoryItem[];
            setHistory(parsed);
            onHistoryLoaded?.(parsed);
          } catch {
            onHistoryError?.('Failed to load document history');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [onHistoryLoaded, onHistoryError]);

  // Add document to history (save to DB)
  const addToHistory = useCallback(
    async (doc: DocumentHistoryData): Promise<DocumentHistoryItem | null> => {
      try {
        const result = await saveDocument(doc, doc.is_draft ?? true);
        if (result.error) {
          toast.error(result.error);
          return null;
        }

        const newDoc = result.data as DocumentHistoryItem;
        setHistory((prev) => [newDoc, ...prev]);

        // Also update localStorage as fallback
        const updated = [newDoc, ...history];
        localStorage.setItem('church_doc_history', JSON.stringify(updated));

        toast.success('Document saved');
        return newDoc;
      } catch (err) {
        console.error('Error adding to history:', err);
        toast.error('Failed to save document');
        return null;
      }
    },
    [history]
  );

  // Remove document from history (soft delete)
  const removeFromHistory = useCallback(
    async (docId: string): Promise<void> => {
      try {
        const result = await deleteDocument(docId);
        if (result.error) {
          toast.error(result.error);
          return;
        }

        setHistory((prev) => prev.filter((item) => item.id !== docId));

        // Also update localStorage as fallback
        const updated = history.filter((item) => item.id !== docId);
        localStorage.setItem('church_doc_history', JSON.stringify(updated));

        toast.success('Document deleted');
      } catch (err) {
        console.error('Error removing from history:', err);
        toast.error('Failed to delete document');
      }
    },
    [history]
  );

  // Clear entire history
  const clearHistory = useCallback(async (): Promise<void> => {
    try {
      // Delete all documents
      for (const doc of history) {
        if (!doc.deleted_at) {
          const result = await deleteDocument(doc.id);
          if (result.error) {
            console.error('Error deleting document:', doc.id, result.error);
          }
        }
      }

      setHistory([]);
      localStorage.removeItem('church_doc_history');
      toast.success('History cleared');
    } catch (err) {
      console.error('Error clearing history:', err);
      toast.error('Failed to clear history');
    }
  }, [history]);

  // Refresh history from database
  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      const result = await getDocuments(1, 100);
      if (result.error) {
        toast.error('Failed to refresh documents');
        return;
      }

      if (result.data?.documents) {
        const docs = result.data.documents as DocumentHistoryItem[];
        setHistory(docs);
        localStorage.setItem('church_doc_history', JSON.stringify(docs));
        toast.success('History refreshed');
      }
    } catch (err) {
      console.error('Error refreshing history:', err);
      toast.error('Failed to refresh history');
    }
  }, []);

  // Get current history
  const getHistory = useCallback((): DocumentHistoryItem[] => {
    return history;
  }, [history]);

  React.useImperativeHandle(ref, () => ({
    addToHistory,
    clearHistory,
    removeFromHistory,
    refreshHistory,
    getHistory,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading documents...</span>
      </div>
    );
  }

  return <>{children}</>;
});

DocumentHistoryManager.displayName = 'DocumentHistoryManager';
