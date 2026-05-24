"use server";

import { query } from "@/lib/db";
import { getPaymentConfig, getPaymentSecretKey } from "@/actions/payment-config";
import { sendMail } from "@/lib/mailer";

export type GiftEventStatus = "checkout_started" | "success" | "cancelled" | "error";

export interface GiftEvent {
    id: string;
    provider: "stripe" | "square";
    status: GiftEventStatus;
    amount: number;
    currency: string;
    gift_ref: string;
    source: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

export interface GiftEventInput {
    provider: "stripe" | "square";
    status: GiftEventStatus;
    amount: number;
    currency: string;
    giftRef: string;
    source?: string;
    metadata?: Record<string, unknown> | null;
}

async function ensureGiftEventsSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS church_gift_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            provider TEXT NOT NULL CHECK (provider IN ('stripe', 'square')),
            status TEXT NOT NULL CHECK (status IN ('checkout_started', 'success', 'cancelled', 'error')),
            amount NUMERIC(12,2) NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'usd',
            gift_ref TEXT NOT NULL,
            source TEXT NOT NULL DEFAULT 'payment-page',
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
            UNIQUE (gift_ref, status)
        )
    `);
}

export async function recordGiftEvent(input: GiftEventInput) {
    await ensureGiftEventsSchema();

    await query(
        `
        INSERT INTO church_gift_events (provider, status, amount, currency, gift_ref, source, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (gift_ref, status) DO NOTHING
    `,
        [
            input.provider,
            input.status,
            Math.max(0, Number(input.amount || 0)),
            String(input.currency || "usd").toLowerCase(),
            input.giftRef,
            input.source || "payment-page",
            JSON.stringify(input.metadata || null),
        ],
    );
}

// Fetch Square Payments directly from Square API
async function fetchSquarePayments(secretKey: string, appId: string | null): Promise<GiftEvent[]> {
    const isSandbox = typeof appId === "string" && appId.startsWith("sandbox");
    const base = isSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
    
    try {
        const response = await fetch(`${base}/v2/payments?sort_order=DESC`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${secretKey}`,
                "Content-Type": "application/json",
                "Square-Version": "2024-10-16"
            }
        });
        
        if (!response.ok) {
            console.error("[Square Payments] Failed to fetch:", await response.text());
            return [];
        }
        
        const data = await response.json();
        if (!Array.isArray(data?.payments)) return [];
        
        return data.payments.map((p: any) => {
            const cardholderName = p.card_details?.card?.cardholder_name || null;
            const buyerEmail = p.buyer_email_address || null;
            
            return {
                id: p.id,
                provider: "square",
                status: p.status === "COMPLETED" ? "success" : p.status === "CANCELED" ? "cancelled" : "error",
                amount: (p.amount_money?.amount || 0) / 100,
                currency: p.amount_money?.currency || "usd",
                gift_ref: p.reference_id || p.id,
                source: p.note || "Square Payment",
                metadata: {
                    payer_name: cardholderName,
                    payer_email: buyerEmail,
                    card_brand: p.card_details?.card?.card_brand,
                    last_4: p.card_details?.card?.last_4,
                    receipt_url: p.receipt_url
                },
                created_at: p.created_at
            } as GiftEvent;
        });
    } catch (error) {
        console.error("[Square Payments] Error:", error);
        return [];
    }
}

// Fetch Stripe Payments directly from Stripe API
async function fetchStripePayments(secretKey: string): Promise<GiftEvent[]> {
    try {
        const response = await fetch("https://api.stripe.com/v1/charges?limit=100", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${secretKey}`
            }
        });
        
        if (!response.ok) {
            console.error("[Stripe Payments] Failed to fetch:", await response.text());
            return [];
        }
        
        const data = await response.json();
        if (!Array.isArray(data?.data)) return [];
        
        return data.data.map((c: any) => {
            return {
                id: c.id,
                provider: "stripe",
                status: c.status === "succeeded" ? "success" : c.status === "failed" ? "error" : "cancelled",
                amount: (c.amount || 0) / 100,
                currency: c.currency || "usd",
                gift_ref: c.payment_intent || c.id,
                source: c.description || "Stripe Payment",
                metadata: {
                    payer_name: c.billing_details?.name || c.shipping?.name,
                    payer_email: c.billing_details?.email || c.receipt_email,
                    card_brand: c.payment_method_details?.card?.brand,
                    last_4: c.payment_method_details?.card?.last4,
                    receipt_url: c.receipt_url
                },
                created_at: new Date(c.created * 1000).toISOString()
            } as GiftEvent;
        });
    } catch (error) {
        console.error("[Stripe Payments] Error:", error);
        return [];
    }
}

// Send bilingual thank-you email with receipt link
export async function sendGiftThankYouEmail(email: string, name: string | null, amount: number, currency: string, receiptUrl: string | null) {
    const formattedAmount = `${amount.toFixed(2)} ${currency.toUpperCase()}`;
    const dateStr = new Date().toLocaleDateString("fa-IR");
    const dateStrEn = new Date().toLocaleDateString("en-US");
    const supportEmail = process.env.SMTP_USER || "iranianchurchdc.us@gmail.com";

    const greetingFa = name ? `برادر/خواهر عزیز، جناب آقای/سرکار خانم ${name}` : "اهداکننده گرامی";
    const greetingEn = name ? `Dear ${name}` : "Dear Supporter";

    const receiptButtonHtml = receiptUrl ? `
    <div style="text-align: center; margin: 30px 0;">
        <a href="${receiptUrl}" target="_blank" style="background-color: #ba955c; color: #000000; font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; padding: 12px 25px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 10px rgba(186, 149, 92, 0.2);">
            مشاهده رسید رسمی / View Official Receipt
        </a>
    </div>` : "";

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>سپاسگزاری بابت هدیه شما | Thank You for Your Gift</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0a09; color: #ffffff; font-family: 'Vazirmatn', Tahoma, Geneva, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0a09; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #1c1917; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; padding: 40px 30px; box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.4);">
                        <tr>
                            <td>
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="font-size: 50px; line-height: 1;">💝</span>
                                </div>

                                <div style="text-align: right; direction: rtl; margin-bottom: 30px;">
                                    <h2 style="color: #ba955c; margin: 0 0 15px 0; font-size: 24px; font-weight: bold; font-family: 'Vazirmatn', Tahoma, sans-serif;">سپاسگزاری از هدیه سخاوتمندانه شما</h2>
                                    <p style="font-size: 16px; color: #f5f5f4; margin: 0 0 12px 0; line-height: 1.7; font-family: 'Vazirmatn', Tahoma, sans-serif;">${greetingFa}،</p>
                                    <p style="font-size: 15px; color: #e7e5e4; margin: 0 0 15px 0; line-height: 1.7; font-family: 'Vazirmatn', Tahoma, sans-serif;">
                                        با تشکر و سپاس فراوان از هدیه محبت‌آمیز شما به مبلغ <strong>${formattedAmount}</strong> برای کلیسای ایرانیان واشنگتن دی‌سی.
                                    </p>
                                    <p style="font-size: 15px; color: #d6d3d1; margin: 0 0 20px 0; line-height: 1.7; font-family: 'Vazirmatn', Tahoma, sans-serif;">
                                        پشتیبانی بی‌دریغ شما ما را در ادامه خدمت‌رسانی و رساندن پیام امید و محبت الهی یاری می‌دهد. دعا می‌کنیم که برکت و فیض بی‌پایان خداوند همواره در زندگی شما جاری باشد.
                                    </p>
                                </div>

                                <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 25px 0;"></div>

                                <div dir="ltr" style="text-align: left; margin-bottom: 30px;">
                                    <h2 style="color: #ba955c; margin: 0 0 15px 0; font-size: 20px; font-weight: bold; font-family: Arial, sans-serif;">Thank You for Your Generous Gift</h2>
                                    <p style="font-size: 15px; color: #f5f5f4; margin: 0 0 12px 0; line-height: 1.6; font-family: Arial, sans-serif;">${greetingEn},</p>
                                    <p style="font-size: 14px; color: #e7e5e4; margin: 0 0 15px 0; line-height: 1.6; font-family: Arial, sans-serif;">
                                        We are deeply grateful for your loving gift of <strong>${formattedAmount}</strong> to the Iranian Christian Church of Washington DC.
                                    </p>
                                    <p style="font-size: 14px; color: #d6d3d1; margin: 0 0 20px 0; line-height: 1.6; font-family: Arial, sans-serif;">
                                        Your faithful support helps us sustain our ministries and share God's message of love and hope. May God richly bless you.
                                    </p>
                                </div>

                                ${receiptButtonHtml}

                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a; border: 1px solid rgba(186, 149, 92, 0.2); border-radius: 12px; margin: 25px 0; padding: 15px 20px; font-size: 13px; color: #a8a29e; font-family: Arial, sans-serif;">
                                    <tr>
                                        <td style="padding: 4px 0;" dir="rtl"><strong>مبلغ هدیه / Gift Amount:</strong> <span style="color: #ba955c; font-weight: bold;">${formattedAmount}</span></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0;" dir="rtl"><strong>تاریخ پرداخت / Date:</strong> ${dateStr} (${dateStrEn})</td>
                                    </tr>
                                </table>

                                <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px; font-size: 12px; color: #78716c; font-family: 'Vazirmatn', Tahoma, sans-serif;">
                                    <p style="margin: 0 0 5px 0;">این یک مکاتبه رسمی خودکار از کلیسای مسیحی ایرانی واشنگتن دی‌سی است.</p>
                                    <p dir="ltr" style="margin: 0;">This is an automated official communication from the Iranian Christian Church of Washington DC.</p>
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        await sendMail({
            to: email,
            subject: "سپاسگزاری بابت هدیه شما | Thank you for your gift",
            replyTo: supportEmail,
            html: htmlContent,
        });
    } catch (error) {
        console.error("[Mailer] Failed to send thank-you email:", error);
    }
}

// Process successful payment, extract customer details, record event, and trigger thank-you email
export async function processPaymentSuccess(giftRef: string, sessionId?: string, orderId?: string) {
    await ensureGiftEventsSchema();

    const config = await getPaymentConfig();
    const secretKey = await getPaymentSecretKey(config.provider);

    let amount = Number(config.monthly_amount);
    let currency = config.currency || "usd";
    let payerEmail: string | null = null;
    let payerName: string | null = null;
    let receiptUrl: string | null = null;

    if (secretKey) {
        if (config.provider === "square") {
            // Find payment in Square
            const p = await findSquarePayment(secretKey, config.square_application_id, giftRef, orderId);
            if (p) {
                payerEmail = p.buyer_email_address || null;
                payerName = p.card_details?.card?.cardholder_name || null;
                amount = (p.amount_money?.amount || 0) / 100;
                currency = p.amount_money?.currency || "usd";
                receiptUrl = p.receipt_url || null;
            }
        } else if (sessionId) {
            // Retrieve session from Stripe
            try {
                const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${secretKey}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    payerEmail = data.customer_details?.email || null;
                    payerName = data.customer_details?.name || null;
                    amount = (data.amount_total || 0) / 100;
                    currency = data.currency || "usd";
                    
                    // Fetch latest charge to get receipt_url
                    if (data.payment_intent) {
                        const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${data.payment_intent}`, {
                            headers: { Authorization: `Bearer ${secretKey}` }
                        });
                        if (piRes.ok) {
                            const piData = await piRes.json();
                            const chargeId = piData.latest_charge;
                            if (chargeId) {
                                const chargeRes = await fetch(`https://api.stripe.com/v1/charges/${chargeId}`, {
                                    headers: { Authorization: `Bearer ${secretKey}` }
                                });
                                if (chargeRes.ok) {
                                    const chargeData = await chargeRes.json();
                                    receiptUrl = chargeData.receipt_url || null;
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("[Stripe Session Lookup] Error:", err);
            }
        }
    }

    const metadata = {
        checkout_mode: config.checkout_mode,
        payer_name: payerName,
        payer_email: payerEmail,
        receipt_url: receiptUrl,
        stripe_session_id: sessionId || null,
        square_order_id: orderId || null,
        email_sent: false
    };

    // Check if we already registered a success status for this giftRef
    const { rows: existingRows } = await query(
        "SELECT id, metadata FROM church_gift_events WHERE gift_ref = $1 AND status = 'success'",
        [giftRef]
    );

    const hasEmailBeenSent = existingRows[0]?.metadata?.email_sent === true;

    if (existingRows.length === 0) {
        // Record new success event
        await query(
            `
            INSERT INTO church_gift_events (provider, status, amount, currency, gift_ref, source, metadata)
            VALUES ($1, 'success', $2, $3, $4, 'payment-return', $5::jsonb)
        `,
            [config.provider, amount, currency.toLowerCase(), giftRef, JSON.stringify(metadata)]
        );
    } else {
        // Update existing record metadata with payer details
        const mergedMeta = { ...existingRows[0].metadata, ...metadata, email_sent: hasEmailBeenSent };
        await query(
            "UPDATE church_gift_events SET metadata = $1::jsonb WHERE gift_ref = $2 AND status = 'success'",
            [JSON.stringify(mergedMeta), giftRef]
        );
    }

    // Send thank-you email if we resolved the email address and haven't sent it yet
    if (payerEmail && !hasEmailBeenSent) {
        await sendGiftThankYouEmail(payerEmail, payerName, amount, currency, receiptUrl);
        // Mark as sent in DB
        const updatedMeta = { ...metadata, email_sent: true };
        await query(
            "UPDATE church_gift_events SET metadata = $1::jsonb WHERE gift_ref = $2 AND status = 'success'",
            [JSON.stringify(updatedMeta), giftRef]
        );
    }
}

// Find Square payment by reference_id or order_id
async function findSquarePayment(secretKey: string, appId: string | null, giftRef: string, orderId?: string): Promise<any | null> {
    const isSandbox = typeof appId === "string" && appId.startsWith("sandbox");
    const base = isSandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
    
    try {
        const response = await fetch(`${base}/v2/payments?sort_order=DESC`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${secretKey}`,
                "Content-Type": "application/json",
                "Square-Version": "2024-10-16"
            }
        });
        
        if (!response.ok) return null;
        const data = await response.json();
        if (!Array.isArray(data?.payments)) return null;
        
        return data.payments.find((p: any) => 
            p.reference_id === giftRef || 
            (orderId && p.order_id === orderId)
        ) || null;
    } catch (error) {
        console.error("[Square Payment Lookup] Error:", error);
        return null;
    }
}

export async function getGiftEvents(limit = 100): Promise<GiftEvent[]> {
    await ensureGiftEventsSchema();

    const { rows } = await query(
        `
        SELECT id, provider, status, amount, currency, gift_ref, source, metadata, created_at
        FROM church_gift_events
        ORDER BY created_at DESC
        LIMIT $1
    `,
        [Math.max(1, Math.min(500, Number(limit) || 100))],
    );

    const config = await getPaymentConfig();
    const secretKey = await getPaymentSecretKey(config.provider);
    
    let remoteEvents: GiftEvent[] = [];
    if (config.enabled && secretKey) {
        if (config.provider === "square") {
            remoteEvents = await fetchSquarePayments(secretKey, config.square_application_id);
        } else {
            remoteEvents = await fetchStripePayments(secretKey);
        }
    }

    const mergedMap = new Map<string, GiftEvent>();
    
    rows.forEach((row: any) => {
        mergedMap.set(row.gift_ref || row.id, {
            ...row,
            amount: Number(row.amount)
        });
    });
    
    remoteEvents.forEach((evt) => {
        const key = evt.gift_ref || evt.id;
        const existing = mergedMap.get(key);
        if (existing) {
            mergedMap.set(key, {
                ...existing,
                status: evt.status,
                metadata: {
                    ...existing.metadata,
                    ...evt.metadata
                }
            });
        } else {
            mergedMap.set(key, evt);
        }
    });

    const sorted = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return sorted.slice(0, limit);
}

export async function getGiftNotificationsSummary() {
    await ensureGiftEventsSchema();

    const { rows } = await query(
        `
        SELECT
            COUNT(*) FILTER (WHERE created_at > timezone('utc'::text, now()) - interval '24 hours')::int AS last_24h,
            COUNT(*) FILTER (WHERE status = 'success')::int AS total_success,
            COUNT(*) FILTER (WHERE status = 'cancelled')::int AS total_cancelled,
            COUNT(*)::int AS total
        FROM church_gift_events
    `,
    );

    return rows[0] || { last_24h: 0, total_success: 0, total_cancelled: 0, total: 0 };
}

export async function resendGiftEmailAction(giftRef: string) {
    try {
        await ensureGiftEventsSchema();
        
        // Find in local DB
        const { rows } = await query(
            "SELECT amount, currency, metadata FROM church_gift_events WHERE gift_ref = $1 AND status = 'success'",
            [giftRef]
        );

        let amount = 25;
        let currency = "usd";
        let payerEmail: string | null = null;
        let payerName: string | null = null;
        let receiptUrl: string | null = null;

        if (rows.length > 0) {
            const row = rows[0];
            amount = Number(row.amount);
            currency = row.currency || "usd";
            const meta = row.metadata || {};
            payerEmail = meta.payer_email || null;
            payerName = meta.payer_name || null;
            receiptUrl = meta.receipt_url || null;
        } else {
            // If not logged in DB, fetch from remote APIs
            const config = await getPaymentConfig();
            const secretKey = await getPaymentSecretKey(config.provider);
            if (secretKey) {
                if (config.provider === "square") {
                    const p = await findSquarePayment(secretKey, config.square_application_id, giftRef);
                    if (p) {
                        payerEmail = p.buyer_email_address || null;
                        payerName = p.card_details?.card?.cardholder_name || null;
                        amount = (p.amount_money?.amount || 0) / 100;
                        currency = p.amount_money?.currency || "usd";
                        receiptUrl = p.receipt_url || null;
                    }
                } else {
                    // Try stripe
                    try {
                        const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${giftRef}`, {
                            headers: { Authorization: `Bearer ${secretKey}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            payerEmail = data.customer_details?.email || null;
                            payerName = data.customer_details?.name || null;
                            amount = (data.amount_total || 0) / 100;
                            currency = data.currency || "usd";
                        }
                    } catch (e) {}
                }
            }
        }

        if (!payerEmail) {
            return { error: "اطلاعات ایمیل پرداخت‌کننده یافت نشد / Payer email details not found" };
        }

        await sendGiftThankYouEmail(payerEmail, payerName, amount, currency, receiptUrl);
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Failed to resend email" };
    }
}
