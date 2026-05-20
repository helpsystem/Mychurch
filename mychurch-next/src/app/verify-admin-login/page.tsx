import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VerifyAdminClient from "./VerifyAdminClient";

export default async function VerifyAdminLoginPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Double check role
    const { data: roleData } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .single();

    if (!roleData || !['Admin', 'Leader', 'Operator'].includes(roleData.role)) {
        redirect("/unauthorized");
    }

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#09090b] text-neutral-50 px-4 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />
            <VerifyAdminClient email={user.email || ""} />
        </div>
    );
}
