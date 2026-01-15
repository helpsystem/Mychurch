/**
 * Script to audit HiDrive files against Database records
 * Run with: node backend/scripts/audit-hidrive.js
 */

const { Pool } = require('pg');
const hidriveStorage = require('../services/hidriveStorage');
require('dotenv').config();

// Use existing DB module if possible, or replicate robust connection
let pool;
try {
    // Try to require the shared database module first
    // Note: we might need to adjust path if db-postgres doesn't export pool directly or exports it differently
    const dbModule = require('../db-postgres');
    pool = dbModule.pool;
    console.log('📦 Using core database module.');
} catch (e) {
    console.log('⚠️  Core DB module not found or failed, falling back to local pool config.');
    console.log('⚠️  Error:', e.message);

    // Fallback to manual config
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_URL;

    if (connectionString) {
        console.log('📦 Using connection string from env.');
        pool = new Pool({
            connectionString: connectionString,
            ssl: { rejectUnauthorized: false }
        });
    } else {
        console.log('📦 Using explicit connection parameters.');
        pool = new Pool({
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'mychurch_db',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
        });
    }
}

async function auditAudioFiles() {
    console.log('🔍 Starting HiDrive Audio Audit...');

    try {
        // 1. Connect to DB
        console.log('📦 Connecting to Database...');
        const res = await pool.query('SELECT id, title, audiourl FROM worship_songs WHERE audiourl IS NOT NULL AND audiourl != \'\'');
        const songs = res.rows;
        console.log(`✅ Found ${songs.length} songs with audio URLs.`);

        // 2. Connect to HiDrive
        console.log('☁️ Connecting to HiDrive...');
        try {
            await hidriveStorage.connect();
        } catch (e) {
            console.error('❌ Failed to connect to HiDrive. Check .env credentials.');
            process.exit(1);
        }
        console.log('✅ Connected to HiDrive.');

        // 3. Verify files
        let found = 0;
        let missing = 0;
        let missingList = [];

        console.log('\n📝 Verifying files...');
        for (const song of songs) {
            let pathToCheck = song.audiourl;

            // Clean path
            if (pathToCheck.startsWith('/api/hidrive/stream/')) {
                pathToCheck = pathToCheck.replace('/api/hidrive/stream/', '');
            }

            // Verification
            const exists = await hidriveStorage.checkPathExists(pathToCheck);

            const title = typeof song.title === 'string' ? JSON.parse(song.title).fa : song.title.fa;

            if (exists) {
                found++;
                // console.log(`✅ [FOUND] ${title} (${pathToCheck})`);
            } else {
                missing++;
                console.log(`❌ [MISSING] ${title} (ID: ${song.id})`);
                console.log(`   Path: ${pathToCheck}`);
                missingList.push({ id: song.id, title, path: pathToCheck });
            }
        }

        console.log('\n📊 Audit Summary:');
        console.log(`------------------`);
        console.log(`Total Songs Checked: ${songs.length}`);
        console.log(`✅ Files Found:      ${found}`);
        console.log(`❌ Files Missing:    ${missing}`);

        if (missingList.length > 0) {
            console.log('\n⚠️  Missing Files List (Needs Re-upload):');
            missingList.forEach(m => {
                console.log(`- ID ${m.id}: ${m.title}`);
            });
        }

    } catch (err) {
        console.error('Audit failed:', err);
    } finally {
        await pool.end();
        await hidriveStorage.disconnect();
    }
}

auditAudioFiles();
