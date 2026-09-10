const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

function cleanForMatch(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFC')
        .replace(/\.(mp3|m4a|wav|ogg)$/i, '')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
        .replace(/[\u064B-\u065F]/g, '') // Arabic diacritics
        .replace(/[\(\)\[\]\-\_\.\,\+\'\:\"\؛\،]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function run() {
    try {
        console.log("=== CHECKING KALAMEH URLS ===");
        const { rows: kalamehSongs } = await pool.query("SELECT id, title_fa, audio_url FROM church_worship_songs WHERE audio_url LIKE '%kalameh.com%'");
        const audioDir = path.join(process.cwd(), 'public', 'worship', 'audio', 'kalameh');
        const localFiles = fs.readdirSync(audioDir);

        let fixedKalameh = 0;
        for (const s of kalamehSongs) {
            const rawFilename = path.basename(s.audio_url);
            const decoded = decodeURIComponent(rawFilename);
            
            // Try exact match or case-insensitive match
            const exact = localFiles.find(f => f.toLowerCase() === decoded.toLowerCase() || f.toLowerCase() === rawFilename.toLowerCase());
            if (exact) {
                const newUrl = `/worship/audio/kalameh/${exact}`;
                await pool.query("UPDATE church_worship_songs SET audio_url = $1 WHERE id = $2", [newUrl, s.id]);
                fixedKalameh++;
                console.log(`[Fixed Kalameh URL] ${s.title_fa} -> ${newUrl}`);
            } else {
                // Try fuzzy match on clean name
                const cleanTarget = cleanForMatch(decoded);
                const fuzzy = localFiles.find(f => cleanForMatch(f) === cleanTarget);
                if (fuzzy) {
                    const newUrl = `/worship/audio/kalameh/${fuzzy}`;
                    await pool.query("UPDATE church_worship_songs SET audio_url = $1 WHERE id = $2", [newUrl, s.id]);
                    fixedKalameh++;
                    console.log(`[Fuzzy Fixed Kalameh URL] ${s.title_fa} -> ${newUrl}`);
                }
            }
        }
        console.log(`Updated ${fixedKalameh} / ${kalamehSongs.length} kalameh.com URLs to local files.\n`);

        // Check unlinked songs
        const { rows: unlinked } = await pool.query("SELECT id, title_fa, title_en, artist FROM church_worship_songs WHERE audio_url IS NULL OR audio_url = ''");
        console.log(`Found ${unlinked.length} songs missing audio.`);

        // Get all already used audio files
        const { rows: usedRows } = await pool.query("SELECT audio_url FROM church_worship_songs WHERE audio_url IS NOT NULL AND audio_url != ''");
        const usedFiles = new Set(usedRows.map(r => path.basename(r.audio_url).toLowerCase()));

        const availableFiles = localFiles.filter(f => !usedFiles.has(f.toLowerCase()));
        console.log(`Available unlinked local audio files: ${availableFiles.length}`);

        let newMatches = 0;
        for (const song of unlinked) {
            const cleanTitle = cleanForMatch(song.title_fa);
            const cleanEn = cleanForMatch(song.title_en);

            let matched = null;
            // 1. Exact match on cleaned name
            matched = availableFiles.find(f => {
                const cf = cleanForMatch(f);
                return cf === cleanTitle || (cleanEn && cf === cleanEn);
            });

            // 2. Substring match if long enough
            if (!matched && cleanTitle.length >= 6) {
                matched = availableFiles.find(f => {
                    const cf = cleanForMatch(f);
                    if (cf.length < 5) return false;
                    return cf.includes(cleanTitle) || cleanTitle.includes(cf);
                });
            }

            if (matched) {
                const newUrl = `/worship/audio/kalameh/${matched}`;
                await pool.query("UPDATE church_worship_songs SET audio_url = $1 WHERE id = $2", [newUrl, song.id]);
                newMatches++;
                console.log(`[Linked] "${song.title_fa}" -> ${matched}`);
                // Remove from available
                const idx = availableFiles.indexOf(matched);
                if (idx > -1) availableFiles.splice(idx, 1);
            }
        }
        console.log(`Newly matched & linked: ${newMatches} songs.`);

        const { rows: finalCount } = await pool.query("SELECT count(*) as total, count(audio_url) as with_audio FROM church_worship_songs");
        console.log('Final DB stats:', finalCount[0]);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
