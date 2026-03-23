const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = 'https://xjliwbfdzmxncyebblxw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGl3YmZkem14bmN5ZWJibHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTEyMjcsImV4cCI6MjA4ODIyNzIyN30.XjVW8NwhAuMXHFtJn4g_ojyhnM1Y3N_fMwsym5dxgqo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const JSON_PATH = path.join(__dirname, '..', 'frontend', 'public', 'worship', 'data', 'worship_songs.json');

async function checkIds() {
    let content = fs.readFileSync(JSON_PATH, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const jsonSongs = JSON.parse(content);

    const { data: dbSongs, error } = await supabase.from('worship_songs').select('id, title_fa').limit(20);
    
    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    console.log("Checking first 20 DB songs against JSON...");
    dbSongs.forEach(dbSong => {
        const jsonMatch = jsonSongs.find(s => s.id === dbSong.id);
        if (jsonMatch) {
            console.log(`ID ${dbSong.id}: DB Title="${dbSong.title_fa}", JSON Title="${jsonMatch.title?.fa}" - ${dbSong.title_fa === jsonMatch.title?.fa ? '✅ MATCH' : '❌ MISMATCH'}`);
        } else {
            console.log(`ID ${dbSong.id}: Not found in JSON`);
        }
    });
}

checkIds();
