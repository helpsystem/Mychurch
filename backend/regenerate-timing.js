/**
 * Regenerate timing file with correct frontend format
 * Uses the precisionTimingService which outputs correct format
 */

require('dotenv').config();
const PrecisionTimingService = require('./services/precisionTimingService');

const SONG_335 = {
    id: 335,
    audioUrl: 'https://www.hidrive.strato.com/webdav/MyChurch-Files/worship/songs/wm_song_arami-delhaye.mp3',
    lyrics: `آرامی دل های
سازنده دریاها
روشنی خورشیدی
زیبایی رویاها
از تو امنیت دارم
در کشمکش طوفان
من قایق پوسیده
تو رهبر این سکان

آرامی دل های
سازنده دریاها
روشنی خورشیدی
زیبایی رویاها
از تو امنیت دارم
در کشمکش طوفان
من قایق پوسیده
تو رهبر این سکان

تا مقصد آزادی
سرباز تو می مانم
نعمت نجاتم را
از فیض تو می دانم

تا مقصد آزادی
سرباز تو می مانم
نعمت نجاتم را
از فیض تو می دانم

آن دم که در این جسمم
در غصه و در شادی
در ثروت و فقر و ظلم
ویرانی و آبادی

حاشا که اگر جز تو
یار دیگری گیرم
زنده ام از عشق تو
در راه تو می میرم

آن دم که در این جسمم
در غصه و در شادی
در ثروت و فقر و ظلم
ویرانی و آبادی

حاشا که اگر جز تو
یار دیگری گیرم
زنده ام از عشق تو
در راه تو می میرم`
};

async function regenerate() {
    console.log('🔄 Regenerating timing with correct format...\n');

    try {
        const service = new PrecisionTimingService();

        const result = await service.generateWorshipTiming({
            songId: SONG_335.id,
            audioUrl: SONG_335.audioUrl,
            lyrics: SONG_335.lyrics
        });

        if (result.success) {
            console.log('\n✅ SUCCESS!');
            console.log('📁 File saved to:', result.outputPath);
            console.log('📊 Lines:', result.timing.lines?.length);
            console.log('📊 First line:', result.timing.lines?.[0]);
        } else {
            console.log('\n❌ FAILED:', result.error);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

regenerate();
