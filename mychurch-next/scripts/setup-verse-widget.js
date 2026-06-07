const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Registering w_verse_donation widget...");
        
        const defaultConfig = {
            verseFa: "آیا تو را امر نکردم؟ قوی و دلیر باش! نترس و هراسان مباش، زیرا هر جا که بروی، یَهُوَه خدایت با تو خواهد بود.",
            verseEn: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
            refFa: "یوشع ۱:۹",
            refEn: "Joshua 1:9",
            displayFrequency: "session",
            showDelaySeconds: 2,
            enabledPaths: "/",
            excludedPaths: "/broadcast,/admin"
        };

        await pool.query(
            "INSERT INTO widgets (id, name, description, is_active, icon, color, config) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING;",
            [
                'w_verse_donation',
                'ویجت آیه روز و هدیه',
                'نمایش آیه روز به همراه فیلد پیام برکت و هدایت به درگاه پرداخت',
                false,
                'Heart',
                'text-rose-500',
                JSON.stringify(defaultConfig)
            ]
        );
        console.log("Widget w_verse_donation inserted/verified successfully.");
    } catch (e) {
        console.error("Database migration error:", e);
    } finally {
        await pool.end();
    }
}
run();
