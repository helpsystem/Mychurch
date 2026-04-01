import { query } from "@/lib/db";
import { extractWorshipSongAI } from "@/actions/worship";

/**
 * MyChurch Mass AI Enricher (Cron Job Task)
 * 
 * This script finds songs in the database that haven't been processed by the AI Wizard yet
 * (where timing_data is NULL), and processes them in batches to respect Gemini's RPM limits.
 */

// Delay helper to respect API Rate Limits (Flash allows ~15 RPM on free tier)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runMassEnrichment() {
    console.log("=========================================");
    console.log(`[Cron] Starting Mass Enrichment Job: ${new Date().toISOString()}`);

    try {
        // 1. Fetch up to 10 unprocessed songs
        // We limit to 10 per run to respect Rate Limits comfortably
        const { rows: pendingSongs } = await query(`
            SELECT id, title_fa 
            FROM church_worship_songs 
            WHERE timing_data IS NULL 
              AND lyrics_fa IS NOT NULL
              AND audio_url IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 10
        `);

        if (pendingSongs.length === 0) {
            console.log("[Cron] No pending songs require AI enrichment. Exiting.");
            return;
        }

        console.log(`[Cron] Found ${pendingSongs.length} songs to process.`);

        // 2. Process each song sequentially
        for (const [index, song] of pendingSongs.entries()) {
            console.log(`\n⏳ [${index + 1}/${pendingSongs.length}] Processing: ${song.title_fa} (ID: ${song.id})`);
            
            try {
                // Call our existing robust AI action!
                const result = await extractWorshipSongAI(song.id);
                
                if (result.success) {
                    console.log(`✅ Success: ${song.title_fa}`);
                } else {
                    console.log(`❌ Failed: ${song.title_fa} - ${result.message}`);
                }
            } catch (err: any) {
                console.error(`💥 Critical Error on ${song.title_fa}:`, err.message);
            }

            // 3. Rate Limiting Pause (4-5 seconds between requests)
            if (index < pendingSongs.length - 1) {
                console.log(`[Cron] Waiting 5 seconds before next song to respect API limits...`);
                await delay(5000); 
            }
        }

    } catch (error) {
        console.error("[Cron] Global Error running mass enrichment:", error);
    }

    console.log("\n[Cron] Job Finished.");
    console.log("=========================================\n");
    process.exit(0);
}

runMassEnrichment();
