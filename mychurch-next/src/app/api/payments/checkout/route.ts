import { NextResponse } from "next/server";
import { recordGiftEvent } from "@/actions/gift-events";
import { getPaymentConfig, getPaymentSecretKey } from "@/actions/payment-config";
import { resolvePublicSiteUrl } from "@/lib/site-url";

export async function POST(request: Request) {
    const config = await getPaymentConfig();
    const giftRef = (globalThis.crypto && (globalThis.crypto as any).randomUUID)
        ? (globalThis.crypto as any).randomUUID()
        : `gift-${Date.now()}`;

    if (!config.enabled) {
        return NextResponse.json({ error: "Payments are currently disabled" }, { status: 403 });
    }

    let amount = Number(config.monthly_amount);
    let message = "";
    try {
        const body = await request.json();
        if (body) {
            if (Number.isFinite(Number(body.amount)) && Number(body.amount) > 0) {
                amount = Number(body.amount);
            }
            if (body.message) {
                message = String(body.message);
            }
        }
    } catch (e) {}

    if (config.payment_link_url && config.checkout_mode === "payment") {
        await recordGiftEvent({
            provider: config.provider,
            status: "checkout_started",
            amount: amount,
            currency: config.currency || "usd",
            giftRef,
            source: "checkout-api",
            metadata: { payment_link_mode: true, message: message || undefined },
        });

        const paymentLinkUrlObj = new URL(config.payment_link_url);
        paymentLinkUrlObj.searchParams.set("gift_ref", giftRef);
        return NextResponse.json({ url: paymentLinkUrlObj.toString(), mode: "payment_link", gift_ref: giftRef });
    }

    const secretKey = await getPaymentSecretKey(config.provider);
    if (!secretKey) {
        if (config.payment_link_url) {
            return NextResponse.json({ url: config.payment_link_url, mode: "payment_link" });
        }
        return NextResponse.json({ error: "Payment provider secret key is not configured" }, { status: 400 });
    }

    const siteUrl = resolvePublicSiteUrl();
    const successPath = config.success_path || "/payment?status=success";
    const cancelPath = config.cancel_path || "/payment?status=cancelled";
    const successURLObject = new URL(successPath, siteUrl);
    const cancelURLObject = new URL(cancelPath, siteUrl);
    successURLObject.searchParams.set("gift_ref", giftRef);
    cancelURLObject.searchParams.set("gift_ref", giftRef);
    if (config.provider !== "square") {
        successURLObject.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
    }
    const successUrl = successURLObject.toString();
    const cancelUrl = cancelURLObject.toString();
    const amountInCents = Math.max(100, Math.round(amount * 100));
    const mode = config.checkout_mode === "payment" ? "payment" : "subscription";
    const productName = config.display_name_en || config.display_name_fa || "Monthly Support";

    await recordGiftEvent({
        provider: config.provider,
        status: "checkout_started",
        amount: amount,
        currency: config.currency || "usd",
        giftRef,
        source: "checkout-api",
        metadata: {
            checkout_mode: config.checkout_mode,
            payment_link_mode: false,
            message: message || undefined,
        },
    });

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

    if (message) {
        params.set("metadata[message]", message.slice(0, 500));
    }

    // Handle Square provider
    if (config.provider === "square") {
        try {
            const appId = config.square_application_id || process.env.SQUARE_APPLICATION_ID || null;
            const isSandbox = typeof appId === "string" && appId.startsWith("sandbox");
            const base = isSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";

            // Fetch locations to determine a location_id if not configured
            let locationId = config.square_location_id || null;
            if (!locationId) {
                const locRes = await fetch(`${base}/v2/locations`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${secretKey}`,
                        "Content-Type": "application/json",
                    },
                });
                const locData = await locRes.json();
                if (Array.isArray(locData?.locations) && locData.locations.length > 0) {
                    locationId = locData.locations[0].id;
                }
            }

            if (!locationId) {
                throw new Error("Square location_id not found or configured");
            }

            const idempotency_key = (globalThis.crypto && (globalThis.crypto as any).randomUUID) ? (globalThis.crypto as any).randomUUID() : String(Date.now());

            const body = {
                idempotency_key,
                order: {
                    location_id: locationId,
                    reference_id: giftRef,
                    metadata: {
                        message: message ? message.slice(0, 500) : "No message"
                    },
                    line_items: [
                        {
                            name: productName,
                            quantity: "1",
                            base_price_money: {
                                amount: amountInCents,
                                currency: (config.currency || "USD").toUpperCase(),
                            },
                        },
                    ],
                },
                checkout_options: {
                    redirect_url: successUrl,
                },
            };

            const linkRes = await fetch(`${base}/v2/online-checkout/payment-links`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const linkData = await linkRes.json();
            if (!linkRes.ok) {
                const message = linkData?.message || linkData?.errors || "Failed to create Square payment link";
                await recordGiftEvent({
                    provider: "square",
                    status: "error",
                    amount: amount,
                    currency: config.currency || "usd",
                    giftRef,
                    source: "checkout-api",
                    metadata: { message: typeof message === "string" ? message : linkData?.errors || null },
                });
                return NextResponse.json({ error: typeof message === "string" ? message : JSON.stringify(message) }, { status: 400 });
            }

            const url = linkData?.payment_link?.url;
            if (!url) {
                await recordGiftEvent({
                    provider: "square",
                    status: "error",
                    amount: amount,
                    currency: config.currency || "usd",
                    giftRef,
                    source: "checkout-api",
                    metadata: { message: "Square did not return a payment link URL" },
                });
                return NextResponse.json({ error: "Square did not return a payment link URL" }, { status: 400 });
            }

            return NextResponse.json({ url, mode: "checkout", gift_ref: giftRef });
        } catch (err: any) {
            await recordGiftEvent({
                provider: "square",
                status: "error",
                amount: amount,
                currency: config.currency || "usd",
                giftRef,
                source: "checkout-api",
                metadata: { message: err?.message || String(err) },
            });
            return NextResponse.json({ error: err?.message || String(err) }, { status: 400 });
        }
    }

    // Fallback: Stripe
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
        await recordGiftEvent({
            provider: "stripe",
            status: "error",
            amount: amount,
            currency: config.currency || "usd",
            giftRef,
            source: "checkout-api",
            metadata: { message },
        });
        return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!data?.url) {
        await recordGiftEvent({
            provider: "stripe",
            status: "error",
            amount: amount,
            currency: config.currency || "usd",
            giftRef,
            source: "checkout-api",
            metadata: { message: "Stripe did not return a checkout URL" },
        });
        return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 400 });
    }

    return NextResponse.json({ url: data.url, mode: "checkout", gift_ref: giftRef });
}
