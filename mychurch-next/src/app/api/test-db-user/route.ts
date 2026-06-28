import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const adminSupabase = await createAdminClient();

        // 1. Upgrade help.system@ymail.com to Admin role
        const { error: updateError } = await adminSupabase
            .from("users")
            .update({ role: "Admin" })
            .ilike("email", "help.system@ymail.com");

        if (updateError) {
            console.error("Failed to upgrade user role:", updateError);
        }

        // 2. Fetch all users to verify
        const { data: users, error } = await adminSupabase
            .from("users")
            .select("*");
            
        return NextResponse.json({ 
            success: true, 
            message: "User role upgraded successfully if record existed.",
            usersCount: users?.length || 0,
            users: users || [], 
            updateError: updateError ? { message: updateError.message } : null,
            error: error ? { message: error.message, details: error.details } : null 
        });
    } catch (e: any) {
        return NextResponse.json({ 
            success: false, 
            error: e.message 
        }, { status: 500 });
    }
}
