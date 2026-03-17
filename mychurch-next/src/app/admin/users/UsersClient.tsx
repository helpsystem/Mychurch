"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Users, Search, Shield, Settings, Trash2, Edit, X, Check, FileText, LayoutTemplate, Music, Calendar, Video, UserPlus, Loader2, Mail } from "lucide-react";
import { type UserRow, updateUserRole, deleteUser, updateUserPermissions } from "@/actions/users";

const AVAILABLE_PERMISSIONS = [
    { key: "canManageUsers", label: "Users & Roles", desc: "مدیریت کاربران و دسترسی‌ها", icon: Shield, color: "text-blue-500" },
    { key: "canManageWidgets", label: "Widget System", desc: "مدیریت ویجت‌های سایت", icon: LayoutTemplate, color: "text-indigo-500" },
    { key: "canManageWorship", label: "Worship Media", desc: "مدیریت سرودها و آکوردها", icon: Music, color: "text-fuchsia-500" },
    { key: "canViewMessages", label: "Messages & Prayers", desc: "دسترسی به پیام‌ها و درخواست‌های دعا", icon: FileText, color: "text-emerald-500" },
    { key: "canManageMedia", label: "Media Library", desc: "مدیریت تصاویر و ویدیوها", icon: Video, color: "text-amber-500" },
    { key: "canManageCalendar", label: "Smart Calendar", desc: "مدیریت تقویم و رویدادهای کلیسا", icon: Calendar, color: "text-purple-500" }
];

export default function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [inviteRole, setInviteRole] = useState("User");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState("");

    // Permissions Modal State
    const [permissionsModalUserId, setPermissionsModalUserId] = useState<number | null>(null);
    const [editingPermissions, setEditingPermissions] = useState<Record<string, boolean>>({});

    const handleRoleChange = (id: number, newRole: string) => {
        startTransition(async () => {
            await updateUserRole(id, newRole);
            setEditingUserId(null);
        });
    };

    const handleDelete = (id: number) => {
        if (confirm("آیا از حذف این کاربر اطمینان دارید؟")) {
            startTransition(async () => {
                await deleteUser(id);
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
                body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setInviteSuccess(`دعوت‌نامه به ${inviteEmail} ارسال شد!`);
            setInviteEmail("");
            setInviteName("");
        } catch (err: any) {
            alert('خطا: ' + err.message);
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
            await updateUserPermissions(permissionsModalUserId, editingPermissions);
            setPermissionsModalUserId(null);
        });
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return initialUsers;
        const q = searchQuery.toLowerCase();
        return initialUsers.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    }, [initialUsers, searchQuery]);

    const activeUser = initialUsers.find(u => u.id === permissionsModalUserId);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        Users & Roles
                    </h2>
                    <p className="text-muted-foreground mt-1">Manage RBAC permissions and active sessions.</p>
                </div>
                <button onClick={() => setShowInviteModal(true)} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> دعوت کاربر جدید
                </button>
            </div>

            <div className="bg-neutral-900 border border-border/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/10 flex items-center gap-4 bg-neutral-950/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search email or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-border/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-950 border-b border-border/10">
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Permissions</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-muted-foreground border border-border/10">
                                                {(user.name || "?").charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold">{user.name}</div>
                                                <div className="text-sm text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingUserId === user.id ? (
                                            <select
                                                className="bg-neutral-950 border border-border/20 rounded p-1 text-xs outline-none"
                                                defaultValue={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={isPending}
                                                title="انتخاب نقش کاربر"
                                                onBlur={() => setEditingUserId(null)}
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="Leader">Leader</option>
                                                <option value="Operator">Operator</option>
                                                <option value="User">User</option>
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                                                ${user.role === 'Admin' ? 'bg-primary/10 text-primary border border-primary/20' : ''}
                                                ${user.role === 'Leader' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : ''}
                                                ${user.role === 'Operator' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : ''}
                                                ${user.role === 'User' ? 'bg-neutral-800 text-muted-foreground border border-border/10' : ''}
                                            `}>
                                                <Shield className="w-3 h-3" />
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === 'Admin' ? (
                                            <span className="text-xs text-primary font-medium px-2 py-1 rounded bg-primary/10">All Access</span>
                                        ) : (
                                            <div className="flex gap-1 flex-wrap max-w-[150px]">
                                                {Object.entries(user.permissions || {}).filter(([_, val]) => val).length > 0 ? (
                                                    <span className="text-xs text-emerald-500 font-medium px-2 py-1 rounded bg-emerald-500/10">{Object.entries(user.permissions || {}).filter(([_, val]) => val).length} Rules Custom</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Default</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-muted-foreground">{user.last_active || "Never"}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openPermissionsModal(user)}
                                            disabled={isPending || user.role === 'Admin'}
                                            className="p-2 text-muted-foreground hover:text-foreground bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors border border-border/5 disabled:opacity-50" title="Granular Permissions"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingUserId(user.id)}
                                            disabled={isPending}
                                            className="p-2 text-muted-foreground hover:text-foreground bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors border border-border/5 disabled:opacity-50" title="Edit Role"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            disabled={isPending}
                                            className="p-2 text-red-500/70 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/10 disabled:opacity-50" title="Revoke Access"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Granular Permissions Modal */}
            {permissionsModalUserId && activeUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-border/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border/10 flex justify-between items-start bg-neutral-950/50">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xl text-primary border border-border/10 shadow-inner">
                                    {(activeUser.name || "?").charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        {activeUser.name}
                                        <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-border/20 text-muted-foreground">{activeUser.role}</span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{activeUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setPermissionsModalUserId(null)} className="p-2 hover:bg-white/5 rounded-full transition text-muted-foreground" title="Close Modal">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Granular Access Control</h4>
                                    <p className="text-xs text-muted-foreground">Toggle specific modules for {activeUser.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {AVAILABLE_PERMISSIONS.map(perm => {
                                    const Icon = perm.icon;
                                    const hasAccess = editingPermissions[perm.key];
                                    return (
                                        <button
                                            key={perm.key}
                                            onClick={() => togglePermission(perm.key)}
                                            className={`flex items-start text-left gap-4 p-4 rounded-2xl border transition-all ${hasAccess ? "border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" : "border-border/10 bg-neutral-950 hover:bg-neutral-900"}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasAccess ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-muted-foreground"}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm mb-1 text-foreground flex items-center justify-between">
                                                    {perm.label}
                                                    {hasAccess && <Check className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                                <p className="text-xs text-muted-foreground" dir="rtl">{perm.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-border/10 bg-neutral-950/50 flex justify-end gap-3">
                            <button
                                onClick={() => setPermissionsModalUserId(null)}
                                className="px-6 py-2.5 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePermissions}
                                disabled={isPending}
                                className="px-6 py-2.5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition flex items-center gap-2"
                            >
                                {isPending ? (
                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Apply Access Rules
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-neutral-900 border border-border/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-border/10 flex justify-between items-center bg-neutral-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">دعوت کاربر جدید</h3>
                                    <p className="text-xs text-muted-foreground">یک ایمیل دعوت ارسال می‌شود</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowInviteModal(false); setInviteSuccess(""); }} className="p-2 hover:bg-white/5 rounded-full transition" title="بستن">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            {inviteSuccess && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold">
                                    <Check className="w-4 h-4" /> {inviteSuccess}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label htmlFor="invite-email" className="text-sm font-bold text-muted-foreground">ایمیل *</label>
                                <div className="relative">
                                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="invite-email"
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="user@example.com"
                                        dir="ltr"
                                        className="w-full bg-neutral-950 border border-border/20 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="invite-name" className="text-sm font-bold text-muted-foreground">نام</label>
                                <input
                                    id="invite-name"
                                    type="text"
                                    value={inviteName}
                                    onChange={e => setInviteName(e.target.value)}
                                    placeholder="نام کامل (اختیاری)"
                                    className="w-full bg-neutral-950 border border-border/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="invite-role" className="text-sm font-bold text-muted-foreground">نقش</label>
                                <select
                                    id="invite-role"
                                    title="انتخاب نقش"
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value)}
                                    className="w-full bg-neutral-950 border border-border/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                                >
                                    <option value="Admin">Admin — دسترسی کامل</option>
                                    <option value="Leader">Leader — رهبر گروه</option>
                                    <option value="Operator">Operator — اپراتور</option>
                                    <option value="User">User — کاربر عادی</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition">
                                    انصراف
                                </button>
                                <button type="submit" disabled={isInviting} className="flex-1 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-2 disabled:opacity-60">
                                    {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                    {isInviting ? 'در حال ارسال...' : 'ارسال دعوت‌نامه'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
