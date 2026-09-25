import { query } from "@/lib/db";
import { unlink } from "fs/promises";
import { join } from "path";
import { addBusinessDays } from "@/lib/business-days";

/**
 * Deletes the local disk cache copy of a published session recording once it has been
 * public for 2 business days, so the host's disk doesn't fill up. The recording itself is
 * never lost: it stays permanently available through its Telegram-backed cloud copy
 * (media_library.telegram_file_id), which is what /api/serve/cloud/<id> and the admin
 * Sessions player already serve from. A row is only ever touched here once its Telegram
 * upload is confirmed (telegram_file_id present) — a session whose cloud copy never landed
 * keeps its local file indefinitely rather than risk losing the only copy.
 */

interface CandidateRow {
    id: string; // church_sessions.id
    media_library_id: string;
    published_at: string;
    file_name: string;
    folder: string | null;
    telegram_file_id: string | null;
}

async function runCleanup() {
    const startTime = Date.now();
    console.log("=========================================");
    console.log(`[Cron] Starting Session Recording Cleanup: ${new Date().toISOString()}`);

    let totalProcessed = 0;
    let deletedCount = 0;
    let failureCount = 0;
    const details: Array<Record<string, unknown>> = [];

    try {
        // Cheap pre-filter in SQL (calendar days, always <= the business-day threshold),
        // then the exact business-day check happens in JS per row below.
        const { rows } = await query(`
            SELECT
                cs.id,
                cs.published_at,
                ml.id AS media_library_id,
                ml.file_name,
                ml.folder,
                ml.telegram_file_id
            FROM church_sessions cs
            JOIN media_library ml ON ml.id = cs.media_library_id
            WHERE cs.status = 'published'
              AND cs.published_at IS NOT NULL
              AND ml.local_file_removed_at IS NULL
              AND ml.telegram_file_id IS NOT NULL
              AND cs.published_at <= NOW() - INTERVAL '2 days'
        `);

        const candidates: CandidateRow[] = rows;
        totalProcessed = candidates.length;

        if (totalProcessed === 0) {
            console.log("[Cron] No session recordings are due for local cleanup. Exiting.");
        }

        const now = new Date();

        for (const row of candidates) {
            const eligibleAt = addBusinessDays(new Date(row.published_at), 2);
            if (now < eligibleAt) continue; // calendar-day filter matched, but not yet 2 business days

            const relativePath = row.folder ? join(row.folder, row.file_name) : row.file_name;
            const filePath = join(process.cwd(), "public", "media", relativePath);

            try {
                await unlink(filePath);
                await query(
                    `UPDATE media_library SET local_file_removed_at = NOW() WHERE id = $1`,
                    [row.media_library_id]
                );
                deletedCount++;
                details.push({ sessionId: row.id, file: relativePath, result: "deleted" });
                console.log(`🗑️  Removed local copy: ${relativePath} (session ${row.id})`);
            } catch (err) {
                const nodeErr = err as NodeJS.ErrnoException;
                if (nodeErr?.code === "ENOENT") {
                    // Already gone from disk (e.g. manual cleanup) — just mark it so we stop retrying.
                    await query(
                        `UPDATE media_library SET local_file_removed_at = NOW() WHERE id = $1`,
                        [row.media_library_id]
                    );
                    details.push({ sessionId: row.id, file: relativePath, result: "already_missing" });
                    console.log(`ℹ️  Already missing on disk, marked removed: ${relativePath}`);
                } else {
                    failureCount++;
                    const message = err instanceof Error ? err.message : String(err);
                    details.push({ sessionId: row.id, file: relativePath, result: "error", error: message });
                    console.error(`❌ Failed to remove ${relativePath}:`, message);
                }
            }
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[Cron] Global error running session recording cleanup:", error);
        failureCount++;
        details.push({ error: message });
    }

    const durationMs = Date.now() - startTime;
    const jobStatus = failureCount === 0 ? "Success" : "Completed With Errors";

    try {
        await query(
            `INSERT INTO cron_logs (job_name, status, duration_ms, total_processed, success_count, failure_count, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                "SESSION_RECORDING_CLEANUP",
                jobStatus,
                durationMs,
                totalProcessed,
                deletedCount,
                failureCount,
                JSON.stringify(details),
            ]
        );
        console.log("[Cron] Logged to database.");
    } catch (dbErr) {
        console.error("[Cron] Failed to write log:", dbErr);
    }

    console.log(`[Cron] Deleted ${deletedCount}/${totalProcessed} eligible local recording copies (${failureCount} failures).`);
    console.log("[Cron] Job Finished.");
    console.log("=========================================\n");
    process.exit(0);
}

runCleanup();
