"use server";

import { createAdminClient, createClient } from "@/utils/supabase/server";
import { getAccessContext, hasAdminRoleOrPermission } from "@/lib/access-control";
import { logUserActivity } from "@/actions/audit";
import { revalidatePath } from "next/cache";

export interface ScannedDocument {
    id: string;
    title: string;
    category: 'baptism' | 'marriage' | 'letter' | 'invoice' | 'identity' | 'contract' | 'archive' | string;
    security_level: 'top_secret' | 'confidential' | 'restricted' | 'normal' | string;
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    scanner_source: 'hardware_escl' | 'camera_scanner' | 'file_upload' | string;
    ocr_text: string | null;
    ocr_summary: string | null;
    ocr_metadata: Record<string, any>;
    ocr_status: 'none' | 'processing' | 'completed' | 'failed';
    tags: string[];
    uploaded_by: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;
    deleted_by: string | null;
    signed_download_url?: string;
}

export interface DocumentStats {
    totalDocuments: number;
    confidentialCount: number;
    topSecretCount: number;
    ocrProcessedCount: number;
    totalSizeBytes: number;
    categories: Record<string, number>;
}

/**
 * Ensures user has authorization to view or manage sacred church documents
 */
async function ensureDocumentAccess(): Promise<{ authorized: boolean; userEmail?: string; role?: string; isAdmin: boolean }> {
    const context = await getAccessContext();
    const isAdmin = context.role === 'Admin';
    const hasPermission = isAdmin || context.permissions?.canManageDocuments === true || context.permissions?.canManageDocumentRequests === true;

    return {
        authorized: hasPermission,
        userEmail: context.email || 'system@iranianchurchdc.com',
        role: context.role || 'User',
        isAdmin
    };
}

/**
 * Fetches active scanned documents with filtering, full-text search, and signed temporary URLs
 */
export async function getScannedDocuments(options?: {
    category?: string;
    securityLevel?: string;
    search?: string;
    limit?: number;
    offset?: number;
}): Promise<{ documents: ScannedDocument[]; totalCount: number }> {
    try {
        const { authorized } = await ensureDocumentAccess();
        if (!authorized) {
            throw new Error("شما مجوز دسترسی به بایگانی امن اسناد را ندارید.");
        }

        const adminSupabase = await createAdminClient();
        let query = adminSupabase
            .from('scanned_documents')
            .select('*', { count: 'exact' })
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        if (options?.category && options.category !== 'all') {
            query = query.eq('category', options.category);
        }

        if (options?.securityLevel && options.securityLevel !== 'all') {
            query = query.eq('security_level', options.securityLevel);
        }

        if (options?.search && options.search.trim()) {
            const term = options.search.trim();
            query = query.or(`title.ilike.%${term}%,ocr_text.ilike.%${term}%,ocr_summary.ilike.%${term}%,file_name.ilike.%${term}%`);
        }

        if (options?.limit) {
            const offset = options.offset || 0;
            query = query.range(offset, offset + options.limit - 1);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[ScannedDocuments] Fetch error:', error.message);
            return { documents: [], totalCount: 0 };
        }

        // Generate secure temporary signed URLs (1 hour validity) for each document
        const docsWithSignedUrls: ScannedDocument[] = await Promise.all(
            (data || []).map(async (doc: any) => {
                let signedUrl = doc.file_url;
                try {
                    if (doc.file_url && !doc.file_url.startsWith('http')) {
                        const { data: signedData } = await adminSupabase.storage
                            .from('secure-documents')
                            .createSignedUrl(doc.file_url, 3600);
                        if (signedData?.signedUrl) {
                            signedUrl = signedData.signedUrl;
                        }
                    }
                } catch (signErr) {
                    console.warn('[ScannedDocuments] Failed to sign URL for doc:', doc.id, signErr);
                }

                return {
                    ...doc,
                    signed_download_url: signedUrl
                };
            })
        );

        return {
            documents: docsWithSignedUrls,
            totalCount: count || docsWithSignedUrls.length
        };
    } catch (err: any) {
        console.error('[ScannedDocuments] Exception in getScannedDocuments:', err);
        return { documents: [], totalCount: 0 };
    }
}

/**
 * Uploads a scanned document file to the private 'secure-documents' bucket,
 * records it in the database, and logs the secure activity in audit_logs.
 */
export async function saveScannedDocument(payload: {
    title: string;
    category: string;
    security_level: string;
    scanner_source: string;
    fileBase64?: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    ocr_text?: string;
    ocr_summary?: string;
    ocr_metadata?: Record<string, any>;
    ocr_status?: 'none' | 'completed' | 'failed';
    tags?: string[];
}): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
        const { authorized, userEmail, role } = await ensureDocumentAccess();
        if (!authorized) {
            return { success: false, error: "عدم دسترسی به ثبت سند" };
        }

        const adminSupabase = await createAdminClient();

        let storagePath = payload.fileName;
        // Upload to private secure-documents bucket
        if (payload.fileBase64) {
            const cleanBase64 = payload.fileBase64.replace(/^data:[^;]+;base64,/, '');
            const buffer = Buffer.from(cleanBase64, 'base64');
            const fileExt = payload.fileName.split('.').pop() || 'jpg';
            const timestamp = Date.now();
            const safeFileName = payload.fileName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
            storagePath = `${payload.category}/${timestamp}_${safeFileName}`;

            const { error: uploadErr } = await adminSupabase.storage
                .from('secure-documents')
                .upload(storagePath, buffer, {
                    contentType: payload.mimeType || 'image/jpeg',
                    upsert: true
                });

            if (uploadErr) {
                console.error('[ScannedDocuments] Storage upload error:', uploadErr.message);
                return { success: false, error: `خطا در ذخیره فایل امن: ${uploadErr.message}` };
            }
        }

        // Insert database record
        const { data: newDoc, error: insertErr } = await adminSupabase
            .from('scanned_documents')
            .insert({
                title: payload.title || 'سند بدون عنوان',
                category: payload.category || 'archive',
                security_level: payload.security_level || 'confidential',
                file_url: storagePath,
                file_name: payload.fileName,
                file_size: payload.fileSize || 0,
                mime_type: payload.mimeType || 'image/jpeg',
                scanner_source: payload.scanner_source || 'file_upload',
                ocr_text: payload.ocr_text || null,
                ocr_summary: payload.ocr_summary || null,
                ocr_metadata: payload.ocr_metadata || {},
                ocr_status: payload.ocr_status || (payload.ocr_text ? 'completed' : 'none'),
                tags: payload.tags || [],
                uploaded_by: userEmail,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_deleted: false
            })
            .select()
            .single();

        if (insertErr) {
            console.error('[ScannedDocuments] Database insert error:', insertErr.message);
            return { success: false, error: `خطا در ثبت سند در پایگاه داده: ${insertErr.message}` };
        }

        // Log audit activity
        await logUserActivity({
            action: 'DOCUMENT_SCAN_UPLOAD',
            resourceType: 'document',
            resourceId: newDoc.id,
            details: {
                title: newDoc.title,
                category: newDoc.category,
                security_level: newDoc.security_level,
                scanner_source: newDoc.scanner_source,
                file_name: newDoc.file_name,
                has_ocr: !!payload.ocr_text
            },
            userOverride: {
                email: userEmail,
                role: role
            }
        });

        revalidatePath('/admin/documents');
        revalidatePath('/admin/documents/scanner');
        revalidatePath('/admin/audit-logs');

        return { success: true, documentId: newDoc.id };
    } catch (err: any) {
        console.error('[ScannedDocuments] Save exception:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Updates document metadata, title, tags, or OCR details
 */
export async function updateScannedDocument(
    id: string,
    updates: {
        title?: string;
        category?: string;
        security_level?: string;
        ocr_text?: string;
        ocr_summary?: string;
        tags?: string[];
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const { authorized, userEmail } = await ensureDocumentAccess();
        if (!authorized) {
            return { success: false, error: "عدم مجوز برای ویرایش سند" };
        }

        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('scanned_documents')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        await logUserActivity({
            action: 'DOCUMENT_METADATA_UPDATED',
            resourceType: 'document',
            resourceId: id,
            details: updates,
            userOverride: { email: userEmail }
        });

        revalidatePath('/admin/documents/scanner');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Soft deletes a scanned document and sends it to the trash bin for safe recovery
 */
export async function softDeleteScannedDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { authorized, userEmail } = await ensureDocumentAccess();
        if (!authorized) {
            return { success: false, error: "شما دسترسی لازم برای حذف سند را ندارید." };
        }

        const adminSupabase = await createAdminClient();
        const { data: doc, error } = await adminSupabase
            .from('scanned_documents')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: userEmail
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        await logUserActivity({
            action: 'DOCUMENT_SOFT_DELETED',
            resourceType: 'document',
            resourceId: id,
            details: {
                title: doc?.title,
                category: doc?.category,
                security_level: doc?.security_level
            },
            userOverride: { email: userEmail }
        });

        revalidatePath('/admin/documents/scanner');
        revalidatePath('/admin/trash');
        revalidatePath('/admin/audit-logs');

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Restores a soft-deleted document back to the active archive
 */
export async function restoreScannedDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { authorized, userEmail } = await ensureDocumentAccess();
        if (!authorized) {
            return { success: false, error: "عدم مجوز برای بازیابی سند" };
        }

        const adminSupabase = await createAdminClient();
        const { data: doc, error } = await adminSupabase
            .from('scanned_documents')
            .update({
                is_deleted: false,
                deleted_at: null,
                deleted_by: null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        await logUserActivity({
            action: 'DOCUMENT_RESTORED',
            resourceType: 'document',
            resourceId: id,
            details: { title: doc?.title },
            userOverride: { email: userEmail }
        });

        revalidatePath('/admin/documents/scanner');
        revalidatePath('/admin/trash');
        revalidatePath('/admin/audit-logs');

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Permanently deletes a document from storage and database.
 * RESTRICTED: Admin only. Requires secondary verification.
 */
export async function permanentDeleteScannedDocument(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { isAdmin, userEmail } = await ensureDocumentAccess();
        if (!isAdmin) {
            return { success: false, error: "تنها ادمین اصلی مجاز به پاکسازی دائمی اسناد است." };
        }

        const adminSupabase = await createAdminClient();

        // 1. Fetch document to delete file from storage
        const { data: doc } = await adminSupabase
            .from('scanned_documents')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (doc && doc.file_url) {
            try {
                await adminSupabase.storage
                    .from('secure-documents')
                    .remove([doc.file_url]);
            } catch (storageErr) {
                console.warn('[ScannedDocuments] Storage removal warning:', storageErr);
            }
        }

        // 2. Delete database record
        const { error } = await adminSupabase
            .from('scanned_documents')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        await logUserActivity({
            action: 'DOCUMENT_PERMANENT_DELETE',
            resourceType: 'document',
            resourceId: id,
            details: {
                title: doc?.title,
                file_name: doc?.file_name,
                security_level: doc?.security_level
            },
            userOverride: { email: userEmail }
        });

        revalidatePath('/admin/documents/scanner');
        revalidatePath('/admin/trash');
        revalidatePath('/admin/audit-logs');

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Aggregates statistics for the documents dashboard
 */
export async function getDocumentStats(): Promise<DocumentStats> {
    try {
        const adminSupabase = await createAdminClient();
        const { data, error } = await adminSupabase
            .from('scanned_documents')
            .select('category, security_level, file_size, ocr_status')
            .eq('is_deleted', false);

        if (error || !data) {
            return {
                totalDocuments: 0,
                confidentialCount: 0,
                topSecretCount: 0,
                ocrProcessedCount: 0,
                totalSizeBytes: 0,
                categories: {}
            };
        }

        let confidentialCount = 0;
        let topSecretCount = 0;
        let ocrProcessedCount = 0;
        let totalSizeBytes = 0;
        const categories: Record<string, number> = {};

        data.forEach((doc: any) => {
            if (doc.security_level === 'confidential') confidentialCount++;
            if (doc.security_level === 'top_secret') topSecretCount++;
            if (doc.ocr_status === 'completed') ocrProcessedCount++;
            totalSizeBytes += Number(doc.file_size) || 0;

            const cat = doc.category || 'archive';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        return {
            totalDocuments: data.length,
            confidentialCount,
            topSecretCount,
            ocrProcessedCount,
            totalSizeBytes,
            categories
        };
    } catch (err) {
        console.error('[ScannedDocuments] Stats error:', err);
        return {
            totalDocuments: 0,
            confidentialCount: 0,
            topSecretCount: 0,
            ocrProcessedCount: 0,
            totalSizeBytes: 0,
            categories: {}
        };
    }
}
