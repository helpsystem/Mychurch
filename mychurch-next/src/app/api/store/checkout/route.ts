import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";
import { createAdminClient } from "@/utils/supabase/server";
import { sendMail } from "@/lib/mailer";
import React from "react";
import { render } from "@react-email/components";
import ReceiptEmail from "@/emails/receipt";
import crypto from "crypto";

const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN || "";
const isProduction = process.env.NODE_ENV === "production";

const squareClient = new SquareClient({
    token: squareAccessToken,
    environment: isProduction ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

const shippoApiKey = process.env.SHIPPO_API_KEY || "";

interface CheckoutRequest {
    cart: { id: string; quantity: number }[];
    email: string;
    shippingAddress: {
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    sourceId: string;
}

// Shippo Label Purchase Helper
async function createShippoLabel(shippingAddress: any, totalWeightGrams: number) {
    try {
        console.log(`[Shippo] 🚚 Creating shipping label for ${totalWeightGrams}g...`);
        const weightOunces = Math.max(1, Math.round(totalWeightGrams * 0.035274));

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
            throw new Error(`Shippo shipment failed: ${errText}`);
        }

        const shipment = await shipmentResponse.json();
        const rates = shipment.rates || [];
        
        if (rates.length === 0) {
            throw new Error("No shipping rates returned from Shippo.");
        }

        const cheapestRate = rates.reduce((cheapest: any, current: any) => {
            return Number(current.amount) < Number(cheapest.amount) ? current : cheapest;
        }, rates[0]);

        console.log(`[Shippo] Selected cheapest rate: ${cheapestRate.provider} - $${cheapestRate.amount}`);

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
            throw new Error(`Shippo transaction error: ${transaction.status}`);
        }
    } catch (e: any) {
        console.error("[Shippo] ❌ Label purchase skipped/failed:", e.message || e);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as CheckoutRequest;
        const { cart, email, shippingAddress, sourceId } = body;

        if (!cart || cart.length === 0 || !email || !shippingAddress || !sourceId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // 1. Fetch products from database to prevent price tampering
        const productIds = cart.map(item => item.id);
        const { data: dbProducts, error: dbError } = await supabase
            .from("products")
            .select("id, title, price, weight_grams, inventory")
            .in("id", productIds);

        if (dbError || !dbProducts) {
            console.error("[Store Checkout] ❌ Product validation failed:", dbError);
            return NextResponse.json({ error: "Failed to validate products" }, { status: 500 });
        }

        const orderItems: any[] = [];
        let totalWeightGrams = 0;
        let subtotal = 0;

        for (const cartItem of cart) {
            const dbProduct = dbProducts.find(p => p.id === cartItem.id);
            if (!dbProduct) {
                return NextResponse.json({ error: `Product not found: ${cartItem.id}` }, { status: 400 });
            }
            if (dbProduct.inventory < cartItem.quantity) {
                return NextResponse.json({ error: `Insufficient inventory for: ${dbProduct.title}` }, { status: 400 });
            }

            subtotal += Number(dbProduct.price) * cartItem.quantity;
            totalWeightGrams += Number(dbProduct.weight_grams) * cartItem.quantity;

            orderItems.push({
                product_id: dbProduct.id,
                title: dbProduct.title,
                price: Number(dbProduct.price),
                weight_grams: Number(dbProduct.weight_grams),
                quantity: cartItem.quantity,
            });
        }

        // 2. Shipping calculation: Base $5.99 + $0.01 per gram
        const baseShipping = 5.99;
        const shippingCost = baseShipping + (totalWeightGrams * 0.01);
        const totalAmount = subtotal + shippingCost;

        console.log(`[Store Checkout] 💸 Total to charge: $${totalAmount.toFixed(2)} (Subtotal: $${subtotal.toFixed(2)}, Shipping: $${shippingCost.toFixed(2)})`);

        // 3. Process Card Payment via Square SDK
        const idempotencyKey = crypto.randomUUID();
        const amountInCents = Math.round(totalAmount * 100);

        let paymentResponse;
        try {
            paymentResponse = await squareClient.payments.create({
                sourceId: sourceId,
                idempotencyKey: idempotencyKey,
                amountMoney: {
                    amount: BigInt(amountInCents),
                    currency: "USD",
                },
            });
        } catch (paymentErr: any) {
            console.error("[Store Checkout] ❌ Square Payment API error:", paymentErr);
            const errMsg = paymentErr.errors?.[0]?.detail || paymentErr.message || "Payment processing failed";
            return NextResponse.json({ error: errMsg }, { status: 400 });
        }

        const paymentResult = paymentResponse.payment;
        if (!paymentResult || paymentResult.status === "FAILED") {
            console.error("[Store Checkout] ❌ Square Payment failed. Result:", paymentResponse);
            return NextResponse.json({ error: "Card payment was declined." }, { status: 400 });
        }

        console.log(`[Store Checkout] ✅ Square Payment succeeded: ${paymentResult.id}`);

        // 4. Generate Shippo Label
        const shippoResult = await createShippoLabel(shippingAddress, totalWeightGrams);

        // 5. Insert order into DB
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_email: email,
                items: orderItems,
                total_amount: totalAmount,
                shipping_address: shippingAddress,
                payment_status: "paid",
                shipping_cost: shippingCost,
                tracking_number: shippoResult?.trackingNumber || null,
                shipping_label_url: shippoResult?.labelUrl || null,
                shippo_object_id: shippoResult?.shippoObjectId || null,
            })
            .select("id")
            .single();

        if (orderError || !orderData) {
            console.error("[Store Checkout] ❌ Failed to log order to database:", orderError);
            return NextResponse.json({
                success: true,
                warning: "Payment succeeded but order logging failed.",
                paymentId: paymentResult.id,
            });
        }

        // 6. Subtract inventories from products
        for (const item of orderItems) {
            try {
                const { data: prod } = await supabase
                    .from("products")
                    .select("inventory")
                    .eq("id", item.product_id)
                    .single();

                if (prod) {
                    const newInventory = Math.max(0, prod.inventory - item.quantity);
                    await supabase
                        .from("products")
                        .update({ inventory: newInventory })
                        .eq("id", item.product_id);
                }
            } catch (invErr) {
                console.error(`[Store Checkout] ⚠️ Stock deduction failed for ${item.title}:`, invErr);
            }
        }

        // 7. Send Receipt Email
        try {
            console.log(`[Store Checkout] 📧 Dispatching receipt email to: ${email}`);
            const html = await render(React.createElement(ReceiptEmail, {
                orderId: orderData.id,
                fullName: shippingAddress.name,
                items: orderItems,
                subtotal: subtotal,
                shippingCost: shippingCost,
                total: totalAmount,
                trackingNumber: shippoResult?.trackingNumber,
                trackingUrl: shippoResult?.trackingNumber
                    ? `https://goshippo.com/tracking/${shippoResult.trackingNumber}`
                    : undefined,
            }));

            const text = await render(React.createElement(ReceiptEmail, {
                orderId: orderData.id,
                fullName: shippingAddress.name,
                items: orderItems,
                subtotal: subtotal,
                shippingCost: shippingCost,
                total: totalAmount,
                trackingNumber: shippoResult?.trackingNumber,
                trackingUrl: shippoResult?.trackingNumber
                    ? `https://goshippo.com/tracking/${shippoResult.trackingNumber}`
                    : undefined,
            }), { plainText: true });

            await sendMail({
                to: email,
                subject: `رسید خرید سفارش #${orderData.id.slice(0, 8)} | Order Receipt - ICC Store`,
                text,
                html,
            });
        } catch (emailErr: any) {
            console.error("[Store Checkout] ❌ Failed to send receipt email:", emailErr.message || emailErr);
        }

        return NextResponse.json({ success: true, orderId: orderData.id });
    } catch (err: any) {
        console.error("[Store Checkout] ❌ Checkout API error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
