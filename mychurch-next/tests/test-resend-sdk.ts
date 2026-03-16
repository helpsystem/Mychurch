import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
    console.log('[Test] Testing Resend SDK...');
    const resendKey = process.env.RESEND_API_KEY;
    console.log(`[Test] Resend API Key loaded: ${resendKey ? 'YES (starts with ' + resendKey.substring(0, 5) + '...)' : 'NO'}`);

    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev', // Use Resend's default for initial testing if domain isn't verified
            to: 'iranianchurchdc.us@gmail.com',
            subject: 'Test from Resend SDK',
            html: '<p>Testing Resend SDK implementation.</p>'
        });

        if (error) {
            console.error('[Test] ❌ Resend SDK Error:', error);
        } else {
            console.log('[Test] ✅ Resend SDK Success:', data);
        }
    } catch (err) {
        console.error('[Test] ❌ Unexpected Error:', err);
    }
}

testResend();
