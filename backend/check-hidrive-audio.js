// Quick check for Bible audio on HiDrive
const hidriveStorage = require('./services/hidriveStorage');
const path = require('path');

async function check() {
  try {
    console.log('🔍 Checking HiDrive bible/audio directory...\n');
    
    // Connect to SFTP
    await hidriveStorage.connect();
    const sftp = hidriveStorage.sftpClient;
    
    // Check bible/audio directory
    const basePath = process.env.HIDRIVE_BASE_PATH || '/users/adminchurch/mychurch';
    const bibleAudioPath = path.posix.join(basePath, 'bible/audio');
    
    console.log(`Checking path: ${bibleAudioPath}`);
    
    const exists = await sftp.exists(bibleAudioPath);
    
    if (!exists) {
      console.log('❌ Directory does not exist on HiDrive');
      console.log('ℹ️  Bible audio files need to be uploaded\n');
      return;
    }
    
    console.log('✅ Directory exists!\n');
    
    // List translations
    const translations = await sftp.list(bibleAudioPath);
    console.log(`Found ${translations.length} items:`);
    
    for (const item of translations.slice(0, 5)) {
      console.log(`  ${item.type === 'd' ? '📁' : '📄'} ${item.name}`);
      
      // If it's a directory (translation), check first book
      if (item.type === 'd') {
        const translationPath = path.posix.join(bibleAudioPath, item.name);
        const books = await sftp.list(translationPath);
        console.log(`     └─ ${books.length} books`);
        
        if (books.length > 0) {
          const firstBook = books[0];
          const bookPath = path.posix.join(translationPath, firstBook.name);
          const chapters = await sftp.list(bookPath);
          const mp3Files = chapters.filter(f => f.name.endsWith('.mp3'));
          console.log(`        └─ ${firstBook.name}: ${mp3Files.length} MP3 files`);
        }
      }
    }
    
    await hidriveStorage.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

check();
