/**
 * Bible Audio Upload Script for HiDrive
 * Uploads all Bible audio files to IONOS HiDrive storage
 */

const hidriveStorage = require('./services/hidriveStorage');
const fs = require('fs').promises;
const path = require('path');

const BIBLE_AUDIO_DIR = path.join(__dirname, '../bible_data/audio');

async function uploadBibleAudio() {
  console.log('📤 Starting Bible Audio Upload to HiDrive...\n');

  try {
    // Check if directory exists
    await fs.access(BIBLE_AUDIO_DIR);
    
    // Get translations
    const translations = await fs.readdir(BIBLE_AUDIO_DIR);
    console.log(`Found ${translations.length} translations: ${translations.join(', ')}\n`);

    let totalFiles = 0;
    let uploaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const translation of translations) {
      const translationPath = path.join(BIBLE_AUDIO_DIR, translation);
      const stat = await fs.stat(translationPath);
      
      if (!stat.isDirectory()) continue;

      console.log(`\n📖 Processing ${translation}...`);

      // Get books
      const books = await fs.readdir(translationPath);

      for (const book of books) {
        const bookPath = path.join(translationPath, book);
        const bookStat = await fs.stat(bookPath);
        
        if (!bookStat.isDirectory()) continue;

        // Get chapters
        const chapters = await fs.readdir(bookPath);
        const mp3Files = chapters.filter(f => f.endsWith('.mp3'));

        console.log(`  📁 ${book}: ${mp3Files.length} chapters`);

        for (const file of mp3Files) {
          totalFiles++;
          const localPath = path.join(bookPath, file);
          const hidrivePath = `bible/audio/${translation}/${book}/${file}`;

          try {
            // Check if already exists on HiDrive
            const exists = await hidriveStorage.fileExists('', hidrivePath);
            
            if (exists) {
              console.log(`    ⏭️  Skip: ${hidrivePath} (already exists)`);
              skipped++;
              continue;
            }

            // Read file
            const fileBuffer = await fs.readFile(localPath);
            
            // Upload to HiDrive
            await hidriveStorage.uploadFile(fileBuffer, 'bible/audio', `${translation}/${book}/${file}`);
            
            uploaded++;
            console.log(`    ✅ ${file}`);

          } catch (error) {
            errors++;
            console.error(`    ❌ Error uploading ${file}:`, error.message);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log(`   Total files: ${totalFiles}`);
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  uploadBibleAudio()
    .then(() => {
      console.log('\n✅ Upload complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Upload failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadBibleAudio };
