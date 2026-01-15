const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

// Hidrive WebDAV config
const HIDRIVE_WEBDAV_URL = 'https://webdav.hidrive.ionos.com';
const HIDRIVE_USER = process.env.HIDRIVE_USER || 'adminchurch';
const HIDRIVE_PASSWORD = process.env.HIDRIVE_PASSWORD;
const HIDRIVE_BASE_PATH = '/users/adminchurch/mychurch/bible/audio';

// Path to extracted audio files
const AUDIO_BASE_PATH = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\bible_data\\audio';

const TRANSLATIONS = ['POV_extracted', 'TPV_extracted', 'NMV_extracted'];

async function ensureRemoteDir(dirPath) {
    try {
        await axios({
            method: 'MKCOL',
            url: `${HIDRIVE_WEBDAV_URL}${dirPath}`,
            auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD }
        });
        console.log(`Created: ${dirPath}`);
    } catch (error) {
        if (error.response?.status === 405) {
            // Directory already exists
        } else if (error.response?.status !== 409) {
            console.warn(`Warning creating ${dirPath}: ${error.message}`);
        }
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

async function findAllAudioFiles(basePath) {
    const audioFiles = [];

    async function searchDir(dir, relativePath = '') {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relPath = path.join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    await searchDir(fullPath, relPath);
                } else if (entry.name.toLowerCase().endsWith('.mp3')) {
                    audioFiles.push({ fullPath, relativePath: relPath });
                }
            }
        } catch (err) {
            console.warn(`Cannot read: ${dir}`);
        }
    }

    await searchDir(basePath);
    return audioFiles;
}

async function uploadBibleAudioNewFiles() {
    console.log('='.repeat(60));
    console.log('  Bible Audio Upload to HiDrive');
    console.log('  Extracted files from SeppoWP');
    console.log('='.repeat(60));
    console.log('');

    if (!HIDRIVE_PASSWORD) {
        console.error('ERROR: HIDRIVE_PASSWORD not set in .env.server');
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

    // Create base directory structure
    console.log('Creating directory structure...');
    await ensureRemoteDir(HIDRIVE_BASE_PATH);

    let totalUploaded = 0;
    let totalFailed = 0;

    for (const translation of TRANSLATIONS) {
        const translationPath = path.join(AUDIO_BASE_PATH, translation);
        const translationName = translation.replace('_extracted', '');

        console.log(`\n${'='.repeat(50)}`);
        console.log(`Processing: ${translationName}`);
        console.log('='.repeat(50));

        try {
            await fs.access(translationPath);
        } catch {
            console.log(`Skipping ${translation} - not found`);
            continue;
        }

        // Create remote translation directory
        await ensureRemoteDir(`${HIDRIVE_BASE_PATH}/${translationName}`);

        // Find all audio files
        const audioFiles = await findAllAudioFiles(translationPath);
        console.log(`Found ${audioFiles.length} files`);

        if (audioFiles.length === 0) continue;

        let uploaded = 0;
        let failed = 0;

        for (const [index, file] of audioFiles.entries()) {
            const progress = `[${index + 1}/${audioFiles.length}]`;

            // Build remote path
            const remotePath = `${HIDRIVE_BASE_PATH}/${translationName}/${file.relativePath.replace(/\\/g, '/')}`;
            const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');

            try {
                // Ensure book directory exists
                const bookName = file.relativePath.split(/[/\\]/)[0];
                await ensureRemoteDir(`${HIDRIVE_BASE_PATH}/${translationName}/${bookName}`);

                // Upload file
                await uploadFile(file.fullPath, remotePath);
                uploaded++;

                if ((index + 1) % 50 === 0) {
                    console.log(`${progress} Progress: ${uploaded}/${audioFiles.length}`);
                }

            } catch (error) {
                console.error(`${progress} Failed: ${file.relativePath} - ${error.message}`);
                failed++;
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`\n${translationName} Summary:`);
        console.log(`  Uploaded: ${uploaded}`);
        console.log(`  Failed: ${failed}`);

        totalUploaded += uploaded;
        totalFailed += failed;
    }

    console.log('\n' + '='.repeat(60));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Uploaded: ${totalUploaded}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log('\nDone!');
}

uploadBibleAudioNewFiles()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
