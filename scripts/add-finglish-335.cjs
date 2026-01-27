/**
 * Add Finglish to Song 335 Timing File
 * Uses Gemini API to generate Finglish transliteration
 */

const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDy10lfMhXoYCcFzq_CJlJXxMQYXSVCkfw';

async function addFinglishToTimingFile() {
    const timingFile = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\frontend\\public\\worship\\data\\timings\\song_335_timing.json';

    console.log('📖 Reading timing file...\n');
    const timingData = JSON.parse(fs.readFileSync(timingFile, 'utf8'));

    console.log(`✓ Loaded ${timingData.lines.length} lines\n`);
    console.log('🔤 Generating Finglish transliterations with Gemini...\n');

    // Extract all Persian words
    const allWords = [];
    timingData.lines.forEach(line => {
        line.words.forEach(word => {
            if (word.word && !allWords.includes(word.word)) {
                allWords.push(word.word);
            }
        });
    });

    console.log(`  Found ${allWords.length} unique Persian words\n`);

    // Call Gemini API to get Finglish for all words
    const prompt = `Convert these Persian words to Finglish (Persian using English alphabet). Return a JSON object with Persian words as keys and Finglish as values. Keep it simple and phonetic.

Persian words: ${JSON.stringify(allWords)}

Return ONLY a JSON object in this format:
{
  "آرامی": "aarami",
  "دل": "del",
  ...
}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: 'application/json'
                }
            })
        });

        const result = await response.json();
        const finglishMap = JSON.parse(result.candidates[0].content.parts[0].text);

        console.log('✓ Received Finglish translations\n');
        console.log('📝 Sample translations:');
        Object.entries(finglishMap).slice(0, 5).forEach(([persian, finglish]) => {
            console.log(`  ${persian} → ${finglish}`);
        });
        console.log('');

        // Apply Finglish to timing data
        let updatedCount = 0;
        timingData.lines.forEach(line => {
            line.words.forEach(word => {
                if (finglishMap[word.word]) {
                    word.finglish = finglishMap[word.word];
                    updatedCount++;
                }
            });
        });

        console.log(`✓ Updated ${updatedCount} words with Finglish\n`);

        // Save updated file
        fs.writeFileSync(timingFile, JSON.stringify(timingData, null, 2), 'utf8');

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ SUCCESS! Finglish added to timing file');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`📄 File: ${timingFile}`);
        console.log(`📊 Lines: ${timingData.lines.length}`);
        console.log(`🔤 Words with Finglish: ${updatedCount}`);
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

addFinglishToTimingFile().catch(console.error);
