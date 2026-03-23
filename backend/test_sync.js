const worshipScraperService = require('./services/worshipScraperService');

async function testSync() {
    try {
        console.log('--- Starting Test Sync ---');
        const stats = await worshipScraperService.syncWithArchive();
        console.log('Final Stats:', stats);
        process.exit(0);
    } catch (err) {
        console.error('Test Sync Failed:', err);
        process.exit(1);
    }
}

testSync();
