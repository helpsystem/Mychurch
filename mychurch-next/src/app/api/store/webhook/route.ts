import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";
import { sendMail } from "@/lib/mailer";
import React from "react";
import { render } from "@react-email/components";
import ReceiptEmail from "@/emails/receipt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia" as any,
});

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const shippoApiKey = process.env.SHIPPO_API_KEY || "";

// Helper to interact with Shippo REST API directly
async function createShippoLabel(shippingAddress: any, totalWeightGrams: number) {
    try {
        console.log(`[Shippo] 🚚 Initiating shipping label generation for ${totalWeightGrams}g...`);
        
        // Convert weight to ounces (Shippo commonly uses oz for USPS parcels)
        const weightOunces = Math.max(1, Math.round(totalWeightGrams * 0.035274));

        // Create Shipment
        const shipmentResponse = await fetch("https://api.goshippo.com/shipments/", {
            method: "POST",
            headers: {
                "Authorization": `ShippoToken ${shippoApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                address_from: {
                    name: "Iranian Christian Church DC",
                    street1: "8100 Glenbrook Rd",
                    city: "Bethesda",
                    state: "MD",
                    zip: "20814",
                    country: "US",
                    phone: "+13016563333",
                    email: "info@iranianchurchdc.org",
                },
                address_to: {
                    name: shippingAddress.name,
                    street1: shippingAddress.line1,
                    street2: shippingAddress.line2 || "",
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zip: shippingAddress.postal_code,
                    country: shippingAddress.country,
                },
                parcels: [{
                    length: "10",
                    width: "8",
                    height: "6",
                    distance_unit: "in",
                    weight: weightOunces.toString(),
                    mass_unit: "oz",
                }],
                async: false,
            }),
        });

        if (!shipmentResponse.ok) {
            const errText = await shipmentResponse.text();
            throw new Error(`Shippo shipment creation failed: ${errText}`);
        }

        const shipment = await shipmentResponse.json();
        const rates = shipment.rates || [];
        
        if (rates.length === 0) {
            throw new Error("No shipping rates returned from Shippo.");
        }

        // Find the cheapest rate (typically USPS Ground Advantage or Media Mail)
        const cheapestRate = rates.reduce((cheapest: any, current: any) => {
            return Number(current.amount) < Number(cheapest.amount) ? current : cheapest;
        }, rates[0]);

        console.log(`[Shippo] 💸 Selected cheapest shipping option: ${cheapestRate.provider} (${cheapestRate.servicelevel.name}) - $${cheapestRate.amount}`);

        // Purchase Transaction / Label
        const transactionResponse = await fetch("https://api.goshippo.com/transactions/", {
            method: "POST",
            headers: {
                "Authorization": `ShippoToken ${shippoApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                rate: cheapestRate.object_id,
                label_file_type: "PDF",
                async: false,
            }),
        });

        if (!transactionResponse.ok) {
            const errText = await transactionResponse.text();
            throw new Error(`Shippo label purchase failed: ${errText}`);
        }

        const transaction = await transactionResponse.json();

        if (transaction.status === "SUCCESS") {
            return {
                trackingNumber: transaction.tracking_number,
                labelUrl: transaction.label_url,
                shippoObjectId: transaction.object_id,
            };
        } else {
            throw new Error(`Transaction status: ${transaction.status}. Messages: ${JSON.stringify(transaction.messages)}`);
        }
    } catch (e: any) {
        console.error("[Shippo] ❌ Shipping label generation exception:", e.message || e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    const bodyText = await req.text();
    const sig = req.headers.get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(bodyText, sig, stripeWebhookSecret);
    } catch (err: any) {
        console.error(`[Store Webhook] ❌ Signature verification failed:`, err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`[Store Webhook] 🔔 Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id || session.client_reference_id;
        const totalWeightGrams = Number(session.metadata?.total_weight_grams || "0");

        if (!orderId) {
            console.error("[Store Webhook] ❌ No order_id linked in metadata/reference.");
            return NextResponse.json({ error: "No order ID found" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Get shipping info from checkout session
        const shippingDetails = session.shipping_details;
        const customerEmail = session.customer_details?.email || "";
        const customerName = shippingDetails?.name || session.customer_details?.name || "Church Member";

        const shippingAddress = {
            name: customerName,
            line1: shippingDetails?.address?.line1 || "",
            line2: shippingDetails?.address?.line2 || "",
            city: shippingDetails?.address?.city || "",
            state: shippingDetails?.address?.state || "",
            postal_code: shippingDetails?.address?.postal_code || "",
            country: shippingDetails?.address?.country || "US",
        };

        console.log(`[Store Webhook] 🛒 Processing payment for Order ID: ${orderId}`);

        // 1. Fetch current order items
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            console.error("[Store Webhook] ❌ Failed to fetch order:", orderError);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // 2. Generate Shippo Label
        const shippoResult = await createShippoLabel(shippingAddress, totalWeightGrams);

        // 3. Update Order status
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                payment_status: "paid",
                user_email: customerEmail || order.user_email,
                shipping_address: shippingAddress,
                tracking_number: shippoResult?.trackingNumber || null,
                shipping_label_url: shippoResult?.labelUrl || null,
                shippo_object_id: shippoResult?.shippoObjectId || null,
            })
            .eq("id", orderId);

        if (updateError) {
            console.error("[Store Webhook] ❌ Failed to update order status:", updateError);
            return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
        }

        // 4. Update product inventories
        for (const item of order.items) {
            try {
                // Read current inventory
                const { data: product } = await supabase
                    .from("products")
                    .select("inventory")
                    .eq("id", item.product_id)
                    .single();

                if (product) {
                    const newInventory = Math.max(0, product.inventory - item.quantity);
                    await supabase
                        .from("products")
                        .update({ inventory: newInventory })
                        .eq("id", item.product_id);
                    console.log(`[Store Webhook] 📦 Adjusted inventory for ${item.title}: ${product.inventory} -> ${newInventory}`);
                }
            } catch (invErr) {
                console.error(`[Store Webhook] ⚠️ Failed to update inventory for ${item.title}:`, invErr);
            }
        }

        // 5. Send receipt email via React Email and Resend SDK
        try {
            console.log(`[Store Webhook] 📧 Sending purchase receipt email to: ${customerEmail}`);
            
            const subtotal = order.total_amount - order.shipping_cost;

            const html = await render(React.createElement(ReceiptEmail, {
                orderId: order.id,
                fullName: customerName,
                items: order.items,
                subtotal: subtotal,
                shippingCost: order.shipping_cost,
                total: order.total_amount,
                trackingNumber: shippoResult?.trackingNumber,
                trackingUrl: shippoResult?.trackingNumber 
                    ? `https://goshippo.com/tracking/${shippoResult.trackingNumber}` 
                    : undefined,
            }));

            const text = await render(React.createElement(ReceiptEmail, {
                orderId: order.id,
                fullName: customerName,
                items: order.items,
                subtotal: subtotal,
                shippingCost: order.shipping_cost,
                total: order.total_amount,
                trackingNumber: shippoResult?.trackingNumber,
                trackingUrl: shippoResult?.trackingNumber 
                    ? `https://goshippo.com/tracking/${shippoResult.trackingNumber}` 
                    : undefined,
            }), { plainText: true });

            await sendMail({
                to: customerEmail,
                subject: `رسید خرید سفارش #${order.id.slice(0, 8)} | Order Receipt - MyChurch Store`,
                text,
                html,
            });
            console.log("[Store Webhook] 📨 Receipt email sent successfully.");
        } catch (emailErr: any) {
            console.error("[Store Webhook] ❌ Failed to send receipt email:", emailErr.message || emailErr);
        }
    }

    return NextResponse.json({ received: true });
}
