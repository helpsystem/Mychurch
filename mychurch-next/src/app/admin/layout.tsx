import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, LayoutTemplate, Settings, Power } from "lucide-react";
import Image from "next/image";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-[100dvh] w-full bg-neutral-950 text-foreground font-sans selection:bg-primary/30">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-neutral-900 border-r border-border/10 flex flex-col z-20 shrink-0">
                <div className="h-20 flex items-center gap-3 px-6 border-b border-border/10 bg-neutral-950/50">
                    <Image src="/logo-transparent.png" alt="Logo" width={36} height={36} className="object-contain" />
                    <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-widest text-primary uppercase">ADMIN PANEL</span>
                        <span className="text-xs text-muted-foreground font-medium">MyChurch System</span>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-bold transition-colors">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link href="/admin/widgets" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                        <LayoutTemplate className="w-5 h-5" /> Widget System
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                        <Users className="w-5 h-5" /> Users & Roles
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-neutral-800 hover:text-foreground font-medium transition-colors">
                        <Settings className="w-5 h-5" /> Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-border/10">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 font-bold transition-colors">
                        <Power className="w-5 h-5" /> Exit Admin
                    </Link>
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
        </div>
    );
}
