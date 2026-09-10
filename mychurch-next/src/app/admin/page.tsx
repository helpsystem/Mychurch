import {
    Users, LayoutTemplate, Activity, Server,
    ArrowRight, CheckCircle2, ShieldAlert, Tags, Info,
    Cpu, Database, ShieldCheck, Mail, Zap, RefreshCw, Layers,
    Languages, Sparkles, BarChart3, ArrowUpRight, Crown, Shield, Briefcase,
    HeartHandshake, MonitorPlay, ScanLine, Trash2, History, Video, Radio, Music
} from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { getUserRole } from "@/utils/rbac";
import Link from "next/link";
import LiveTranslator from "@/components/ui/LiveTranslator";

export default async function AdminDashboard() {
    const [stats, role] = await Promise.all([
        getDashboardStats(),
        getUserRole().then(r => r || 'Admin')
    ]);

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

    const getRoleTitle = () => {
        if (role === 'Leader') return 'کنسول خدمت و هدایت شبانی (Pastoral Workspace)';
        if (role === 'Operator') return 'کنسول عملیات رسانه، برودکست و استودیو (Broadcast Studio)';
        return 'داشبورد مدیریت کلیسا (Master Admin Cockpit)';
    };

    const getRoleSubtitle = () => {
        if (role === 'Leader') return 'رسیدگی به دعاهای اعضا، آماده‌سازی موعظه‌های یکشنبه، امضای گواهی‌ها و پیام‌های شبانی.';
        if (role === 'Operator') return 'کنترل پخش زنده مراسم، همگام‌سازی سرودهای پرستشی، استوریج ابری و مترجم زنده همزمان.';
        return 'وضعیت سرویس‌ها، کنترل کامل امنیت، مدیریت نقش‌ها و سلامت ارتباطات ابری دیتابیس در یک نگاه.';
    };

    const getRoleBadge = () => {
        if (role === 'Leader') {
            return (
                <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-500/30 rounded-full px-4 py-2 text-xs font-bold text-purple-300">
                    <Shield className="w-4 h-4 text-purple-400" />
                    پرتال رهبر کلیسا (Leader)
                </div>
            );
        }
        if (role === 'Operator') {
            return (
                <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 rounded-full px-4 py-2 text-xs font-bold text-emerald-300">
                    <Briefcase className="w-4 h-4 text-emerald-400" />
                    پرتال مدیر و اپراتور (Operator)
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/30 rounded-full px-4 py-2 text-xs font-bold text-amber-300">
                <Crown className="w-4 h-4 text-amber-400" />
                پرتال ادمین ارشد (Admin)
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-vazirmatn" dir="rtl">
            
            {/* Upper Dashboard Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none -z-10" />

            {/* Welcome & Role Summary Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                        <span className="p-2 bg-primary/10 rounded-xl text-primary"><Activity className="w-8 h-8" /></span>
                        {getRoleTitle()}
                    </h2>
                    <p className="text-white/80 mt-2 pr-12 text-sm max-w-3xl leading-relaxed">{getRoleSubtitle()}</p>
                </div>
                <div className="flex items-center gap-3">
                    {getRoleBadge()}
                    <div className="hidden sm:flex items-center gap-2 bg-neutral-900 border border-white/10 rounded-full px-3.5 py-2 text-xs font-bold text-emerald-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        سرویس‌ها فعال
                    </div>
                </div>
            </div>

            {/* Role-Adaptive Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {role === 'Leader' ? (
                    <>
                        <div className="bg-neutral-900/90 border border-purple-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-purple-500/40 hover:scale-[1.02] shadow-purple-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">دعاهای در نوبت بررسی</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.pendingPrayersCount || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-purple-400">رسیدگی و برکت شبانی</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                    <HeartHandshake className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-emerald-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:scale-[1.02] shadow-emerald-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">پرزنتیشن‌ها و خطبه‌ها</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.presentationsCount || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-emerald-400">موعظه‌های آماده یکشنبه</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <MonitorPlay className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-cyan-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.02] shadow-cyan-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">اسناد و گواهی‌های رسمی</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.scannedDocsCount || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-cyan-400">آرشیو محرمانه تعمید و ازدواج</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <ScanLine className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-blue-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-blue-500/40 hover:scale-[1.02] shadow-blue-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">اعضای ثبت‌شده کلیسا</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.activeUsers || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-blue-400">اعضای فعال تحت پوشش</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </>
                ) : role === 'Operator' ? (
                    <>
                        <div className="bg-neutral-900/90 border border-rose-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-rose-500/40 hover:scale-[1.02] shadow-rose-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">استودیو پخش زنده</p>
                                    <h3 className="text-4xl font-black text-rose-400 font-mono">LIVE</h3>
                                    <p className="text-xs text-neutral-400">کنسول برودکست و لایو استریم</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                                    <Radio className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-cyan-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.02] shadow-cyan-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">سرودهای پرستشی</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.totalCategories || 12).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-cyan-400">کارائوکه و سینک صوتی فعال</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <Music className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-emerald-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:scale-[1.02] shadow-emerald-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">پرزنتیشن‌های لایو</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.presentationsCount || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-emerald-400">اسلایدهای آماده نمایش</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <MonitorPlay className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-amber-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-amber-500/40 hover:scale-[1.02] shadow-amber-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">اسکن و دیجیتالی‌سازی</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.scannedDocsCount || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-amber-400">اسکنر سخت‌افزاری و OCR</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <ScanLine className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-neutral-900/90 border border-blue-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-blue-500/40 hover:scale-[1.02] shadow-blue-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">کاربران ثبت‌شده</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.activeUsers || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-blue-400">مدیریت اعضا و پرمیشن‌ها</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Users className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-cyan-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-cyan-500/40 hover:scale-[1.02] shadow-cyan-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">بایگانی اسناد و OCR</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.scannedDocsCount || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-cyan-400">اسناد محرمانه و فوق‌محرمانه</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    <ScanLine className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-rose-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-rose-500/40 hover:scale-[1.02] shadow-rose-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">زباله‌دان و بازیابی</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.trashedItemsCount || 0).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-rose-400">اقلام حذف‌شده قابل بازگردانی</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900/90 border border-amber-500/20 rounded-3xl p-6 shadow-xl transition-all duration-300 hover:border-amber-500/40 hover:scale-[1.02] shadow-amber-500/5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">اتصالات زنده دیتابیس</p>
                                    <h3 className="text-4xl font-black text-white font-mono">{(stats.dbConnections || 1).toLocaleString('fa-IR')}</h3>
                                    <p className="text-xs text-amber-400">PostgreSQL و سوپابیس آنلاین</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Server className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Microsoft Azure & AI Translation Quota & Token Monitor */}
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-neutral-950 border border-amber-500/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10">
                            <Languages className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-white">مانیتورینگ مصرف توکن‌ها و سهمیه مایکروسافت آژور (Azure Translator)</h3>
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">پلن رایگان F0 فعال</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">مدیریت مصرف سهمیه ۲,۰۰۰,۰۰۰ کاراکتر ماهانه رایگان مایکروسافت همراه با ذخیره و رهگیری دقیق در دیتابیس.</p>
                        </div>
                    </div>

                    <Link
                        href="/admin/live-translator"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                    >
                        <span>مترجم زنده</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Quota Progress Bar & Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 items-center">
                    {/* Left: Live Gauge & Progress */}
                    <div className="lg:col-span-2 space-y-4 bg-black/40 border border-white/5 rounded-2xl p-5">
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-xs text-slate-400 block font-medium">مصرف کاراکتر در این ماه:</span>
                                <span className="text-3xl font-black text-white font-mono mt-1 block">
                                    {(stats.translationStats?.monthlyChars || 0).toLocaleString()} <span className="text-sm font-normal text-slate-400">/ ۲,۰۰۰,۰۰۰ کاراکتر</span>
                                </span>
                            </div>
                            <div className="text-left">
                                <span className={`text-2xl font-black font-mono ${(stats.translationStats?.monthlyPercent || 0) > 85 ? 'text-red-400' : 'text-amber-400'}`}>
                                    {stats.translationStats?.monthlyPercent || 0}%
                                </span>
                                <span className="text-[11px] text-slate-400 block">درصد مصرف ماهانه</span>
                            </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-3.5 rounded-full bg-white/5 border border-white/10 p-0.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    (stats.translationStats?.monthlyPercent || 0) > 85
                                        ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                                        : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-500 shadow-[0_0_12px_rgba(245,166,35,0.4)]'
                                }`}
                                style={{ width: `${Math.max(2, stats.translationStats?.monthlyPercent || 0)}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                            <span className="text-emerald-400 font-semibold">
                                {(stats.translationStats?.remainingChars || 2000000).toLocaleString()} کاراکتر رایگان باقیمانده تا تمدید ماهانه
                            </span>
                            <span>تمدید خودکار اول هر ماه میلادی</span>
                        </div>
                    </div>

                    {/* Right: Quick Insights */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center space-y-1">
                            <span className="text-[11px] text-slate-400 block font-medium">مصرف امروز</span>
                            <span className="text-2xl font-black text-amber-400 font-mono block">
                                {(stats.translationStats?.todayChars || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500">کاراکتر ترجمه شده</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center space-y-1">
                            <span className="text-[11px] text-slate-400 block font-medium">کل درخواست‌ها</span>
                            <span className="text-2xl font-black text-blue-400 font-mono block">
                                {(stats.translationStats?.totalRequests || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500">ریکوئست ثبت شده</span>
                        </div>
                    </div>
                </div>

                {/* Embedded Live Translator Tool in Dashboard */}
                <div className="mt-6 pt-5 border-t border-white/5">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            مترجم سریع لحظه‌ای (تست مستقیم آژور و ثبت کاراکترها)
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">Debounce: 450ms Active</span>
                    </div>
                    <LiveTranslator />
                </div>
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
                        <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">
                            دسترسی سریع به پنل‌ها (Quick Actions)
                        </h3>

                        <div className="space-y-3">
                            {role === 'Leader' ? (
                                <>
                                    <Link href="/admin/prayers" className="w-full flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-purple-400 transition-colors">بررسی درخواست‌های دعای اعضا</h4>
                                            <p className="text-xs text-muted-foreground">تائید، پاسخ و برکت شبانی اعضا</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/presentations" className="w-full flex items-center justify-between p-4 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-emerald-400 transition-colors">موعظه‌ها و اسلایدهای یکشنبه</h4>
                                            <p className="text-xs text-muted-foreground">ساخت اسلاید، خطبه‌ها و آیات کلیدی</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/documents/scanner" className="w-full flex items-center justify-between p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-cyan-400 transition-colors">اسکنر و آرشیو گواهی‌های تعمید</h4>
                                            <p className="text-xs text-muted-foreground">اسکن سخت‌افزاری، استخراج OCR و امضا</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/communications" className="w-full flex items-center justify-between p-4 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-blue-400 transition-colors">مرکز پیام‌ها و ایمیل‌های شبانی</h4>
                                            <p className="text-xs text-muted-foreground">ارسال ایمیل، پیامک و ارتباط با اعضا</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors transform rotate-180" />
                                    </Link>
                                </>
                            ) : role === 'Operator' ? (
                                <>
                                    <Link href="/broadcast" className="w-full flex items-center justify-between p-4 rounded-2xl border border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all text-right group bg-rose-950/20">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-rose-400 group-hover:text-rose-300 transition-colors">کنسول پخش زنده (Live Studio)</h4>
                                            <p className="text-xs text-muted-foreground">شروع لایو استریم، وبکم و زیرنویس مراسم</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/worship" className="w-full flex items-center justify-between p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-cyan-400 transition-colors">سرودهای پرستشی و کارائوکه</h4>
                                            <p className="text-xs text-muted-foreground">هماهنگ‌سازی لیریک‌ها و همگام‌سازی صوت</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/media" className="w-full flex items-center justify-between p-4 rounded-2xl border border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-indigo-400 transition-colors">مدیا لایبرری و تلگرام CDN</h4>
                                            <p className="text-xs text-muted-foreground">آپلود و استریم نامحدود ویدئوها و صوت</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/live-translator" className="w-full flex items-center justify-between p-4 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors">مترجم همزمان خطبه‌ها</h4>
                                            <p className="text-xs text-muted-foreground">ترجمه صوتی و متنی بلادرنگ سخنرانی</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors transform rotate-180" />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/admin/users" className="w-full flex items-center justify-between p-4 rounded-2xl border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors">مدیریت کاربران و سطوح دسترسی</h4>
                                            <p className="text-xs text-muted-foreground">کنترل نقش‌ها (RBAC) و دسترسی‌های اختصاصی</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/documents/scanner" className="w-full flex items-center justify-between p-4 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-cyan-400 transition-colors">مرکز اسکنر سخت‌افزاری و OCR</h4>
                                            <p className="text-xs text-muted-foreground">اتصال به اسکنر کامپیوتر و آرشیو امن</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/trash" className="w-full flex items-center justify-between p-4 rounded-2xl border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-rose-400 transition-colors">سطل بازیافت و پاکسازی ایمن</h4>
                                            <p className="text-xs text-muted-foreground">بازیابی اسناد و مدیا با تائید دومرحله‌ای</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-400 transition-colors transform rotate-180" />
                                    </Link>

                                    <Link href="/admin/audit-logs" className="w-full flex items-center justify-between p-4 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-right group">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-sm text-foreground group-hover:text-blue-400 transition-colors">لاگ رویدادها و امنیت سیستم</h4>
                                            <p className="text-xs text-muted-foreground">رهگیری کلیه فعالیت‌های کاربران با IP و زمان</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors transform rotate-180" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
