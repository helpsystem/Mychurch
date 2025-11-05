/**
 * Check bible_verses table structure
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  console.log('📊 Checking bible_verses table schema...\n');

  const { data: versesData, error: versesError } = await supabase
    .from('bible_verses')
    .select('*')
    .limit(1);

  if (versesError) {
    console.error('❌ Error:', versesError.message);
  } else if (versesData && versesData.length > 0) {
    console.log('✅ Sample row from bible_verses:');
    console.log(JSON.stringify(versesData[0], null, 2));
    console.log('\n📋 Column names:', Object.keys(versesData[0]));
  }

  console.log('\n📊 Checking bible_chapters table schema...\n');

  const { data: chaptersData, error: chaptersError } = await supabase
    .from('bible_chapters')
    .select('*')
    .limit(1);

  if (chaptersError) {
    console.error('❌ Error:', chaptersError.message);
  } else if (chaptersData && chaptersData.length > 0) {
    console.log('✅ Sample row from bible_chapters:');
    console.log(JSON.stringify(chaptersData[0], null, 2));
    console.log('\n📋 Column names:', Object.keys(chaptersData[0]));
  }
}

checkSchema();
