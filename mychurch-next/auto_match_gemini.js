const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Secure Gemini API call with auto-retry on 429 Resource Exhausted
async function generateContentWithRetry(genAI, prompt, retries = 4, delayMs = 65000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    maxOutputTokens: 8192,
                }
            });
            return response;
        } catch (err) {
            if (err.status === 429 && attempt < retries) {
                console.warn(`⚠️ [429] Rate limit hit (attempt ${attempt}/${retries}). Retrying in ${delayMs / 1000}s...`);
                await sleep(delayMs);
                continue;
            }
            throw err;
        }
    }
}

// Loose JSON parser that handles unterminated strings or syntax bugs by extracting UUID mapping keys directly
function parseMatchesLoose(text) {
    const mapping = {};
    // Matches "uuid": "filename.mp3" or "uuid": "filename.m4a"
    const regex = /"([a-f0-9\-]{36})"\s*:\s*"([^"]+)"/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
        mapping[match[1]] = match[2];
    }
    return mapping;
}

// Clean and normalize Unicode representations to NFC
function normalize(str) {
    if (!str) return '';
    return str
        .normalize('NFC')
        .toLowerCase()
        .replace(/\.mp3$/i, '')
        .replace(/\.m4a$/i, '')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/ٔ/g, '')
        .replace(/‌/g, ' ')
        .replace(/[0-9\(\)\[\]\-\_\.\,\+\']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function toFinglish(str) {
    const chars = {
        'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's', 'ج': 'j', 'چ': 'ch',
        'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
        'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
        'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v', 'ه': 'h',
        'ی': 'y', 'ئ': 'y', 'ء': 'a'
    };
    return str
        .normalize('NFC')
        .split('')
        .map(c => chars[c] || c)
        .join('');
}

async function main() {
    try {
        console.log("=== STARTING RESILIENT HYBRID AUTO-LINKER WITH LOOSE PARSING ===");

        // Fetch active API key from DB
        const { rows: configRows } = await pool.query("SELECT gemini_api_key FROM church_ai_settings WHERE id = 'default'");
        const dbApiKey = configRows[0]?.gemini_api_key;
        const apiKey = dbApiKey || 'AIzaSyB6NKiAHfFqPbk1tbVFDe-EuJi9hP_zg_w';
        
        console.log(`Using API Key source: ${dbApiKey ? 'Database Settings' : 'Fallback Defaults'}`);
        const genAI = new GoogleGenAI({ apiKey });

        // 1. Get already linked files from DB
        const { rows: linkedRows } = await pool.query(`
            SELECT audio_url FROM church_worship_songs WHERE audio_url IS NOT NULL AND audio_url != ''
        `);
        const linkedFiles = new Set(
            linkedRows.map(r => r.audio_url.split('/').pop()).filter(Boolean)
        );
        console.log(`Excluding ${linkedFiles.size} already-linked audio files from the search space.`);

        // 2. Get files on disk
        const audioDir = path.join(process.cwd(), 'public', 'worship', 'audio', 'kalameh');
        if (!fs.existsSync(audioDir)) {
            console.error("Audio directory not found:", audioDir);
            return;
        }

        const rawFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a'));
        let files = rawFiles.filter(f => !linkedFiles.has(f));
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

        // --- PHASE 1: LOCAL MATCHER (NFC ENABLED) ---
        console.log("\n--- Phase 1: Local Exact & Substring Matcher (NFC Enabled) ---");
        let localLinked = 0;
        const unmatchedSongs = [];
        
        const fileLookup = files.map(file => {
            const norm = normalize(file);
            return {
                original: file,
                normalized: norm,
                finglish: toFinglish(norm),
                words: norm.split(' ').filter(w => w.length > 2)
            };
        });

        for (const song of songs) {
            const normTitle = normalize(song.title_fa);
            const finglishTitle = toFinglish(normTitle);
            let matched = null;

            // Farsi matching
            matched = fileLookup.find(f => f.normalized === normTitle);

            // Substring Farsi matching
            if (!matched) {
                matched = fileLookup.find(f => {
                    if (f.normalized.length < 4 || normTitle.length < 4) return false;
                    return normTitle.includes(f.normalized) || f.normalized.includes(normTitle);
                });
            }

            // Finglish representation matching
            if (!matched) {
                matched = fileLookup.find(f => {
                    if (f.finglish.length < 5 || finglishTitle.length < 5) return false;
                    return finglishTitle.includes(f.finglish) || f.finglish.includes(finglishTitle);
                });
            }

            // Word token matching
            if (!matched) {
                const songWords = normTitle.split(' ').filter(w => w.length > 2);
                matched = fileLookup.find(f => {
                    if (f.words.length === 0 || songWords.length === 0) return false;
                    let matchesCount = 0;
                    for (const sw of songWords) {
                        if (f.words.includes(sw)) matchesCount++;
                    }
                    return matchesCount >= 2;
                });
            }

            if (matched) {
                const audioUrl = `/worship/audio/kalameh/${matched.original}`;
                await pool.query("UPDATE church_worship_songs SET audio_url = $1 WHERE id = $2", [audioUrl, song.id]);
                console.log(`🔗 Local Link: "${song.title_fa}" -> "${matched.original}"`);
                localLinked++;

                // Remove matched file
                const idx = fileLookup.indexOf(matched);
                if (idx > -1) fileLookup.splice(idx, 1);
                files = files.filter(f => f !== matched.original);
            } else {
                unmatchedSongs.push(song);
            }
        }

        console.log(`Phase 1 finished. Linked: ${localLinked} songs. Unmatched: ${unmatchedSongs.length} songs.`);

        if (unmatchedSongs.length === 0) {
            console.log("No songs left to match!");
            return;
        }

        // --- PHASE 2: GEMINI MATCHER ---
        console.log("\n--- Phase 2: Gemini Phonetic Matcher ---");
        
        // Split remaining songs into smaller chunks of 50 to prevent token rate limits
        const chunkSize = 50;
        let geminiLinked = 0;

        for (let i = 0; i < unmatchedSongs.length; i += chunkSize) {
            const chunk = unmatchedSongs.slice(i, i + chunkSize);
            console.log(`\nProcessing Gemini chunk ${i / chunkSize + 1} of ${Math.ceil(unmatchedSongs.length / chunkSize)} (${chunk.length} songs)...`);

            if (i > 0) {
                console.log("Sleeping for 75 seconds to avoid rate limits...");
                await sleep(75000);
            }

            const prompt = `
                You are a data matching assistant. Match Farsi worship song titles (in Arabic script) with their corresponding Finglish/transliterated filenames.
                
                Matching Rules:
                - Farsi title: e.g. "ای برادر و خواهرم"
                - Filename: e.g. "122 Ey baradar o khahar.mp3" or "Ey baradar o ey khahar.mp3"
                - They are phonetically the same. Ignore prefix numbers, suffix numbers, hashes, or extensions.
                - Ignore artist names, parts of speech like "Copy", or other noise.
                - Only match if you are confident. If a song title has no matching filename, do not include it.
                
                Song Titles:
                ${JSON.stringify(chunk.map(s => ({ id: s.id, title_fa: s.title_fa, artist: s.artist })))}
                
                Filenames on Disk:
                ${JSON.stringify(files)}
                
                Return a valid minified JSON object mapping song ID to the matched filename. Do NOT include any explanations, markdown ticks, or code blocks.
                Format:
                {
                  "song-id-uuid": "matched_filename.mp3"
                }
            `;

            try {
                const response = await generateContentWithRetry(genAI, prompt);

                let text = response.text || "";
                console.log(`Received raw response from Gemini (${text.length} chars). Parsing...`);

                const mapping = parseMatchesLoose(text);
                const matchedIds = Object.keys(mapping);
                console.log(`Gemini matched ${matchedIds.length} songs in this chunk.`);

                for (const songId of matchedIds) {
                    const fileName = mapping[songId];
                    if (!fileName) continue;

                    // Verify filename is in the list of available files to avoid hallucinations
                    if (!files.includes(fileName)) {
                        console.warn(`⚠️ Skipped hallucinated match: ${songId} -> ${fileName} (file not on disk)`);
                        continue;
                    }

                    const audioUrl = `/worship/audio/kalameh/${fileName}`;
                    await pool.query(
                        "UPDATE church_worship_songs SET audio_url = $1 WHERE id = $2",
                        [audioUrl, songId]
                    );
                    
                    const song = chunk.find(s => s.id === songId);
                    console.log(`🔗 Gemini Link: "${song ? song.title_fa : songId}" -> ${fileName}`);
                    
                    // Remove from active files list
                    files = files.filter(f => f !== fileName);
                    geminiLinked++;
                }

            } catch (err) {
                console.error("Error processing chunk with Gemini:", err);
            }
        }

        console.log(`\n=== HYBRID AUTO-LINKING COMPLETE ===`);
        console.log(`Total Local Matches: ${localLinked}`);
        console.log(`Total Gemini Matches: ${geminiLinked}`);
        console.log(`Total Linked: ${localLinked + geminiLinked}`);

    } catch (err) {
        console.error("Hybrid auto-linker error:", err);
    } finally {
        await pool.end();
    }
}

main();
