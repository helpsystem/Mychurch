import { getUserRole, getUserPermissions } from "@/utils/rbac";
import { redirect } from "next/navigation";
import DocumentsClient from "../DocumentsClient";

export const dynamic = "force-dynamic";

export default async function LegacyDocumentsPage() {
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
        <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6">
                <h2 className="text-red-500 font-bold">Legacy System</h2>
                <p className="text-sm text-red-500/80">You are viewing the old monolithic documents system. This will be replaced soon.</p>
            </div>
            <DocumentsClient />
        </div>
    );
}
