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

async function testRPC() {
    console.log('🧪 Testing RPC function with sample data...\n');

    // Get a real chapter ID from the database
    const { data: chapters } = await supabase
        .from('bible_chapters')
        .select('id')
        .eq('book_iso', 'GEN')
        .eq('chapter_number', 1)
        .single();

    if (!chapters) {
        console.error('❌ Could not find Genesis chapter 1');
        return;
    }

    const testData = [
        {
            chapter_id: chapters.id,
            verse_number: 1,
            text_fa: 'تست فارسی ۱'
        },
        {
            chapter_id: chapters.id,
            verse_number: 2,
            text_fa: 'تست فارسی ۲'
        }
    ];

    console.log('Test data:', JSON.stringify(testData, null, 2));
    console.log('\nCalling RPC...\n');

    const { data, error } = await supabase.rpc('import_persian_verses_batch', {
        verses_data: testData
    });

    if (error) {
        console.error('❌ RPC Error:', error);
    } else {
        console.log('✅ RPC Response:', data);
    }
}

testRPC();
