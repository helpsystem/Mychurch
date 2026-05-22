import React from "react";
import { recordGiftEvent } from "@/actions/gift-events";
import { getPaymentConfig } from "@/actions/payment-config";
import PaymentPageClient from "./PaymentPageClient";

export const dynamic = "force-dynamic";

export default async function PaymentPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const config = await getPaymentConfig();
    const params = await searchParams;

    const status = typeof params.status === "string" ? params.status : null;
    const giftRef = typeof params.gift_ref === "string" && params.gift_ref.trim() ? params.gift_ref.trim() : null;

    if (giftRef && (status === "success" || status === "cancelled")) {
        await recordGiftEvent({
            provider: config.provider,
            status,
            amount: Number(config.monthly_amount),
            currency: config.currency || "usd",
            giftRef,
            source: "payment-return",
            metadata: { checkout_mode: config.checkout_mode },
        });
    }

    return <PaymentPageClient config={config} status={status} />;
}
