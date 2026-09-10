"use server";

import { createAdminClient, createClient } from "@/utils/supabase/server";
import { getAccessContext, hasAdminRoleOrPermission } from "@/lib/access-control";
import { revalidatePath } from "next/cache";

export interface AuditLogItem {
    id: string;
    user_id: string | null;
    user_email: string | null;
    user_name: string | null;
    user_role: string | null;
    action: string;
    resource_type: string;
    resource_id: string | null;
    details: Record<string, any>;
    ip_address: string | null;
    created_at: string;
}

export type AuditAction = 
    | 'UPLOAD_MEDIA'
    | 'TRASH_MEDIA'
    | 'RESTORE_MEDIA'
    | 'PERMANENT_DELETE_MEDIA'
    | 'RENAME_MEDIA'
    | 'MOVE_MEDIA'
    | 'SAVE_PRESENTATION'
    | 'TRASH_PRESENTATION'
    | 'RESTORE_PRESENTATION'
    | 'PERMANENT_DELETE_PRESENTATION'
    | 'EXPORT_TELEGRAM'
    | 'ADD_PRAYER'
    | 'TRASH_PRAYER'
    | 'RESTORE_PRAYER'
    | 'PERMANENT_DELETE_PRAYER'
    | 'UPDATE_USER_ROLE'
    | 'LOGIN'
    | 'LOGOUT'
    | string;

export async function logUserActivity(params: {
    action: AuditAction;
    resourceType: 'media' | 'presentation' | 'prayer' | 'user' | 'worship' | 'system' | string;
    resourceId?: string | null;
    details?: Record<string, any>;
    userOverride?: {
        id?: string;
        email?: string;
        name?: string;
        role?: string;
    };
}): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
        let userEmail = params.userOverride?.email || null;
        let userName = params.userOverride?.name || null;
        let userRole = params.userOverride?.role || null;
        let userId = params.userOverride?.id || null;

        if (!userEmail) {
            try {
                const ctx = await getAccessContext();
                if (ctx.authenticated && ctx.email) {
                    userEmail = ctx.email;
                    userRole = ctx.role || 'User';
                    userName = userEmail.split('@')[0];
                }
            } catch (e) {
                // Ignore context extraction error
            }
        }

        if (!userEmail) {
            try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) {
                    userEmail = user.email;
                    userId = user.id;
                    userName = user.user_metadata?.full_name || user.email.split('@')[0];
                    userRole = userRole || 'User';
                }
            } catch {
                // Guest or background process
            }
        }

        const adminSupabase = await createAdminClient();
        const { data, error } = await adminSupabase
            .from('audit_logs')
            .insert({
                user_id: userId,
                user_email: userEmail || 'anonymous@iranianchurchdc.com',
                user_name: userName || (userEmail ? userEmail.split('@')[0] : 'اپراتور سیستم'),
                user_role: userRole || 'Operator',
                action: params.action,
                resource_type: params.resourceType,
                resource_id: params.resourceId || null,
                details: params.details || {},
            })
            .select('id')
            .single();

        if (error) {
            console.error('[Audit Log] Failed to insert log:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, logId: data?.id };
    } catch (err: any) {
        console.error('[Audit Log Exception]:', err?.message);
        return { success: false, error: err?.message };
    }
}

export async function getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userEmail?: string;
    action?: string;
    resourceType?: string;
    search?: string;
}): Promise<{ logs: AuditLogItem[]; totalCount: number; page: number; totalPages: number }> {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(100, Math.max(10, params?.limit || 30));
    const offset = (page - 1) * limit;

    try {
        const adminSupabase = await createAdminClient();
        let query = adminSupabase
            .from('audit_logs')
            .select('*', { count: 'exact' });

        if (params?.userEmail) {
            query = query.ilike('user_email', `%${params.userEmail}%`);
        }

        if (params?.action && params.action !== 'all') {
            query = query.eq('action', params.action);
        }

        if (params?.resourceType && params.resourceType !== 'all') {
            query = query.eq('resource_type', params.resourceType);
        }

        if (params?.search && params.search.trim()) {
            const s = params.search.trim();
            query = query.or(`user_email.ilike.%${s}%,user_name.ilike.%${s}%,action.ilike.%${s}%,resource_id.ilike.%${s}%`);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[Audit Log] Error fetching logs:', error.message);
            return { logs: [], totalCount: 0, page, totalPages: 1 };
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / limit) || 1;

        return {
            logs: (data || []) as AuditLogItem[],
            totalCount,
            page,
            totalPages
        };
    } catch (err) {
        console.error('[Audit Log] Exception in getAuditLogs:', err);
        return { logs: [], totalCount: 0, page, totalPages: 1 };
    }
}

export async function getAuditStats(): Promise<{
    todayCount: number;
    totalCount: number;
    trashCount: number;
    uniqueUsersCount: number;
}> {
    try {
        const adminSupabase = await createAdminClient();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
            { count: totalCount },
            { count: todayCount },
            { count: trashCount },
        ] = await Promise.all([
            adminSupabase.from('audit_logs').select('*', { count: 'exact', head: true }),
            adminSupabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
            adminSupabase.from('media_library').select('*', { count: 'exact', head: true }).eq('is_deleted', true),
        ]);

        return {
            totalCount: totalCount || 0,
            todayCount: todayCount || 0,
            trashCount: trashCount || 0,
            uniqueUsersCount: 0
        };
    } catch (e) {
        return { totalCount: 0, todayCount: 0, trashCount: 0, uniqueUsersCount: 0 };
    }
}
