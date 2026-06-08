import React from "react";
import { createClient } from "@/utils/supabase/server";
import StoreClient from "./StoreClient";

export const revalidate = 0; // Force server-side evaluation for accurate inventory status

export default async function StorePage() {
    const supabase = await createClient();
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("title");

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <StoreClient initialProducts={products || []} />
        </div>
    );
}
