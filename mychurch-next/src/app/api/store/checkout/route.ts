import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/utils/supabase/server";
import { resolvePublicSiteUrl } from "@/lib/site-url";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeSecret, {
    apiVersion: "2025-02-24.acacia" as any, // standard acacia API version or latest supported by the package
});

interface CheckoutRequest {
    cart: { id: string; quantity: number }[];
    email?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as CheckoutRequest;
        const { cart, email } = body;

        if (!cart || cart.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        const supabase = await createAdminClient();
        
        // Fetch all products in the cart from the DB to prevent price tampering
        const productIds = cart.map(item => item.id);
        const { data: dbProducts, error: dbError } = await supabase
            .from("products")
            .select("id, title, price, weight_grams, inventory")
            .in("id", productIds);

        if (dbError || !dbProducts) {
            console.error("[Store Checkout] ❌ Failed to fetch products:", dbError);
            return NextResponse.json({ error: "Failed to validate products" }, { status: 500 });
        }

        // Build list of valid line items and calculate total weight/costs
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        const orderItems: any[] = [];
        let totalWeightGrams = 0;
        let subtotal = 0;

        for (const cartItem of cart) {
            const dbProduct = dbProducts.find(p => p.id === cartItem.id);
            if (!dbProduct) {
                return NextResponse.json({ error: `Product not found: ${cartItem.id}` }, { status: 400 });
            }
            if (dbProduct.inventory < cartItem.quantity) {
                return NextResponse.json({ error: `Insufficient stock for: ${dbProduct.title}` }, { status: 400 });
            }

            subtotal += Number(dbProduct.price) * cartItem.quantity;
            totalWeightGrams += Number(dbProduct.weight_grams) * cartItem.quantity;

            lineItems.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: dbProduct.title,
                        description: `Weight: ${dbProduct.weight_grams}g`,
                    },
                    unit_amount: Math.round(Number(dbProduct.price) * 100), // Stripe expects cents
                },
                quantity: cartItem.quantity,
            });

            orderItems.push({
                product_id: dbProduct.id,
                title: dbProduct.title,
                price: Number(dbProduct.price),
                weight_grams: Number(dbProduct.weight_grams),
                quantity: cartItem.quantity,
            });
        }

        // Calculate dynamic shipping cost based on weight:
        // Base rate: $5.99, plus $0.01 per gram of total weight
        const baseShipping = 5.99;
        const shippingCost = baseShipping + (totalWeightGrams * 0.01);
        const totalAmount = subtotal + shippingCost;

        // Add shipping fee as a line item to Stripe Checkout Session
        lineItems.push({
            price_data: {
                currency: "usd",
                product_data: {
                    name: "Shipping & Handling (Calculated by weight)",
                    description: `Total Weight: ${totalWeightGrams}g`,
                },
                unit_amount: Math.round(shippingCost * 100), // in cents
            },
            quantity: 1,
        });

        // Generate unique order ID beforehand
        const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_email: email || "anonymous@iranianchurchdc.org",
                items: orderItems,
                total_amount: totalAmount,
                shipping_address: {}, // Will be filled on webhook callback from Stripe shipping details
                payment_status: "pending",
                shipping_cost: shippingCost,
            })
            .select("id")
            .single();

        if (orderError || !orderData) {
            console.error("[Store Checkout] ❌ Failed to create pending order:", orderError);
            return NextResponse.json({ error: "Failed to create order record" }, { status: 500 });
        }

        const siteUrl = resolvePublicSiteUrl();

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            customer_email: email || undefined,
            client_reference_id: orderData.id, // Links Stripe session directly to order ID
            metadata: {
                order_id: orderData.id,
                total_weight_grams: totalWeightGrams.toString(),
            },
            shipping_address_collection: {
                allowed_countries: ["US", "CA"],
            },
            success_url: `${siteUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/store?canceled=true`,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error("[Store Checkout] ❌ Checkout session error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
