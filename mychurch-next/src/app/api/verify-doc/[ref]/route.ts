import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const resolvedParams = await params;
  const ref = decodeURIComponent(resolvedParams.ref).trim().toUpperCase();

  try {
    // 1. Check unified document_history table first
    const { data: unifiedDoc } = await supabase
      .from("document_history")
      .select("id, document_type, title, description, document_content, recipient_name, recipient_address, created_at, is_draft")
      .ilike("description", `%${ref}%`)
      .maybeSingle();

    if (unifiedDoc) {
      const content = (unifiedDoc.document_content || {}) as any;
      const docType = unifiedDoc.document_type;
      
      // Determine the reference number
      const docRef = content.refNo || ref;
      
      // Calculate amount if in-kind
      let amt = content.amount || content.invoiceTotalAmount;
      if (docType === "inkind" && content.inKindItems) {
        amt = content.inKindItems.reduce((acc: number, item: any) => acc + (item.value * item.qty), 0);
      }

      return NextResponse.json({
        found: true,
        type: docType === "inkind" ? "receipt" : docType, // normalize inkind to receipt for UI
        ref: docRef,
        valid: !unifiedDoc.is_draft,
        donor: content.donorName || content.recipient || unifiedDoc.recipient_name,
        to: docType === "invoice" ? content.invoiceTo : undefined,
        recipient: docType === "letter" ? (content.recipient || unifiedDoc.recipient_name) : undefined,
        subject: content.subject || unifiedDoc.title,
        amount: amt,
        date: content.date || content.invoiceDate || content.timestamp || unifiedDoc.created_at,
      });
    }

    // 2. Check receipts fallback
    const { data: receipt } = await supabase
      .from("donation_receipts")
      .select("id, ref_number, donor_name, amount, currency, date, church_ein, is_valid")
      .ilike("ref_number", ref)
      .maybeSingle();

    if (receipt) {
      return NextResponse.json({
        found: true,
        type: "receipt",
        ref: receipt.ref_number,
        valid: receipt.is_valid !== false,
        donor: receipt.donor_name,
        amount: receipt.amount,
        currency: receipt.currency,
        date: receipt.date,
        church_ein: receipt.church_ein,
      });
    }

    // 3. Check invoices fallback
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, invoice_no, invoice_to, total_amount, date, is_valid")
      .ilike("invoice_no", ref.replace(/^INV-/, ''))
      .maybeSingle();

    if (invoice) {
      return NextResponse.json({
        found: true,
        type: "invoice",
        ref: `INV-${invoice.invoice_no}`,
        valid: invoice.is_valid !== false,
        to: invoice.invoice_to,
        amount: invoice.total_amount,
        date: invoice.date,
      });
    }

    // 4. Check letters fallback
    const { data: letter } = await supabase
      .from("church_letters")
      .select("id, ref_number, recipient_name, subject, date, is_valid")
      .ilike("ref_number", ref)
      .maybeSingle();

    if (letter) {
      return NextResponse.json({
        found: true,
        type: "letter",
        ref: letter.ref_number,
        valid: letter.is_valid !== false,
        recipient: letter.recipient_name,
        subject: letter.subject,
        date: letter.date,
      });
    }

    return NextResponse.json({ found: false, ref });
  } catch (e) {
    console.error("[verify-doc]", e);
    return NextResponse.json({ found: false, ref, error: "lookup_failed" });
  }
}
