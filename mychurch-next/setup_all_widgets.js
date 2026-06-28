// setup_all_widgets.js
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

const widgetsData = [
  {
    id: 'w_watermark',
    name: 'واترمارک و لوگوی پخش زنده (Watermark & Logo Overlay)',
    description: 'تنظیم مکان، اندازه و شفافیت لوگوی کلیسا روی صفحات لایو و آرشیو سرودها',
    is_active: true,
    icon: 'LayoutDashboard',
    color: 'text-amber-500',
    config: { size: 300, position: "top-right", opacity: 4, imageUrl: "/logo-transparent.png", customOffsets: { x: 20, y: 20 } }
  },
  {
    id: 'w_global_popup',
    name: 'پاپ‌آپ اطلاعیه جهانی (Global Announcement Popup)',
    description: 'نمایش پیام‌های مهم، تبریک‌های مناسبتی (مانند عید نوروز، کریسمس) و پاپ‌آپ‌های سفارشی به محض ورود کاربران به سایت',
    is_active: false,
    icon: 'LayoutTemplate',
    color: 'text-emerald-500',
    config: { titleFa: "نوروز خجسته باد", titleEn: "Happy Nowruz", heroIcon: "🌱", mediaType: "image", imageUrl: "/images/nowruz-bg.png", messageFa: "آرزوی سالی سرشار از برکت", messageEn: "Wishing you a blessed year", buttonTextFa: "ورود به سایت", buttonTextEn: "Enter Site", themeColor: "emerald", particleEffect: "blossoms" }
  },
  {
    id: 'w_verse_donation',
    name: 'ویجت آیه روز و هدیه (Verse of the Day & Donation Widget)',
    description: 'نمایش آیه روز با ترجمه دو زبانه و امکان نوشتن پیغام برکت و هدایت مستقیم کاربر به درگاه پرداخت برای هدایا و نذورات',
    is_active: false,
    icon: 'Heart',
    color: 'text-rose-500',
    config: { verseFa: "آیا تو را امر نکردم؟ قوی و دلیر باش! نترس و هراسان مباش، زیرا هر جا که بروی، یَهُوَه خدایت با تو خواهد بود.", verseEn: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", refFa: "یوشع ۱:۹", refEn: "Joshua 1:9", showDelaySeconds: 2, displayFrequency: "session" }
  },
  {
    id: 'w_ai_avatar',
    name: 'مولد تصویر آواتار هوش مصنوعی (AI Avatar Generator)',
    description: 'فعال‌سازی هوش مصنوعی برای تولید تصاویر پروفایل مسیحی و کارتونی برای کاربران در صفحه پروفایل شخصیشان',
    is_active: true,
    icon: 'Sparkles',
    color: 'text-indigo-500',
    config: { model: "stability-ai/sdxl", maxGenerationsPerUser: 5 }
  },
  {
    id: 'w_worship_audio',
    name: 'پخش‌کننده صوتی سرودهای پرستشی (Worship Audio Playlist Widget)',
    description: 'نمایش مینی‌پلی‌یر صوتی سرودهای پرستشی برگزیده در صفحات عمومی سایت برای دسترسی سریع کاربران',
    is_active: false,
    icon: 'Music',
    color: 'text-cyan-500',
    config: { autoplay: false, volume: 0.8, loop: false }
  },
  {
    id: 'w_calendar',
    name: 'تقویم رویدادهای کلیسا (Church Events Calendar Widget)',
    description: 'نمایش خودکار رویدادها، جلسات دعا و برنامه‌های هفتگی کلیسا به صورت ویجت در صفحه اصلی',
    is_active: false,
    icon: 'Calendar',
    color: 'text-blue-500',
    config: { showPastEvents: false, maxEventsShown: 5 }
  },
  {
    id: 'w_qr_code',
    name: 'اشتراک‌گذاری سریع با کد QR (Church Share QR Code)',
    description: 'تولید و نمایش کدهای QR برای اشتراک‌گذاری سریع آدرس کانال تلگرام، اینستاگرام، جلسات Zoom و اطلاعات تماس کلیسا',
    is_active: false,
    icon: 'QrCode',
    color: 'text-teal-500',
    config: { zoomLink: "", telegramLink: "", instagramLink: "" }
  }
];

async function run() {
  console.log("=== POPULATING ALL CORES WIDGETS ===");
  try {
    for (const w of widgetsData) {
      console.log(`Processing: ${w.id}...`);
      await pool.query(`
        INSERT INTO widgets (id, name, description, is_active, icon, color, config, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE 
        SET name = EXCLUDED.name, 
            description = EXCLUDED.description, 
            icon = EXCLUDED.icon, 
            color = EXCLUDED.color,
            config = COALESCE(widgets.config, EXCLUDED.config);
      `, [w.id, w.name, w.description, w.is_active, w.icon, w.color, JSON.stringify(w.config)]);
    }
    console.log("✅ All widgets populated/synchronized successfully in PostgreSQL!");
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    await pool.end();
  }
}

run();
