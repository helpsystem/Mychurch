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

async function checkTranslations() {
    console.log('📚 بررسی Translation ها\n');

    // Get all translations
    const { data: translations } = await supabase
        .from('bible_translations')
        .select('*')
        .order('id');

    if (!translations || translations.length === 0) {
        console.log('❌ جدول bible_translations وجود نداره یا خالیه\n');

        // Check distinct translation_ids in verses
        const { data: verses } = await supabase
            .from('bible_verses')
            .select('translation_id')
            .limit(1000);

        const uniqueIds = [...new Set(verses?.map(v => v.translation_id))];
        console.log(`Translation IDs در bible_verses: ${uniqueIds.join(', ')}`);

    } else {
        console.log(`✅ ${translations.length} Translation یافت شد:\n`);
        for (const t of translations) {
            console.log(`ID: ${t.id} | Name: ${t.name} | Language: ${t.language} | Code: ${t.code}`);
        }
    }
}

checkTranslations();
