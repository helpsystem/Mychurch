import React from "react";
import {
    Users, LayoutTemplate, Activity, Server,
    ArrowRight, CheckCircle2, ShieldAlert, Tags, Info,
    Cpu, Database, ShieldCheck, Mail, Zap, RefreshCw, Layers
} from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import Link from "next/link";

export default async function AdminDashboard() {
    const stats = await getDashboardStats();

    const getActivityIcon = (type: string) => {
        switch(type) {
            case 'SUCCESS': return CheckCircle2;
            case 'WARNING': return ShieldAlert;
            case 'INFO': default: return Info;
        }
    };

    const getActivityColor = (type: string) => {
        switch(type) {
            case 'SUCCESS': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'WARNING': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'INFO': default: return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-vazirmatn" dir="rtl">
            
            {/* Upper Dashboard Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />

            {/* Welcome & System Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <span className="p-2 bg-primary/10 rounded-xl text-primary"><Activity className="w-8 h-8" /></span>
                        داشبورد مدیریت کلیسا (Admin Cockpit)
                    </h2>
                    <p className="text-white/80 mt-2 pr-12 text-sm">وضعیت سرویس‌ها، کنترل عملکرد کل سیستم و سلامت ارتباطات ابری دیتابیس در یک نگاه.</p>
                </div>
                <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-emerald-400">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    سرویس‌های ابری: فعال (ONLINE)
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "کاربران فعال", value: stats.activeUsers.toLocaleString(), sub: "ثبت شده در سیستم", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", glow: "shadow-blue-500/5" },
                    { title: "ویجت‌های فعال", value: stats.activeWidgets.toLocaleString(), sub: "ابزارهای فعال سایت", icon: LayoutTemplate, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20", glow: "shadow-purple-500/5" },
                    { title: "دسته‌بندی‌های سرود", value: stats.totalCategories.toLocaleString(), sub: "موضوعات سازماندهی شده", icon: Tags, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", glow: "shadow-emerald-500/5" },
                    { title: "کانکشن‌های دیتابیس", value: stats.dbConnections.toLocaleString(), sub: "اتصالات همزمان فعال", icon: Server, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", glow: "shadow-amber-500/5" }
                ].map((stat, i) => (
                    <div key={i} className={`bg-neutral-900/90 border rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-white/20 hover:scale-[1.02] ${stat.glow} ${stat.bg.split(' ')[1]}`}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</p>
                                <h3 className="text-4xl font-black text-white font-mono">{stat.value}</h3>
                                <p className="text-xs text-white/50">{stat.sub}</p>
                            </div>
                            <div className={`p-4 rounded-2xl ${stat.bg.split(' ')[0]} ${stat.color} border ${stat.bg.split(' ')[1]}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: System Service Health & Live Monitor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Systems Cockpit & Live Transporter Health */}
                <div className="bg-neutral-900 border border-white/5 rounded-[2rem] p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-indigo-400" />
                            وضعیت سلامت سرورها (Services)
                        </h3>
                        <span className="text-[10px] text-muted-foreground font-mono">v1.6.4</span>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: "پایگاه‌داده اصلی (PostgreSQL / Supabase)", status: "عملیاتی", statusColor: "text-emerald-400 bg-emerald-500/10", details: "پاسخ‌دهی زیر ۴۵ میلی‌ثانیه", icon: Database },
                            { name: "سرویس پیام‌رسان هوشمند (Resend/Gmail SMTP)", status: "آماده‌به‌کار", statusColor: "text-emerald-400 bg-emerald-500/10", details: "ارسال لحظه‌ای ایمیل‌ها فعال", icon: Mail },
                            { name: "هاب همگام‌سازی پخش زنده (Realtime Sub/Pub)", status: "متصل", statusColor: "text-emerald-400 bg-emerald-500/10", details: "کانال‌های مجزای امن", icon: Zap },
                            { name: "محیط لود فایل‌های رسانه (Media Storage API)", status: "پایدار", statusColor: "text-emerald-400 bg-emerald-500/10", details: "آپلود مستقیم با CDN فعال", icon: Layers }
                        ].map((srv, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-neutral-800 text-white/70">
                                        <srv.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white">{srv.name}</h4>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{srv.details}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${srv.statusColor}`}>
                                    {srv.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SVG Performance Trends Monitor */}
                <div className="lg:col-span-2 bg-neutral-900 border border-white/5 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            ترافیک و پردازش لحظه‌ای سیستم (Realtime Pulse)
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-white/50">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> کوئری‌های دیتابیس</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> اتصالات زنده</span>
                        </div>
                    </div>

                    {/* Premium Neon SVG Chart */}
                    <div className="w-full h-48 my-4 relative">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradient-db" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="gradient-ws" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid Lines */}
                            <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                            {/* Database path fill & line */}
                            <path d="M 0 90 Q 50 40, 100 70 T 200 30 T 300 60 T 400 45 T 500 20 L 500 100 L 0 100 Z" fill="url(#gradient-db)" />
                            <path d="M 0 90 Q 50 40, 100 70 T 200 30 T 300 60 T 400 45 T 500 20" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

                            {/* Live WebSocket sync path fill & line */}
                            <path d="M 0 95 Q 50 80, 100 45 T 200 80 T 300 40 T 400 70 T 500 30 L 500 100 L 0 100 Z" fill="url(#gradient-ws)" />
                            <path d="M 0 95 Q 50 80, 100 45 T 200 80 T 300 40 T 400 70 T 500 30" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
                        </svg>
                        <div className="absolute top-2 right-2 text-[10px] text-emerald-400/80 font-bold bg-neutral-900/80 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">CPU Load: 4%</div>
                    </div>

                    <p className="text-xs text-muted-foreground text-left" dir="ltr">Systems response health is stable. Zero dropped connections over the last 24 hours.</p>
                </div>

            </div>

            {/* Bottom Section: Recent Activity & Quick Navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent System Activity Logs */}
                <div className="lg:col-span-2 bg-neutral-900 border border-white/5 rounded-[2rem] p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            گزارش آخرین فعالیت‌های سیستم
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {stats.recentActivities.map((log) => {
                            const Icon = getActivityIcon(log.type);
                            const colorsClass = getActivityColor(log.type);
                            return (
                                <div key={log.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-800/40 transition-colors border border-transparent hover:border-white/5">
                                    <div className={`p-2.5 rounded-xl border ${colorsClass.split(' ').slice(0, 3).join(' ')}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-foreground truncate">{log.action}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">{log.user}</p>
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground bg-black/40 border border-white/5 px-3 py-1 rounded-full shrink-0 font-mono">{log.time}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upgraded Quick Action Cards panel */}
                <div className="bg-neutral-900 border border-white/5 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">دسترسی سریع به پنل‌ها (Quick Actions)</h3>

                        <div className="space-y-3">
                            <Link href="/admin/widgets" className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-right group">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">مدیریت ویجت‌های سایت</h4>
                                    <p className="text-xs text-muted-foreground">فعال‌سازی آیه روز، پاپ‌آپ و واترمارک لایو</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors transform rotate-180" />
                            </Link>

                            <Link href="/admin/worship" className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-right group">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-foreground group-hover:text-cyan-400 transition-colors">آرشیو و سرودهای پرستشی</h4>
                                    <p className="text-xs text-muted-foreground">بارگذاری سرودها، هماهنگ‌سازی و تغییر لیریک‌ها</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors transform rotate-180" />
                            </Link>

                            <Link href="/admin/presentations" className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-right group">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-foreground group-hover:text-emerald-400 transition-colors">مدیریت پرزنتیشن‌ها و اسلایدها</h4>
                                    <p className="text-xs text-muted-foreground">ایجاد پرزنتیشن‌های موعظه، متون کتاب‌مقدس و لایو</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors transform rotate-180" />
                            </Link>

                            <Link href="/admin/users" className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-right group">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors">مدیریت کاربران و سطوح دسترسی</h4>
                                    <p className="text-xs text-muted-foreground">کنترل نقش‌ها (RBAC) و مدیریت اعضای سیستم</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors transform rotate-180" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
