import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VerifyAdminClient from "./VerifyAdminClient";

export default async function VerifyAdminLoginPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Double check role and get contact info using admin client to bypass RLS policies
    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('role, phone, whatsapp_number')
        .eq('email', user.email?.toLowerCase())
        .single();

    if (!userData || !['Admin', 'Leader', 'Operator'].includes(userData.role)) {
        redirect("/unauthorized");
    }

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#09090b] text-neutral-50 px-4 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
            <VerifyAdminClient 
                email={user.email || ""} 
                initialPhone={userData.phone || ""}
                initialWhatsApp={userData.whatsapp_number || ""}
            />
        </div>
    );
}

