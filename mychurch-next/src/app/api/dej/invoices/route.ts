import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/dej/invoices - List all invoices
export async function GET() {
    const { data, error } = await supabase
        .from("dej_invoices")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST /api/dej/invoices - Create new invoice
export async function POST(req: Request) {
    const body = await req.json();

    // Generate invoice number server-side
    const { data: numData, error: numError } = await supabase
        .rpc("next_dej_invoice_number");

    if (numError) return NextResponse.json({ error: numError.message }, { status: 500 });

    const invoice = {
        invoice_number: numData,
        to_company: body.to_company || "DEJ TV",
        freelancer_name: body.freelancer_name,
        freelancer_address: body.freelancer_address || null,
        invoice_date: body.invoice_date,
        due_date: body.due_date || null,
        items: body.items,
        subtotal: body.subtotal,
        discount_percent: body.discount_percent || 0,
        total_amount: body.total_amount,
        currency: body.currency || "USD",
        wallet_tether: body.wallet_tether || null,
        payment_status: "unpaid",
        notes: body.notes || null,
    };

    const { data, error } = await supabase
        .from("dej_invoices")
        .insert(invoice)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}
