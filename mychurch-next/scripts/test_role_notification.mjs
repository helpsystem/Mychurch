import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const { rows } = await pool.query("SELECT id, email, name, role, telegram_id FROM users WHERE role IN ('Admin', 'Leader')");
  console.log("Found responsible users:", rows);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  console.log("Bot Token exists:", !!botToken);

  const adminWithTg = rows.find(r => r.telegram_id);
  if (adminWithTg && botToken) {
    const text = "🕊️ <b>[نوتیفیکیشن سامانه کلیسای ایرانیان واشنگتن]</b>\n\nیک درخواست دعای جدید در سامانه ثبت گردید.\n\n👤 <b>متقاضی:</b> کاربر تستی\n📌 <b>عنوان:</b> شفای بیماران و برکت کلیسا\n🔒 <b>نمایش:</b> عمومی بر روی دیوار دعا\n\n🔗 <a href=\"https://www.iranianchurchdc.com/admin/prayers\">بررسی و تأیید در پنل شبانی</a>";
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminWithTg.telegram_id,
        text,
        parse_mode: 'HTML'
      })
    });
    const result = await res.json();
    console.log("Telegram API result for", adminWithTg.email, ":", result);
  }

  // Also test email if configured
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const targetEmail = rows[0]?.email;
    if (targetEmail) {
      console.log("Testing email to:", targetEmail);
      const emailRes = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'MyChurch <onboarding@resend.dev>',
        to: [targetEmail],
        subject: '[کلیسای ایرانیان واشنگتن] درخواست دعای جدید جهت بررسی و تأیید',
        html: '<div style="font-family: sans-serif; direction: rtl; padding: 20px;"><h2>درخواست دعای جدید</h2><p>یک درخواست دعای جدید جهت بررسی و تأیید توسط شبانان در سامانه ثبت گردید.</p><a href="https://www.iranianchurchdc.com/admin/prayers">ورود به پنل مدیریت</a></div>'
      });
      console.log("Email result:", emailRes);
    }
  }

  await pool.end();
}

run().catch(console.error);
