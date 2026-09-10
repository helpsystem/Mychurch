"use server";

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { hasAdminRoleOrPermission } from "@/lib/access-control";
import { logUserActivity } from "@/actions/audit";

export type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    last_active: string;
    permissions: Record<string, boolean>;
    telegram_id?: string;
};

async function canManageUsers(): Promise<boolean> {
    return hasAdminRoleOrPermission(["canManageUsers"]);
}

export async function getUsers(): Promise<UserRow[]> {
    if (!(await canManageUsers())) {
        return [];
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('last_active', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => {
            const displayName = row.name || row.full_name || (row.email ? row.email.split('@')[0] : 'Unknown User');
            const lastActiveDate = row.last_active ? new Date(row.last_active) : null;

            return {
                id: row.id,
                name: displayName,
                email: row.email || '',
                role: row.role || 'User',
                last_active: lastActiveDate && !Number.isNaN(lastActiveDate.getTime())
                    ? lastActiveDate.toLocaleString()
                    : 'Never',
                permissions: row.permissions || {},
                telegram_id: row.telegram_id || ''
            } satisfies UserRow;
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

export async function updateUserRole(id: string, newRole: string) {
    if (!(await canManageUsers())) {
        return false;
    }

    try {
        const adminSupabase = await createAdminClient();
        
        // Fetch current user details
        const { data: targetUser } = await adminSupabase
            .from('users')
            .select('email, role, name')
            .eq('id', id)
            .maybeSingle();

        const oldRole = targetUser?.role || 'Unknown';

        const { error } = await adminSupabase
            .from('users')
            .update({ role: newRole })
            .eq('id', id);

        if (error) throw error;

        // Log role change in audit_logs
        await logUserActivity({
            action: 'UPDATE_USER_ROLE',
            resourceType: 'user',
            resourceId: id,
            details: {
                targetEmail: targetUser?.email,
                targetName: targetUser?.name,
                oldRole,
                newRole
            }
        });

        revalidatePath('/admin/users');
        revalidatePath('/admin/audit-logs');
        return true;
    } catch (error) {
        console.error("Failed to update user role:", error);
        return false;
    }
}

export async function updateUserTelegramId(id: string, telegram_id: string) {
    if (!(await canManageUsers())) {
        return false;
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('users')
            .update({ telegram_id })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/users');
        return true;
    } catch (error) {
        console.error("Failed to update user telegram id:", error);
        return false;
    }
}

export async function updateUserPermissions(id: string, permissions: Record<string, boolean>) {
    if (!(await canManageUsers())) {
        return false;
    }

    try {
        const adminSupabase = await createAdminClient();

        const { data: targetUser } = await adminSupabase
            .from('users')
            .select('email, role, name')
            .eq('id', id)
            .maybeSingle();

        const { error } = await adminSupabase
            .from('users')
            .update({ permissions })
            .eq('id', id);

        if (error) throw error;

        await logUserActivity({
            action: 'UPDATE_USER_PERMISSIONS',
            resourceType: 'user',
            resourceId: id,
            details: {
                targetEmail: targetUser?.email,
                targetName: targetUser?.name,
                permissions
            }
        });

        revalidatePath('/admin/users');
        revalidatePath('/admin/audit-logs');
        return true;
    } catch (error) {
        console.error("Failed to update user permissions:", error);
        return false;
    }
}

export async function deleteUser(id: string) {
    if (!(await canManageUsers())) {
        return false;
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/users');
        return true;
    } catch (error) {
        console.error("Failed to delete user:", error);
        return false;
    }
}
