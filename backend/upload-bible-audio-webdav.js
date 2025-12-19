/**
 * Bible Audio Upload to HiDrive via WebDAV
 * Uploads all Bible audio files using WebDAV instead of SFTP
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');

const BIBLE_AUDIO_DIR = path.join(__dirname, '../bible_data/audio');
const WEBDAV_BASE = process.env.HIDRIVE_PUBLIC_URL || 'https://webdav.hidrive.ionos.com/users/adminchurch/mychurch';
const AUTH = {
  username: process.env.HIDRIVE_USER || 'adminchurch',
  password: process.env.HIDRIVE_PASSWORD
};

async function uploadFile(localPath, remotePath) {
  const fileBuffer = await fs.readFile(localPath);
  const fullUrl = `${WEBDAV_BASE}/${remotePath}`;
  
  try {
    await axios.put(fullUrl, fileBuffer, {
      auth: AUTH,
      headers: {
        'Content-Type': 'audio/mpeg'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    return true;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}

async function createDirectory(remotePath) {
  const fullUrl = `${WEBDAV_BASE}/${remotePath}`;
  
  try {
    await axios({
      method: 'MKCOL',
      url: fullUrl,
      auth: AUTH
    });
    return true;
  } catch (error) {
    // Ignore if directory already exists
    if (error.response?.status === 405 || error.response?.status === 409) {
      return true;
    }
    throw error;
  }
}

async function fileExists(remotePath) {
  const fullUrl = `${WEBDAV_BASE}/${remotePath}`;
  
  try {
    await axios.head(fullUrl, { auth: AUTH });
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
}

async function uploadBibleAudio() {
  console.log('📤 Bible Audio Upload to HiDrive (WebDAV)\n');
  console.log(`Source: ${BIBLE_AUDIO_DIR}`);
  console.log(`Destination: ${WEBDAV_BASE}/bible/audio\n`);

  if (!AUTH.password) {
    console.error('❌ HIDRIVE_PASSWORD not set in .env');
    process.exit(1);
  }

  try {
    // Check if directory exists
    await fs.access(BIBLE_AUDIO_DIR);
    
    // Create base directory on HiDrive
    console.log('📁 Creating base directory: bible/audio');
    await createDirectory('bible');
    await createDirectory('bible/audio');
    
    // Get translations
    const translations = await fs.readdir(BIBLE_AUDIO_DIR);
    console.log(`\nFound ${translations.length} translations: ${translations.join(', ')}\n`);

    let totalFiles = 0;
    let uploaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const translation of translations) {
      const translationPath = path.join(BIBLE_AUDIO_DIR, translation);
      const stat = await fs.stat(translationPath);
      
      if (!stat.isDirectory()) continue;

      console.log(`\n📖 Processing ${translation}...`);
      
      // Create translation directory
      await createDirectory(`bible/audio/${translation}`);

      // Get books
      const books = await fs.readdir(translationPath);

      for (const book of books) {
        const bookPath = path.join(translationPath, book);
        const bookStat = await fs.stat(bookPath);
        
        if (!bookStat.isDirectory()) continue;

        // Create book directory
        await createDirectory(`bible/audio/${translation}/${book}`);

        // Get chapters
        const chapters = await fs.readdir(bookPath);
        const mp3Files = chapters.filter(f => f.endsWith('.mp3'));

        if (mp3Files.length === 0) continue;

        console.log(`  📁 ${book}: ${mp3Files.length} chapters`);

        for (const file of mp3Files) {
          totalFiles++;
          const localPath = path.join(bookPath, file);
          const remotePath = `bible/audio/${translation}/${book}/${file}`;

          try {
            // Check if already exists
            const exists = await fileExists(remotePath);
            
            if (exists) {
              skipped++;
              continue;
            }

            // Upload file
            await uploadFile(localPath, remotePath);
            
            uploaded++;
            process.stdout.write(`    ✅ ${file}\r`);

          } catch (error) {
            errors++;
            console.error(`\n    ❌ Error uploading ${file}: ${error.message}`);
          }
        }
        
        console.log(''); // New line after book
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
    console.error('\n❌ Fatal Error:', error.message);
    console.error('Stack:', error.stack);
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
