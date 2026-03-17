"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string;
    last_active: string;
    permissions: Record<string, boolean>;
};

export async function getUsers(): Promise<UserRow[]> {
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
                permissions: row.permissions || {}
            } satisfies UserRow;
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

export async function updateUserRole(id: number, newRole: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('users')
            .update({ role: newRole })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/users');
        return true;
    } catch (error) {
        console.error("Failed to update user role:", error);
        return false;
    }
}

export async function updateUserPermissions(id: number, permissions: Record<string, boolean>) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('users')
            .update({ permissions })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/users');
        return true;
    } catch (error) {
        console.error("Failed to update user permissions:", error);
        return false;
    }
}

export async function deleteUser(id: number) {
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
