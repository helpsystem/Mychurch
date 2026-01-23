/**
 * Convert timing from user's app format to website format
 * Source: آرامی دلهایی_full_project.json
 * Target: song_335_timing.json
 */

const fs = require('fs');
const path = require('path');

// Finglish mapping for Persian words
const finglishMap = {
  'آرامی': 'aarami',
  'دل': 'del',
  'هایی': 'haayi',
  'های': 'haaye',
  'سازنده': 'sazandeh',
  'دریاها': 'daryaaha',
  'روشنی': 'roshani',
  'خورشیدی': 'khorshidi',
  'زیبایی': 'zibaayi',
  'رویاها': 'royaaha',
  'از': 'az',
  'تو': 'to',
  'امنیت': 'amniyat',
  'دارم': 'daaram',
  'در': 'dar',
  'کشمکش': 'keshmakesh',
  'طوفان': 'toofaan',
  'من': 'man',
  'قایق': 'ghaayegh',
  'پوسیده': 'poosideh',
  'رهبر': 'rahbar',
  'این': 'in',
  'سوهان': 'sokkaan',
  'سوکان': 'sokkaan',
  'مقصد': 'maghsad',
  'آزادی': 'aazaadi',
  'سرباز': 'sarbaaz',
  'میمانم': 'mimaanam',
  'نعمت': 'nemat',
  'چاتم': 'khaatam',
  'را': 'raa',
  'فیض': 'feyz',
  'می': 'mi',
  'دانم': 'daanam',
  'آن': 'aan',
  'دم': 'dam',
  'که': 'ke',
  'جسمم': 'jesmam',
  'غصه': 'ghosseh',
  'قصه': 'ghesseh',
  'و': 'va',
  'شادی': 'shaadi',
  'ثروت': 'servat',
  'فقر': 'faghr',
  'ظلم': 'zolm',
  'ویرانی': 'viraani',
  'آبادی': 'aabaadi',
  'حاشا': 'haashaa',
  'اگر': 'agar',
  'جز': 'joz',
  'یار': 'yaar',
  'دیگری': 'digari',
  'گیرم': 'giram',
  'زنده': 'zendeh',
  'ام': 'am',
  'عشق': 'eshgh',
  'راه': 'raah',
  'میرم': 'miram'
};

function getFinglish(word) {
  return finglishMap[word] || word.toLowerCase();
}

// Read source file
const sourceFile = path.join(__dirname, '..', 'Project', 'آرامی دلهایی_full_project.json');
const targetFile = path.join(__dirname, '..', 'public', 'worship', 'data', 'timings', 'song_335_timing.json');

console.log('📂 Reading source file:', sourceFile);

const sourceData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

console.log(`✅ Found ${sourceData.structure.length} lines in source`);

// Convert to target format
const targetData = {
  songId: 335,
  generatedAt: new Date().toISOString(),
  version: "3.0",
  model: "user-app-precise",
  schema: "json-schema",
  source: "آرامی دلهایی_full_project.json",
  lines: sourceData.structure.map((item, index) => {
    const words = item.words.map(w => ({
      word: w.word,
      finglish: getFinglish(w.word),
      start: w.start_time,
      end: w.end_time
    }));
    
    const lineStart = words.length > 0 ? words[0].start : 0;
    const lineEnd = words.length > 0 ? words[words.length - 1].end : 0;
    
    return {
      line: item.content,
      start: lineStart,
      end: lineEnd,
      words: words
    };
  })
};

// Write target file
fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2), 'utf8');

console.log(`✅ Converted ${targetData.lines.length} lines`);
console.log(`📁 Saved to: ${targetFile}`);

// Show first line as sample
console.log('\n📋 Sample (Line 1):');
console.log(JSON.stringify(targetData.lines[0], null, 2));

// Show some stats
const firstWord = targetData.lines[0].words[0];
const lastLine = targetData.lines[targetData.lines.length - 1];
const lastWord = lastLine.words[lastLine.words.length - 1];

console.log(`\n📊 Timing Stats:`);
console.log(`   First word starts at: ${firstWord.start}s`);
console.log(`   Last word ends at: ${lastWord.end}s`);
console.log(`   Total duration: ${lastWord.end}s`);
