import React from "react";
import { getAIConfig } from "@/actions/ai-config";
import { getPaymentConfig } from "@/actions/payment-config";
import SettingsClient from "./SettingsClient";
import PaymentSettingsClient from "./PaymentSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
    const [aiConfig, paymentConfig] = await Promise.all([
        getAIConfig(),
        getPaymentConfig(),
    ]);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-white">System Settings</h1>
                <p className="text-muted-foreground">Manage AI providers, Stripe/Square payments, API keys, and global application configurations.</p>
            </div>

            <SettingsClient initialConfig={aiConfig} />

            <div className="space-y-3">
                <h2 className="text-2xl font-black tracking-tight text-white">Payment Settings</h2>
                <p className="text-sm text-muted-foreground">
                    Configure Square or Stripe in sandbox now and switch to production later without changing the public payment page.
                </p>
            </div>

            <PaymentSettingsClient initialConfig={paymentConfig} />
        </div>
    );
}
