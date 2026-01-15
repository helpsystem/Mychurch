const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.server') });

// Hidrive WebDAV config
const HIDRIVE_WEBDAV_URL = 'https://webdav.hidrive.ionos.com';
const HIDRIVE_USER = process.env.HIDRIVE_USER || 'adminchurch';
const HIDRIVE_PASSWORD = process.env.HIDRIVE_PASSWORD;

async function debug() {
    console.log('=== HiDrive Debug ===\n');

    console.log('Credentials:');
    console.log('  User:', HIDRIVE_USER);
    console.log('  Password:', HIDRIVE_PASSWORD ? `SET (${HIDRIVE_PASSWORD.length} chars)` : 'NOT SET');
    console.log('');

    // Test 1: Root access
    console.log('Test 1: Root access...');
    try {
        const res = await axios({
            method: 'PROPFIND',
            url: `${HIDRIVE_WEBDAV_URL}/users/adminchurch`,
            auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD },
            headers: { 'Depth': '0' }
        });
        console.log('  OK - Status:', res.status);
    } catch (error) {
        console.log('  FAILED:', error.response?.status || error.message);
    }

    // Test 2: Bible audio directory
    console.log('\nTest 2: Bible audio directory...');
    try {
        const res = await axios({
            method: 'PROPFIND',
            url: `${HIDRIVE_WEBDAV_URL}/users/adminchurch/mychurch/bible/audio`,
            auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD },
            headers: { 'Depth': '1' }
        });
        console.log('  OK - Status:', res.status);
        // Parse directories
        const matches = res.data.match(/<d:href>([^<]+)<\/d:href>/g);
        if (matches) {
            console.log('  Directories found:', matches.length);
            matches.slice(0, 10).forEach(m => {
                const path = m.replace(/<\/?d:href>/g, '');
                console.log('    -', path);
            });
        }
    } catch (error) {
        console.log('  FAILED:', error.response?.status || error.message);
    }

    // Test 3: NMV directory exists?
    console.log('\nTest 3: NMV directory...');
    try {
        const res = await axios({
            method: 'PROPFIND',
            url: `${HIDRIVE_WEBDAV_URL}/users/adminchurch/mychurch/bible/audio/NMV`,
            auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD },
            headers: { 'Depth': '0' }
        });
        console.log('  EXISTS - Status:', res.status);
    } catch (error) {
        const status = error.response?.status;
        if (status === 404) {
            console.log('  DOES NOT EXIST (404)');
            console.log('  Creating directory...');
            try {
                await axios({
                    method: 'MKCOL',
                    url: `${HIDRIVE_WEBDAV_URL}/users/adminchurch/mychurch/bible/audio/NMV`,
                    auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD }
                });
                console.log('  Created successfully!');
            } catch (mkErr) {
                console.log('  Create FAILED:', mkErr.response?.status || mkErr.message);
            }
        } else {
            console.log('  FAILED:', status || error.message);
        }
    }

    // Test 4: Try uploading a small test file
    console.log('\nTest 4: Test upload to NMV...');
    const testContent = Buffer.from('test');
    try {
        await axios.put(
            `${HIDRIVE_WEBDAV_URL}/users/adminchurch/mychurch/bible/audio/NMV/test.txt`,
            testContent,
            {
                auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD },
                headers: { 'Content-Type': 'text/plain' }
            }
        );
        console.log('  Upload SUCCESS!');

        // Delete test file
        await axios.delete(
            `${HIDRIVE_WEBDAV_URL}/users/adminchurch/mychurch/bible/audio/NMV/test.txt`,
            { auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD } }
        );
        console.log('  Test file deleted.');
    } catch (error) {
        console.log('  Upload FAILED:', error.response?.status || error.message);
        if (error.response?.data) {
            console.log('  Response:', error.response.data.substring(0, 200));
        }
    }

    // Test 5: Check POV directory (which worked before)
    console.log('\nTest 5: POV directory (should work)...');
    try {
        const res = await axios({
            method: 'PROPFIND',
            url: `${HIDRIVE_WEBDAV_URL}/users/adminchurch/mychurch/bible/audio/POV`,
            auth: { username: HIDRIVE_USER, password: HIDRIVE_PASSWORD },
            headers: { 'Depth': '0' }
        });
        console.log('  EXISTS - Status:', res.status);
    } catch (error) {
        console.log('  FAILED:', error.response?.status || error.message);
    }

    console.log('\n=== Debug Complete ===');
}

debug().catch(console.error);
