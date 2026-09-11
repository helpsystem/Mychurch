import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRealUserRole } from "@/utils/rbac";
import { disconnectPersonalWhatsApp } from "@/services/whatsapp-personal";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = await getRealUserRole();
        if (!role || !['Admin'].includes(role)) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const res = await disconnectPersonalWhatsApp();
        return NextResponse.json(res);
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
