console.log('Script started');
require('dotenv').config({ path: './backend/.env' });
const hidriveStorage = require('../backend/services/hidriveStorage');

async function checkFiles() {
    try {
        console.log('Connecting...');
        await hidriveStorage.connect();

        const pathToCheck = '/users/adminchurch/mychurch/bible/audio/fa/GEN';
        console.log(`Checking ${pathToCheck}...`);

        const exists = await hidriveStorage.sftpClient.exists(pathToCheck);
        if (exists) {
            const items = await hidriveStorage.sftpClient.list(pathToCheck);
            console.log(`Items in GEN: ${items.length}`);
            console.log(items.map(i => i.name).slice(0, 10));
        } else {
            console.log('GEN folder does not exist yet.');
        }

        await hidriveStorage.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkFiles();
