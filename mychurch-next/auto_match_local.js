const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

// Helper to clean and normalize strings (Farsi & English)
function normalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        // Remove file extensions
        .replace(/\.mp3$/i, '')
        .replace(/\.m4a$/i, '')
        // Normalizing Persian characters
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/ٔ/g, '') // remove hamza
        .replace(/‌/g, ' ') // replace zero-width non-joiner with space
        // Remove numbers, parentheses, brackets, hyphens, underscores, dots, commas, pluses
        .replace(/[0-9\(\)\[\]\-\_\.\,\+\']/g, ' ')
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        .trim();
}

// Convert Farsi characters to simple Finglish equivalents for phonetic comparison
function toFinglish(str) {
    const chars = {
        'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch',
        'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
        'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
        'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h',
        'ی': 'y', 'ئ': 'y', 'ء': 'a'
    };
    return str
        .split('')
        .map(c => chars[c] || c)
        .join('');
}

async function main() {
    try {
        console.log("=== STARTING LOCAL AUTO-LINKER ===");

        // 1. Get already linked files
        const { rows: linkedRows } = await pool.query(`
            SELECT audio_url FROM church_worship_songs WHERE audio_url IS NOT NULL AND audio_url != ''
        `);
        const linkedFiles = new Set(
            linkedRows.map(r => r.audio_url.split('/').pop()).filter(Boolean)
        );
        console.log(`Excluding ${linkedFiles.size} already-linked audio files.`);

        // 2. Get files on disk
        const audioDir = path.join(process.cwd(), 'public', 'worship', 'audio', 'kalameh');
        if (!fs.existsSync(audioDir)) {
            console.error("Audio directory not found:", audioDir);
            return;
        }

        const rawFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a'));
        const files = rawFiles.filter(f => !linkedFiles.has(f));
        console.log(`Found ${files.length} unlinked files on disk.`);

        // 3. Get songs missing audio
        const { rows: songs } = await pool.query(`
            SELECT id, title_fa, title_en, artist 
            FROM church_worship_songs 
            WHERE audio_url IS NULL OR audio_url = ''
        `);
        console.log(`Found ${songs.length} songs in DB missing audio.`);

        if (songs.length === 0 || files.length === 0) {
            console.log("Nothing to link.");
            return;
        }

        let localLinked = 0;
        const remainingSongs = [];

        // Build file lookup maps
        const normalizedFiles = files.map(file => {
            const norm = normalize(file);
            const words = norm.split(' ').filter(w => w.length > 2);
            return {
                original: file,
                normalized: norm,
                finglish: toFinglish(norm),
                words
            };
        });

        for (const song of songs) {
            const normTitle = normalize(song.title_fa);
            const finglishTitle = toFinglish(normTitle);
            
            // Try matching
            let matchedFile = null;

            // 1. Exact match on normalized Farsi
            matchedFile = normalizedFiles.find(f => f.normalized === normTitle);

            // 2. Exact match on Finglish normalized
            if (!matchedFile && song.title_en) {
                const normEn = normalize(song.title_en);
                matchedFile = normalizedFiles.find(f => f.normalized === normEn);
            }

            // 3. Substring match (Song title contains normalized filename or vice-versa)
            if (!matchedFile) {
                matchedFile = normalizedFiles.find(f => {
                    if (f.normalized.length < 4 || normTitle.length < 4) return false;
                    return normTitle.includes(f.normalized) || f.normalized.includes(normTitle);
                });
            }

            // 4. Substring match on Finglish representation
            if (!matchedFile) {
                matchedFile = normalizedFiles.find(f => {
                    if (f.finglish.length < 5 || finglishTitle.length < 5) return false;
                    return finglishTitle.includes(f.finglish) || f.finglish.includes(finglishTitle);
                });
            }

            // 5. Word-based token matching (if at least 2 words match)
            if (!matchedFile) {
                const songWords = normTitle.split(' ').filter(w => w.length > 2);
                matchedFile = normalizedFiles.find(f => {
                    if (f.words.length === 0 || songWords.length === 0) return false;
                    let matchesCount = 0;
                    for (const sw of songWords) {
                        if (f.words.includes(sw)) matchesCount++;
                    }
                    // For shorter titles, 1 matching word of 3+ chars might be enough if files are unique
                    return matchesCount >= 2;
                });
            }

            if (matchedFile) {
                const audioUrl = `/worship/audio/kalameh/${matchedFile.original}`;
                await pool.query(
                    "UPDATE church_worship_songs SET audio_url = $1 WHERE id = $2",
                    [audioUrl, song.id]
                );
                console.log(`🔗 Local Link: "${song.title_fa}" -> "${matchedFile.original}"`);
                localLinked++;
                
                // Remove matched file from the pool to avoid duplicate matching
                const idx = normalizedFiles.indexOf(matchedFile);
                if (idx > -1) normalizedFiles.splice(idx, 1);
            } else {
                remainingSongs.push(song);
            }
        }

        console.log(`\n=== LOCAL AUTO-LINKING COMPLETE: Linked ${localLinked} songs. Remaining: ${remainingSongs.length} ===`);

    } catch (err) {
        console.error("Local auto-linker error:", err);
    } finally {
        await pool.end();
    }
}

main();
