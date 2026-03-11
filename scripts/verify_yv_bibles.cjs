/**
 * YouVersion Bible ID Verifier v2
 * Run from project root: node scripts/verify_yv_bibles.cjs
 */

const https = require('https');

const YV_KEY = 'mQSt6AbhCy2oUMbqw7AXWdjtpBEgErqZxrjgvG5AmaExT834';

function yvGet(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.youversion.com',
            path,
            method: 'GET',
            headers: { 'X-YVP-App-Key': YV_KEY, 'Accept': 'application/json' }
        };
        const req = https.request(options, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(body)); }
                    catch(e) { reject(new Error(`Parse error (${res.statusCode}): ${body.slice(0, 300)}`)); }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 300)}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('\n🔑 Testing YouVersion API key (api.youversion.com)...\n');

    // ─── 1. English Bibles ─────────────────────────────────────────────────
    console.log('🇬🇧 English Bibles:\n');
    try {
        const en = await yvGet('/v1/bibles?language_ranges%5B%5D=en&page_size=30');
        (en.data || []).forEach(b => {
            console.log(`  ID: ${String(b.id).padEnd(6)} | ${(b.abbreviation||'').padEnd(10)} | ${b.title}`);
        });
        console.log(`  Total: ${en.total_size}`);
    } catch(e) { console.error('  ✗', e.message); }

    await sleep(400);

    // ─── 2. Persian language default Bible ───────────────────────────────
    console.log('\n🇮🇷 Persian language info:\n');
    try {
        const faLang = await yvGet('/v1/languages/fa');
        console.log(`  ✅ Default Bible ID for Persian: ${faLang.default_bible_id}`);
        console.log(`  Text direction: ${faLang.text_direction}`);
    } catch(e) { console.error('  ✗', e.message); }

    await sleep(400);

    // ─── 3. Persian Bibles (all_available=true) ──────────────────────────
    console.log('\n🇮🇷 All Persian Bibles (all_available=true):\n');
    try {
        const fa = await yvGet('/v1/bibles?language_ranges%5B%5D=fa&page_size=50&all_available=true');
        if (fa.data && fa.data.length > 0) {
            fa.data.forEach(b => {
                console.log(`  ID: ${String(b.id).padEnd(6)} | ${(b.abbreviation||'').padEnd(12)} | ${b.title}`);
            });
        } else {
            console.log(`  (No results — total_size: ${fa.total_size})`);
        }
    } catch(e) { console.error('  ✗', e.message); }

    await sleep(400);

    // ─── 4. Test passage fetch with accessible IDs ────────────────────────
    console.log('\n🧪 Testing GEN.1.1 passages:\n');
    const testIds = [3034, 206, 12]; // BSB, WEB-US, ASV — all confirmed open-license
    for (const id of testIds) {
        try {
            const p = await yvGet(`/v1/bibles/${id}/passages/GEN.1.1?format=text`);
            console.log(`  ✅ ID:${id} → "${(p.content||'').trim().slice(0, 80)}"`);
        } catch(e) {
            console.log(`  ❌ ID:${id}: ${e.message.slice(0, 80)}`);
        }
        await sleep(200);
    }

    console.log('\n✅ Done! Use the IDs above to configure bible.ts.');
}

main().catch(console.error);
