const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    const { rows } = await pool.query("SELECT COUNT(*) as cnt FROM admin_emails");
    if (parseInt(rows[0].cnt, 10) > 0) {
      console.log("Table admin_emails already contains records, skipping seed.");
      return;
    }

    // 1. Legitimate Welcome Email
    await pool.query(`
      INSERT INTO admin_emails (
        direction, from_email, from_name, to_email, subject, body_text, body_html, status, is_spam, spam_score, spam_reasons, is_bot_flagged, created_at
      ) VALUES (
        'inbound',
        'pastor@iranianchurchdc.com',
        'Rev. Javad Pishghadamian',
        'admin@iranianchurchdc.com',
        'خوش‌آمدگویی به سامانه رسمی ایمیل کلیسا (Welcome to Church Mail)',
        'با سلام و درود خداوند عیسی مسیح،\nسامانه امن ایمیل کلیسا با آدرس رسمی admin@iranianchurchdc.com با موفقیت راه‌اندازی گردید. این سامانه مجهز به اعتبارسنجی SPF، امضای دیجیتال DKIM و موتور ضد ربات و فیلتر هرزنامه است.\nبرکت خداوند با شما باد.',
        '<div style="font-family: Tahoma, sans-serif; direction: rtl; padding: 20px; line-height: 1.8; color: #1e293b;"><h3>سلام و درود در نام فیض‌بخش خداوند،</h3><p>سامانه امن ایمیل کلیسا با آدرس رسمی <b>admin@iranianchurchdc.com</b> با موفقیت راه‌اندازی گردید.</p><p>این سیستم مجهز به پروتکل‌های ضد ربات و آنالیز لحظه‌ای اسپم است و ایمیل‌های رسمی کلیسا را با بالاترین ضریب اطمینان تحویل می‌دهد.</p><p style="margin-top: 24px; color: #64748b;">برکت خداوند با شما باد،<br />تیم خادمین کلیسای ایرانیان واشنگتن دی‌سی</p></div>',
        'unread',
        FALSE,
        0,
        '[]'::jsonb,
        FALSE,
        NOW()
      )
    `);

    // 2. Simulated Spam / Bot Email
    await pool.query(`
      INSERT INTO admin_emails (
        direction, from_email, from_name, to_email, subject, body_text, body_html, status, is_spam, spam_score, spam_reasons, is_bot_flagged, bot_reason, created_at
      ) VALUES (
        'inbound',
        'promo8492@tempmail.com',
        'Fast Crypto Profit Bot',
        'admin@iranianchurchdc.com',
        'URGENT: Guaranteed Bitcoin Investment Deposit Required',
        'Claim your crypto prize now! Immediate deposit profit guaranteed. Click here: http://suspicious-link.xyz/claim',
        NULL,
        'spam',
        TRUE,
        85.00,
        '["Disposable sender domain (tempmail.com)", "Cryptocurrency / Investment scam pattern", "High-risk TLD link detected"]'::jsonb,
        TRUE,
        'Automated spam pattern detected by anti-bot filter',
        NOW() - INTERVAL '1 HOUR'
      )
    `);

    console.log("✅ Successfully seeded initial welcome and spam test emails!");
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await pool.end();
  }
}

seed();
