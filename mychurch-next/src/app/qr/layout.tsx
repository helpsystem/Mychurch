import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function QRLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("widgets")
        .select("is_active")
        .eq("id", "w_qr")
        .single();

    if (data && data.is_active === false) {
        redirect("/");
    }
    return <>{children}</>;
}
