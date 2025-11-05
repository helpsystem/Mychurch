/**
 * Check actual database schema using raw SQL
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  console.log('📊 Checking bible_verses schema using SQL...\n');

  // Query column information
  const { data, error } = await supabase.rpc('get_bible_verses_schema', {});

  // Since RPC might not exist, let's just query a row and check its structure
  const { data: sampleVerse, error: verseError } = await supabase
    .from('bible_verses')
    .select('*')
    .limit(5);

  if (verseError) {
    console.error('❌ Error:', verseError.message);
    return;
  }

  console.log('✅ Sample verses from database:');
  console.log(JSON.stringify(sampleVerse, null, 2));
  
  if (sampleVerse && sampleVerse.length > 0) {
    console.log('\n📋 Available columns:', Object.keys(sampleVerse[0]));
  }

  // Try to query with book_id and chapter_number
  console.log('\n🔍 Testing query with book_id + chapter_number...\n');
  
  const { count, error: countError } = await supabase
    .from('bible_verses')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', 1);

  if (countError) {
    console.error('❌ Query error:', countError.message);
  } else {
    console.log(`✅ Found ${count} verses with chapter_id = 1`);
  }
}

checkSchema();
