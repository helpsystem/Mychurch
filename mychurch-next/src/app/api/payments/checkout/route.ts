import { NextResponse } from "next/server";
import { getPaymentConfig, getPaymentSecretKey } from "@/actions/payment-config";
import { resolvePublicSiteUrl } from "@/lib/site-url";

export async function POST() {
    const config = await getPaymentConfig();

    if (!config.enabled) {
        return NextResponse.json({ error: "Payments are currently disabled" }, { status: 403 });
    }

    if (config.payment_link_url && config.checkout_mode === "payment") {
        return NextResponse.json({ url: config.payment_link_url, mode: "payment_link" });
    }

    const secretKey = await getPaymentSecretKey();
    if (!secretKey) {
        if (config.payment_link_url) {
            return NextResponse.json({ url: config.payment_link_url, mode: "payment_link" });
        }
        return NextResponse.json({ error: "Stripe secret key is not configured" }, { status: 400 });
    }

    const siteUrl = resolvePublicSiteUrl();
    const successPath = config.success_path || "/payment?status=success";
    const cancelPath = config.cancel_path || "/payment?status=cancelled";
    const successUrl = new URL(successPath, siteUrl).toString();
    const cancelUrl = new URL(cancelPath, siteUrl).toString();
    const amountInCents = Math.max(100, Math.round(Number(config.monthly_amount) * 100));
    const mode = config.checkout_mode === "payment" ? "payment" : "subscription";
    const productName = config.display_name_en || config.display_name_fa || "Monthly Support";

    const params = new URLSearchParams();
    params.set("mode", mode);
    params.set("success_url", successUrl);
    params.set("cancel_url", cancelUrl);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", (config.currency || "usd").toLowerCase());
    params.set("line_items[0][price_data][product_data][name]", productName);
    params.set("line_items[0][price_data][unit_amount]", String(amountInCents));

    if (mode === "subscription") {
        params.set("line_items[0][price_data][recurring][interval]", "month");
    }

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
        const message = data?.error?.message || data?.error || "Failed to create Stripe checkout session";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!data?.url) {
        return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 400 });
    }

    return NextResponse.json({ url: data.url, mode: "checkout" });
}
