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

async function debugChapters() {
    console.log('🔍 Inspecting bible_chapters table...');

    // 1. Check count
    const { count, error: countError } = await supabase
        .from('bible_chapters')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Error counting chapters:', countError);
        return;
    }
    console.log(`Total chapters in DB: ${count}`);

    if (count === 0) {
        console.warn('⚠️ bible_chapters table is EMPTY! You need to populate it first.');
        return;
    }

    // 2. Check a sample chapter for Genesis (Book ID for GEN)
    // First get GEN book id
    const { data: book } = await supabase.from('bible_books').select('id').eq('book_iso', 'GEN').single();

    if (!book) {
        console.error('❌ Genesis book not found');
        return;
    }
    console.log(`Genesis Book ID: ${book.id}`);

    const { data: chapters, error: chapError } = await supabase
        .from('bible_chapters')
        .select('*')
        .eq('book_id', book.id)
        .limit(5);

    if (chapError) {
        console.error('❌ Error fetching chapters:', chapError);
    } else {
        console.log('Sample Genesis chapters:', chapters);
    }
}

debugChapters().catch(console.error);
