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
    console.log('Loading environment from .env.server');
    dotenv.config({ path: envServerPath });
} else {
    console.log('Loading environment from .env');
    dotenv.config({ path: envLocalPath });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectFullSchema() {
    console.log('🔍 Inspecting Schema...');

    // Inspect bible_chapters
    console.log('\n--- bible_chapters ---');
    const { data: chapters, error: chapError } = await supabase.from('bible_chapters').select('*').limit(1);
    if (chapError) console.error(chapError);
    else if (chapters.length > 0) console.log(Object.keys(chapters[0]));
    else console.log('Empty table');

    // Inspect bible_verses
    console.log('\n--- bible_verses ---');
    const { data: verses, error: verseError } = await supabase.from('bible_verses').select('*').limit(1);
    if (verseError) console.error(verseError);
    else if (verses.length > 0) console.log(Object.keys(verses[0]));
    else console.log('Empty table');
}

inspectFullSchema();
