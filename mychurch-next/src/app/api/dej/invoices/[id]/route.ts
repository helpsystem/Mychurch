import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/dej/invoices/[id] - Get single invoice
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    const { data, error } = await supabase
        .from("dej_invoices")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
}

// PATCH /api/dej/invoices/[id] - Update invoice (status, fields)
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    const body = await req.json();

    const { data, error } = await supabase
        .from("dej_invoices")
        .update(body)
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// DELETE /api/dej/invoices/[id] - Delete invoice
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    const { error } = await supabase
        .from("dej_invoices")
        .delete()
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
