"use server";

import { createAdminClient, createClient } from "@/utils/supabase/server";
import { getAccessContext, hasAdminRoleOrPermission } from "@/lib/access-control";
import { logUserActivity } from "@/actions/audit";
import { revalidatePath } from "next/cache";

export interface TrashedItem {
    id: string;
    resourceType: 'media' | 'presentation' | 'prayer';
    title: string;
    deletedAt: string;
    deletedBy: string | null;
    meta?: Record<string, any>;
    previewUrl?: string;
}

export async function getTrashedItems(filter: 'all' | 'media' | 'presentation' | 'prayer' = 'all'): Promise<TrashedItem[]> {
    try {
        const adminSupabase = await createAdminClient();
        const items: TrashedItem[] = [];

        // 1. Trashed Media
        if (filter === 'all' || filter === 'media') {
            const { data: media } = await adminSupabase
                .from('media_library')
                .select('*')
                .eq('is_deleted', true)
                .order('deleted_at', { ascending: false });

            if (media) {
                media.forEach((m: any) => {
                    items.push({
                        id: m.id,
                        resourceType: 'media',
                        title: m.file_name,
                        deletedAt: m.deleted_at || m.created_at,
                        deletedBy: m.deleted_by,
                        previewUrl: `/api/serve/cloud/${m.id}`,
                        meta: {
                            size: m.size,
                            mimeType: m.mime_type,
                            telegram_message_id: m.telegram_message_id,
                            folder: m.folder
                        }
                    });
                });
            }
        }

        // 2. Trashed Presentations
        if (filter === 'all' || filter === 'presentation') {
            const { data: presentations } = await adminSupabase
                .from('presentations')
                .select('*')
                .eq('is_deleted', true)
                .order('deleted_at', { ascending: false });

            if (presentations) {
                presentations.forEach((p: any) => {
                    items.push({
                        id: p.id,
                        resourceType: 'presentation',
                        title: p.title || 'بدون عنوان',
                        deletedAt: p.deleted_at || p.created_at,
                        deletedBy: p.deleted_by,
                        meta: {
                            date: p.date,
                            host: p.host_name,
                            slidesCount: Array.isArray(p.slides) ? p.slides.length : (Array.isArray(p.slides_json) ? p.slides_json.length : 0)
                        }
                    });
                });
            }
        }

        // 3. Trashed Prayers
        if (filter === 'all' || filter === 'prayer') {
            const { data: prayers } = await adminSupabase
                .from('prayer_requests')
                .select('*')
                .eq('is_deleted', true)
                .order('deleted_at', { ascending: false });

            if (prayers) {
                prayers.forEach((pr: any) => {
                    items.push({
                        id: pr.id,
                        resourceType: 'prayer',
                        title: pr.user_name ? `${pr.user_name}: ${pr.title || pr.content}` : pr.content,
                        deletedAt: pr.deleted_at || pr.created_at,
                        deletedBy: pr.deleted_by,
                        meta: {
                            userName: pr.user_name,
                            content: pr.content,
                            prayedCount: pr.prayed_count
                        }
                    });
                });
            }
        }

        // Sort all descending by deletedAt
        return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    } catch (err) {
        console.error('[Trash] Failed to fetch trashed items:', err);
        return [];
    }
}

export async function restoreItem(resourceType: 'media' | 'presentation' | 'prayer', id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const adminSupabase = await createAdminClient();
        let table = '';
        if (resourceType === 'media') table = 'media_library';
        else if (resourceType === 'presentation') table = 'presentations';
        else if (resourceType === 'prayer') table = 'prayer_requests';
        else return { success: false, error: 'Invalid resource type' };

        const { data, error } = await adminSupabase
            .from(table)
            .update({
                is_deleted: false,
                deleted_at: null,
                deleted_by: null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[Trash] Restore error:', error.message);
            return { success: false, error: error.message };
        }

        // Log restore event
        const title = data?.file_name || data?.title || id;
        await logUserActivity({
            action: `RESTORE_${resourceType.toUpperCase()}` as any,
            resourceType,
            resourceId: id,
            details: { title, restored_at: new Date().toISOString() }
        });

        revalidatePath('/admin/trash');
        revalidatePath('/admin/media');
        revalidatePath('/admin/presentations');
        revalidatePath('/broadcast');

        return { success: true };
    } catch (err: any) {
        console.error('[Trash] Restore exception:', err);
        return { success: false, error: err.message };
    }
}

export async function permanentlyDeleteItem(resourceType: 'media' | 'presentation' | 'prayer', id: string): Promise<{ success: boolean; error?: string }> {
    const isAdmin = await hasAdminRoleOrPermission(['canManageMedia', 'canManageUsers']);
    if (!isAdmin) {
        return { success: false, error: 'تنها ادمین اصلی مجاز به حذف دائمی اطلاعات است.' };
    }

    try {
        const adminSupabase = await createAdminClient();

        if (resourceType === 'media') {
            // Fetch asset to get telegram_message_id
            const { data: asset } = await adminSupabase
                .from('media_library')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (asset && asset.telegram_message_id) {
                try {
                    const { deleteFromTelegramStorage } = await import('@/services/telegram');
                    await deleteFromTelegramStorage(asset.telegram_message_id);
                } catch (tErr) {
                    console.warn('[Trash] Permanent delete from Telegram warning:', tErr);
                }
            }

            // Remove from gallery if linked
            await adminSupabase.from('gallery_images').delete().eq('src', `/api/serve/cloud/${id}`);
            // Remove from media_library
            await adminSupabase.from('media_library').delete().eq('id', id);

            await logUserActivity({
                action: 'PERMANENT_DELETE_MEDIA',
                resourceType: 'media',
                resourceId: id,
                details: { fileName: asset?.file_name, size: asset?.size }
            });
        } else if (resourceType === 'presentation') {
            const { data: pres } = await adminSupabase.from('presentations').select('title').eq('id', id).maybeSingle();
            await adminSupabase.from('presentations').delete().eq('id', id);

            await logUserActivity({
                action: 'PERMANENT_DELETE_PRESENTATION',
                resourceType: 'presentation',
                resourceId: id,
                details: { title: pres?.title }
            });
        } else if (resourceType === 'prayer') {
            await adminSupabase.from('prayer_requests').delete().eq('id', id);

            await logUserActivity({
                action: 'PERMANENT_DELETE_PRAYER',
                resourceType: 'prayer',
                resourceId: id
            });
        }

        revalidatePath('/admin/trash');
        revalidatePath('/admin/media');
        revalidatePath('/admin/presentations');
        return { success: true };
    } catch (err: any) {
        console.error('[Trash] Permanent deletion exception:', err);
        return { success: false, error: err.message };
    }
}
