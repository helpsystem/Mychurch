import { query } from "@/lib/db";
import { extractWorshipSongAI } from "@/actions/worship";
import { sendMail } from "@/lib/mailer";

/**
 * MyChurch Mass AI Enricher (Cron Job Task)
 * 
 * This script finds songs in the database that haven't been processed by the AI Wizard yet
 * (where timing_data is NULL), and processes them in batches to respect Gemini's RPM limits.
 */

// Delay helper to respect API Rate Limits (Flash allows ~15 RPM on free tier)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runMassEnrichment() {
    const startTime = Date.now();
    console.log("=========================================");
    console.log(`[Cron] Starting Mass Enrichment Job: ${new Date().toISOString()}`);

    // Safety Check: Verify job is enabled before proceeding
    try {
        const { rows: config } = await query(`
            SELECT worship_ai_enabled 
            FROM church_ai_settings 
            LIMIT 1
        `);

        const isEnabled = config?.[0]?.worship_ai_enabled;
        if (!isEnabled) {
            console.log("[Cron] ⛔ Job is DISABLED in settings. Skipping enrichment.");
            process.exit(0);
        }
    } catch (err) {
        console.error("[Cron] ⚠️ Could not verify job status. Continuing anyway...", err);
    }

    let totalProcessed = 0;
    let successCount = 0;
    let failureCount = 0;
    const reportDetails = [];

    try {
        // 1. Fetch up to 10 unprocessed songs (skipping verified songs to avoid extra token spend)
        const { rows: pendingSongs } = await query(`
            SELECT id, title_fa 
            FROM church_worship_songs 
            WHERE timing_data IS NULL 
              AND lyrics_fa IS NOT NULL
              AND audio_url IS NOT NULL
              AND (is_verified IS NULL OR is_verified = FALSE)
            ORDER BY created_at DESC
            LIMIT 10
        `);

        totalProcessed = pendingSongs.length;

        if (totalProcessed === 0) {
            console.log("[Cron] No pending songs require AI enrichment. Exiting.");
            return;
        }

        console.log(`[Cron] Found ${totalProcessed} songs to process.`);

        // 2. Process each song sequentially
        for (const [index, song] of pendingSongs.entries()) {
            console.log(`\n⏳ [${index + 1}/${totalProcessed}] Processing: ${song.title_fa} (ID: ${song.id})`);
            
            try {
                // Call our existing robust AI action!
                const result = await extractWorshipSongAI(song.id);
                
                if (result.success) {
                    successCount++;
                    reportDetails.push({ title: song.title_fa, status: 'Success' });
                    console.log(`✅ Success: ${song.title_fa}`);
                } else {
                    failureCount++;
                    reportDetails.push({ title: song.title_fa, status: 'Failed', error: result.message });
                    console.log(`❌ Failed: ${song.title_fa} - ${result.message}`);
                }
            } catch (err: any) {
                failureCount++;
                reportDetails.push({ title: song.title_fa, status: 'Critical Error', error: err.message });
                console.error(`💥 Critical Error on ${song.title_fa}:`, err.message);
            }

            // 3. Rate Limiting Pause (5 seconds between requests)
            if (index < totalProcessed - 1) {
                console.log(`[Cron] Waiting 5 seconds before next song to respect API limits...`);
                await delay(5000); 
            }
        }

    } catch (error: any) {
        console.error("[Cron] Global Error running mass enrichment:", error);
        reportDetails.push({ status: 'Global Script Error', error: error.message });
        failureCount++;
    }

    const durationMs = Date.now() - startTime;
    const jobStatus = failureCount === 0 ? 'Success' : (successCount > 0 ? 'Partial Failure' : 'Failed');

    // 4. Save Log to Database
    try {
        await query(`
            INSERT INTO cron_logs (job_name, status, duration_ms, total_processed, success_count, failure_count, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            'AI_MASS_ENRICHMENT', 
            jobStatus, 
            durationMs, 
            totalProcessed, 
            successCount, 
            failureCount, 
            JSON.stringify(reportDetails)
        ]);
        console.log(`[Cron] Successfully logged execution to Database.`);
    } catch (dbErr) {
        console.error(`[Cron] Failed to write log to DB:`, dbErr);
    }

    // 5. Send Alert Email via Resend
    try {
        const htmlTableRows = reportDetails.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title || 'System'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${item.status === 'Success' ? 'green' : 'red'};">${item.status}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.error || '-'}</td>
            </tr>
        `).join('');

        await sendMail({
            to: 'help.system@ymail.com',
            subject: `[AI Mass Enricher] Report - ${successCount}/${totalProcessed} Succeeded`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; color: #333;">🤖 AI Cron Job Report</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p><strong>Job Name:</strong> AI_MASS_ENRICHMENT</p>
                        <p><strong>Status:</strong> ${jobStatus}</p>
                        <p><strong>Duration:</strong> ${(durationMs / 1000).toFixed(2)}s</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                            <thead>
                                <tr>
                                    <th style="padding: 8px; border-bottom: 2px solid #ddd;">Song Title</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #ddd;">Status</th>
                                    <th style="padding: 8px; border-bottom: 2px solid #ddd;">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${htmlTableRows}
                            </tbody>
                        </table>
                    </div>
                    <div style="background-color: #fafafa; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                        Generative AI Automation by MyChurch
                    </div>
                </div>
            `
        });
        console.log(`[Cron] Warning/Success email dispatched to admin.`);
    } catch (emailErr) {
        console.error(`[Cron] Error dispatching email:`, emailErr);
    }

    console.log("\n[Cron] Job Finished.");
    console.log("=========================================\n");
    process.exit(0);
}

runMassEnrichment();
