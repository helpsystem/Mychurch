const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query("INSERT INTO widgets (id, name, description, is_active, icon, color, config) VALUES ('w_global_popup', 'پاپ‌آپ اطلاعیه جهانی', 'نمایش پیام‌های مهم مانند تبریک نوروز به صورت پاپ‌آپ در تمام صفحات (یک‌بار برای هر کاربر)', false, 'LayoutTemplate', 'text-pink-500', '{}') ON CONFLICT (id) DO NOTHING;");
        console.log("Widget w_global_popup inserted successfully.");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
