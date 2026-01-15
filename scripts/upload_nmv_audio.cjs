const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

// Hidrive WebDAV config
const HIDRIVE_WEBDAV_URL = 'https://webdav.hidrive.ionos.com';
const HIDRIVE_USER = process.env.HIDRIVE_USER || 'adminchurch';
const HIDRIVE_PASSWORD = process.env.HIDRIVE_PASSWORD;
const HIDRIVE_BASE_PATH = '/users/adminchurch/mychurch/bible/audio/NMV';

// Path to NMV extracted files (flat structure)
const NMV_PATH = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\bible_data\\audio\\NMV_extracted';

async function ensureRemoteDir(dirPath) {
    try {
        await axios({
            method: 'MKCOL',
            url: `${HIDRIVE_WEBDAV_URL}${dirPath}`,
            auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD }
        });
        console.log(`Created: ${dirPath}`);
    } catch (error) {
        // Directory might already exist
    }
}

async function uploadFile(localPath, remotePath) {
    const fileBuffer = await fs.readFile(localPath);

    await axios.put(`${HIDRIVE_WEBDAV_URL}${remotePath}`, fileBuffer, {
        auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD },
        headers: { 'Content-Type': 'audio/mpeg' },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });
}

async function uploadNMV() {
    console.log('='.repeat(60));
    console.log('  NMV Bible Audio Upload to HiDrive');
    console.log('='.repeat(60));
    console.log('');

    if (!HIDRIVE_PASSWORD) {
        console.error('ERROR: HIDRIVE_PASSWORD not set');
        return;
    }

    // Test connection
    console.log('Testing WebDAV connection...');
    try {
        await axios({
            method: 'PROPFIND',
            url: `${HIDRIVE_WEBDAV_URL}/users/adminchurch`,
            auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD },
            headers: { 'Depth': '0' }
        });
        console.log('Connection OK!\n');
    } catch (error) {
        console.error('WebDAV connection failed:', error.message);
        return;
    }

    // Ensure NMV directory exists
    console.log('Creating NMV directory...');
    await ensureRemoteDir(HIDRIVE_BASE_PATH);

    // Get all MP3 files
    const entries = await fs.readdir(NMV_PATH);
    const mp3Files = entries.filter(f => f.toLowerCase().endsWith('.mp3'));

    console.log(`Found ${mp3Files.length} MP3 files\n`);

    let uploaded = 0;
    let failed = 0;

    for (const [index, filename] of mp3Files.entries()) {
        const progress = `[${index + 1}/${mp3Files.length}]`;
        const localPath = path.join(NMV_PATH, filename);
        // Fix filename: replace dashes with underscores
        const fixedFilename = filename.replace(/-/g, '_');
        const remotePath = `${HIDRIVE_BASE_PATH}/${fixedFilename}`;

        try {
            await uploadFile(localPath, remotePath);
            uploaded++;

            if ((index + 1) % 20 === 0) {
                console.log(`${progress} Progress: ${uploaded}/${mp3Files.length} (${Math.round(uploaded / mp3Files.length * 100)}%)`);
            }
        } catch (error) {
            console.error(`${progress} Failed: ${filename} - ${error.message}`);
            failed++;
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log('NMV UPLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`Uploaded: ${uploaded}`);
    console.log(`Failed: ${failed}`);
    console.log('\nDone!');
}

uploadNMV()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
