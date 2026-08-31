import { getUserRole, getUserPermissions } from "@/utils/rbac";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, FileSignature, CheckSquare, Settings, CreditCard, Wand2 } from "lucide-react";

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
                <h1 className="text-display-xl font-display-xl text-on-surface mb-2">Sacred Archive Registry</h1>
                <p className="text-body-base font-body-base text-on-surface-variant font-scripture-calligraphy italic">Maryland Diocesan Archives</p>
            </div>

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
