const { GoogleGenAI } = require('@google/genai');
const apiKey = 'AIzaSyBFnb6mnNvajlXJ2wxumXIw4MoDEdLQIQM';
const genAI = new GoogleGenAI({ apiKey });

async function main() {
    try {
        console.log("Testing gemini-2.5-flash with DB API key...");
        const res = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello, write a short greeting in Farsi.'
        });
        console.log("Success:", res.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();



