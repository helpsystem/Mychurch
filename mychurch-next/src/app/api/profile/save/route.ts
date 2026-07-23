import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, ...data } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!serviceKey) {
            return NextResponse.json({
                success: false,
                error: "SUPABASE_SERVICE_ROLE_KEY is not set in environment variables!"
            }, { status: 500 });
        }

        const supabase = createServerClient(supabaseUrl, serviceKey, {
            cookies: { getAll: () => [], setAll: () => {} },
        });

        // Build update payload
        const updatePayload: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };
        const fields = ['name', 'phone', 'whatsapp_number', 'telegram_id', 'bio',
            'address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code', 'lat', 'lng'];

        for (const field of fields) {
            if (data[field] !== undefined) {
                updatePayload[field] = data[field] || null;
            }
        }

        console.log('[profile/save] Updating user:', email, 'payload:', updatePayload);

        const { data: updated, error } = await supabase
            .from('users')
            .update(updatePayload)
            .ilike('email', email)
            .select();

        if (error) {
            console.error('[profile/save] Supabase error:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
            }, { status: 500 });
        }

        console.log('[profile/save] Updated rows:', updated?.length ?? 0);

        if (!updated || updated.length === 0) {
            // No row was updated — user might not exist in the 'users' table
            // Try to insert instead
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    email: email.toLowerCase(),
                    name: data.name || email.split('@')[0],
                    role: 'User',
                    ...updatePayload,
                });

            if (insertError) {
                return NextResponse.json({
                    success: false,
                    error: `Row not found and insert failed: ${insertError.message}`,
                }, { status: 500 });
            }

            return NextResponse.json({ success: true, action: 'inserted' });
        }

        return NextResponse.json({ success: true, action: 'updated', rows: updated.length });

    } catch (e: any) {
        console.error('[profile/save] Unexpected error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
