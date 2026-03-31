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

    // Fetch user-specific tickets (filtered by user_id on client)
    const allTickets = await getTickets();
    
    return <ClientSupport initialTickets={allTickets} userEmail={user.email || ""} />;
}
