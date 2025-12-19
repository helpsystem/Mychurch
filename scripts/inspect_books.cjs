
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking bible_books...");
    const { data: books, error } = await supabase.from('bible_books').select('*').limit(1);
    if (error) console.log('Books Error:', error.message);
    else {
        console.log('Books Keys:', books && books.length ? Object.keys(books[0]) : 'No books');
        console.log('Sample Book:', books ? books[0] : 'None');
    }

    console.log("\nChecking bible_translations...");
    const { data: translations, error: transError } = await supabase.from('bible_translations').select('*');
    if (transError) console.log('Translations Error:', transError.message);
    else console.log('Translations:', translations.map(t => ({ id: t.id, code: t.code, name: t.name_en })));
}
check();
