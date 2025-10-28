const fs = require('fs');

// تابع فیلتر lyrics مثل timing-recorder
function filterLyrics(lyrics) {
    if (!lyrics) return '';
    
    // حذف Chord ها: [C], [Dm], [G], etc.
    let clean = lyrics.replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]/g, '');
    
    // حذف عناوین: V1, V2, Chorus, etc.
    clean = clean.replace(/^(V\d+|Chorus\d*|Bridge|Intro|Outro|Verse\s*\d*)$/gm, '');
    
    // حذف virgool‌های انتهای خط (برای سینک با timing)
    clean = clean.replace(/\s*،\s*$/gm, '');
    clean = clean.replace(/،\s+/g, ' '); // virgool وسط خط → فاصله
    
    return clean.trim();
}

// خواندن فایل‌ها
const songs = JSON.parse(fs.readFileSync('public/worship/data/worship_songs.json', 'utf8'));
const timing = JSON.parse(fs.readFileSync('public/worship/data/timings/song_1_timing.json', 'utf8'));

const elshaddai = songs.find(s => s.id === 1);

console.log('=' .repeat(60));
console.log('📝 LYRICS خام در Database:');
console.log('='.repeat(60));
console.log(elshaddai.lyrics.fa.substring(0, 300));

console.log('\n' + '='.repeat(60));
console.log('🔄 LYRICS فیلتر شده (بدون V1, Chord, virgool):');
console.log('='.repeat(60));
const filteredLyrics = filterLyrics(elshaddai.lyrics.fa);
console.log(filteredLyrics.substring(0, 300));

console.log('\n' + '='.repeat(60));
console.log('⏱️ TIMING JSON - اولین 10 کلمه:');
console.log('='.repeat(60));
timing.words.slice(0, 10).forEach((w, i) => {
    console.log(`${i + 1}. "${w.word}" - ${w.start}s`);
});

console.log('\n' + '='.repeat(60));
console.log('📊 مقایسه (با lyrics فیلتر شده):');
console.log('='.repeat(60));

// پردازش lyrics برای مقایسه
const lyricsWords = filteredLyrics.split(/\s+/).filter(w => w.length > 0);
const timingWords = timing.words.map(w => w.word);

console.log(`تعداد کلمات lyrics فیلتر شده: ${lyricsWords.length}`);
console.log(`تعداد کلمات timing: ${timingWords.length}`);
console.log(`\n10 کلمه اول lyrics فیلتر شده:`);
lyricsWords.slice(0, 10).forEach((w, i) => console.log(`  ${i + 1}. ${w}`));

console.log(`\n10 کلمه اول timing:`);
timingWords.slice(0, 10).forEach((w, i) => console.log(`  ${i + 1}. ${w}`));

// چک کردن تطابق
let mismatchCount = 0;
const maxCheck = Math.min(30, lyricsWords.length, timingWords.length);
for (let i = 0; i < maxCheck; i++) {
    const lw = lyricsWords[i];
    const tw = timingWords[i];
    if (lw !== tw) {
        console.log(`\n❌ عدم تطابق در index ${i}:`);
        console.log(`   Lyrics: "${lw}"`);
        console.log(`   Timing: "${tw}"`);
        mismatchCount++;
    }
}

if (mismatchCount === 0) {
    console.log(`\n✅✅✅ ${maxCheck} کلمه اول کاملاً تطابق دارند! 🎉`);
} else {
    console.log(`\n⚠️ ${mismatchCount} عدم تطابق از ${maxCheck} کلمه یافت شد!`);
}
