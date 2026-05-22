import { requireRole } from "@/utils/rbac";
import DocumentsClient from "./DocumentsClient";

export const dynamic = "force-dynamic";

export default async function DocumentsAdminPage() {
    // Only Admin and Leader can access the documents page
    await requireRole(['Admin', 'Leader']);

    return <DocumentsClient />;
}
