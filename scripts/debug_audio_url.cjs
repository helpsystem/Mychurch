const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Dynamic import for node-fetch (ESM module)
let fetch;
const loadFetch = async () => {
    if (!fetch) {
        const mod = await import('node-fetch');
        fetch = mod.default;
    }
    return fetch;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use service role key to ensure we can read everything
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAudio() {
    console.log('🔍 Debugging Audio URLs...');

    // 1. Get a song with an audio URL
    const { data: songs, error } = await supabase
        .from('worship_songs')
        .select('*')
        .not('audiourl', 'is', null)
        .limit(1);

    if (error) {
        console.error('❌ DB Error:', error);
        return;
    }

    if (!songs || songs.length === 0) {
        console.error('❌ No songs with audio URLs found in DB.');
        return;
    }

    const song = songs[0];
    console.log(`\n🎵 Testing Song: "${song.title_fa || song.title_en}" (ID: ${song.id})`);
    console.log(`🔗 URL: ${song.audiourl}`);

    // HiDrive credentials for Basic Auth
    const hidriveUser = process.env.HIDRIVE_USER || '';
    const hidrivePassword = process.env.HIDRIVE_PASSWORD || '';

    try {
        const fetchFn = await loadFetch();

        // Test 1: Without auth
        console.log('\n📡 Test 1: Without authentication...');
        const response1 = await fetchFn(song.audiourl, { method: 'HEAD' });
        console.log(`📊 Status: ${response1.status} ${response1.statusText}`);

        // Test 2: With Basic Auth (if credentials exist)
        if (hidriveUser && hidrivePassword && song.audiourl.includes('hidrive')) {
            console.log('\n📡 Test 2: With Basic Auth...');
            const authHeader = 'Basic ' + Buffer.from(`${hidriveUser}:${hidrivePassword}`).toString('base64');
            const response2 = await fetchFn(song.audiourl, {
                method: 'HEAD',
                headers: { 'Authorization': authHeader }
            });
            console.log(`📊 Status: ${response2.status} ${response2.statusText}`);

            if (response2.ok) {
                console.log('✅ Audio URL is accessible with Basic Auth!');
            } else {
                console.error('❌ Still NOT accessible with Basic Auth.');
                console.error('headers:', response2.headers.raw());
            }
        } else if (!hidriveUser || !hidrivePassword) {
            console.log('\n⚠️  HIDRIVE_USER or HIDRIVE_PASSWORD not set in .env');
        }

    } catch (fetchErr) {
        console.error('💥 Network Error:', fetchErr.message);
    }
}

debugAudio();
