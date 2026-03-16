import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Load root .env explicitly
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function testGmail() {
    console.log('[Test] Testing Gmail SMTP...');
    console.log(`[Test] SMTP User: ${process.env.SMTP_USER}`);
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: 'iranianchurchdc.us@gmail.com',
            subject: 'Test from Gmail SMTP Fallback',
            text: 'Testing Gmail SMTP implementation after Resend failure.',
            html: '<b>Testing Gmail SMTP implementation after Resend failure.</b>'
        });

        console.log('✅ Gmail SMTP Success:', info.messageId);
    } catch (err) {
        console.error('❌ Gmail SMTP Error:', err);
    }
}

testGmail();
