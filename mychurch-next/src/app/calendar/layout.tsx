import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function CalendarLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("widgets")
        .select("is_active")
        .eq("id", "w_cal")
        .single();

    // If widget is explicitly disabled, redirect to home
    if (data && data.is_active === false) {
        redirect("/");
    }
    return <>{children}</>;
}
