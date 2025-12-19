
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('Checking Storage Buckets...');
    const { data: buckets, error: bucketError } = await supabase
        .storage
        .listBuckets();

    if (bucketError) {
        console.log('Error listing buckets:', bucketError.message);
        return;
    }

    console.log('Buckets:', buckets.map(b => b.name));

    for (const bucket of buckets) {
        if (bucket.name.includes('audio') || bucket.name.includes('bible')) {
            console.log(`\nListing files in bucket '${bucket.name}' (limit 10)...`);
            const { data: files, error: fileError } = await supabase
                .storage
                .from(bucket.name)
                .list('', { limit: 10 });

            if (fileError) console.error('Error listing files:', fileError);
            else {
                console.log(`Found ${files.length} files/folders.`);
                files.forEach(f => console.log(` - ${f.name} (${f.metadata ? f.metadata.mimetype : 'folder'})`));
            }
        }
    }
}

checkStorage();
