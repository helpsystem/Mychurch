import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, LayoutTemplate, Settings, Power, FileVideo, Music, UserCircle } from "lucide-react";
import Image from "next/image";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";
import { requireRole, getUserPermissions } from "@/utils/rbac";
import { logout } from "@/actions/auth";
import { createClient } from "@/utils/supabase/server";
import ViewAsRoleSwitcher from "@/components/admin/ViewAsRoleSwitcher";
import { Toaster } from "sonner";

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
        <div className="flex h-[100dvh] w-full bg-neutral-950 text-foreground font-sans selection:bg-primary/30">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-neutral-900 border-r border-border/10 flex flex-col z-20 shrink-0">
                <div className="h-20 flex items-center gap-3 px-6 border-b border-border/10 bg-neutral-950/50">
                    <Image src="/logo-transparent.png" alt="Logo" width={36} height={36} className="object-contain" />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-widest text-primary uppercase">ADMIN PANEL</span>
                        <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">{role} MODE</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold transition-colors">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>

                    {/* Permission: canManageWorship */}
                    {(isAdmin || permissions?.canManageWorship) && (
                        <Link href="/admin/worship" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                            <Music className="w-5 h-5" /> Worship Media
                        </Link>
                    )}

                    {/* Permission: canManageWidgets */}
                    {(isAdmin || permissions?.canManageWidgets) && (
                        <Link href="/admin/widgets" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                            <LayoutTemplate className="w-5 h-5" /> Widget System
                        </Link>
                    )}

                    {/* Permission: canManageMedia */}
                    {(isAdmin || permissions?.canManageMedia) && (
                        <Link href="/admin/media" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                            <FileVideo className="w-5 h-5" /> Media Library
                        </Link>
                    )}

                    {/* Permission: canManageUsers - Only Admins or Specifically granted Leaders */}
                    {(isAdmin || permissions?.canManageUsers) && (
                        <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                            <Users className="w-5 h-5" /> Users & Roles
                        </Link>
                    )}

                    {/* Permission: Default access for all admin panel entrants unless overridden */}
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                        <Settings className="w-5 h-5" /> Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-border/10 space-y-2">
                    {/* View As Role Switcher — Admin only */}
                    {isAdmin && (
                        <ViewAsRoleSwitcher realRole={role} />
                    )}

                    {/* User Profile Card */}
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm ring-2 ring-indigo-500/20 shrink-0">
                            {initials}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="text-xs font-bold text-foreground group-hover:text-indigo-400 transition-colors">پروفایل من</span>
                            <span className="text-xs text-muted-foreground/70 truncate">{userEmail}</span>
                        </div>
                        <UserCircle className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <form action={logout}>
                        <button type="submit" className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-colors" title="Logout">
                            <Power className="w-5 h-5" /> Exit Admin
                        </button>
                    </form>
                </div>
            </aside>

            {/* Admin Main Content Area */}
            <main className="flex-1 flex flex-col bg-background relative overflow-y-auto">
                {/* Background Watermark (Admin Configurable later) */}
                <DynamicWatermark defaultSize={800} defaultPosition="center" defaultOpacity={2} className="md:pt-0 pt-32" />

                <header className="h-20 px-8 flex items-center justify-between border-b border-border/10 sticky top-0 bg-background/80 backdrop-blur-xl z-20">
                    <h1 className="text-xl font-bold">System Status</h1>
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold ring-1 ring-emerald-500/20">All Systems Operational</span>
                    </div>
                </header>
                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
            <Toaster position="bottom-right" theme="dark" richColors />
        </div>
    );
}
