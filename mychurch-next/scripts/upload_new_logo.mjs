import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { Bot, InputFile } from 'grammy';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function main() {
    console.log('[Logo Upload] Starting upload and registration...');
    const logoPath = path.join(__dirname, '../new logo 2026.png');
    const buffer = await fs.readFile(logoPath);
    const size = buffer.length;
    const fileName = 'logo-transparent.png';
    const mimeType = 'image/png';

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const storageChannelId = process.env.TELEGRAM_STORAGE_CHANNEL_ID;

    if (!botToken || !storageChannelId) {
        throw new Error('Telegram credentials missing in .env.local');
    }

    // 1. Upload to Telegram Cloud Storage
    console.log('[Logo Upload] Uploading to Telegram Storage Channel:', storageChannelId);
    const bot = new Bot(botToken);
    const inputFile = new InputFile(buffer, fileName);
    const msg = await bot.api.sendDocument(storageChannelId, inputFile, {
        caption: `⛪️ Iranian Church DC Official Logo (2026) - ${fileName}`
    });

    const fileId = msg.document?.file_id;
    const messageId = msg.message_id;
    console.log('[Logo Upload] Telegram upload success! file_id:', fileId, 'message_id:', messageId);

    // 2. Connect to Database (Supabase PostgreSQL)
    const dbUrl = process.env.DATABASE_URL;
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('[Logo Upload] Connected to Database.');

    // Insert into media_library
    const query = `
        INSERT INTO media_library (file_name, telegram_file_id, telegram_message_id, mime_type, size, folder, visibility, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id;
    `;
    const res = await client.query(query, [
        'new-logo-2026.png',
        fileId,
        messageId,
        mimeType,
        size,
        'branding',
        'public'
    ]);

    const insertedId = res.rows[0]?.id;
    console.log('[Logo Upload] Inserted into media_library with ID:', insertedId);

    // Also update any watermark or logo settings in widgets table if present
    try {
        await client.query(`
            UPDATE widgets 
            SET config = jsonb_set(config, '{logoUrl}', '"/logo-transparent.png"')
            WHERE type = 'watermark';
        `);
        console.log('[Logo Upload] Updated watermark widget configuration.');
    } catch (wErr) {
        console.log('[Logo Upload] Widget table update notice:', wErr.message);
    }

    await client.end();
    console.log('[Logo Upload] COMPLETED SUCCESSFULLY! Registered in storage and DB.');
}

main().catch(err => {
    console.error('[Logo Upload] Error:', err);
    process.exit(1);
});
