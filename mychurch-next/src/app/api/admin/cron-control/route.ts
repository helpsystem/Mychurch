import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const CRON_JOB_NAME = "ai-mass-enricher";
const SCRIPT_PATH = "src/scripts/cron_worship_enricher.ts";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: userRecord } = await supabase.from('users').select('role').eq('email', user.email).single();
        if (!userRecord || userRecord.role !== 'Admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Get total stats
        const { rows: totals } = await query(`
            SELECT 
                COUNT(*) as total_songs,
                COUNT(*) FILTER (WHERE lyrics_fa IS NOT NULL AND audio_url IS NOT NULL) as eligible_songs,
                COUNT(*) FILTER (WHERE timing_data IS NOT NULL) as enriched_songs
            FROM church_worship_songs
        `);

        // Check if PM2 is running
        let isRunning = false;
        try {
            const { stdout } = await execAsync(`pm2 jlist`);
            const processes = JSON.parse(stdout);
            const cronProcess = processes.find((p: any) => p.name === CRON_JOB_NAME);
            isRunning = cronProcess && cronProcess.pm2_env.status === "online";
        } catch (e) {
            console.error("PM2 jlist error (could be acceptable locally):", e);
        }

        return NextResponse.json({
            stats: totals[0],
            isRunning
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: userRecord } = await supabase.from('users').select('role').eq('email', user.email).single();
        if (!userRecord || userRecord.role !== 'Admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { action, interval } = await req.json();

        switch (action) {
            case 'start':
                const minutes = interval || "5";
                const cronSchedule = `*/${minutes} * * * *`;
                // Start or restart if exists
                await execAsync(`pm2 start "npx tsx --env-file .env.local ${SCRIPT_PATH}" --name "${CRON_JOB_NAME}" --cron-restart="${cronSchedule}" --no-autorestart || pm2 restart ${CRON_JOB_NAME} --cron-restart="${cronSchedule}"`);
                return NextResponse.json({ success: true, message: "Started successfully" });
                
            case 'stop':
                await execAsync(`pm2 stop ${CRON_JOB_NAME} || true`);
                return NextResponse.json({ success: true, message: "Stopped successfully" });

            case 'run_once':
                // We'll execute it directly without PM2 for an instant blocking run, or using PM2 run
                // Doing via node child process directly to get immediate feedback. Or just use PM2 start but without cron.
                // Since PM2 limits logs, it's safer to just run it as a standalone script for 'run once', or restart the PM2 task immediately.
                await execAsync(`pm2 restart ${CRON_JOB_NAME}`);
                return NextResponse.json({ success: true, message: "Triggered execution successfully" });

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
