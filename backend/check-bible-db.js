// Check Bible audio data in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBibleData() {
  console.log('🔍 Checking Bible data in Supabase...\n');

  try {
    // Check bible_verses table
    console.log('📖 Checking bible_verses table...');
    const { data: verses, error: versesError } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('translation', 'tpv')
      .eq('book', 'GEN')
      .eq('chapter', 1)
      .limit(3);

    if (versesError) {
      console.log('  ⚠️  Error:', versesError.message);
    } else {
      console.log(`  ✅ Found ${verses.length} verses`);
      if (verses.length > 0) {
        console.log('  Sample verse:', JSON.stringify(verses[0], null, 2));
      }
    }

    // Check bible_chapters table
    console.log('\n📚 Checking bible_chapters table...');
    const { data: chapters, error: chaptersError } = await supabase
      .from('bible_chapters')
      .select('*')
      .eq('translation', 'tpv')
      .eq('book', 'GEN')
      .eq('chapter', 1)
      .limit(1);

    if (chaptersError) {
      console.log('  ⚠️  Error:', chaptersError.message);
    } else {
      console.log(`  ✅ Found ${chapters.length} chapters`);
      if (chapters.length > 0) {
        console.log('  Sample chapter:', JSON.stringify(chapters[0], null, 2));
      }
    }

    // Check bible_audio table
    console.log('\n🎵 Checking bible_audio table...');
    const { data: audio, error: audioError } = await supabase
      .from('bible_audio')
      .select('*')
      .eq('translation', 'tpv')
      .eq('book', 'GEN')
      .limit(3);

    if (audioError) {
      console.log('  ⚠️  Error:', audioError.message);
    } else {
      console.log(`  ✅ Found ${audio.length} audio records`);
      if (audio.length > 0) {
        console.log('  Sample audio:', JSON.stringify(audio[0], null, 2));
      }
    }

    // Check bible_audio_files table
    console.log('\n🎧 Checking bible_audio_files table...');
    const { data: audioFiles, error: audioFilesError } = await supabase
      .from('bible_audio_files')
      .select('*')
      .eq('translation', 'tpv')
      .limit(3);

    if (audioFilesError) {
      console.log('  ⚠️  Error:', audioFilesError.message);
    } else {
      console.log(`  ✅ Found ${audioFiles.length} audio file records`);
      if (audioFiles.length > 0) {
        console.log('  Sample:', JSON.stringify(audioFiles[0], null, 2));
      }
    }

    // List all tables
    console.log('\n📋 Listing all tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'bible%');

    if (!tablesError && tables) {
      console.log('  Bible-related tables:', tables.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBibleData();
