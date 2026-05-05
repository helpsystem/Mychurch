"use server";

import { query } from "@/lib/db";
import { getUserRole } from "@/utils/rbac";

export interface PaymentConfig {
    id: string;
    enabled: boolean;
    provider: "stripe" | "square";
    checkout_mode: "subscription" | "payment";
    monthly_amount: number;
    currency: string;
    display_name_en: string;
    display_name_fa: string;
    description_en: string;
    description_fa: string;
    payment_link_url: string | null;
    stripe_publishable_key: string | null;
    stripe_secret_key: string | null;
    square_application_id: string | null;
    square_access_token: string | null;
    square_location_id: string | null;
    success_path: string;
    cancel_path: string;
    updated_at?: string;
}

export interface PaymentConfigClient extends Omit<PaymentConfig, "stripe_secret_key"> {
    stripe_secret_key_configured: boolean;
    square_access_token_configured: boolean;
}

const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
    id: "default",
    enabled: false,
    provider: "stripe",
    checkout_mode: "subscription",
    monthly_amount: 25,
    currency: "usd",
    display_name_en: "Monthly Support",
    display_name_fa: "حمایت ماهانه",
    description_en: "Secure monthly contribution",
    description_fa: "پرداخت ماهانه امن و قابل تنظیم",
    payment_link_url: null,
    stripe_publishable_key: null,
    stripe_secret_key: null,
    square_application_id: null,
    square_access_token: null,
    square_location_id: null,
    success_path: "/payment?status=success",
    cancel_path: "/payment?status=cancelled",
};

function normalizePath(value: unknown, fallback: string) {
    if (typeof value !== "string" || !value.trim()) {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizePaymentConfig(data?: Partial<PaymentConfig> | null): PaymentConfigClient {
    const { stripe_secret_key: _defaultSecret, square_access_token: _defaultSquare, ...safeDefaults } = DEFAULT_PAYMENT_CONFIG;
    const { stripe_secret_key: _incomingSecret, square_access_token: _incomingSquare, ...safeIncoming } = data ?? {};

    return {
        ...safeDefaults,
        ...safeIncoming,
        id: data?.id || "default",
        enabled: Boolean(data?.enabled),
        provider: data?.provider === "square" ? "square" : DEFAULT_PAYMENT_CONFIG.provider,
        checkout_mode: data?.checkout_mode === "payment" ? "payment" : "subscription",
        monthly_amount: Number.isFinite(Number(data?.monthly_amount)) ? Number(data?.monthly_amount) : DEFAULT_PAYMENT_CONFIG.monthly_amount,
        currency: (typeof data?.currency === "string" && data.currency.trim()) ? data.currency.trim().toLowerCase() : DEFAULT_PAYMENT_CONFIG.currency,
        display_name_en: typeof data?.display_name_en === "string" && data.display_name_en.trim() ? data.display_name_en.trim() : DEFAULT_PAYMENT_CONFIG.display_name_en,
        display_name_fa: typeof data?.display_name_fa === "string" && data.display_name_fa.trim() ? data.display_name_fa.trim() : DEFAULT_PAYMENT_CONFIG.display_name_fa,
        description_en: typeof data?.description_en === "string" && data.description_en.trim() ? data.description_en.trim() : DEFAULT_PAYMENT_CONFIG.description_en,
        description_fa: typeof data?.description_fa === "string" && data.description_fa.trim() ? data.description_fa.trim() : DEFAULT_PAYMENT_CONFIG.description_fa,
        payment_link_url: typeof data?.payment_link_url === "string" && data.payment_link_url.trim() ? data.payment_link_url.trim() : null,
        stripe_publishable_key: typeof data?.stripe_publishable_key === "string" && data.stripe_publishable_key.trim() ? data.stripe_publishable_key.trim() : null,
        stripe_secret_key_configured: Boolean(data?.stripe_secret_key),
        square_application_id: typeof data?.square_application_id === "string" && data.square_application_id.trim() ? data.square_application_id.trim() : null,
        square_access_token_configured: Boolean(data?.square_access_token),
        square_location_id: typeof data?.square_location_id === "string" && data.square_location_id.trim() ? data.square_location_id.trim() : null,
        success_path: normalizePath(data?.success_path, DEFAULT_PAYMENT_CONFIG.success_path),
        cancel_path: normalizePath(data?.cancel_path, DEFAULT_PAYMENT_CONFIG.cancel_path),
        updated_at: data?.updated_at,
    };
}

async function ensurePaymentSettingsSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS church_payment_settings (
            id TEXT PRIMARY KEY DEFAULT 'default',
            enabled BOOLEAN DEFAULT FALSE,
            provider TEXT DEFAULT 'stripe' CHECK (provider IN ('stripe','square')),
            checkout_mode TEXT DEFAULT 'subscription' CHECK (checkout_mode IN ('subscription', 'payment')),
            monthly_amount NUMERIC(12, 2) DEFAULT 25,
            currency TEXT DEFAULT 'usd',
            display_name_en TEXT DEFAULT 'Monthly Support',
            display_name_fa TEXT DEFAULT 'حمایت ماهانه',
            description_en TEXT DEFAULT 'Secure monthly contribution',
            description_fa TEXT DEFAULT 'پرداخت ماهانه امن و قابل تنظیم',
            payment_link_url TEXT,
            stripe_publishable_key TEXT,
            stripe_secret_key TEXT,
            square_application_id TEXT,
            square_access_token TEXT,
            square_location_id TEXT,
            success_path TEXT DEFAULT '/payment?status=success',
            cancel_path TEXT DEFAULT '/payment?status=cancelled',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        )
    `);

    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'stripe'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS checkout_mode TEXT DEFAULT 'subscription'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(12, 2) DEFAULT 25`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS display_name_en TEXT DEFAULT 'Monthly Support'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS display_name_fa TEXT DEFAULT 'حمایت ماهانه'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS description_en TEXT DEFAULT 'Secure monthly contribution'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS description_fa TEXT DEFAULT 'پرداخت ماهانه امن و قابل تنظیم'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS payment_link_url TEXT`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS stripe_publishable_key TEXT`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS square_application_id TEXT`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS square_access_token TEXT`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS square_location_id TEXT`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS success_path TEXT DEFAULT '/payment?status=success'`);
    await query(`ALTER TABLE church_payment_settings ADD COLUMN IF NOT EXISTS cancel_path TEXT DEFAULT '/payment?status=cancelled'`);

    await query(`
        INSERT INTO church_payment_settings (id, enabled, provider, checkout_mode, monthly_amount, currency, display_name_en, display_name_fa, description_en, description_fa, success_path, cancel_path)
        SELECT 'default', FALSE, 'stripe', 'subscription', 25, 'usd', 'Monthly Support', 'حمایت ماهانه', 'Secure monthly contribution', 'پرداخت ماهانه امن و قابل تنظیم', '/payment?status=success', '/payment?status=cancelled'
        WHERE NOT EXISTS (SELECT 1 FROM church_payment_settings WHERE id = 'default')
    `);
}

export async function getPaymentConfig(): Promise<PaymentConfigClient> {
    try {
        await ensurePaymentSettingsSchema();
        const { rows } = await query("SELECT * FROM church_payment_settings WHERE id = 'default'");
        const data = rows[0];

        if (!data) {
            return normalizePaymentConfig(DEFAULT_PAYMENT_CONFIG);
        }

        return normalizePaymentConfig(data as Partial<PaymentConfig>);
    } catch (error) {
        console.error("[PaymentConfig] Error fetching config:", error);
        return normalizePaymentConfig(DEFAULT_PAYMENT_CONFIG);
    }
}

export async function getPaymentSecretKey(provider?: PaymentConfig["provider"]): Promise<string | null> {
    try {
        await ensurePaymentSettingsSchema();
        const { rows } = await query("SELECT stripe_secret_key, square_access_token FROM church_payment_settings WHERE id = 'default'");
        const storedStripe = rows[0]?.stripe_secret_key;
        const storedSquare = rows[0]?.square_access_token;
        const envStripe = process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY || null;
        const envSquare = process.env.SQUARE_ACCESS_TOKEN || null;

        if (provider === "square") {
            if (typeof storedSquare === "string" && storedSquare.trim()) return storedSquare.trim();
            return envSquare;
        }

        // Default to Stripe for backwards compatibility.
        if (typeof storedStripe === "string" && storedStripe.trim()) return storedStripe.trim();
        if (envStripe) return envStripe;
        if (typeof storedSquare === "string" && storedSquare.trim()) return storedSquare.trim();
        return envSquare;
    } catch (error) {
        console.error("[PaymentConfig] Error reading secret key:", error);
        if (provider === "square") {
            return process.env.SQUARE_ACCESS_TOKEN || null;
        }
        return process.env.STRIPE_SECRET_KEY || process.env.SQUARE_ACCESS_TOKEN || null;
    }
}

async function assertAdminAccess() {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
        throw new Error("Unauthorized");
    }

    const role = await getUserRole(user.email);
    if (role !== "Admin") {
        throw new Error("Unauthorized");
    }
}

export async function updatePaymentConfig(config: Partial<PaymentConfigClient> & { stripe_secret_key?: string | null, square_access_token?: string | null }) {
    await ensurePaymentSettingsSchema();
    await assertAdminAccess();

    const currentConfig = await getPaymentConfig();
    const nextConfig = normalizePaymentConfig({ ...currentConfig, ...config });
    const secretKey = typeof config.stripe_secret_key === "string" ? config.stripe_secret_key.trim() : "";
    const squareSecret = typeof config.square_access_token === "string" ? config.square_access_token.trim() : "";

    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const payload: Record<string, unknown> = {
        id: nextConfig.id,
        enabled: nextConfig.enabled,
        provider: nextConfig.provider,
        checkout_mode: nextConfig.checkout_mode,
        monthly_amount: nextConfig.monthly_amount,
        currency: nextConfig.currency,
        display_name_en: nextConfig.display_name_en,
        display_name_fa: nextConfig.display_name_fa,
        description_en: nextConfig.description_en,
        description_fa: nextConfig.description_fa,
        payment_link_url: nextConfig.payment_link_url,
        stripe_publishable_key: nextConfig.stripe_publishable_key,
        square_application_id: nextConfig.square_application_id,
        square_location_id: nextConfig.square_location_id,
        success_path: nextConfig.success_path,
        cancel_path: nextConfig.cancel_path,
        updated_at: new Date().toISOString(),
    };

    if (secretKey) {
        payload.stripe_secret_key = secretKey;
    }
    if (squareSecret) {
        payload.square_access_token = squareSecret;
    }

    const { error } = await supabase
        .from("church_payment_settings")
        .upsert(payload);

    if (error) {
        throw new Error(error.message);
    }

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/settings");
    revalidatePath("/payment");

    return { success: true };
}
