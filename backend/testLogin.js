const fetch = require('node-fetch');

(async () => {
  try {
    console.log('🚀 شروع تست لاگین...');

    const response = await fetch('https://npyugcbr.a2hosted.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'help.system@ymail.com',
        password: 'Samyar@1989'
      })
    });

    const data = await response.json();

    if (data && data.token) {
      console.log('✅ لاگین موفقیت‌آمیز بود');
      console.log('🔑 JWT Token:', data.token);
      console.log('👤 User Data:', data.user);
    } else {
      console.log('⚠️ پاسخ دریافت شد اما توکن موجود نیست:', data);
    }
  } catch (err) {
    console.error('❌ خطا در تست لاگین:', err.message);
  }
})();
