/**
 * Test Parse Single HTML File
 * تست استخراج آیات از یک فایل HTML
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Test file path
const TEST_FILE = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm\\www.wordproject.org\\bibles\\fa\\01\\1.html';

/**
 * Parse HTML file and extract verses
 */
function parseHTMLFile(filePath) {
  try {
    console.log(`📖 Parsing: ${path.basename(filePath)}`);
    
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);
    const verses = [];

    // WordProject structure: <span class="verse" id="1">1 </span>&nbsp;متن آیه<br />
    $('span.verse').each((i, elem) => {
      const $span = $(elem);
      const verseNum = parseInt($span.attr('id') || $span.text().trim());
      
      if (verseNum > 0) {
        // Get text after this span until next <br> or next span.verse
        let text = '';
        let $next = $span.next();
        
        // Collect text nodes and elements
        while ($next.length > 0) {
          if ($next.is('br')) break;
          if ($next.is('span.verse')) break;
          
          text += $next.text() + ' ';
          $next = $next.next();
        }
        
        // Also get direct text after span
        const directText = $span[0].nextSibling;
        if (directText && directText.type === 'text') {
          text = directText.data + ' ' + text;
        }
        
        text = text.replace(/&nbsp;/g, '').trim();
        
        if (text) {
          verses.push({
            verse_number: verseNum,
            text: text
          });
        }
      }
    });

    console.log(`✅ Found ${verses.length} verses`);
    
    // Show first 3 verses
    if (verses.length > 0) {
      console.log('\n📜 Sample verses:');
      verses.slice(0, 3).forEach(v => {
        console.log(`  ${v.verse_number}. ${v.text.substring(0, 100)}${v.text.length > 100 ? '...' : ''}`);
      });
    }

    return verses;
  } catch (error) {
    console.error(`❌ Error parsing ${filePath}:`, error.message);
    return [];
  }
}

// Run test
if (fs.existsSync(TEST_FILE)) {
  parseHTMLFile(TEST_FILE);
} else {
  console.error(`❌ File not found: ${TEST_FILE}`);
}
