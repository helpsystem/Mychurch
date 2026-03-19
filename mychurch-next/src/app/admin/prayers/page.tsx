import { requireRole } from "@/utils/rbac";
import AdminPrayersClient from "./AdminPrayersClient";
import { getPrayers } from "@/actions/prayers";

export const metadata = {
    title: "Prayer CRM | Admin Hub",
};

export default async function AdminPrayersPage() {
    await requireRole(['Admin', 'Leader']);
    const prayers = await getPrayers('all');

    return <AdminPrayersClient initialPrayers={prayers} />;
}
