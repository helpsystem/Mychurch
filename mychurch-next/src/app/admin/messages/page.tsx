import { requireRole } from "@/utils/rbac";
import AdminMessagesClient from "./AdminMessagesClient";
import { getTickets } from "@/actions/tickets";

export const metadata = {
    title: "Messages CRM | Admin Hub",
};

export default async function AdminMessagesPage() {
    await requireRole(['Admin', 'Leader']);
    const tickets = await getTickets('all');

    return <AdminMessagesClient initialTickets={tickets} />;
}
