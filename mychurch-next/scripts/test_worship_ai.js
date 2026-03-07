require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testWorshipAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env.local");
        return;
    }
    console.log("✅ GEMINI_API_KEY found:", apiKey.substring(0, 12) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const persianLyrics = `عیسی نام مقدس تو
شبان من تویی خداوند
در حضورت می‌پرستم
نام تو جلال جاودانه`;

    // Test 1: Translation
    console.log("\n--- Test 1: AI Translation ---");
    const translatePrompt = `You are a bilingual Persian-English Christian worship song translator.
Translate the following Persian worship song lyrics into beautiful, singable English.
Keep the same poetic structure and verse/chorus breaks.
Only output the English translation, nothing else.

Persian Lyrics:
${persianLyrics}`;

    const translateResult = await model.generateContent(translatePrompt);
    console.log("✅ Translation result:\n", translateResult.response.text());

    // Test 2: Chords
    console.log("\n--- Test 2: AI Chord Generation ---");
    const chordsPrompt = `You are a Christian worship music arranger.
Based on the following Persian worship song lyrics, suggest appropriate guitar chord progressions.
Format: Show each line with its chord(s) above it.
Only output the chord chart, nothing else.

Persian Lyrics:
${persianLyrics}`;

    const chordsResult = await model.generateContent(chordsPrompt);
    console.log("✅ Chords result:\n", chordsResult.response.text());
}

testWorshipAI().catch(err => {
    console.error("❌ Error:", err.message);
});
