
/**
 * Update Bible JSON files with Audio URLs from Upload Report
 */
const fs = require('fs');
const path = require('path');

// Configuration
const REPORT_PATH = path.join(__dirname, 'bible_audio_upload_report.json');
const TEXT_BASE_DIR = path.join(__dirname, '../bible_data/text');

// Map audio folder names to text folder names
// Audio: MOJDEH, ENGLISH
// Text: MOJDEH, ENGLISH (we need to ensure extracted text uses these names)
// Note: Previous extraction used 'MOJDEH' and 'QADIM'. English might not be extracted yet check.
const TRANSLATION_MAP = {
    'MOJDEH': 'MOJDEH',
    'ENGLISH': 'ENGLISH',
    'TPV': 'MOJDEH' // Map TPV audio to MOJDEH text if needed
};

async function main() {
    console.log('🔄 Updating JSON files with Audio URLs...');

    if (!fs.existsSync(REPORT_PATH)) {
        console.error('❌ Upload report not found!');
        return;
    }

    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
    const updates = { success: 0, skipped: 0, failed: 0 };

    // Create a lookup map for faster access
    // Key: TRANSLATION/BOOK/CHAPTER
    const audioMap = {};

    report.forEach(item => {
        if (!item.success) return;

        // Extract info from filePath
        // D:\...\bible_data\audio\ENGLISH\GEN\1.mp3
        const parts = item.filePath.split(path.sep);
        const filename = parts.pop(); // 1.mp3
        const book = parts.pop();     // GEN
        const translation = parts.pop(); // ENGLISH

        const chapter = parseInt(filename.replace('.mp3', ''));

        // Normalize translation name if needed
        const key = `${translation}/${book}/${chapter}`;
        audioMap[key] = item.hidriveUrl;

        // Also add mapping for TPV -> MOJDEH if strictly needed
        if (translation === 'TPV') {
            audioMap[`MOJDEH/${book}/${chapter}`] = item.hidriveUrl;
        }
    });

    console.log(`📊 Loaded ${Object.keys(audioMap).length} audio mappings.`);

    // Iterate through text directories
    if (!fs.existsSync(TEXT_BASE_DIR)) {
        console.error(`❌ Text directory not found: ${TEXT_BASE_DIR}`);
        return;
    }

    const translations = fs.readdirSync(TEXT_BASE_DIR);

    for (const transDir of translations) {
        const transPath = path.join(TEXT_BASE_DIR, transDir);
        if (!fs.statSync(transPath).isDirectory()) continue;

        const books = fs.readdirSync(transPath);
        for (const book of books) {
            const bookPath = path.join(transPath, book);
            if (!fs.statSync(bookPath).isDirectory()) continue;

            const chapters = fs.readdirSync(bookPath);
            for (const chapterFile of chapters) {
                if (!chapterFile.endsWith('.json')) continue;

                const chapterNum = parseInt(chapterFile.replace('.json', ''));
                const jsonPath = path.join(bookPath, chapterFile);

                try {
                    // correct key lookup
                    // If text folder is MOJDEH and audio is MOJDEH (or TPV mapped)

                    // Try exact match first
                    let audioUrl = audioMap[`${transDir}/${book}/${chapterNum}`];

                    // If not found, try mapping (e.g. if text is MOJDEH but audio was TPV)
                    if (!audioUrl && transDir === 'MOJDEH') {
                        audioUrl = audioMap[`TPV/${book}/${chapterNum}`];
                    }
                    if (!audioUrl && transDir === 'NET') {
                        audioUrl = audioMap[`ENGLISH/${book}/${chapterNum}`];
                    }

                    if (audioUrl) {
                        const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

                        // Update Audio URL
                        // TPV JSON format usually has a separate field or inside extracted data?
                        // Let's add it to the root or ensure it matches TPV format

                        content.audio = audioUrl;
                        // TPV App might expect 'audio_url' or similar? TPV json example:
                        // "audio": "https://..." 

                        fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2));
                        updates.success++;
                        // console.log(`  ✓ Updated ${transDir}/${book}/${chapterNum}`);
                    } else {
                        updates.skipped++;
                        // console.log(`  - No audio for ${transDir}/${book}/${chapterNum}`);
                    }

                } catch (e) {
                    console.error(`  ❌ Error updating ${jsonPath}: ${e.message}`);
                    updates.failed++;
                }
            }
        }
    }

    console.log('\n✅ Update Complete.');
    console.log(`   Updated: ${updates.success}`);
    console.log(`   Skipped: ${updates.skipped}`);
    console.log(`   Failed:  ${updates.failed}`);
}

main();
