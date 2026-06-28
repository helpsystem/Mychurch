"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
    Users, Search, Shield, Settings, Trash2, Edit, 
    X, Check, FileText, LayoutTemplate, Music, 
    Calendar, Video, UserPlus, Loader2, Mail 
} from "lucide-react";
import { type UserRow, updateUserRole, deleteUser, updateUserPermissions } from "@/actions/users";
import { toast } from "sonner";

const AVAILABLE_PERMISSIONS = [
    { key: "canManageUsers", label: "Users & Roles", desc: "مدیریت کاربران، نقش‌ها و سطوح دسترسی سیستمی", icon: Shield, color: "text-blue-500" },
    { key: "canManageWidgets", label: "Widget System", desc: "مدیریت و پیکربندی ویجت‌های پویا و بنرهای سایت", icon: LayoutTemplate, color: "text-indigo-500" },
    { key: "canManageWorship", label: "Worship Media", desc: "مدیریت فایل‌ها، لیریک‌ها و آکوردهای سرودهای پرستشی", icon: Music, color: "text-fuchsia-500" },
    { key: "canViewMessages", label: "Messages & Prayers", desc: "دسترسی و مدیریت درخواست‌های دعا و ارتباطات کاربران", icon: FileText, color: "text-emerald-500" },
    { key: "canManageMedia", label: "Media Library", desc: "آپلود و مدیریت فایل‌ها و ویدیوها در کتابخانه رسانه", icon: Video, color: "text-amber-500" },
    { key: "canManageCalendar", label: "Smart Calendar", desc: "مدیریت رویدادها، جلسات دعا و برنامه‌ریزی تقویم کلیسا", icon: Calendar, color: "text-purple-500" }
];

export default function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState("");

    // Permissions Modal State
    const [permissionsModalUserId, setPermissionsModalUserId] = useState<string | null>(null);
    const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>({});

    const handleRoleChange = (id: string, newRole: string) => {
        startTransition(async () => {
            const success = await updateUserRole(id, newRole);
            if (success) {
                toast.success("نقش کاربر با موفقیت تغییر یافت.");
            } else {
                toast.error("خطا در تغییر نقش کاربر.");
            }
            setEditingUserId(null);
        });
    };

    const handleDelete = (id: string) => {
        if (confirm("آیا از حذف این کاربر اطمینان دارید؟ دسترسی او قطع خواهد شد.")) {
            startTransition(async () => {
                const success = await deleteUser(id);
                if (success) {
                    toast.success("کاربر با موفقیت حذف شد.");
                } else {
                    toast.error("خطا در حذف کاربر.");
                }
            });
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsInviting(true);
        setInviteSuccess("");
        try {
            const res = await fetch('/api/admin/invite-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, name: inviteName }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setInviteSuccess(`دعوت‌نامه به ${inviteEmail} ارسال شد!`);
            toast.success("ایمیل دعوت با موفقیت ارسال شد.");
            setInviteEmail("");
            setInviteName("");
        } catch (err: any) {
            toast.error('خطا در ارسال دعوت‌نامه: ' + err.message);
        } finally {
            setIsInviting(false);
        }
    };

    const openPermissionsModal = (user: UserRow) => {
        setPermissionsModalUserId(user.id);
        setEditingPermissions(user.permissions || {});
    };

    const togglePermission = (key: string) => {
        setEditingPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const savePermissions = () => {
        if (!permissionsModalUserId) return;
        startTransition(async () => {
            const success = await updateUserPermissions(permissionsModalUserId, editingPermissions);
            if (success) {
                toast.success("سطوح دسترسی کاربر با موفقیت ویرایش شد.");
            } else {
                toast.error("خطا در به‌روزرسانی دسترسی‌ها.");
            }
            setPermissionsModalUserId(null);
        });
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return initialUsers;
        const q = searchQuery.toLowerCase();
        return initialUsers.filter(u => 
            (u.name || "").toLowerCase().includes(q) || 
            (u.email || "").toLowerCase().includes(q)
        );
    }, [initialUsers, searchQuery]);

    const activeUser = initialUsers.find(u => u.id === permissionsModalUserId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-vazirmatn" dir="rtl">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" />
                        مدیریت کاربران و سطوح دسترسی (RBAC)
                    </h2>
                    <p className="text-white/80 mt-2 pr-12 text-sm">
                        مدیریت اعضای تیم، تغییر نقش‌های کاربری (مدیر، رهبر، اپراتور) و تخصیص سطوح دسترسی مجزا.
                    </p>
                </div>
                <button 
                    onClick={() => setShowInviteModal(true)} 
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/95 transition flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" /> دعوت مدیر یا رهبر جدید
                </button>
            </div>

            {/* Main Table section */}
            <div className="glass-strong border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                
                {/* Search Bar */}
                <div className="p-5 border-b border-white/10 flex items-center gap-4 bg-black/20 relative z-10">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="جستجوی نام یا ایمیل کاربر..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-white/5 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:border-primary transition text-right"
                        />
                    </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-black/25 border-b border-white/10 text-muted-foreground text-xs font-bold uppercase">
                                <th className="px-6 py-4 text-right">کاربر / Email & Name</th>
                                <th className="px-6 py-4 text-right">نقش سیستمی / Role</th>
                                <th className="px-6 py-4 text-right">دسترسی‌های سفارشی / Rules</th>
                                <th className="px-6 py-4 text-right">آخرین فعالیت / Last Active</th>
                                <th className="px-6 py-4 text-left">عملیات / Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-800/35 transition-colors">
                                    {/* User Details */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black border border-primary/20 shadow-sm">
                                                {(user.name || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{user.name}</div>
                                                <div className="text-xs text-white/50 font-mono mt-0.5 text-left" dir="ltr">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role Selector / Badge */}
                                    <td className="px-6 py-4">
                                        {editingUserId === user.id ? (
                                            <select
                                                className="bg-neutral-950 border border-white/10 rounded-xl p-2 text-xs outline-none text-white focus:border-primary font-bold"
                                                defaultValue={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={isPending}
                                                title="انتخاب نقش کاربر"
                                                onBlur={() => setEditingUserId(null)}
                                            >
                                                <option value="Admin">Admin (مدیر کل)</option>
                                                <option value="Leader">Leader (رهبر)</option>
                                                <option value="Operator">Operator (اپراتور)</option>
                                                <option value="User">User (کاربر عادی)</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border
                                                ${user.role === 'Admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                                ${user.role === 'Leader' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                                                ${user.role === 'Operator' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                                ${user.role === 'User' ? 'bg-neutral-800 text-muted-foreground border-white/5' : ''}
                                            `}>
                                                <Shield className="w-3.5 h-3.5" />
                                                {user.role === 'Admin' ? 'مدیر کل / Admin' : 
                                                 user.role === 'Leader' ? 'رهبر / Leader' : 
                                                 user.role === 'Operator' ? 'اپراتور / Operator' : 'کاربر عادی / User'}
                                            </span>
                                        )}
                                    </td>

                                    {/* Permissions Count */}
                                    <td className="px-6 py-4">
                                        {user.role === 'Admin' ? (
                                            <span className="text-[11px] text-red-400 font-bold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">دسترسی کامل (مدیر کل)</span>
                                        ) : (
                                            <div className="flex gap-1 flex-wrap">
                                                {Object.entries(user.permissions || {}).filter(([_, val]) => val).length > 0 ? (
                                                    <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                        {Object.entries(user.permissions || {}).filter(([_, val]) => val).length} قانون دسترسی فعال
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                                                        دسترسی پیش‌فرض نقش
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    {/* Last Active Timestamp */}
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-muted-foreground font-mono">{user.last_active || "هرگز"}</span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-left">
                                        <div className="flex items-center justify-end gap-2" dir="ltr">
                                            {/* Revoke / Delete */}
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={isPending}
                                                className="p-2 text-red-500/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all disabled:opacity-50" 
                                                title="حذف دسترسی کاربر"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            
                                            {/* Change Role Button */}
                                            <button
                                                onClick={() => setEditingUserId(user.id)}
                                                disabled={isPending}
                                                className="p-2 text-white/70 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-white/5 rounded-xl transition-all disabled:opacity-50" 
                                                title="تغییر نقش سیستمی"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>

                                            {/* Granular Permissions Button */}
                                            <button
                                                onClick={() => openPermissionsModal(user)}
                                                disabled={isPending || user.role === 'Admin'}
                                                className="p-2 text-primary/80 hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl transition-all disabled:opacity-50" 
                                                title="تنظیم دسترسی‌های اختصاصی"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-bold">
                                        کاربری با این مشخصات یافت نشد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Granular Permissions Modal */}
            {permissionsModalUserId && activeUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="glass-strong border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative">
                        <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black/25 relative z-10">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xl shadow-inner">
                                    {(activeUser.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        {activeUser.name}
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">{activeUser.role}</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground text-left" dir="ltr">{activeUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setPermissionsModalUserId(null)} className="p-2 hover:bg-white/5 rounded-full transition text-muted-foreground" title="بستن">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative z-10 space-y-6">
                            <div>
                                <h4 className="text-base font-black text-foreground">سطوح دسترسی جزئی و مدیریت ماژول‌ها</h4>
                                <p className="text-xs text-muted-foreground mt-1">تغییر وضعیت دسترسی‌های اختصاصی کاربر به هر یک از بخش‌های ادمین کلیسا.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {AVAILABLE_PERMISSIONS.map(perm => {
                                    const Icon = perm.icon;
                                    const hasAccess = editingPermissions[perm.key];
                                    return (
                                        <button
                                            key={perm.key}
                                            onClick={() => togglePermission(perm.key)}
                                            className={`flex items-start text-right gap-4 p-4 rounded-2xl border transition-all duration-300 ${hasAccess ? "border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" : "border-white/10 bg-neutral-950/60 hover:bg-neutral-900"}`}
                                        >
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${hasAccess ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-neutral-800 text-muted-foreground border-white/5"}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm mb-1 text-white flex items-center justify-between">
                                                    <span>{perm.label}</span>
                                                    {hasAccess && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{perm.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 bg-black/30 flex justify-end gap-3 relative z-10">
                            <button
                                onClick={() => setPermissionsModalUserId(null)}
                                className="px-6 py-2 rounded-xl font-bold hover:bg-white/5 text-muted-foreground transition"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={savePermissions}
                                disabled={isPending}
                                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition flex items-center gap-2"
                            >
                                {isPending ? (
                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                اعمال و بروزرسانی سطوح دسترسی
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                    <div className="glass-strong border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative">
                        <div className="absolute inset-0 bg-noise opacity-[0.14] pointer-events-none" />
                        
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/25 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-white">دعوت رهبر یا مدیر جدید</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">ارسال ایمیل دعوت‌نامه جهت ایجاد حساب کاربری</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowInviteModal(false); setInviteSuccess(""); }} className="p-2 hover:bg-white/5 rounded-full transition text-muted-foreground" title="بستن">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleInvite} className="p-6 space-y-4 relative z-10">
                            {inviteSuccess && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                                    <Check className="w-4 h-4" /> {inviteSuccess}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label htmlFor="invite-email" className="text-xs font-bold text-muted-foreground mr-1">پست الکترونیکی (ایمیل) *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="invite-email"
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="user@example.com"
                                        dir="ltr"
                                        className="w-full bg-neutral-900 border border-white/5 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-primary transition text-left"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="invite-name" className="text-xs font-bold text-muted-foreground mr-1">نام کامل کاربر</label>
                                <input
                                    id="invite-name"
                                    type="text"
                                    value={inviteName}
                                    onChange={e => setInviteName(e.target.value)}
                                    placeholder="مثال: سهراب رحیمی"
                                    className="w-full bg-neutral-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition text-right"
                                    dir="rtl"
                                />
                            </div>
                            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary-foreground leading-relaxed">
                                کاربر دعوت شده به طور پیش‌فرض نقش کاربر عادی (User) را دریافت می‌کند و شما می‌توانید بلافاصله پس از ثبت‌نام، نقش او را به مدیر، رهبر یا اپراتور ارتقا دهید.
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition">
                                    انصراف
                                </button>
                                <button type="submit" disabled={isInviting} className="flex-1 py-2.5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition flex items-center justify-center gap-2 disabled:opacity-60">
                                    {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    {isInviting ? 'در حال ارسال...' : 'ارسال ایمیل دعوت'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
