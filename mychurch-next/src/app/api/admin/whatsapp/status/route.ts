import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getRealUserRole } from "@/utils/rbac";
import { getPersonalWhatsAppStatus } from "@/services/whatsapp-personal";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = await getRealUserRole();
        if (!role || !['Admin'].includes(role)) {
            return NextResponse.json({ error: "Admin only" }, { status: 403 });
        }

        const status = await getPersonalWhatsAppStatus();
        return NextResponse.json(status);
    } catch (err: any) {
        return NextResponse.json({ paired: false, qrCode: null, error: err.message }, { status: 500 });
    }
}
