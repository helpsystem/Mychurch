require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

async function main() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const audio = fs.readFileSync('D:/Windows.old/Users/Sami/Desktop/Iran Church DC/Git/Mychurch/frontend/public/worship/audio/kalameh/1 Aramiye delhaayee.mp3');
    console.log('Generating word-level timing...');

    const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            parts: [
                { inlineData: { mimeType: 'audio/mpeg', data: audio.toString('base64') } },
                { text: 'Listen to this Persian song. Generate word-level timestamps. Return JSON: {"lines":[{"line":"line text","start":0.0,"end":5.0,"words":[{"word":"word","start":0.0,"end":0.5}]}]}' }
            ]
        }],
        config: { responseMimeType: 'application/json', temperature: 0.1 }
    });

    const d = JSON.parse(r.text);
    console.log('Lines:', d.lines?.length);
    console.log('Sample:', JSON.stringify(d.lines?.[0], null, 2).substring(0, 300));
    fs.writeFileSync('timing_result.json', r.text);
    console.log('Saved to timing_result.json');
}
main().catch(e => console.log('Error:', e.message));
