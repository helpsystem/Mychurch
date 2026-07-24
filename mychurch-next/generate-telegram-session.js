/**
 * One-time script to generate a Telegram User Session String
 * This uses the church's personal Telegram account (not bot)
 * to be able to send messages to any user directly.
 * 
 * Run: node generate-telegram-session.js
 * Copy the output session string to .env.local as TELEGRAM_USER_SESSION
 */

const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

const API_ID = parseInt('32078713');
const API_HASH = 'a6a18e4f73df376a74fb1d8ed65bd1da';

async function main() {
    console.log('🔐 Telegram User Account Login');
    console.log('================================');
    console.log('This will log in to the CHURCH Telegram account.');
    console.log('You will receive an OTP code on Telegram.\n');

    const session = new StringSession('');
    const client = new TelegramClient(session, API_ID, API_HASH, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => {
            const phone = await input.text('📱 Enter church Telegram phone number (e.g. +12025551234): ');
            return phone.trim();
        },
        password: async () => {
            const pass = await input.text('🔒 Enter 2FA password (if any, else press Enter): ');
            return pass.trim();
        },
        phoneCode: async () => {
            const code = await input.text('📨 Enter the OTP code sent to your Telegram: ');
            return code.trim();
        },
        onError: (err) => {
            console.error('❌ Error:', err.message);
        },
    });

    console.log('\n✅ Login successful!');
    console.log('\n📋 Copy this session string to your .env.local:');
    console.log('================================================');
    console.log(`TELEGRAM_USER_SESSION="${client.session.save()}"`);
    console.log('================================================');
    console.log('\n⚠️  Keep this session string SECRET — it gives full access to the account!');

    await client.disconnect();
}

main().catch(console.error);
