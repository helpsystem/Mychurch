import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, LayoutTemplate, Settings, Power, FileVideo, Music, UserCircle, Megaphone, Crown, Tags, MonitorPlay } from "lucide-react";
import Image from "next/image";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";
import { requireRole, getUserPermissions } from "@/utils/rbac";
import { logout } from "@/actions/auth";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // 1. Enforce Role-Based Access Control
    // Allow Admins, Leaders, and Operators to enter. The sidebar options are restricted individually.
    const role = await requireRole(['Admin', 'Leader', 'Operator']);
    const permissions = await getUserPermissions();
    const isAdmin = role === 'Admin';

    // 2. Get the logged-in user's info for the profile section
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || '';
    const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : '??';

    return (
        <div className="dark flex h-[100dvh] w-full bg-[#09090b] text-neutral-50 font-sans selection:bg-primary/30 relative overflow-hidden">
            {/* Background Base */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
            {/* Admin Sidebar (Client component for mobile toggle) */}
            <AdminSidebar 
                role={role} 
                permissions={permissions} 
                userEmail={userEmail} 
                initials={initials} 
                isAdmin={isAdmin} 
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
