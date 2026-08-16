import { query } from "@/lib/db";

export interface TranslationUsageStats {
  monthlyChars: number;
  monthlyQuota: number;
  remainingChars: number;
  monthlyPercent: number;
  todayChars: number;
  totalRequests: number;
  azureChars: number;
  geminiChars: number;
  fallbackChars: number;
}

let isInitialized = false;

export async function ensureTranslationTable() {
  if (isInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS translation_usage_logs (
        id BIGSERIAL PRIMARY KEY,
        char_count INTEGER NOT NULL DEFAULT 0,
        engine VARCHAR(50) NOT NULL DEFAULT 'azure',
        source_lang VARCHAR(10),
        target_lang VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_translation_created_at ON translation_usage_logs(created_at);
    `);
    isInitialized = true;
  } catch (err) {
    console.error("[Translation Tracker] Error initializing schema:", err);
  }
}

export async function logTranslationUsage(
  charCount: number,
  engine: string = "azure",
  sourceLang?: string,
  targetLang?: string
) {
  if (charCount <= 0) return;
  try {
    await ensureTranslationTable();
    await query(
      `INSERT INTO translation_usage_logs (char_count, engine, source_lang, target_lang)
       VALUES ($1, $2, $3, $4)`,
      [charCount, engine, sourceLang || null, targetLang || null]
    );
  } catch (err) {
    console.error("[Translation Tracker] Error logging usage:", err);
  }
}

export async function getTranslationStats(): Promise<TranslationUsageStats> {
  const MONTHLY_QUOTA = 2000000; // Microsoft Azure Free F0 Tier: 2 Million Chars/Month

  try {
    await ensureTranslationTable();

    // 1. Current Month Chars
    const monthlyRes = await query(`
      SELECT COALESCE(SUM(char_count), 0) AS total_chars,
             COUNT(*) AS total_reqs
      FROM translation_usage_logs
      WHERE created_at >= date_trunc('month', NOW())
    `);

    // 2. Today's Chars
    const todayRes = await query(`
      SELECT COALESCE(SUM(char_count), 0) AS today_chars
      FROM translation_usage_logs
      WHERE created_at >= date_trunc('day', NOW())
    `);

    // 3. Engine breakdown for current month
    const engineRes = await query(`
      SELECT engine, COALESCE(SUM(char_count), 0) AS chars
      FROM translation_usage_logs
      WHERE created_at >= date_trunc('month', NOW())
      GROUP BY engine
    `);

    const monthlyChars = parseInt(monthlyRes.rows[0]?.total_chars || "0", 10);
    const totalRequests = parseInt(monthlyRes.rows[0]?.total_reqs || "0", 10);
    const todayChars = parseInt(todayRes.rows[0]?.today_chars || "0", 10);

    let azureChars = 0;
    let geminiChars = 0;
    let fallbackChars = 0;

    for (const r of engineRes.rows) {
      const count = parseInt(r.chars || "0", 10);
      if (r.engine === "azure") azureChars += count;
      else if (r.engine.includes("gemini")) geminiChars += count;
      else fallbackChars += count;
    }

    const remainingChars = Math.max(0, MONTHLY_QUOTA - monthlyChars);
    const monthlyPercent = Math.min(100, Math.round((monthlyChars / MONTHLY_QUOTA) * 1000) / 10);

    return {
      monthlyChars,
      monthlyQuota: MONTHLY_QUOTA,
      remainingChars,
      monthlyPercent,
      todayChars,
      totalRequests,
      azureChars,
      geminiChars,
      fallbackChars,
    };
  } catch (err) {
    console.error("[Translation Tracker] Error fetching stats:", err);
    return {
      monthlyChars: 0,
      monthlyQuota: MONTHLY_QUOTA,
      remainingChars: MONTHLY_QUOTA,
      monthlyPercent: 0,
      todayChars: 0,
      totalRequests: 0,
      azureChars: 0,
      geminiChars: 0,
      fallbackChars: 0,
    };
  }
}
