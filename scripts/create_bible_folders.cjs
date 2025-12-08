console.log('Script started');
require('dotenv').config({ path: './backend/.env' });
const hidriveStorage = require('../backend/services/hidriveStorage');

async function createFolders() {
    try {
        console.log('Connecting...');
        await hidriveStorage.connect();

        const paths = [
            '/users/adminchurch/mychurch/bible',
            '/users/adminchurch/mychurch/bible/audio',
            '/users/adminchurch/mychurch/bible/timings',
            '/users/adminchurch/mychurch/bible/audio/fa',
            '/users/adminchurch/mychurch/bible/audio/en'
        ];

        for (const p of paths) {
            console.log(`Checking ${p}...`);
            const exists = await hidriveStorage.sftpClient.exists(p);
            if (!exists) {
                console.log(`Creating ${p}...`);
                await hidriveStorage.sftpClient.mkdir(p, true);
            } else {
                console.log(`${p} exists.`);
            }
        }

        await hidriveStorage.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

createFolders();
