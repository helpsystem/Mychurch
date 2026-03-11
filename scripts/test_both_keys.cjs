/**
 * YouVersion Bible Multi-Key Test
 * Tests both API keys to find which has better Persian Bible access.
 * Run from project root: node scripts/test_both_keys.cjs
 */

const https = require('https');

const KEYS = {
    key1: 'mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834',
    key2: 'wLmhDYKYfChgGB0tvhgv4mCIcaCGgnKsEm76FlaSOFQAqvcv',
};

function yvGet(path, apiKey) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.youversion.com',
            path,
            method: 'GET',
            headers: { 'X-YVP-App-Key': apiKey, 'Accept': 'application/json' }
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(body)); }
                    catch(e) { reject(new Error(`Parse error: ${body.slice(0, 200)}`)); }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Bible IDs to test - Persian translations
const PERSIAN_IDS = [
    { id: 1619, name: 'PCB - Persian Contemporary Bible 2022' },
    { id: 118,  name: 'NMV - هزاره نو' },
    { id: 28,   name: 'TPV - پارسایان' },
    { id: 131,  name: 'QADIM - ترجمه قدیم' },
    { id: 114,  name: 'WP  - WordProject' },
];

async function testKey(label, apiKey) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🔑 ${label}: ${apiKey.slice(0, 12)}...`);
    console.log(`${'─'.repeat(60)}`);

    // Test Persian Bibles list
    console.log('\n📚 Persian Bibles (all_available=true):');
    try {
        const fa = await yvGet('/v1/bibles?language_ranges%5B%5D=fa&page_size=50&all_available=true', apiKey);
        if (fa.data?.length > 0) {
            fa.data.forEach(b => console.log(`  ✓ ID:${String(b.id).padEnd(6)} | ${b.abbreviation} | ${b.title}`));
        } else {
            console.log('  (none found)');
        }
    } catch(e) { console.log(`  ✗ ${e.message.slice(0, 80)}`); }

    await sleep(300);

    // Test specific Persian IDs
    console.log('\n🧪 Testing GEN.1.1 for Persian IDs:');
    for (const { id, name } of PERSIAN_IDS) {
        try {
            const p = await yvGet(`/v1/bibles/${id}/passages/GEN.1.1?format=text`, apiKey);
            console.log(`  ✅ ID:${id} [${name}]`);
            console.log(`     "${(p.content||'').trim().slice(0, 90)}"`);
        } catch(e) {
            console.log(`  ❌ ID:${id} [${name}]: ${e.message.slice(0, 70)}`);
        }
        await sleep(200);
    }
}

async function main() {
    console.log('🔍 Testing YouVersion API Keys for Persian Bible Access\n');

    await testKey('Key 1 (original)', KEYS.key1);
    await sleep(500);
    await testKey('Key 2 (new)', KEYS.key2);

    console.log('\n\n✅ Done! Use the key and ID that gives Persian access.');
}

main().catch(console.error);
