// تست Gemini با استفاده از REST API مستقیم (بدون استفاده از SDK)
require('dotenv').config();
const https = require('https');

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
}

async function testGeminiDirectAPI() {
    console.log('🧪 تست Gemini API (REST Direct)\n');
    console.log('API Key:', geminiApiKey.substring(0, 20) + '...\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const requestBody = JSON.stringify({
        contents: [{
            parts: [{
                text: 'سلام! لطفاً یک JSON ساده برگردان: {"status": "ok", "message": "سلام از Gemini"}'
            }]
        }]
    });

    console.log('📤 ارسال درخواست به Gemini...\n');

    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (response.error) {
                        console.error('❌ خطا از Gemini:', response.error.message);
                        reject(new Error(response.error.message));
                        return;
                    }

                    console.log('✅ پاسخ دریافت شد!\n');
                    const text = response.candidates[0]?.content?.parts[0]?.text || 'No response';
                    console.log('پاسخ:');
                    console.log(text);
                    console.log('\n✅ API key معتبر است و کار می‌کند!');

                    resolve(true);
                } catch (error) {
                    console.error('❌ خطا در parse کردن پاسخ:', error.message);
                    console.log('پاسخ خام:', data);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ خطای network:', error.message);
            reject(error);
        });

        req.write(requestBody);
        req.end();
    });
}

testGeminiDirectAPI()
    .then(() => {
        console.log('\n✅ تست موفق!');
        console.log('\n📝 مرحله بعد: اضافه کردن قابلیت audio به اسکریپت');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ تست ناموفق:', error.message);
        process.exit(1);
    });
