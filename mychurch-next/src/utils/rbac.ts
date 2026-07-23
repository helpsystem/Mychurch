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
            .maybeSingle();

        const knownAdmins = ['help.system@ymail.com', 'helpsystem68@gmail.com', 'appsamyar@gmail.com'];
        const isKnownAdmin = knownAdmins.some(a => a.toLowerCase() === email.toLowerCase());

        if (error || !data || !data.role) {
            if (isKnownAdmin) {
                console.log(`[RBAC] Auto-healing admin role for ${email}...`);
                try {
                    await supabase.from('users').upsert({
                        email: email.toLowerCase(),
                        name: email.split('@')[0],
                        role: 'Admin',
                    }, { onConflict: 'email' });
                } catch (upsertErr) {
                    // upsert might fail if column constraints differ — still return Admin
                    console.warn('[RBAC] Upsert auto-heal failed (non-critical):', upsertErr);
                }
                return 'Admin';
            }
            return null;
        }

        // If known admin but DB has regular 'User', auto-upgrade to 'Admin'
        const rawRole = String(data.role);
        const formattedRole = (rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()) as Role;
        
        if (isKnownAdmin && formattedRole !== 'Admin') {
            console.log(`[RBAC] Upgrading known admin ${email} to Admin role...`);
            await supabase.from('users').update({ role: 'Admin' }).ilike('email', email);
            return 'Admin';
        }

        return formattedRole;
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
            .maybeSingle();

        if (error || !data) return {};
        return data.permissions || {};
    } catch (error) {
        console.error("Failed to fetch user permissions:", error);
        return {};
    }
}

export async function requireRole(allowedRoles: Role[]) {
    const realRole = await getRealUserRole();

    if (!realRole) {
        redirect("/login");
    }

    if (!allowedRoles.includes(realRole)) {
        // User is authenticated but lacks permission
        redirect("/unauthorized");
    }

    return realRole;
}
