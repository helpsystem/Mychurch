import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import nodemailer from 'nodemailer';

async function testSmtp() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("No SMTP credentials configured.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const verified = await transporter.verify();
    console.log("SMTP Connection verified:", verified);

    const info = await transporter.sendMail({
      from: `"کلیسای ایرانیان واشنگتن" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // send to self for testing
      subject: "تست ارسال ایمیل کلیسا",
      html: "<h3>تست موفقیت‌آمیز ایمیل</h3><p>سامانه نوتیفیکیشن با موفقیت به سرور ایمیل متصل شد.</p>",
    });
    console.log("Email sent successfully:", info.messageId);
  } catch (err) {
    console.error("SMTP Error:", err.message);
  }
}

testSmtp();
