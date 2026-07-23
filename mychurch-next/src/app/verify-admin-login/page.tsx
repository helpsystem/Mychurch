import { createClient, createAdminClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VerifyAdminClient from "./VerifyAdminClient";

export default async function VerifyAdminLoginPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { getRealUserRole } = await import("@/utils/rbac");
    const role = await getRealUserRole();

    if (!role || !['Admin', 'Leader', 'Operator'].includes(role)) {
        redirect("/unauthorized");
    }

    // Get contact info using admin client to bypass RLS policies
    const adminSupabase = await createAdminClient();
    const { data: userData } = await adminSupabase
        .from('users')
        .select('role, phone, whatsapp_number, telegram_id')
        .ilike('email', user.email || '')
        .maybeSingle();

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#09090b] text-neutral-50 px-4 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
            <VerifyAdminClient 
                email={user.email || ""} 
                initialPhone={userData?.phone || ""}
                initialWhatsApp={userData?.whatsapp_number || ""}
                initialTelegram={userData?.telegram_id || ""}
            />
        </div>
    );
}

