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

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Required Supabase environment variables not found.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDb() {
    console.log('🔍 Inspecting bible_books table...');

    const { data: books, error } = await supabase
        .from('bible_books')
        .select('id, code, name_en');

    if (error) {
        console.error('❌ Error fetching books:', error);
        return;
    }

    console.log(`Found ${books.length} books.`);
    if (books.length > 0) {
        console.log('First 5 books:');
        console.table(books.slice(0, 5));

        console.log('Checking for GEN or 01...');
        const gen = books.find(b => b.code === 'GEN');
        const code01 = books.find(b => b.code === '01');

        console.log(`Has 'GEN': ${!!gen}`);
        console.log(`Has '01': ${!!code01}`);
    } else {
        console.warn('⚠️ Table appears to be empty!');
    }
}

debugDb().catch(console.error);
