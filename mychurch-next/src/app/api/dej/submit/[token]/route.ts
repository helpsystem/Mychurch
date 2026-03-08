import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/dej/submit/[token] - Validate token and get link details
export async function GET(req: Request, { params }: { params: { token: string } }) {
    const { data, error } = await supabase
        .from("dej_submission_links")
        .select("*")
        .eq("token", params.token)
        .single();

    if (error || !data) return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
    if (data.is_used) return NextResponse.json({ error: "This link has already been used." }, { status: 410 });
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return NextResponse.json({ error: "This link has expired." }, { status: 410 });
    }

    return NextResponse.json(data);
}

// POST /api/dej/submit/[token] - Submit timesheet and create invoice
export async function POST(req: Request, { params }: { params: { token: string } }) {
    // 1. Validate token
    const { data: link, error: linkError } = await supabase
        .from("dej_submission_links")
        .select("*")
        .eq("token", params.token)
        .single();

    if (linkError || !link) return NextResponse.json({ error: "Invalid link." }, { status: 404 });
    if (link.is_used) return NextResponse.json({ error: "Already submitted." }, { status: 410 });
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return NextResponse.json({ error: "Link expired." }, { status: 410 });
    }

    const body = await req.json();

    // 2. Generate invoice number
    const { data: invNum } = await supabase.rpc("next_dej_invoice_number");

    // 3. Compute totals from submitted items
    const items = body.items as { description: string; hours: number; rate: number; total: number }[];
    const subtotal = items.reduce((s, i) => s + i.total, 0);

    // 4. Create invoice
    const invoice = {
        invoice_number: invNum,
        to_company: link.to_company,
        freelancer_name: body.freelancer_name,
        freelancer_address: body.freelancer_address || null,
        invoice_date: new Date().toISOString().split("T")[0],
        items: items.map(({ description, hours, rate, total }) => ({
            description,
            quantity: hours,
            unit_price: rate,
            total,
        })),
        subtotal,
        discount_percent: 0,
        total_amount: subtotal,
        currency: "USD",
        wallet_tether: body.wallet_tether || null,
        payment_status: "unpaid",
        notes: body.notes || `Submitted via: ${link.label}`,
    };

    const { data: createdInvoice, error: invoiceError } = await supabase
        .from("dej_invoices")
        .insert(invoice)
        .select()
        .single();

    if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 });

    // 5. Mark link as used
    await supabase
        .from("dej_submission_links")
        .update({ is_used: true, invoice_id: createdInvoice.id })
        .eq("token", params.token);

    return NextResponse.json({ success: true, invoice_id: createdInvoice.id, invoice_number: createdInvoice.invoice_number });
}
