"use client";

import React from "react";
import {
    Users, LayoutTemplate, Activity, Server,
    ArrowRight, CheckCircle2, ShieldAlert
} from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "Active Users", value: "1,248", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Active Widgets", value: "4", icon: LayoutTemplate, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { title: "Server Load", value: "24%", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "DB Connections", value: "12", icon: Server, color: "text-amber-500", bg: "bg-amber-500/10" }
                ].map((stat, i) => (
                    <div key={i} className="bg-neutral-900 border border-border/10 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.title}</p>
                                <h3 className="text-3xl font-black">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-neutral-900 border border-border/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Recent System Activity</h3>
                        <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                            View All <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {[
                            { action: "Widget Configuration Updated", user: "Admin (Sami)", time: "2 mins ago", icon: CheckCircle2, color: "text-emerald-500" },
                            { action: "Failed Login Attempt", user: "Unknown IP", time: "1 hour ago", icon: ShieldAlert, color: "text-red-500" },
                            { action: "New Role Assigned", user: "Leader (John)", time: "3 hours ago", icon: Users, color: "text-blue-500" },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-800/50 transition-colors">
                                <div className={`p-2 rounded-lg bg-neutral-950 border border-border/5 ${log.color}`}>
                                    <log.icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-foreground">{log.action}</h4>
                                    <p className="text-xs text-muted-foreground">{log.user}</p>
                                </div>
                                <span className="text-xs font-bold text-muted-foreground bg-neutral-950 px-2 py-1 rounded-md">{log.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-neutral-900 border border-border/10 rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold mb-6">Quick Actions</h3>

                    <div className="space-y-3 flex-1">
                        <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group">
                            <div>
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors">Manage Widgets</h4>
                                <p className="text-xs text-muted-foreground">Toggle site extensions</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group">
                            <div>
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors">User Roles (RBAC)</h4>
                                <p className="text-xs text-muted-foreground">Modify access levels</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group">
                            <div>
                                <h4 className="font-bold text-sm group-hover:text-primary transition-colors">System Logs</h4>
                                <p className="text-xs text-muted-foreground">View error reports</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
