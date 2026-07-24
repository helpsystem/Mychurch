require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { CustomFile } = require('telegram/client/uploads');

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function walkDir(dir) {
    let results = [];
    try {
        const list = await fs.promises.readdir(dir);
        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(await walkDir(filePath));
            } else {
                results.push({ path: filePath, name: file, size: stat.size });
            }
        }
    } catch (e) {
        // Directory might not exist
    }
    return results;
}

function getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'svg') return 'image/svg+xml';
    if (ext === 'mp4') return 'video/mp4';
    if (ext === 'webm') return 'video/webm';
    if (ext === 'mov') return 'video/quicktime';
    if (ext === 'mp3') return 'audio/mpeg';
    return 'application/octet-stream';
}

async function runMigration() {
    const apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
    const apiHash = process.env.TELEGRAM_API_HASH;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelIdStr = process.env.TELEGRAM_STORAGE_CHANNEL_ID;
    const dbUrl = process.env.DATABASE_URL;

    if (!apiId || !apiHash || !botToken || !channelIdStr || !dbUrl) {
        console.error("Missing required environment variables in .env.local");
        process.exit(1);
    }

    const channelId = BigInt(channelIdStr);

    // Initialize DB
    const db = new Client({ connectionString: dbUrl });
    await db.connect();
    console.log("✅ Connected to database");

    // Initialize Telegram Client
    const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
        connectionRetries: 3,
        retryDelay: 1000,
    });
    await client.start({ botAuthToken: botToken });
    console.log("✅ Connected to Telegram");

    const allFiles = [...(await walkDir(MEDIA_DIR)), ...(await walkDir(UPLOADS_DIR))];
    console.log(`Found ${allFiles.length} files to process.`);

    for (const file of allFiles) {
        // Check if file is already in media_library
        const res = await db.query('SELECT id FROM media_library WHERE file_name = $1', [file.name]);
        if (res.rows.length > 0) {
            console.log(`⏭️ Skipping ${file.name} (already in DB)`);
            continue;
        }

        console.log(`⏳ Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
        
        try {
            // Read file into memory
            const buffer = await fs.promises.readFile(file.path);
            const customFile = new CustomFile(file.name, buffer.byteLength, "", buffer);

            const message = await client.sendFile(channelId, {
                file: customFile,
                caption: `📁 Migrated Archive File: ${file.name}`,
                workers: 2,
                forceDocument: true,
            });

            if (!message || !message.media || !message.media.document) {
                console.error(`❌ Telegram did not return document info for ${file.name}`);
                continue;
            }

            const doc = message.media.document;
            const mimeType = getMimeType(file.name);

            // Insert into DB
            await db.query(`
                INSERT INTO media_library 
                (file_name, telegram_file_id, telegram_message_id, mime_type, size, folder, visibility)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                file.name,
                doc.id.toString(),
                message.id,
                mimeType,
                Number(doc.size),
                file.path.includes('uploads') ? 'uploads' : 'media',
                'admin'
            ]);

            console.log(`✅ Success: ${file.name}`);
        } catch (e) {
            console.error(`❌ Failed to upload ${file.name}:`, e.message);
        }
    }

    console.log("🎉 Migration completed!");
    await db.end();
    process.exit(0);
}

runMigration().catch(console.error);
