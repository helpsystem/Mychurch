import { getTickets } from "@/actions/tickets";
import ClientSupport from "./ClientSupport";
import { requireAuth } from "@/utils/rbac"; // Assumption: profile requires auth

export const metadata = {
    title: "Support Tickets | MyProfile",
};

export default async function UserSupportPage() {
    // We would normally filter by user_id here based on auth session.
    // For now, we fetch all open tickets or mock tickets for the demo.
    const tickets = await getTickets();
    
    return <ClientSupport initialTickets={tickets} />;
}
