// تست ساده Gemini با متن بدون فایل صوتی
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

async function testGemini() {
    console.log('🧪 تست ساده Gemini API\n');
    console.log('API Key:', geminiApiKey.substring(0, 20) + '...');

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = 'سلام! لطفاً یک JSON ساده با این فرمت برگردان: {"status": "ok", "message": "سلام از Gemini"}';

        console.log('\n📤 ارسال prompt ساده...');

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('\n✅ پاسخ دریافت شد:');
        console.log(text);

        console.log('\n✅ API key معتبر است و کار می‌کند!');

        return true;

    } catch (error) {
        console.error('\n❌ خطا:', error.message);
        if (error.message.includes('API key')) {
            console.log('\n💡 API key مشکل دارد. لطفاً یک key جدید دریافت کنید.');
        }
        return false;
    }
}

testGemini()
    .then(success => {
        process.exit(success ? 0 : 1);
    });
