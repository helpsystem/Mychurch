"use server";

import { query } from "@/lib/db";

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

    return rows as GiftEvent[];
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
