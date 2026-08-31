import { getUserRole, getUserPermissions } from "@/utils/rbac";
import { redirect } from "next/navigation";
import InvoicesClient from "./InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesAdminPage() {
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

    return <InvoicesClient />;
}
