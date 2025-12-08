const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });
const hidriveStorage = require('../backend/services/hidriveStorage');

const LOG_FILE = path.join(__dirname, 'upload_worship_log.txt');
function log(msg) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg);
}

const WORSHIP_BASE_DIR = path.join(__dirname, '../dist/worship');

// Map local folders to HiDrive categories/paths
const UPLOAD_MAP = {
    'audio': { category: 'worship-audio', remotePrefix: '' }, // dist/worship/audio -> /worship/audio
    'pptx': { category: 'worship-presentations', remotePrefix: '' }, // dist/worship/pptx -> /worship/presentations
    'pdf': { category: 'worship-sheets', remotePrefix: '' }, // dist/worship/pdf -> /worship/sheets
    'lyrics': { category: 'documents', remotePrefix: 'lyrics' }, // dist/worship/lyrics -> /documents/lyrics
    'data/timings': { category: 'worship-audio', remotePrefix: 'timings' } // dist/worship/data/timings -> /worship/audio/timings (or maybe separate?)
};

// Helper to recursively find files
function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

async function uploadWorshipFiles() {
    try {
        log('🚀 Starting Worship Files Upload...');
        await hidriveStorage.connect();
        log('Connected to HiDrive');

        for (const [localSubDir, config] of Object.entries(UPLOAD_MAP)) {
            const localDir = path.join(WORSHIP_BASE_DIR, localSubDir);

            if (!fs.existsSync(localDir)) {
                log(`Skipping ${localSubDir} (not found)`);
                continue;
            }

            log(`Scanning ${localSubDir}...`);
            const files = getFiles(localDir);

            for (const filePath of files) {
                // Get relative path from the specific subfolder
                // e.g. dist/worship/audio/kalameh/song.mp3 -> kalameh/song.mp3
                const relativePath = path.relative(localDir, filePath).replace(/\\/g, '/');

                // Construct remote path
                // e.g. /worship/audio/kalameh/song.mp3
                // or /documents/lyrics/song.txt
                const remotePath = config.remotePrefix
                    ? `${config.remotePrefix}/${relativePath}`
                    : relativePath;

                log(`Processing ${relativePath} -> [${config.category}] ${remotePath}`);

                try {
                    const exists = await hidriveStorage.fileExists(config.category, remotePath);
                    if (exists) {
                        log(`  Skipping (already exists): ${remotePath}`);
                    } else {
                        log(`  Uploading: ${remotePath}`);
                        await hidriveStorage.uploadFile(filePath, config.category, remotePath);
                        log(`  Uploaded: ${remotePath}`);
                    }
                } catch (e) {
                    log(`  Failed to upload ${relativePath}: ${e.message}`);
                }
            }
        }

        log('✅ Worship Upload complete!');
        await hidriveStorage.disconnect();

    } catch (error) {
        log(`❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}

uploadWorshipFiles();
