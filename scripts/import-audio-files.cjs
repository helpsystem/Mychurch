/**
 * Import WordProject Audio Files
 * 
 * این اسکریپت فایل‌های صوتی کتاب مقدس را از WordProject
 * کپی و در Supabase Storage ذخیره می‌کند
 * 
 * مسیر منبع:
 * D:\https___www.wordproject.org_bibles_audio_01_english_index.htm\www.wordproject.org\bibles\audio\20_farsi
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wxzhzsqicgwfxffxayhy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Source path
const AUDIO_SOURCE_PATH = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\audio\\20_farsi';

// Bible book codes
const BOOK_CODES = {
  '01': 'GEN', '02': 'EXO', '03': 'LEV', '04': 'NUM', '05': 'DEU',
  '06': 'JOS', '07': 'JDG', '08': 'RUT', '09': '1SA', '10': '2SA',
  '11': '1KI', '12': '2KI', '13': '1CH', '14': '2CH', '15': 'EZR',
  '16': 'NEH', '17': 'EST', '18': 'JOB', '19': 'PSA', '20': 'PRO',
  '21': 'ECC', '22': 'SNG', '23': 'ISA', '24': 'JER', '25': 'LAM',
  '26': 'EZK', '27': 'DAN', '28': 'HOS', '29': 'JOL', '30': 'AMO',
  '31': 'OBA', '32': 'JON', '33': 'MIC', '34': 'NAM', '35': 'HAB',
  '36': 'ZEP', '37': 'HAG', '38': 'ZEC', '39': 'MAL',
  '40': 'MAT', '41': 'MRK', '42': 'LUK', '43': 'JHN', '44': 'ACT',
  '45': 'ROM', '46': '1CO', '47': '2CO', '48': 'GAL', '49': 'EPH',
  '50': 'PHP', '51': 'COL', '52': '1TH', '53': '2TH', '54': '1TI',
  '55': '2TI', '56': 'TIT', '57': 'PHM', '58': 'HEB', '59': 'JAS',
  '60': '1PE', '61': '2PE', '62': '1JN', '63': '2JN', '64': '3JN',
  '65': 'JUD', '66': 'REV'
};

/**
 * Upload audio file to Supabase Storage
 */
async function uploadAudioFile(filePath, bookCode, chapterNum) {
  try {
    const fileName = `${bookCode}_${String(chapterNum).padStart(3, '0')}.mp3`;
    const storagePath = `bible-audio/farsi/${fileName}`;

    console.log(`📤 Uploading: ${fileName}...`);

    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from('audio')
      .upload(storagePath, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (error) {
      console.error(`❌ Upload failed for ${fileName}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(storagePath);

    console.log(`✅ Uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error(`❌ Error uploading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Save audio URL to database
 */
async function saveAudioUrl(bookCode, chapterNum, audioUrl) {
  const { data: bookData, error: bookError } = await supabase
    .from('bible_books')
    .select('id')
    .eq('book_iso', bookCode)
    .single();

  if (bookError || !bookData) {
    console.error(`❌ Book not found: ${bookCode}`);
    return false;
  }

  const { error } = await supabase
    .from('bible_audio')
    .upsert({
      book_id: bookData.id,
      chapter_number: chapterNum,
      audio_url: audioUrl,
      language: 'fa',
      narrator: 'WordProject Farsi'
    }, {
      onConflict: 'book_id,chapter_number,language'
    });

  if (error) {
    console.error(`❌ Error saving audio URL:`, error.message);
    return false;
  }

  return true;
}

/**
 * Scan directory and upload all audio files
 */
async function importAudioFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directory not found: ${dirPath}`);
    return;
  }

  console.log(`\n📂 Scanning audio directory: ${dirPath}`);

  const files = fs.readdirSync(dirPath);
  let uploadedCount = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      await importAudioFiles(filePath);
    } else if (file.endsWith('.mp3') || file.endsWith('.wav')) {
      // Parse filename: e.g., "01_001.mp3" = Book 01, Chapter 001
      const match = file.match(/(\d{2})_(\d{3})\.(mp3|wav)/);

      if (match) {
        const bookNum = match[1];
        const chapterNum = parseInt(match[2]);
        const bookCode = BOOK_CODES[bookNum];

        if (bookCode) {
          const audioUrl = await uploadAudioFile(filePath, bookCode, chapterNum);

          if (audioUrl) {
            await saveAudioUrl(bookCode, chapterNum, audioUrl);
            uploadedCount++;
          }
        }
      } else {
        console.warn(`⚠️  Invalid filename format: ${file}`);
      }
    }
  }

  console.log(`\n✅ Uploaded ${uploadedCount} audio files`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Audio Files Import...\n');
  console.log('=' .repeat(60));
  console.log('🎵 IMPORTING FARSI AUDIO FILES');
  console.log('='.repeat(60));

  try {
    await importAudioFiles(AUDIO_SOURCE_PATH);
    console.log('\n✅ Audio import completed successfully!');
  } catch (error) {
    console.error('❌ Audio import failed:', error);
    process.exit(1);
  }
}

// Run import
if (require.main === module) {
  main();
}

module.exports = { uploadAudioFile, saveAudioUrl };
