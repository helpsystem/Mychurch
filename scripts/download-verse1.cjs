/**
 * Download Missing Verse 1 from WordProject
 * 
 * This script fetches verse 1 from WordProject.org for all chapters
 * that are missing verse 1 in our local JSON files.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const bibleDir = path.join(__dirname, '../public/text/bible/fa');

// Helper to fetch HTML
function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract verse 1 from WordProject HTML
function extractVerse1(html) {
  // The format is: verse text starts after chapter heading
  // Look for pattern like: 1\u00a0 text... 2\u00a0 or just the first verse
  
  // Try to find verse 1 text
  const patterns = [
    /فصل\s+\d+\s*<\/b><\/font>[\s\S]*?<p[^>]*>([\s\S]*?)<span/i,
    /<p[^>]*>\s*([\u0600-\u06FF\s\.,،؛؟!«»\-\(\)]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let verse1 = match[1].trim();
      // Clean up
      verse1 = verse1.replace(/<[^>]+>/g, '');
      verse1 = verse1.replace(/&nbsp;/g, ' ');
      verse1 = verse1.replace(/\s+/g, ' ');
      verse1 = verse1.trim();
      
      // Get text before "2 " (verse 2 marker)
      const v2Match = verse1.match(/^([\s\S]+?)\s*2\s+/);
      if (v2Match) {
        verse1 = v2Match[1].trim();
      }
      
      if (verse1.length > 10) {
        return verse1;
      }
    }
  }
  return null;
}

async function downloadMissingVerse1() {
  const bookDirs = fs.readdirSync(bibleDir).filter(f => {
    return fs.statSync(path.join(bibleDir, f)).isDirectory();
  }).sort();
  
  let fixed = 0;
  let failed = 0;
  
  for (const bookCode of bookDirs) {
    const bookPath = path.join(bibleDir, bookCode);
    const chapterFiles = fs.readdirSync(bookPath).filter(f => f.endsWith('.json'));
    
    for (const chapterFile of chapterFiles) {
      const filePath = path.join(bookPath, chapterFile);
      const chapterNum = chapterFile.replace('.json', '');
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (!data.verses || !data.verses["1"]) {
          // Fetch from WordProject
          const url = `https://www.wordproject.org/bibles/fa/${bookCode}/${chapterNum}.htm`;
          console.log(`Fetching: ${bookCode}/${chapterNum}...`);
          
          try {
            const html = await fetchHTML(url);
            const verse1 = extractVerse1(html);
            
            if (verse1) {
              data.verses = { "1": verse1, ...data.verses };
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
              console.log(`✅ Fixed: ${bookCode}/${chapterNum}`);
              fixed++;
            } else {
              console.log(`⚠️ Could not extract: ${bookCode}/${chapterNum}`);
              failed++;
            }
          } catch (fetchErr) {
            console.log(`❌ Fetch error: ${bookCode}/${chapterNum}:`, fetchErr.message);
            failed++;
          }
          
          // Rate limit - wait 100ms between requests
          await new Promise(r => setTimeout(r, 100));
        }
      } catch (err) {
        console.error(`❌ Error: ${filePath}:`, err.message);
        failed++;
      }
    }
  }
  
  console.log(`\n📊 Summary: Fixed ${fixed}, Failed ${failed}`);
}

downloadMissingVerse1();
