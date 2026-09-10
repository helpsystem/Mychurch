import { Metadata } from "next";
import { getUserRole, getUserPermissions } from "@/utils/rbac";
import { getAccessContext } from "@/lib/access-control";
import { redirect } from "next/navigation";
import { getScannedDocuments, getDocumentStats } from "@/actions/scannedDocuments";
import DocumentScannerClient from "./DocumentScannerClient";

export const metadata: Metadata = {
    title: "اسکنر هوشمند و بایگانی امن اسناد | پنل مدیریت کلیسا",
    description: "اتصال به اسکنر کامپیوتر، اسکنر زنده دوربین، موتور دقیق OCR دوزبانه و بایگانی محرمانه اسناد"
};

export const dynamic = "force-dynamic";

export default async function DocumentScannerPage() {
    const context = await getAccessContext();
    const role = context.role;
    const permissions = context.permissions;

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

    const [docsResult, stats] = await Promise.all([
        getScannedDocuments({ limit: 50 }),
        getDocumentStats()
    ]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-display-xl font-display-xl text-on-surface mb-2 font-bold font-[Vazirmatn]">
                    مرکز اسکن هوشمند و بایگانی امن اسناد
                </h1>
                <p className="text-body-base font-body-base text-on-surface-variant font-[Vazirmatn]">
                    سامانه دیجیتالی‌سازی، بازشناسی متن (OCR فارسی و انگلیسی)، اتصال به اسکنر کامپیوتر و آرشیو محرمانه کلیسای انجیلی ایرانیان واشنگتن
                </p>
            </div>

            <DocumentScannerClient
                initialDocuments={docsResult.documents}
                initialStats={stats}
                userEmail={context.email || 'admin@iranianchurchdc.com'}
                isAdmin={role === 'Admin'}
            />
        </div>
    );
}
