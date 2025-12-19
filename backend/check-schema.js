// Check actual Supabase schema
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSchema() {
  console.log('🔍 Checking Supabase schema...\n');

  // Check bible_verses
  console.log('📖 bible_verses:');
  const { data: verses, error: vError } = await supabase
    .from('bible_verses')
    .select('*')
    .limit(2);
  
  if (vError) {
    console.log('  Error:', vError.message);
  } else if (verses.length > 0) {
    console.log('  Columns:', Object.keys(verses[0]).join(', '));
    console.log('  Sample:', JSON.stringify(verses[0], null, 2));
  }

  // Check bible_chapters
  console.log('\n📚 bible_chapters:');
  const { data: chapters, error: cError } = await supabase
    .from('bible_chapters')
    .select('*')
    .limit(1);
  
  if (cError) {
    console.log('  Error:', cError.message);
  } else if (chapters.length > 0) {
    console.log('  Columns:', Object.keys(chapters[0]).join(', '));
    console.log('  Sample:', JSON.stringify(chapters[0], null, 2));
  }

  // Check bible_audio_files
  console.log('\n🎧 bible_audio_files:');
  const { data: audioFiles, error: aError } = await supabase
    .from('bible_audio_files')
    .select('*')
    .limit(2);
  
  if (aError) {
    console.log('  Error:', aError.message);
  } else if (audioFiles.length > 0) {
    console.log('  Columns:', Object.keys(audioFiles[0]).join(', '));
    console.log('  Sample:', JSON.stringify(audioFiles[0], null, 2));
  }

  // Check bible_books
  console.log('\n📕 bible_books:');
  const { data: books, error: bError } = await supabase
    .from('bible_books')
    .select('*')
    .limit(2);
  
  if (bError) {
    console.log('  Error:', bError.message);
  } else if (books.length > 0) {
    console.log('  Columns:', Object.keys(books[0]).join(', '));
    console.log('  Sample:', JSON.stringify(books[0], null, 2));
  }
}

checkSchema();
