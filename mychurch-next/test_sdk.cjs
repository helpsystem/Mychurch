/**
 * Quick test: YouVersion platform-core SDK
 * Run from mychurch-next directory: node test_sdk.cjs
 */
const { ApiClient, BibleClient } = require('@youversion/platform-core');

const apiClient = new ApiClient({ appKey: 'mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834' });
const bibleClient = new BibleClient(apiClient);

const BSB_ID = 3034;

async function main() {
    console.log('\n📖 Testing YouVersion SDK...\n');

    // Test 1: Get version info
    try {
        const version = await bibleClient.getVersion(BSB_ID);
        console.log('✅ Version:', version?.title || JSON.stringify(version));
    } catch(e) {
        console.error('❌ getVersion:', e.message);
    }

    // Test 2: Get chapter structure
    try {
        const chapter = await bibleClient.getChapter(BSB_ID, 'GEN', '1');
        const verseCount = chapter?.verses?.length || 0;
        console.log(`✅ GEN 1 chapter — ${verseCount} verses`);
        if (verseCount > 0) {
            console.log('   First verse ID:', chapter.verses[0].id);
        }
    } catch(e) {
        console.error('❌ getChapter:', e.message);
    }

    // Test 3: Get a passage (Genesis 1:1)
    try {
        const passage = await bibleClient.getPassage(BSB_ID, 'GEN.1.1', 'text');
        console.log('✅ GEN 1:1:', passage?.content?.trim().slice(0, 100));
    } catch(e) {
        console.error('❌ getPassage:', e.message);
    }

    // Test 4: Get multiple verses
    try {
        const p2 = await bibleClient.getPassage(BSB_ID, 'GEN.1.2', 'text');
        const p3 = await bibleClient.getPassage(BSB_ID, 'GEN.1.3', 'text');
        console.log('✅ GEN 1:2:', p2?.content?.trim().slice(0, 80));
        console.log('✅ GEN 1:3:', p3?.content?.trim().slice(0, 80));
    } catch(e) {
        console.error('❌ multiple passages:', e.message);
    }

    console.log('\n✅ SDK test complete!');
}

main().catch(console.error);
