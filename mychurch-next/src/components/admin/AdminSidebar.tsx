"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, Users, LayoutTemplate, Settings, 
    Power, FileVideo, Music, UserCircle, Megaphone, 
    Crown, Tags, MonitorPlay, Menu, X, Gift, Mail, FileText, Mic, FileAudio, Sparkles
} from "lucide-react";
import Image from "next/image";
import ViewAsRoleSwitcher from "@/components/admin/ViewAsRoleSwitcher";
import { logout } from "@/actions/auth";

interface AdminSidebarProps {
    role: string;
    realRole: string;
    permissions: any;
    userEmail: string;
    initials: string;
    isAdmin: boolean;
}

export default function AdminSidebar({ role, realRole, permissions, userEmail, initials, isAdmin }: AdminSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar on route change when on mobile
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const NavItem = ({ href, icon: Icon, children, colorClass = "text-muted-foreground", hoverClass = "hover:bg-white/5 hover:text-foreground" }: any) => {
        const isActive = pathname && (pathname === href || (href !== '/admin' && pathname.startsWith(href)));
        
        return (
            <Link 
                href={href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isActive 
                        ? 'bg-primary/10 text-primary font-bold' 
                        : `${colorClass} ${hoverClass}`
                }`}
            >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} /> 
                {children}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile Header Toggle Button */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-b border-white/10 z-[60] flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Image src="/logo-transparent.png" alt="Logo" width={32} height={32} className="object-contain" />
                    <span className="font-bold text-sm tracking-widest text-primary uppercase">ADMIN PANEL</span>
                </div>
                <button onClick={toggleSidebar} className="p-2 bg-white/5 rounded-xl text-white" title="Toggle Sidebar">
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black/80 z-[65] backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside 
                className={`
                    fixed md:relative top-0 left-0 h-[100dvh] w-72 md:w-64 glass-strong border-r border-white/10 flex flex-col z-[70] shrink-0 shadow-2xl transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                
                <div className="h-16 md:h-20 flex items-center justify-between gap-3 px-6 border-b border-white/5 bg-black/20 relative z-10">
                    <div className="flex items-center gap-3">
                        <Image src="/logo-transparent.png" alt="Logo" width={36} height={36} className="object-contain hidden md:block" />
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-widest text-primary uppercase hidden md:block">ADMIN PANEL</span>
                            <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">{role} MODE</span>
                        </div>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden p-2 text-white/50 hover:text-white transition-colors" title="Close Sidebar">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1 relative z-10 custom-scrollbar">
                    <NavItem href="/admin" icon={LayoutDashboard}>Dashboard</NavItem>

                    {(isAdmin || role === "Leader" || role === "Operator" || permissions?.canManageWorship) && (
                        <NavItem href="/admin/presentations" icon={MonitorPlay}>Presentations</NavItem>
                    )}

                    {(isAdmin || role === "Leader" || role === "Operator" || permissions?.canManageWorship) && (
                        <NavItem href="/admin/worship" icon={Music}>Worship Media</NavItem>
                    )}

                    {(isAdmin || role === "Leader" || role === "Operator" || permissions?.canManageWorship) && (
                        <NavItem href="/admin/live-translator" icon={Mic} colorClass="text-indigo-400/80">Live Translator</NavItem>
                    )}

                    {(isAdmin || role === "Leader" || role === "Operator" || permissions?.canManageWorship) && (
                        <NavItem href="/admin/audio-sync" icon={FileAudio} colorClass="text-teal-400/80">Audio Sync</NavItem>
                    )}

                    {(isAdmin || role === "Leader" || role === "Operator" || permissions?.canManageWorship) && (
                        <NavItem href="/admin/bible-chat" icon={Sparkles} colorClass="text-amber-400/80">Bible AI Chat</NavItem>
                    )}

                    {(isAdmin || permissions?.canManageMedia) && (
                        <NavItem href="/admin/media" icon={FileVideo}>Media Library</NavItem>
                    )}

                    {(isAdmin || permissions?.canManageMedia) && (
                        <>
                            <NavItem href="/admin/communications" icon={Megaphone}>Communications</NavItem>
                            <NavItem href="/admin/newsletter" icon={Mail} colorClass="text-blue-400/80">Newsletter</NavItem>
                        </>
                    )}

                    {(isAdmin || permissions?.canManageDocuments || role === "Leader") && (
                        <NavItem href="/admin/documents" icon={FileText} colorClass="text-blue-500/80 group-hover:text-blue-400">Documents</NavItem>
                    )}

                    {(role === "Admin" || role === "Leader") && (
                        <NavItem href="/admin/gifts" icon={Gift} colorClass="text-emerald-400/80">Gifts & Notifications</NavItem>
                    )}

                    {(isAdmin || permissions?.canManageUsers) && (
                        <>
                            <NavItem href="/admin/users" icon={Users}>Users & Roles</NavItem>
                            <NavItem href="/admin/leaders" icon={Crown} colorClass="text-amber-500/80 group-hover:text-amber-400">Leaders Direct</NavItem>
                        </>
                    )}

                    {(isAdmin || permissions?.canManageWidgets) && (
                        <>
                            <NavItem href="/admin/widgets" icon={LayoutTemplate} colorClass="text-purple-400/80">Site Widgets</NavItem>
                            <NavItem href="/admin/categories" icon={Tags}>Categories</NavItem>
                        </>
                    )}

                    <NavItem href="/admin/settings" icon={Settings} colorClass="text-emerald-500/80">Settings</NavItem>
                </nav>

                <div className="p-4 border-t border-border/10 space-y-2 relative z-10">
                    {isAdmin && (
                        <ViewAsRoleSwitcher currentRole={role} realRole={realRole} />
                    )}

                    <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground transition-colors group">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm ring-2 ring-indigo-500/20 shrink-0">
                            {initials}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="text-xs font-bold text-foreground group-hover:text-indigo-400 transition-colors">پروفایل من</span>
                            <span className="text-xs text-muted-foreground/70 truncate" dir="ltr">{userEmail}</span>
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
        </>
    );
}
