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

async function simpleRPCTest() {
    console.log('🧪 Simple RPC Test\n');

    // Get first chapter
    const { data: chapters } = await supabase
        .from('bible_chapters')
        .select('id, book_iso, chapter_number, language')
        .eq('book_iso', 'GEN')
        .eq('chapter_number', 1)
        .limit(1);

    if (!chapters || chapters.length === 0) {
        console.error('❌ No chapters found');
        return;
    }

    const chapter = chapters[0];
    console.log('Found chapter:', chapter);

    // Get a verse from this chapter
    const { data: existingVerse } = await supabase
        .from('bible_verses')
        .select('*')
        .eq('chapter_id', chapter.id)
        .eq('verse_number', 1)
        .limit(1)
        .single();

    console.log('\nExisting verse 1:', existingVerse);

    // Test RPC call
    const testData = [{
        chapter_id: chapter.id,
        verse_number: 1,
        text_fa: '🔥 RPC تست موفق - آیه ۱'
    }];

    console.log('\n📤 Calling RPC...');
    const { data, error } = await supabase.rpc('import_persian_verses_batch', {
        verses_data: testData
    });

    if (error) {
        console.error('\n❌ RPC Error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
        console.log('\n✅ RPC Success!');
        console.log('Response type:', typeof data);
        console.log('Response:', JSON.stringify(data, null, 2));
    }

    // Check verse again
    const { data: updatedVerse } = await supabase
        .from('bible_verses')
        .select('verse_number, text_fa')
        .eq('chapter_id', chapter.id)
        .eq('verse_number', 1)
        .limit(1)
        .single();

    console.log('\n📖 After RPC call:', updatedVerse);
}

simpleRPCTest();
