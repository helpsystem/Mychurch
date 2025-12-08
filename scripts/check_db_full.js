import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envServerPath = path.join(__dirname, '..', '.env.server');
const envLocalPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envServerPath)) {
    dotenv.config({ path: envServerPath });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
    console.log('🔍 Checking database contents...\n');

    // Check bible_chapters
    const { data: chapters, count: chapCount } = await supabase
        .from('bible_chapters')
        .select('*', { count: 'exact', head: false })
        .limit(5);

    console.log(`📖 bible_chapters: ${chapCount} total rows`);
    if (chapters && chapters.length > 0) {
        console.log('Sample chapter:', chapters[0]);
    } else {
        console.log('⚠️ No chapters found!\n');
    }

    // Check bible_verses
    const { data: verses, count: verseCount } = await supabase
        .from('bible_verses')
        .select('*', { count: 'exact', head: false })
        .limit(5);

    console.log(`\n📝 bible_verses: ${verseCount} total rows`);
    if (verses && verses.length > 0) {
        console.log('Sample verse:', verses[0]);
    } else {
        console.log('⚠️ No verses found!');
    }

    // Check if there are any Persian verses
    const { data: persianVerses, count: persianCount } = await supabase
        .from('bible_verses')
        .select('*', { count: 'exact' })
        .not('text_fa', 'is', null);

    console.log(`\n🇮🇷 Persian verses (text_fa not null): ${persianCount}`);
}

checkDatabase();
