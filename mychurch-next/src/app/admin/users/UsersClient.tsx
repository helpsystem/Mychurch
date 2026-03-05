"use client";

import React, { useState, useTransition } from "react";
import { Users, Search, Play, Shield, Settings, Trash2, Edit } from "lucide-react";
import { type UserRow, updateUserRole, deleteUser } from "@/actions/users";

export default function UsersClient({ initialUsers }: { initialUsers: UserRow[] }) {
    const [isPending, startTransition] = useTransition();
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    const handleRoleChange = (id: number, newRole: string) => {
        startTransition(async () => {
            await updateUserRole(id, newRole);
            setEditingUserId(null);
        });
    };

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to revoke access?")) {
            startTransition(async () => {
                await deleteUser(id);
            });
        }
    };

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
                <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition">
                    + Invite User
                </button>
            </div>

            <div className="bg-neutral-900 border border-border/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/10 flex items-center gap-4 bg-neutral-950/50">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search email or name..."
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
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/10">
                            {initialUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-muted-foreground border border-border/10">
                                                {user.name.charAt(0)}
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
                                        <span className="text-sm font-medium text-muted-foreground">{user.lastActive}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => setEditingUserId(user.id)}
                                            disabled={isPending}
                                            className="p-2 text-muted-foreground hover:text-foreground bg-neutral-950 hover:bg-neutral-800 rounded-lg transition-colors border border-border/5" title="Edit Permissions"
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
                            {initialUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        No users found in Supabase.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
