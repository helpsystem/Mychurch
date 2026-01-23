const fs = require('fs');
const path = require('path');
const PrecisionTimingService = require('../backend/services/precisionTimingService');
require('dotenv').config();

async function regenerate() {
    // Delete temp file if exists to force download
    const tempPath = path.join(__dirname, '../backend/services/temp_audio_335.mp3');
    if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (e) { }
    }

    // Also check current directory
    const localTemp = path.join(__dirname, 'temp_audio_335.mp3');
    if (fs.existsSync(localTemp)) {
        try { fs.unlinkSync(localTemp); } catch (e) { }
    }

    const service = new PrecisionTimingService();
    // Explicit URL to the verified large file
    const audioUrl = 'https://samanabyar.online/worship/audio/kalameh/1%20Aramiye%20delhaayee.mp3';

    // Lyrics from file - cleaned
    const lyrics = `V1 (x2)
آرامی دلهایی
سازنده دریاها
روشنی خورشیدی ، زیبایی رویاها
از تو امنیت دارم ، در کشمکش طوفان
من قایق پوسیده ، تو رهبر این سکان
Chorus (x2)
تا مقصد آزادی سرباز تو میمانم
نعمت نجاتم را از فیض تو میدانم
[column]
V2 (x2)
آندم که در این جسمم
در غصه و در شادی
در ثروت و فقر و ظلم ویرانی و آبادی
حاشا که اگر جز تو یار دگری گیرم
زندهام از عشق تو در راه تو میمیرم 
Chorus`;

    console.log('Generating timing...');
    try {
        const result = await service.generateWorshipTiming({ songId: 335, audioUrl, lyrics });
        if (result.success) {
            console.log('Success!');
            console.log('Path:', result.outputPath);
            console.log('Start time:', result.timing.lines[0].start);
        } else {
            console.error('Error:', result.error);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}
regenerate();
