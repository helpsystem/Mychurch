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

async function inspectSchema() {
    console.log('🔍 Inspecting bible_books columns...');

    // Try to fetch one row to see the keys
    const { data, error } = await supabase
        .from('bible_books')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('✅ Columns found:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
    } else {
        console.log('⚠️ Table is empty, cannot infer columns from data.');
    }
}

inspectSchema();
