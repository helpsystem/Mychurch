import { getTickets } from "@/actions/tickets";
import ClientSupport from "./ClientSupport";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Support Tickets | MyProfile",
};

export default async function UserSupportPage() {
    // 🔒 Require authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login");
    }

    // Fetch only this user's own tickets (server-side filtered — support tickets
    // carry private pastoral content and must never be sent to the client unfiltered).
    const allTickets = await getTickets(undefined, user.email || "");
    
    return <ClientSupport initialTickets={allTickets} userEmail={user.email || ""} />;
}
