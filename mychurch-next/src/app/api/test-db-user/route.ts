import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const adminSupabase = await createAdminClient();
        const { data: users, error } = await adminSupabase
            .from("users")
            .select("*");
            
        return NextResponse.json({ 
            success: true, 
            usersCount: users?.length || 0,
            users: users || [], 
            error: error ? { message: error.message, details: error.details } : null 
        });
    } catch (e: any) {
        return NextResponse.json({ 
            success: false, 
            error: e.message 
        }, { status: 500 });
    }
}
