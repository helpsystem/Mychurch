import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { query } from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import { getAIConfig, updateAIConfig, type AIConfig } from "@/actions/ai-config";

const execAsync = promisify(exec);
const CRON_JOB_NAME = "ai-mass-enricher";
const SCRIPT_PATH = "src/scripts/cron_worship_enricher.ts";

type WorshipAutomationMode = AIConfig["worship_ai_schedule_mode"];

function buildCronExpression(config: AIConfig): string | null {
    if (!config.worship_ai_enabled || config.worship_ai_schedule_mode === 'off' || config.worship_ai_schedule_mode === 'manual') {
        return null;
    }

    const [hour, minute] = config.worship_ai_schedule_time.split(':').map((value) => Number(value));
    const safeHour = Number.isFinite(hour) ? Math.max(0, Math.min(23, hour)) : 3;
    const safeMinute = Number.isFinite(minute) ? Math.max(0, Math.min(59, minute)) : 0;

    if (config.worship_ai_schedule_mode === 'daily') {
        return `${safeMinute} ${safeHour} * * *`;
    }

    if (config.worship_ai_schedule_mode === 'weekly') {
        const day = Math.max(0, Math.min(6, Number(config.worship_ai_schedule_day_of_week)));
        return `${safeMinute} ${safeHour} * * ${day}`;
    }

    const dayOfMonth = Math.max(1, Math.min(31, Number(config.worship_ai_schedule_day_of_month)));
    return `${safeMinute} ${safeHour} ${dayOfMonth} * *`;
}

async function syncWorshipCronJob(config: AIConfig) {
    const cronSchedule = buildCronExpression(config);

    if (!config.worship_ai_enabled || !cronSchedule) {
        await execAsync(`pm2 stop ${CRON_JOB_NAME} >/dev/null 2>&1 || true; pm2 delete ${CRON_JOB_NAME} >/dev/null 2>&1 || true`);
        return { isRunning: false, cronSchedule: null };
    }

    await execAsync(`pm2 delete ${CRON_JOB_NAME} >/dev/null 2>&1 || true; pm2 start "npx tsx --env-file .env.local ${SCRIPT_PATH}" --name "${CRON_JOB_NAME}" --cron-restart="${cronSchedule}" --no-autorestart`);
    return { isRunning: true, cronSchedule };
}

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
                COUNT(*) FILTER (WHERE lyrics_fa IS NOT NULL AND lyrics_fa != '') as eligible_songs,
                COUNT(*) FILTER (WHERE lyrics_en IS NOT NULL AND lyrics_en != '') as enriched_songs
            FROM church_worship_songs
        `);

        const config = await getAIConfig();

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
            isRunning,
            config
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

        const payload = await req.json();
        const action = payload?.action;
        const requestedConfig: Partial<AIConfig> = {
            worship_ai_enabled: payload?.worship_ai_enabled,
            worship_ai_schedule_mode: payload?.worship_ai_schedule_mode,
            worship_ai_schedule_time: payload?.worship_ai_schedule_time,
            worship_ai_schedule_day_of_week: payload?.worship_ai_schedule_day_of_week,
            worship_ai_schedule_day_of_month: payload?.worship_ai_schedule_day_of_month,
        };

        switch (action) {
            case 'start':
                {
                    const currentConfig = await getAIConfig();
                    const nextConfig = { ...currentConfig, ...requestedConfig, worship_ai_enabled: true } as AIConfig;
                    await updateAIConfig(nextConfig);
                    const result = await syncWorshipCronJob(nextConfig);
                    return NextResponse.json({ success: true, message: result.cronSchedule ? `Scheduled successfully (${result.cronSchedule})` : "Saved as manual mode" });
                }
                
            case 'stop':
                {
                    const currentConfig = await getAIConfig();
                    const nextConfig = { ...currentConfig, ...requestedConfig, worship_ai_enabled: false, worship_ai_schedule_mode: 'off' } as AIConfig;
                    await updateAIConfig(nextConfig);
                    await syncWorshipCronJob(nextConfig);
                    return NextResponse.json({ success: true, message: "Stopped successfully" });
                }

            case 'run_once':
                await execAsync(`cd /root/mychurch-v2/mychurch-next && NEXT_TELEMETRY_DISABLED=1 NEXT_DISABLE_ESLINT=1 NODE_OPTIONS=--max-old-space-size=1536 npx tsx --env-file .env.local ${SCRIPT_PATH}`);
                return NextResponse.json({ success: true, message: "Triggered execution successfully" });

            case 'save':
                {
                    const currentConfig = await getAIConfig();
                    const nextConfig = { ...currentConfig, ...requestedConfig } as AIConfig;
                    await updateAIConfig(nextConfig);
                    const result = await syncWorshipCronJob(nextConfig);
                    return NextResponse.json({
                        success: true,
                        message: result.cronSchedule ? `Saved and scheduled (${result.cronSchedule})` : "Saved. Manual mode / off does not keep PM2 scheduled.",
                        config: nextConfig,
                    });
                }

            default:
                return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
