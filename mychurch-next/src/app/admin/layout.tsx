import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, LayoutTemplate, Settings, Power, FileVideo, Music, UserCircle, Megaphone, Crown, Tags, MonitorPlay } from "lucide-react";
import Image from "next/image";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";
import { logout } from "@/actions/auth";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { Toaster } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    const userEmail = user?.email || '';
    const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : '??';

    const adminSupabase = await createAdminClient();
    const [roleResult, permissionsResult] = await Promise.all([
        adminSupabase
            .from('users')
            .select('role')
            .ilike('email', userEmail)
            .single(),
        adminSupabase
            .from('users')
            .select('permissions')
            .ilike('email', userEmail)
            .single(),
    ]);

    const rawRole = roleResult.data?.role;
    const roleStr = rawRole ? String(rawRole) : null;
    const role = roleStr ? (roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase()) : null;

    if (!role || !['Admin', 'Leader', 'Operator'].includes(role)) {
        redirect('/unauthorized');
    }

    const permissions = permissionsResult.data?.permissions || {};
    
    // Get the impersonated role if any
    const { getUserRole } = await import("@/utils/rbac");
    const currentRole = await getUserRole() || role;
    
    // Evaluate permissions and isAdmin based on the effective role
    const effectiveIsAdmin = currentRole === 'Admin';
    // If testing as User, clear permissions to see exactly what they'd see
    const effectivePermissions = currentRole === 'User' ? {} : permissions;

    return (
        <div className="dark flex h-[100dvh] w-full bg-[#09090b] text-neutral-50 font-sans selection:bg-primary/30 relative overflow-hidden">
            {/* Background Base */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
            {/* Admin Sidebar (Client component for mobile toggle) */}
            <AdminSidebar 
                role={currentRole} 
                realRole={role}
                permissions={effectivePermissions} 
                userEmail={userEmail} 
                initials={initials} 
                isAdmin={effectiveIsAdmin} 
            />

            {/* Admin Main Content Area */}
            <main className="flex-1 flex flex-col bg-[#09090b] relative overflow-y-auto md:pt-0 pt-16 w-full max-w-[100vw]">
                {/* Background Watermark */}
                <DynamicWatermark defaultSize={800} defaultPosition="center" defaultOpacity={2} className="md:pt-0 pt-32" />

                <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between border-b border-white/10 sticky top-0 bg-black/20 backdrop-blur-xl z-20 shadow-sm">
                    <h1 className="text-xl font-bold">System Status</h1>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">All Systems Operational</span>
                    </div>
                </header>
                <div className="flex-1 p-4 md:p-8 relative z-10 w-full max-w-[1600px] mx-auto overflow-x-hidden">
                    {children}
                </div>
            </main>
            <Toaster position="bottom-right" theme="dark" richColors />
        </div>
    );
}
