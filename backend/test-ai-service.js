/**
 * Test Bible AI Service
 */

const bibleAIService = require('./services/bibleAIService');

async function runTests() {
  console.log('\n🧪 Testing Bible AI Service...\n');
  
  try {
    // Test 1: Search verses
    console.log('📝 Test 1: Search for "محبت" (love)');
    const searchResults = await bibleAIService.searchVerses('محبت', 'fa', 3);
    console.log(`   ✅ Found ${searchResults.length} verses`);
    if (searchResults.length > 0) {
      console.log(`   Sample: ${searchResults[0].book_name} ${searchResults[0].chapter_number}:${searchResults[0].verse_number}`);
      console.log(`   Text: ${searchResults[0].text.substring(0, 100)}...`);
    }
    
    // Test 2: Get verse by reference
    console.log('\n📝 Test 2: Get verse by reference "یوحنا 3:16"');
    const verseByRef = await bibleAIService.getVerseByReference('یوحنا 3:16', 'fa');
    if (verseByRef) {
      console.log(`   ✅ Found: ${verseByRef.book_name} ${verseByRef.chapter_number}:${verseByRef.verse_number}`);
      console.log(`   Text: ${verseByRef.text.substring(0, 100)}...`);
    } else {
      console.log('   ❌ Not found');
    }
    
    // Test 3: Get daily verse
    console.log('\n📝 Test 3: Get daily verse');
    const dailyVerse = await bibleAIService.getDailyVerse('fa');
    if (dailyVerse) {
      console.log(`   ✅ Today's verse: ${dailyVerse.book_name} ${dailyVerse.chapter_number}:${dailyVerse.verse_number}`);
      console.log(`   Text: ${dailyVerse.text.substring(0, 100)}...`);
    } else {
      console.log('   ❌ Not found');
    }
    
    // Test 4: Generate AI response
    console.log('\n📝 Test 4: AI Response to "چگونه می‌توانم آرامش پیدا کنم؟"');
    const aiResponse = await bibleAIService.generateAIResponse('چگونه می‌توانم آرامش پیدا کنم؟', 'fa');
    console.log(`   ✅ Answer: ${aiResponse.answer}`);
    console.log(`   ✅ Verses: ${aiResponse.verses.length}`);
    if (aiResponse.verses.length > 0) {
      console.log(`   Sample: ${aiResponse.verses[0].reference}`);
      console.log(`   Text: ${aiResponse.verses[0].text?.substring(0, 100) || 'No text'}...`);
    }
    
    // Test 5: Cross references
    console.log('\n📝 Test 5: Cross references for ["محبت", "عشق"]');
    const crossRefs = await bibleAIService.getCrossReferences(['محبت', 'عشق'], 'fa', 3);
    console.log(`   ✅ Found ${crossRefs.length} cross-references`);
    if (crossRefs.length > 0) {
      console.log(`   Sample: ${crossRefs[0].book_name} ${crossRefs[0].chapter_number}:${crossRefs[0].verse_number}`);
    }
    
    console.log('\n✅ All tests completed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
  
  process.exit(0);
}

runTests();
