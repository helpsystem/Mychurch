require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
    console.log('\n=== Worship Songs ===');
    const { data: songs, error: songsErr } = await supabase
        .from('worship_songs')
        .select('id, title_fa, title_en, artist, lyrics_fa, lyrics_en')
        .order('created_at', { ascending: false })
        .limit(20);

    if (songsErr) console.error('Error:', songsErr.message);
    else {
        console.log(`Total songs: ${songs.length}`);
        songs.forEach((s, i) => {
            console.log(`${i + 1}. [${s.id}] ${s.title_fa} | ${s.title_en || '(no EN)'} | lyrics FA: ${s.lyrics_fa ? '✓' : '✗'} | EN: ${s.lyrics_en ? '✓' : '✗'}`);
        });
    }

    console.log('\n=== Bible/Scripture Tables Check ===');
    const bibletables = ['bible_verses', 'scripture_slides', 'bible_books', 'verses'];
    for (const table of bibletables) {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (!error) console.log(`✅ Table "${table}" exists, has data: ${data?.length > 0}`);
        else console.log(`❌ Table "${table}": ${error.message}`);
    }
}

checkData();
