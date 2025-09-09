import axios from 'axios';

// Test parsing function
function parseVersesFromHtml(html) {
  console.log('=== Raw HTML (first 1000 chars) ===');
  console.log(html.substring(0, 1000));
  console.log('=== END Raw HTML ===\n');
  
  const verses = [];
  
  // Look for Persian text patterns in the actual HTML
  // First, let's search for any Persian text that looks like verses
  const persianTextMatches = html.match(/[\u0600-\u06FF\s\d\u060C\u061B\u061F\u0640\u066A\u066B\u066C\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2066\u2067\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F]+/g);
  
  if (!persianTextMatches) {
    console.log('❌ No Persian text found in HTML');
    return verses;
  }
  
  console.log(`✅ Found ${persianTextMatches.length} Persian text segments`);
  
  // Look for verse patterns in the Persian text
  let verseNumber = 1;
  for (const text of persianTextMatches) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length > 20 && 
        !cleanText.includes('کتاب مقدس') &&
        !cleanText.includes('صوتی') &&
        !cleanText.includes('پيدايش ايش') &&
        cleanText.includes('خدا')) { // Contains "خدا" (God) - good indicator of Bible verse
      
      console.log(`\nFound potential verse: ${cleanText.substring(0, 100)}...`);
      
      // Check if this starts with a verse number
      const verseMatch = cleanText.match(/^(\d+)\s+(.+)/);
      if (verseMatch) {
        const vNum = parseInt(verseMatch[1]);
        const vText = verseMatch[2].trim();
        console.log(`  ✅ Numbered verse ${vNum}: ${vText.substring(0, 50)}...`);
        verses.push({ verse_number: vNum, text_fa: vText });
      } else if (verseNumber === 1 && cleanText.includes('در ابتدا')) {
        console.log(`  ✅ Found verse 1: ${cleanText.substring(0, 50)}...`);
        verses.push({ verse_number: 1, text_fa: cleanText });
        verseNumber++;
      }
    }
  }
  
  if (verses.length === 0) {
    console.log('\n--- Showing all Persian text for debugging ---');
    persianTextMatches.slice(0, 10).forEach((text, i) => {
      console.log(`${i + 1}: ${text.substring(0, 100)}...`);
    });
  }
  
  console.log('✅ Chapter match found');
  const content = chapterMatch[1];
  console.log('=== Content after chapter header ===');
  console.log(content.substring(0, 500));
  console.log('=== END Content ===\n');
  
  // Split content into individual verses using verse number pattern
  const lines = content.split(/\n\n/).filter(line => line.trim());
  console.log(`Found ${lines.length} lines after splitting`);
  
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    console.log(`\n--- Line ${i + 1} ---`);
    console.log(line.substring(0, 200));
    
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.includes('Play / pause') || cleanLine.includes('volume') || cleanLine.includes('Right Click')) {
      console.log('  ⏭️  Skipped (contains unwanted content)');
      continue;
    }
    
    // Check if line starts with verse number
    const verseMatch = cleanLine.match(/^(\d+)\s+(.+)/);
    if (verseMatch) {
      const verseNumber = parseInt(verseMatch[1]);
      const verseText = verseMatch[2].replace(/<[^>]*>/g, '').trim();
      console.log(`  ✅ Found verse ${verseNumber}: ${verseText.substring(0, 50)}...`);
      if (verseText && verseText.length > 5) {
        verses.push({
          verse_number: verseNumber,
          text_fa: verseText
        });
      }
    } else {
      // This might be verse 1
      const cleanText = cleanLine.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      if (cleanText && cleanText.length > 10 && 
          !cleanText.includes('پيدايش ايش') && 
          !cleanText.includes('0:00') &&
          !cleanText.includes('Download')) {
        console.log(`  💭 Potential verse 1: ${cleanText.substring(0, 50)}...`);
        const existingVerseNumbers = verses.map(v => v.verse_number);
        if (verses.length === 0 || !existingVerseNumbers.includes(1)) {
          verses.push({
            verse_number: 1,
            text_fa: cleanText
          });
        }
      } else {
        console.log('  ⏭️  Skipped (too short or unwanted content)');
      }
    }
  }
  
  verses.sort((a, b) => a.verse_number - b.verse_number);
  
  console.log(`\n🎉 Final result: ${verses.length} verses found`);
  verses.forEach(v => console.log(`  ${v.verse_number}: ${v.text_fa.substring(0, 80)}...`));
  
  return verses;
}

// Test the function
async function testParsing() {
  try {
    console.log('🌐 Fetching Genesis Chapter 1...\n');
    const response = await axios.get('https://www.wordproject.org/bibles/fa/01/1.htm', { timeout: 30000 });
    parseVersesFromHtml(response.data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testParsing();