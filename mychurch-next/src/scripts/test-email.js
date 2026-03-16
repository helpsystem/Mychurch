require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing Email with Resend SMTP...');
  console.log('MAIL_FROM:', process.env.MAIL_FROM);
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set (starts with ' + process.env.RESEND_API_KEY.substring(0, 3) + ')' : 'Not Set');

  const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || "onboarding@resend.dev",
      to: "help.system@ymail.com",
      subject: "Test Email from mychurch-next",
      text: "This is a test email to verify SMTP configuration.",
      html: "<b>This is a test email to verify SMTP configuration.</b>",
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(error);
  }
}

testEmail();
