import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const adminSupabase = await createAdminClient();

        // 1. Check if user exists
        const { data: existingUser } = await adminSupabase
            .from("users")
            .select("id")
            .ilike("email", "help.system@ymail.com")
            .maybeSingle();

        let updateError;
        if (existingUser) {
            const result = await adminSupabase
                .from("users")
                .update({ role: "Admin" })
                .eq("id", existingUser.id);
            updateError = result.error;
        } else {
            // Get user from auth.users to get the correct ID if possible
            // or just insert a new user with a generated UUID
            const result = await adminSupabase
                .from("users")
                .insert({ email: "help.system@ymail.com", name: "Help System", role: "Admin" });
            updateError = result.error;
        }

        if (updateError) {
            console.error("Failed to upgrade/create user role:", updateError);
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
