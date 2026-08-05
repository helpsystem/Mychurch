import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { query } from '@/lib/db';

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

export async function GET() {
    try {
        await ensureSiteSettingsSchema();
        const { rows } = await query("SELECT homepage_media FROM site_settings WHERE id = 'default'");
        let savedMapping: Record<string, string> = rows[0]?.homepage_media || {};

        const supabase = await createClient();
        
        // Define our desired slots and their fallback name patterns
        const patterns: Record<string, string[]> = {
            'hero_video': ['hero.mp4', 'hero-video', 'hero_video'],
            'hero_fallback': ['hero-fallback', 'hero_fallback'],
            'globe_bg': ['globe-bg', 'globe_bg'],
            'prayer_bg': ['prayer-bg', 'prayer_bg'],
            'live_stage': ['live-stage', 'live_stage'],
            'bible_cover': ['bible-cover', 'bible_cover'],
        };

        const mediaUrls: Record<string, string> = {};
        let needsUpdate = false;

        // Fetch assets to resolve names if any mappings are missing
        const { data: assets } = await supabase
            .from('media_library')
            .select('id, file_name')
            .order('created_at', { ascending: false });

        for (const [key, matchPatterns] of Object.entries(patterns)) {
            let assetId = savedMapping[key];

            // If we have a saved ID, verify it still exists in the media library
            if (assetId && assets?.find(a => a.id === assetId)) {
                mediaUrls[key] = `/api/serve/cloud/${assetId}`;
            } 
            // Otherwise, try to find it by name pattern
            else if (assets) {
                const match = assets.find(a => 
                    matchPatterns.some(p => a.file_name.toLowerCase().includes(p.toLowerCase()))
                );
                if (match) {
                    savedMapping[key] = match.id;
                    mediaUrls[key] = `/api/serve/cloud/${match.id}`;
                    needsUpdate = true;
                }
            }
        }

        // If we discovered new mappings by name, save them permanently as IDs
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
                updatedMapping: needsUpdate
            }
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            }
        });
    } catch (err: any) {
        console.error('[Homepage Media] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
