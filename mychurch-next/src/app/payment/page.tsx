import React from "react";
import { getPaymentConfig } from "@/actions/payment-config";
import PaymentPageClient from "./PaymentPageClient";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ searchParams }: { searchParams?: { status?: string } | Promise<{ status?: string }> }) {
    const config = await getPaymentConfig();
    const params = (await Promise.resolve(searchParams ?? {})) || {};

    return <PaymentPageClient config={config} status={params.status || null} />;
}
