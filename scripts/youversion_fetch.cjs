/**
 * YouVersion Platform API Bible Fetcher
 * 
 * Downloads Bible text data for selected translations and saves as JSON
 * for later import into the PostgreSQL database.
 * 
 * Usage: node scripts/youversion_fetch.cjs [--test] [--lang=fa] [--lang=en]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ─── Configuration ───────────────────────────────────────────────────────────
const API_KEY = 'mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834';
const BASE_URL = 'https://api-dev.youversion.com';
const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'youversion');

// ─── Helper: HTTP GET with API key header ─────────────────────────────────────
function apiGet(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${endpoint}`;
        const options = {
            headers: {
                'X-YouVersion-App-Key': API_KEY,
                'Accept': 'application/json',
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`JSON parse error: ${data.substring(0, 200)}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
                }
            });
        }).on('error', reject);
    });
}

// ─── Helper: delay ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const isTest = args.includes('--test');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // ── Step 1: List Persian Bibles ──────────────────────────────────────────
    console.log('\n📖 Step 1: Fetching Persian (fa) Bible versions...');
    try {
        const faResult = await apiGet('/v1/bibles?language_ranges[]=fa&page_size=50');
        console.log(`   Found ${faResult.total_size ?? faResult.data?.length} Persian Bibles`);
        faResult.data?.forEach(b => {
            console.log(`   ✓ ID: ${b.id} | ${b.abbreviation} | ${b.title}`);
        });
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'persian_bibles.json'),
            JSON.stringify(faResult, null, 2)
        );
    } catch (err) {
        console.error('   ✗ Error fetching Persian Bibles:', err.message);
    }

    // ── Step 2: List English Bibles ──────────────────────────────────────────
    console.log('\n📖 Step 2: Fetching English (en) Bible versions...');
    try {
        const enResult = await apiGet('/v1/bibles?language_ranges[]=en&page_size=50');
        console.log(`   Found ${enResult.total_size ?? enResult.data?.length} English Bibles`);
        enResult.data?.forEach(b => {
            console.log(`   ✓ ID: ${b.id} | ${b.abbreviation} | ${b.title}`);
        });
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'english_bibles.json'),
            JSON.stringify(enResult, null, 2)
        );
    } catch (err) {
        console.error('   ✗ Error fetching English Bibles:', err.message);
    }

    // ── Step 3: Test passage fetch ────────────────────────────────────────────
    if (isTest) {
        console.log('\n🧪 Step 3: Testing passage fetch for GEN.1.1...');
        // KJV Bible ID is typically 1 on YouVersion
        const testBibleIds = [1, 3034]; // KJV canonical, BSB
        for (const bibleId of testBibleIds) {
            try {
                const passage = await apiGet(`/v1/bibles/${bibleId}/passages/GEN.1.1?format=text`);
                console.log(`   ✓ Bible ${bibleId}: ${passage.content?.trim()}`);
            } catch(err) {
                console.error(`   ✗ Bible ${bibleId}: ${err.message}`);
            }
            await sleep(200);
        }
    }

    console.log('\n✅ Done! Check output/youversion/ for results.');
    console.log('   Next step: Use the Bible IDs above to download full texts.');
}

main().catch(console.error);
