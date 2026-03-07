require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addTimepointsColumn() {
    console.log('Adding timepoints column to worship_songs...');

    // Try to add a timepoints column by upserting a test record with empty array
    // Since we can't run raw SQL with anon key, we'll check/handle via the API
    // The column will be created when we first save to it

    // Check if a song exists to test
    const { data: songs, error } = await supabase
        .from('worship_songs')
        .select('id, timepoints')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
        console.log('\n⚠️  If timepoints column is missing, run this in Supabase SQL Editor:');
        console.log('ALTER TABLE worship_songs ADD COLUMN IF NOT EXISTS timepoints JSONB DEFAULT \'[]\'::jsonb;');
    } else {
        const hasTimepoints = songs[0] && 'timepoints' in songs[0];
        if (hasTimepoints) {
            console.log('✅ timepoints column already exists!');
        } else {
            console.log('⚠️  timepoints column not found in query result.');
            console.log('Run this SQL in Supabase SQL Editor:');
            console.log('ALTER TABLE worship_songs ADD COLUMN IF NOT EXISTS timepoints JSONB DEFAULT \'[]\'::jsonb;');
        }
    }
}

addTimepointsColumn();
