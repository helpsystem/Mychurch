import { query } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runHealthCheck() {
    const startTime = Date.now();
    console.log("=========================================");
    console.log(`[Cron] Starting Audio Health Monitor: ${new Date().toISOString()}`);

    let totalProcessed = 0;
    let brokenCount = 0;
    const reportDetails: any[] = [];

    try {
        // Fetch up to 100 songs that haven't been checked recently
        // We only check external HTTP links
        const { rows: songs } = await query(`
            SELECT id, title_fa, audio_url 
            FROM church_worship_songs 
            WHERE audio_url IS NOT NULL 
              AND audio_url LIKE 'http%'
            ORDER BY audio_health_checked_at ASC NULLS FIRST
            LIMIT 100
        `);

        totalProcessed = songs.length;

        if (totalProcessed === 0) {
            console.log("[Cron] No external links found to check. Exiting.");
            return;
        }

        console.log(`[Cron] Found ${totalProcessed} links to check.`);

        for (const [index, song] of songs.entries()) {
            try {
                // Ignore empty or local links
                if (!song.audio_url || !song.audio_url.startsWith('http')) continue;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const res = await fetch(song.audio_url, { 
                    method: 'HEAD', 
                    signal: controller.signal 
                });
                
                clearTimeout(timeoutId);

                const isOk = res.ok || res.status < 400;
                const status = isOk ? 'ok' : 'broken';
                const errorMsg = isOk ? null : `HTTP ${res.status}`;

                await query(`
                    UPDATE church_worship_songs 
                    SET audio_health_status = $1, audio_health_checked_at = NOW(), audio_health_error = $2
                    WHERE id = $3
                `, [status, errorMsg, song.id]);

                if (!isOk) {
                    brokenCount++;
                    reportDetails.push({ title: song.title_fa, url: song.audio_url, error: errorMsg });
                    console.log(`❌ Broken: ${song.title_fa} - ${errorMsg}`);
                }
            } catch (err: any) {
                brokenCount++;
                reportDetails.push({ title: song.title_fa, url: song.audio_url, error: err.message });
                console.log(`❌ Broken: ${song.title_fa} - ${err.message}`);

                await query(`
                    UPDATE church_worship_songs 
                    SET audio_health_status = 'broken', audio_health_checked_at = NOW(), audio_health_error = $1
                    WHERE id = $2
                `, [err.message, song.id]);
            }

            // Small delay to prevent network flood
            await delay(100);
        }

    } catch (error: any) {
        console.error("[Cron] Global Error running health check:", error);
    }

    const durationMs = Date.now() - startTime;
    const jobStatus = brokenCount === 0 ? 'Success' : 'Found Broken Links';

    // Log to DB
    try {
        await query(`
            INSERT INTO cron_logs (job_name, status, duration_ms, total_processed, failure_count, details)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            'AUDIO_HEALTH_MONITOR', 
            jobStatus, 
            durationMs, 
            totalProcessed, 
            brokenCount, 
            JSON.stringify(reportDetails)
        ]);
        console.log(`[Cron] Logged to database.`);
    } catch (dbErr) {
        console.error(`[Cron] Failed to write log:`, dbErr);
    }

    // Send Alert Email if there are broken links
    if (brokenCount > 0) {
        try {
            const htmlTableRows = reportDetails.map(item => `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; color: red; word-break: break-all;">${item.url}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.error}</td>
                </tr>
            `).join('');

            await sendMail({
                to: 'help.system@ymail.com',
                subject: `[Audio Monitor] Alert: ${brokenCount} Broken Links Found`,
                html: `
                    <h2>🔴 Broken Audio Links Detected</h2>
                    <p>The system found ${brokenCount} broken external audio links.</p>
                    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; text-align: left; width: 100%;">
                        <thead>
                            <tr style="background-color: #f9fafb;">
                                <th>Song Title</th>
                                <th>URL</th>
                                <th>Error</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${htmlTableRows}
                        </tbody>
                    </table>
                    <p>Please check the Worship Admin panel to fix these links or move them to local storage.</p>
                `
            });
            console.log(`[Cron] Alert email dispatched.`);
        } catch (emailErr) {
            console.error(`[Cron] Error dispatching email:`, emailErr);
        }
    }

    console.log("\n[Cron] Job Finished.");
    console.log("=========================================\n");
    process.exit(0);
}

runHealthCheck();
