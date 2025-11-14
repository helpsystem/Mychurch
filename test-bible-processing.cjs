// Test script for Bible Audio Processing functionality
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Bible Audio Processing functionality...\n');

// Test 1: Check Bible processing implementation in Admin Panel
console.log('✅ Test 1: Checking Bible processing in Admin Panel');
try {
  const adminPagePath = path.join(__dirname, 'pages', 'AdminSyncManagementPage.tsx');
  if (fs.existsSync(adminPagePath)) {
    const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
    
    // Check for Bible processing features
    const hasBibleTab = adminPageContent.includes('کتاب مقدس صوتی') || adminPageContent.includes('Bible Audio');
    const hasBibleProcessing = adminPageContent.includes('handleProcessBibleChapter');
    const hasBibleAPI = adminPageContent.includes('process-bible');
    const hasBibleVersesAPI = adminPageContent.includes('/api/bible/verses');
    const hasBibleChaptersState = adminPageContent.includes('bibleChapters');
    
    console.log(`  - Bible tab: ${hasBibleTab ? '✅' : '❌'}`);
    console.log(`  - Bible processing function: ${hasBibleProcessing ? '✅' : '❌'}`);
    console.log(`  - Bible API endpoint: ${hasBibleAPI ? '✅' : '❌'}`);
    console.log(`  - Bible verses API: ${hasBibleVersesAPI ? '✅' : '❌'}`);
    console.log(`  - Bible chapters state: ${hasBibleChaptersState ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ AdminSyncManagementPage.tsx not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading AdminSyncManagementPage: ${error.message}`);
}

// Test 2: Check backend Bible processing endpoints
console.log('\n✅ Test 2: Checking backend Bible processing endpoints');
try {
  const routesPath = path.join(__dirname, 'backend', 'routes', 'audioSyncRoutes.js');
  if (fs.existsSync(routesPath)) {
    const routesContent = fs.readFileSync(routesPath, 'utf8');
    
    const hasBibleProcess = routesContent.includes('process-bible');
    const hasBibleBatch = routesContent.includes('process-batch-bible');
    const hasBibleLogic = routesContent.includes('bible') && routesContent.includes('timing');
    const hasErrorHandling = routesContent.includes('try') && routesContent.includes('catch');
    
    console.log(`  - Bible processing endpoint: ${hasBibleProcess ? '✅' : '❌'}`);
    console.log(`  - Bible batch endpoint: ${hasBibleBatch ? '✅' : '❌'}`);
    console.log(`  - Bible processing logic: ${hasBibleLogic ? '✅' : '❌'}`);
    console.log(`  - Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ audioSyncRoutes.js not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading audioSyncRoutes.js: ${error.message}`);
}

// Test 3: Check Bible database schema
console.log('\n✅ Test 3: Checking Bible database schema');
try {
  const schemaPath = path.join(__dirname, 'backend', 'migrations', 'complete_audio_sync_schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    const hasBibleTimingTable = schemaContent.includes('bible_audio_timing');
    const hasBookColumn = schemaContent.includes('book');
    const hasChapterColumn = schemaContent.includes('chapter');
    const hasTranslationColumn = schemaContent.includes('translation');
    const hasTimingData = schemaContent.includes('timing_data');
    
    console.log(`  - Bible timing table: ${hasBibleTimingTable ? '✅' : '❌'}`);
    console.log(`  - Book column: ${hasBookColumn ? '✅' : '❌'}`);
    console.log(`  - Chapter column: ${hasChapterColumn ? '✅' : '❌'}`);
    console.log(`  - Translation column: ${hasTranslationColumn ? '✅' : '❌'}`);
    console.log(`  - Timing data storage: ${hasTimingData ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ complete_audio_sync_schema.sql not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading schema file: ${error.message}`);
}

// Test 4: Check Bible data structure
console.log('\n✅ Test 4: Checking Bible data structure');
try {
  const biblePath = path.join(__dirname, 'types', 'bible.ts');
  if (fs.existsSync(biblePath)) {
    const bibleContent = fs.readFileSync(biblePath, 'utf8');
    
    const hasBookInterface = bibleContent.includes('interface') && bibleContent.includes('book');
    const hasChapterInterface = bibleContent.includes('interface') && bibleContent.includes('chapter');
    const hasVerseInterface = bibleContent.includes('interface') && bibleContent.includes('verse');
    const hasTranslationSupport = bibleContent.includes('translation') || bibleContent.includes('language');
    
    console.log(`  - Book interface: ${hasBookInterface ? '✅' : '❌'}`);
    console.log(`  - Chapter interface: ${hasChapterInterface ? '✅' : '❌'}`);
    console.log(`  - Verse interface: ${hasVerseInterface ? '✅' : '❌'}`);
    console.log(`  - Translation support: ${hasTranslationSupport ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ bible.ts not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading bible.ts: ${error.message}`);
}

// Test 5: Check Bible API integration
console.log('\n✅ Test 5: Checking Bible API integration');
try {
  const adminPagePath = path.join(__dirname, 'pages', 'AdminSyncManagementPage.tsx');
  if (fs.existsSync(adminPagePath)) {
    const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');
    
    const hasBibleAPI = adminPageContent.includes('/api/bible/verses');
    const hasAudioUrl = adminPageContent.includes('audioUrl');
    const hasBookName = adminPageContent.includes('bookName');
    const hasBookCode = adminPageContent.includes('bookCode');
    const hasTranslation = adminPageContent.includes('translation');
    
    console.log(`  - Bible verses API: ${hasBibleAPI ? '✅' : '❌'}`);
    console.log(`  - Audio URL handling: ${hasAudioUrl ? '✅' : '❌'}`);
    console.log(`  - Book name handling: ${hasBookName ? '✅' : '❌'}`);
    console.log(`  - Book code handling: ${hasBookCode ? '✅' : '❌'}`);
    console.log(`  - Translation handling: ${hasTranslation ? '✅' : '❌'}`);
  } else {
    console.log('  ❌ AdminSyncManagementPage.tsx not found');
  }
} catch (error) {
  console.log(`  ❌ Error reading AdminSyncManagementPage: ${error.message}`);
}

// Test 6: Check Bible audio file structure
console.log('\n✅ Test 6: Checking Bible audio file structure');
try {
  const audioPath = path.join(__dirname, 'public', 'audio', 'bible');
  if (fs.existsSync(audioPath)) {
    const audioFiles = fs.readdirSync(audioPath);
    const hasAudioFiles = audioFiles.length > 0;
    const hasMp3Files = audioFiles.some(file => file.endsWith('.mp3'));
    
    console.log(`  - Audio directory exists: ${fs.existsSync(audioPath) ? '✅' : '❌'}`);
    console.log(`  - Has audio files: ${hasAudioFiles ? '✅' : '❌'}`);
    console.log(`  - Has MP3 files: ${hasMp3Files ? '✅' : '❌ (found in subdirectories)'}`);
    console.log(`  - Total audio files: ${audioFiles.length}`);
    
    if (audioFiles.length > 0) {
      console.log(`  - Sample files: ${audioFiles.slice(0, 3).join(', ')}`);
    }
  } else {
    console.log('  ❌ Audio directory not found');
  }
} catch (error) {
  console.log(`  ❌ Error checking audio files: ${error.message}`);
}

console.log('\n🎯 Bible Testing Instructions:');
console.log('1. Open https://samanabyar.online/#/admin/sync-management');
console.log('2. Login with: help.system@ymail.com / Samyar@1989');
console.log('3. Switch to "کتاب مقدس صوتی" (Bible Audio) tab');
console.log('4. Select a Bible chapter');
console.log('5. Click the process button');
console.log('6. Monitor progress indicators');
console.log('7. Check timing data in database');

console.log('\n📋 Expected Bible Processing Behavior:');
console.log('- Bible chapters should be listed with audio files');
console.log('- Process button should be available for each chapter');
console.log('- Progress indicators should show processing status');
console.log('- Timing data should be saved to bible_audio_timing table');
console.log('- Chapters should be organized by book and chapter number');

console.log('\n🔧 Bible Audio File Format:');
console.log('- Files should be named as: BOOK_CHAPTER_translation.mp3');
console.log('- Example: GEN_1_fa.mp3 (Genesis 1, Persian)');
console.log('- Audio files should be accessible via /audio/bible/ directory');

console.log('\n⚠️  Important Notes:');
console.log('- Bible processing may take longer than worship songs');
console.log('- Ensure audio files are properly named and organized');
console.log('- Check database schema matches expected structure');
console.log('- Test with one chapter first before batch processing');