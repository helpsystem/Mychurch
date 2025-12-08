import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envServerPath = path.join(__dirname, '..', '.env.server');
if (fs.existsSync(envServerPath)) {
    dotenv.config({ path: envServerPath });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRPCWithRealData() {
    console.log('🧪 Testing RPC with real data...\n');

    // Get a real chapter
    const { data: chapter } = await supabase
        .from('bible_chapters')
        .select('id')
        .eq('book_iso', 'GEN')
        .eq('chapter_number', 1)
        .single();

    console.log('Chapter ID:', chapter.id);

    const testData = [
        {
            chapter_id: chapter.id,
            verse_number: 1,
            text_fa: 'تست آپدیت - Test Update 1'
        },
        {
            chapter_id: chapter.id,
            verse_number: 2,
            text_fa: 'تست آپدیت - Test Update 2'
        }
    ];

    console.log('\n📤 Calling RPC with data:', testData);

    const { data, error } = await supabase.rpc('import_persian_verses_batch', {
        verses_data: testData
    });

    if (error) {
        console.error('\n❌ RPC Error:', error);
    } else {
        console.log('\n✅ RPC Response:');
        console.log('Type:', typeof data);
        console.log('Data:', JSON.stringify(data, null, 2));

        if (Array.isArray(data) && data.length > 0) {
            console.log('\nFirst result:', data[0]);
        }
    }

    // Check if verses were updated
    console.log('\n🔍 Checking if verses were updated...');
    const { data: verses } = await supabase
        .from('bible_verses')
        .select('verse_number, text_fa')
        .eq('chapter_id', chapter.id)
        .in('verse_number', [1, 2]);

    console.log('Updated verses:', verses);
}

testRPCWithRealData();
