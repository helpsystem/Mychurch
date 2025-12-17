const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const AutoSyncService = require('../backend/services/autoSyncService');

async function main() {
    console.log('🚀 Starting Auto-Sync Job...');
    console.log('📅 ' + new Date().toISOString());

    try {
        const service = new AutoSyncService();

        // 1. Sync Worship Songs
        try {
            await service.syncWorshipSongs();
        } catch (err) {
            console.error('⚠️ Worship sync failed (continuing):', err?.message || err);
        }

        // 2. Sync Bible Chapters (timing)
        try {
            await service.syncBibleChapters();
        } catch (err) {
            console.error('⚠️ Bible sync failed (continuing):', err?.message || err);
        }

        // 3. Export DB to JSON (Ensure "Other Translations" work on frontend)
        console.log('📦 Exporting Bible Database to JSON assets...');
        try {
            const { execSync } = require('child_process');
            execSync('node scripts/extract_bible_from_supabase.cjs', { stdio: 'inherit' });
        } catch (exportErr) {
            console.error('❌ JSON Export Failed:', exportErr.message);
            // Don't exit process, let it finish successfully
        }

        console.log('✅ Auto-Sync Job Complete.');
        process.exit(0);
    } catch (error) {
        console.error('💥 Auto-Sync Job Failed:', error);
        process.exit(1);
    }
}

main();
