import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { query } from '@/lib/db';
import { getTelegramFileStreamUrl } from '@/services/telegram';

async function ensureSiteSettingsSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS site_settings (
            id TEXT PRIMARY KEY DEFAULT 'default',
            homepage_media JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        )
    `);
    await query(`
        INSERT INTO site_settings (id, homepage_media)
        SELECT 'default', '{}'::jsonb
        WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE id = 'default')
    `);
}

/**
 * Media slots and their resolution strategy:
 * 
 * HEAVY (video/audio) → served via Telegram CDN stream  (/api/telegram/stream/[fileId])
 * LIGHT (images)      → served via /api/serve/cloud/[id] or static /public
 */
const SLOT_DEFINITIONS: Record<string, {
    patterns: string[];
    type: 'heavy' | 'light';
}> = {
    // ── Heavy (Telegram CDN) ─────────────────────────────────
    hero_video:   { patterns: ['hero.mp4', 'hero-video', 'hero_video'],     type: 'heavy' },
    // ── Light (local/Supabase) ───────────────────────────────
    hero_fallback:{ patterns: ['hero-fallback', 'hero_fallback'],            type: 'light' },
    globe_bg:     { patterns: ['globe-bg', 'globe_bg'],                     type: 'light' },
    prayer_bg:    { patterns: ['prayer-bg', 'prayer_bg'],                   type: 'light' },
    live_stage:   { patterns: ['live-stage', 'live_stage'],                 type: 'light' },
    bible_cover:  { patterns: ['bible-cover', 'bible_cover'],               type: 'light' },
};

// Cache resolved Telegram URLs (valid ~45min)
const telegramUrlCache = new Map<string, { url: string; ts: number }>();
const TG_URL_TTL = 40 * 60 * 1000;

async function resolveTelegramUrl(fileId: string): Promise<string> {
    const cached = telegramUrlCache.get(fileId);
    if (cached && Date.now() - cached.ts < TG_URL_TTL) return cached.url;

    try {
        const url = await getTelegramFileStreamUrl(fileId);
        telegramUrlCache.set(fileId, { url, ts: Date.now() });
        return url;
    } catch {
        // If Telegram URL fails, return our proxy endpoint as fallback
        return `/api/telegram/stream/${fileId}`;
    }
}

export async function GET() {
    try {
        await ensureSiteSettingsSchema();
        const { rows } = await query("SELECT homepage_media FROM site_settings WHERE id = 'default'");
        let savedMapping: Record<string, string> = rows[0]?.homepage_media || {};

        const supabase = await createClient();
        
        // Fetch all media assets from Supabase for name matching
        const { data: assets } = await supabase
            .from('media_library')
            .select('id, file_name, telegram_file_id')
            .order('created_at', { ascending: false });

        const mediaUrls: Record<string, string> = {};
        let needsUpdate = false;

        for (const [key, def] of Object.entries(SLOT_DEFINITIONS)) {
            const assetId = savedMapping[key];
            
            // ── Try saved ID first ───────────────────────────────────────
            if (assetId) {
                const asset = assets?.find(a => a.id === assetId);
                if (asset) {
                    if (def.type === 'heavy' && asset.telegram_file_id) {
                        // Heavy file: resolve direct Telegram CDN URL
                        mediaUrls[key] = await resolveTelegramUrl(asset.telegram_file_id);
                    } else if (def.type === 'heavy') {
                        // Heavy but no telegram_file_id yet → use proxy
                        mediaUrls[key] = `/api/telegram/stream/${assetId}`;
                    } else {
                        // Light file: serve from our API
                        mediaUrls[key] = `/api/serve/cloud/${assetId}`;
                    }
                    continue;
                }
            }

            // ── Try to find by name pattern ──────────────────────────────
            if (assets) {
                const match = assets.find(a =>
                    def.patterns.some(p => a.file_name.toLowerCase().includes(p.toLowerCase()))
                );
                if (match) {
                    savedMapping[key] = match.id;
                    needsUpdate = true;

                    if (def.type === 'heavy' && match.telegram_file_id) {
                        mediaUrls[key] = await resolveTelegramUrl(match.telegram_file_id);
                    } else if (def.type === 'heavy') {
                        mediaUrls[key] = `/api/telegram/stream/${match.id}`;
                    } else {
                        mediaUrls[key] = `/api/serve/cloud/${match.id}`;
                    }
                }
            }
        }

        // ── Persist updated ID mappings ──────────────────────────────────
        if (needsUpdate) {
            await query(
                "UPDATE site_settings SET homepage_media = $1, updated_at = now() WHERE id = 'default'",
                [JSON.stringify(savedMapping)]
            );
        }

        return NextResponse.json({ 
            assets: mediaUrls,
            _debug: {
                resolvedSlots: Object.keys(mediaUrls),
                heavyViaTelegram: Object.entries(mediaUrls)
                    .filter(([k]) => SLOT_DEFINITIONS[k]?.type === 'heavy')
                    .map(([k]) => k),
                updatedMapping: needsUpdate
            }
        }, {
            headers: {
                // Short cache so Telegram URLs don't expire mid-session
                'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
            }
        });
    } catch (err: any) {
        console.error('[Homepage Media] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * PATCH /api/homepage-media
 * Body: { slot: string, assetId: string }
 * Admin endpoint to pin a specific asset to a homepage slot.
 */
export async function PATCH(req: Request) {
    try {
        const { slot, assetId } = await req.json();
        if (!slot || !assetId) {
            return NextResponse.json({ error: "slot and assetId required" }, { status: 400 });
        }

        await ensureSiteSettingsSchema();
        const { rows } = await query("SELECT homepage_media FROM site_settings WHERE id = 'default'");
        const mapping: Record<string, string> = rows[0]?.homepage_media || {};
        mapping[slot] = assetId;

        await query(
            "UPDATE site_settings SET homepage_media = $1, updated_at = now() WHERE id = 'default'",
            [JSON.stringify(mapping)]
        );

        // Invalidate cached Telegram URL for this slot if it was heavy
        telegramUrlCache.delete(assetId);

        return NextResponse.json({ success: true, slot, assetId });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
