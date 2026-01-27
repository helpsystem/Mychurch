/**
 * Add Finglish using simple Persian-to-Finglish conversion
 */

const fs = require('fs');

const timingFile = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\frontend\\public\\worship\\data\\timings\\song_335_timing.json';

console.log('📖 Reading timing file...\n');
const timingData = JSON.parse(fs.readFileSync(timingFile, 'utf8'));

// Simple Persian to Finglish mapping based on common pronunciation
const finglishMap = {
    'آرامی': 'aarami',
    'دل': 'del',
    'هایی': 'haayi',
    'سازنده': 'saazandeh',
    'دریاها': 'daryaaha',
    'روشنی': 'rowshani',
    'خورشیدی': 'khorshidi',
    'زیبایی': 'zibaayi',
    'رویاها': 'royaaha',
    'از': 'az',
    'تو': 'to',
    'امنیت': 'amniyat',
    'دارم': 'daaram',
    'در': 'dar',
    'کشمکش': 'kashmakesh',
    'طوفان': 'toofaan',
    'من': 'man',
    'قایق': 'ghaayegh',
    'پوسیده': 'poosideh',
    'رهبر': 'rahbar',
    'این': 'in',
    'سوکان': 'sokaan',
    'سوهان': 'sokaan',
    'مقصد': 'maghsad',
    'آزادی': 'aazaadi',
    'سرباز': 'sarbaaz',
    'میمانم': 'mimaanam',
    'نعمت': 'ne'mat',
    'چاتم': 'chaatem',
    'را': 'ra',
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
    'حاشا': 'haasha',
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

let updatedCount = 0;
timingData.lines.forEach(line => {
    line.words.forEach(word => {
        if (finglishMap[word.word]) {
            word.finglish = finglishMap[word.word];
            updatedCount++;
        } else if (word.finglish === null) {
            // Keep null if not in map
            console.warn(`  ⚠️  No Finglish for: ${word.word}`);
        }
    });
});

fs.writeFileSync(timingFile, JSON.stringify(timingData, null, 2), 'utf8');

console.log(`✅ SUCCESS! Added Finglish to ${updatedCount} words`);
console.log(`📄 File: ${timingFile}`);
