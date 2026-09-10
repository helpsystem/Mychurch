import { getUserRole, getUserPermissions } from "@/utils/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, FileSignature, CheckSquare, Settings, CreditCard, Wand2, ScanLine, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentsAdminPage() {
    const role = await getUserRole();
    const permissions = await getUserPermissions();

    if (!role) {
        redirect("/login");
    }

    const hasAccess = 
        role === 'Admin' || 
        permissions?.canManageDocuments === true || 
        permissions?.canManageDocumentRequests === true;

    if (!hasAccess) {
        redirect("/unauthorized");
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div>
                <h1 className="text-display-xl font-display-xl text-on-surface mb-2 font-[Vazirmatn]">بایگانی اسناد و مرکز اسکن کلیسا</h1>
                <p className="text-body-base font-body-base text-on-surface-variant font-[Vazirmatn]">بایگانی محرمانه، صدور اسناد رسمی و دیجیتالی‌سازی با OCR هوشمند</p>
            </div>

            {/* Featured Hero Card: Smart Scanner & Confidential Archive */}
            <Link 
                href="/admin/documents/scanner" 
                className="glass-panel p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-neutral-900/60 to-blue-950/30 hover:border-cyan-500/60 transition-all group shadow-2xl relative overflow-hidden"
            >
                <div className="flex items-start gap-5">
                    <div className="p-5 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl group-hover:scale-105 transition-transform shrink-0">
                        <ScanLine className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-cyan-400 transition font-[Vazirmatn]">
                                مرکز اسکن هوشمند و بایگانی امن اسناد (OCR)
                            </h2>
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> دوزبانه (فارسی / انگلیسی)
                            </span>
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> فوق‌محرمانه
                            </span>
                        </div>
                        <p className="text-sm text-neutral-300 max-w-2xl font-[Vazirmatn] leading-relaxed">
                            اتصال مستقیم به اسکنر سخت‌افزاری کامپیوتر/شبکه (eSCL)، اسکنر زنده دوربین با فیلترهای کنتراست سند، بازشناسی دقیق متن (OCR فارسی و انگلیسی) و آرشیو امن با لینک‌های موقت اعتبارسنجی.
                        </p>
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-xl shadow-cyan-500/20 transition-all">
                    <span>ورود به اسکنر و آرشیو</span>
                    <Wand2 className="w-4 h-4" />
                </div>
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Baptism Certificates */}
                <Link href="/admin/documents/baptism" className="glass-panel p-6 rounded-2xl flex flex-col items-start gap-4 hover:bg-white/10 transition group">
                    <div className="p-4 bg-tertiary/10 rounded-xl">
                        <FileSignature className="w-8 h-8 text-tertiary" />
                    </div>
                    <div>
                        <h3 className="text-headline-md font-headline-md font-bold text-on-surface group-hover:text-tertiary transition">Baptism Certificates</h3>
                        <p className="text-sm text-on-surface-variant mt-2 font-body-base">Manage, generate, and sign official baptism certificates for congregants.</p>
                    </div>
                </Link>

                {/* Donation & Invoices */}
                <Link href="/admin/documents/invoices" className="glass-panel p-6 rounded-2xl flex flex-col items-start gap-4 hover:bg-white/10 transition group">
                    <div className="p-4 bg-secondary/10 rounded-xl">
                        <CreditCard className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-headline-md font-headline-md font-bold text-on-surface group-hover:text-secondary transition">Donations & Invoices</h3>
                        <p className="text-sm text-on-surface-variant mt-2 font-body-base">Generate tax-deductible donation receipts and organizational invoices.</p>
                    </div>
                </Link>

                {/* Official Letters */}
                <Link href="/admin/documents/letters" className="glass-panel p-6 rounded-2xl flex flex-col items-start gap-4 hover:bg-white/10 transition group">
                    <div className="p-4 bg-primary/10 rounded-xl">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-headline-md font-headline-md font-bold text-on-surface group-hover:text-primary transition">Official Letters</h3>
                        <p className="text-sm text-on-surface-variant mt-2 font-body-base">Draft and print official church letters on verified letterheads.</p>
                    </div>
                </Link>
                
                {/* Legacy System Link - Temporary for transition */}
                <Link href="/admin/documents/legacy" className="glass-panel p-6 rounded-2xl flex flex-col items-start gap-4 hover:bg-white/10 transition border-dashed border-white/20 opacity-70 group">
                    <div className="p-4 bg-white/5 rounded-xl group-hover:bg-error/20 transition">
                        <Settings className="w-8 h-8 text-white/50 group-hover:text-error transition" />
                    </div>
                    <div>
                        <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Legacy Documents System</h3>
                        <p className="text-sm text-error/80 mt-2 font-body-base">Access the old DocumentsClient tab interface. Slated for removal.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
