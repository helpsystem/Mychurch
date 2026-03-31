"use client";

import React, { useState, useEffect } from "react";
import { Eye, User, Shield, Briefcase, Crown, X } from "lucide-react";
import Link from "next/link";

const ROLE_OPTIONS = [
    { value: "Admin", label: "Admin", icon: Crown, color: "text-primary", bg: "bg-primary/10", ring: "ring-primary/30" },
    { value: "Leader", label: "Leader", icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10", ring: "ring-purple-500/30" },
    { value: "Operator", label: "Operator", icon: Briefcase, color: "text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
    { value: "User", label: "User", icon: User, color: "text-gray-400", bg: "bg-gray-500/10", ring: "ring-gray-500/30" },
];

const LS_KEY = "mychurch_view_as_role";

export default function ViewAsRoleSwitcher({ realRole }: { realRole: string }) {
    const [viewAs, setViewAs] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            if (saved && saved !== realRole) setViewAs(saved);
        } catch {
            setViewAs(null);
        }
    }, [realRole]);

    const handleSelect = (role: string) => {
        try {
            if (role === realRole) {
                localStorage.removeItem(LS_KEY);
                setViewAs(null);
            } else {
                localStorage.setItem(LS_KEY, role);
                setViewAs(role);
            }
        } catch {
            setViewAs(null);
        }
        setOpen(false);
    };

    const clearImpersonation = () => {
        try {
            localStorage.removeItem(LS_KEY);
        } catch {
            // no-op
        }
        setViewAs(null);
    };

    const activeRole = ROLE_OPTIONS.find(r => r.value === (viewAs || realRole));
    const isImpersonating = !!viewAs && viewAs !== realRole;
    const Icon = activeRole?.icon || Eye;

    return (
        <div className="relative">
            {/* Banner when actively impersonating */}
            {isImpersonating && (
                <div className="mx-2 mb-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between gap-2">
                    <span className="text-yellow-400 text-xs font-bold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        مشاهده به عنوان: {viewAs}
                    </span>
                    <button
                        onClick={clearImpersonation}
                        className="text-yellow-400/70 hover:text-yellow-400 transition"
                        title="بازگشت به نقش اصلی"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Switcher Button */}
            <button
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-sm font-bold
                    ${isImpersonating
                        ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                        : "text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
                    }`}
                title="تغییر نقش برای تست"
            >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-right">مشاهده به عنوان...</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeRole?.bg} ${activeRole?.color} ring-1 ${activeRole?.ring}`}>
                    {viewAs || realRole}
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute bottom-full left-2 right-2 mb-2 bg-neutral-900 border border-border/20 rounded-2xl overflow-hidden shadow-2xl z-50 animate-scale-in">
                    <div className="p-3 border-b border-border/10">
                        <p className="text-xs font-bold text-muted-foreground text-center">
                            مشاهده سایت به عنوان نقش دیگر
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 text-center mt-0.5">
                            نقش واقعی شما: <span className="text-primary font-bold">{realRole}</span>
                        </p>
                    </div>
                    <div className="p-2 space-y-1">
                        {ROLE_OPTIONS.map(role => {
                            const RoleIcon = role.icon;
                            const isActive = (viewAs || realRole) === role.value;
                            const isReal = realRole === role.value;
                            return (
                                <button
                                    key={role.value}
                                    onClick={() => handleSelect(role.value)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                                        ${isActive
                                            ? `${role.bg} ${role.color} ring-1 ${role.ring} font-bold`
                                            : "hover:bg-neutral-800 text-muted-foreground font-medium"
                                        }`}
                                >
                                    <RoleIcon className="w-4 h-4" />
                                    <span className="flex-1 text-right">{role.label}</span>
                                    {isReal && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">نقش اصلی</span>
                                    )}
                                    {isActive && !isReal && (
                                        <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded-full">فعال</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <div className="px-3 pb-3 pt-1 border-t border-border/10">
                        <Link
                            href="/"
                            target="_blank"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground py-2 rounded-xl hover:bg-neutral-800 transition"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            باز کردن سایت در تب جدید
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
