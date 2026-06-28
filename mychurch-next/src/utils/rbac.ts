import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export type Role = 'Admin' | 'Leader' | 'Operator' | 'User';

export async function getUserEmail(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
}

import { cookies } from "next/headers";

export async function getRealUserRole(): Promise<Role | null> {
    const email = await getUserEmail();
    if (!email) return null;

    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .ilike('email', email)
            .single();

        if (error || !data || !data.role) return null;
        
        // Capitalize first letter to match Role type
        const rawRole = String(data.role);
        const formattedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
        
        return formattedRole as Role;
    } catch (error) {
        console.error("Failed to fetch user role:", error);
        return null;
    }
}

export async function getUserRole(): Promise<Role | null> {
    const realRole = await getRealUserRole();
    if (!realRole) return null;

    if (realRole === 'Admin' || realRole === 'Leader') {
        try {
            const cookieStore = await cookies();
            const cookieRole = cookieStore.get('mychurch_view_as_role')?.value;
            if (cookieRole && ['Admin', 'Leader', 'Operator', 'User'].includes(cookieRole)) {
                return cookieRole as Role;
            }
        } catch {
            // ignore
        }
    }

    return realRole;
}

export async function getUserPermissions(): Promise<Record<string, boolean>> {
    const email = await getUserEmail();
    if (!email) return {};

    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from('users')
            .select('permissions')
            .ilike('email', email)
            .single();

        if (error || !data) return {};
        return data.permissions || {};
    } catch (error) {
        console.error("Failed to fetch user permissions:", error);
        return {};
    }
}

export async function requireRole(allowedRoles: Role[]) {
    const role = await getUserRole();

    if (!role) {
        redirect("/login");
    }

    if (!allowedRoles.includes(role)) {
        // User is authenticated but lacks permission
        redirect("/unauthorized");
    }

    return role;
}
