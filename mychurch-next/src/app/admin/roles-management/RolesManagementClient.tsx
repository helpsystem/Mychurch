"use client";

import React, { useState, useTransition } from "react";
import { Shield, AlertCircle, CheckCircle2, Users, Edit2, Save, X } from "lucide-react";
import { type UserRow, updateUserRole } from "@/actions/users";

export default function RolesManagementClient({ initialUsers }: { initialUsers: UserRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [users, setUsers] = useState<UserRow[]>(initialUsers);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ role: string }>({ role: "" });

    // Reacting to prop changes
    React.useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    const handleEdit = (user: UserRow) => {
        setEditingId(user.id);
        setEditData({ role: user.role || "User" });
    };

    const handleSave = async (userId: string) => {
        setError(null);
        startTransition(async () => {
            try {
                const success = await updateUserRole(userId, editData.role);
                if (!success) {
                    throw new Error("خطا در به روزرسانی نقش کاربر یا عدم داشتن دسترسی کافی / Failed to update role or insufficient permissions");
                }
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: editData.role } : u));
                setEditingId(null);
            } catch (err: any) {
                setError(err?.message || "خطا در ذخیره / Error saving");
            }
        });
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const roles = ["Admin", "Leader", "Operator", "User"];
    const roleColors: Record<string, string> = {
        Admin: "bg-red-500/10 text-red-400 border-red-500/30",
        Leader: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        Operator: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        User: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-black text-white">نقش‌های کاربری / Roles Management</h1>
                    <p className="text-sm text-white/60 mt-1 font-[Vazirmatn]">مدیریت نقش‌های کاربران و دسترسی‌ها</p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-950/50 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-bold text-red-200">{error}</p>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                {users.length === 0 ? (
                    <div className="p-8 text-center text-white/60">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>هیچ کاربری یافت نشد / No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-black/30 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-white/80">ایمیل / Email</th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-white/80">نام / Name</th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-white/80">نقش / Role</th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-white/80">آخرین فعالیت / Last Active</th>
                                    <th className="px-6 py-3 text-left text-sm font-bold text-white/80">عملیات / Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-sm text-white font-mono">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-white/90">{user.name || "-"}</td>
                                        <td className="px-6 py-4">
                                            {editingId === user.id ? (
                                                <select
                                                    value={editData.role}
                                                    onChange={(e) => setEditData({ role: e.target.value })}
                                                    disabled={isPending}
                                                    className="px-3 py-1.5 bg-neutral-800 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    {roles.map((role) => (
                                                        <option key={role} value={role}>
                                                            {role}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold ${roleColors[user.role] || roleColors["User"]}`}>
                                                    {user.role || "User"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-white/60">
                                            {user.last_active}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {editingId === user.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSave(user.id)}
                                                            disabled={isPending}
                                                            className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Save / ذخیره"
                                                        >
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={handleCancel}
                                                            disabled={isPending}
                                                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Cancel / لغو"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        disabled={isPending}
                                                        className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                                        title="Edit / ویرایش"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Role Legend */}
            <div className="bg-neutral-900 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    توضیحات نقش‌ها / Roles Explanation
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {[
                        { role: "Admin", fa: "مدیر", desc: "دسترسی کامل به تمام بخش‌ها / Full access to all sections" },
                        { role: "Leader", fa: "رهبر", desc: "مدیریت محتوا و کاربران / Content and user management" },
                        { role: "Operator", fa: "اپراتور", desc: "مدیریت روزانه / Daily operations" },
                        { role: "User", fa: "کاربر", desc: "دسترسی عمومی / General access" },
                    ].map((item) => (
                        <div key={item.role} className={`p-4 rounded-lg border ${roleColors[item.role]}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="font-bold">{item.role} - {item.fa}</span>
                            </div>
                            <p className="text-xs opacity-90">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
