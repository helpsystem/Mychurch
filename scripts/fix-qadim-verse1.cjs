#!/usr/bin/env node
/**
 * Fix QADIM verse 1 - Copy correct verses from MOJDEH
 * MOJDEH and QADIM are both complete, so we can copy verse 1 from MOJDEH
 */

const fs = require('fs');
const path = require('path');

const TEXT_DIR = path.join(__dirname, '../bible_data/text');
const MOJDEH_DIR = path.join(TEXT_DIR, 'MOJDEH');
const QADIM_DIR = path.join(TEXT_DIR, 'QADIM');

async function fixQadimFromMojdeh() {
  console.log('\n🔧 اصلاح آیات ۱ QADIM از MOJDEH...\n');

  const books = fs.readdirSync(MOJDEH_DIR).filter(f => {
    return fs.statSync(path.join(MOJDEH_DIR, f)).isDirectory();
  });

  let fixedCount = 0;

  for (const book of books) {
    const mojdehBookDir = path.join(MOJDEH_DIR, book);
    const qadimBookDir = path.join(QADIM_DIR, book);

    if (!fs.existsSync(qadimBookDir)) continue;

    const chapters = fs.readdirSync(mojdehBookDir).filter(f => f.endsWith('.json'));

    for (const chapterFile of chapters) {
      const mojdehChapterPath = path.join(mojdehBookDir, chapterFile);
      const qadimChapterPath = path.join(qadimBookDir, chapterFile);

      if (!fs.existsSync(qadimChapterPath)) continue;

      try {
        const mojdehContent = JSON.parse(fs.readFileSync(mojdehChapterPath, 'utf-8'));
        const qadimContent = JSON.parse(fs.readFileSync(qadimChapterPath, 'utf-8'));

        // Get verse 1 from MOJDEH
        const verse1 = mojdehContent.verses?.[0];

        // Check if QADIM verse 1 has test data
        if (qadimContent.verses && qadimContent.verses[0] && 
            qadimContent.verses[0].text.includes('🔥 RPC تست موفق')) {
          
          // Replace with MOJDEH verse 1 structure
          qadimContent.verses[0] = verse1;
          
          fs.writeFileSync(qadimChapterPath, JSON.stringify(qadimContent, null, 2), 'utf-8');
          fixedCount++;
          process.stdout.write('.');
        }
      } catch (error) {
        console.error(`\n❌ Error with ${book}/${chapterFile}:`, error.message);
      }
    }
  }

  console.log(`\n\n✅ تعمیر کامل شد:`);
  console.log(`  آیات اصلاح شده: ${fixedCount}`);
}

fixQadimFromMojdeh().catch(console.error);
