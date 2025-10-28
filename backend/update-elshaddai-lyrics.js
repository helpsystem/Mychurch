const fs = require('fs');
const path = require('path');

// مسیر فایل
const filePath = path.join(__dirname, '../public/worship/data/worship_songs.json');

// خواندن فایل
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// پیدا کردن سرود الشدای
const songIndex = data.findIndex(s => s.id === 1);

if (songIndex === -1) {
  console.error('❌ سرود الشدای پیدا نشد!');
  process.exit(1);
}

// متن جدید بر اساس فایل timing (بدون کورد، با 29 کلمه آخر تکراری)
const newLyrics = `V1
الشدای الشدای
ال الــیون ادونای
نام تو در بین ما
هم در عــالــم اعلــی
الشدای خدای ما
دوست داریم نام تو را
ای خالــق ابدی
الشدای
V2
الشدای خدای ما
می‌خوانــیم نام تو را
نام تو چه عظیم است
ای خدای تــازه‌هــا
الشدای خدای ما
تو خالــق بی‌همتا
ستایــیم نام تو را
الشدای
V3
الشدای خدای ما
ای خدای وعده‌ها
نهرهای آب زنده
بجوشان در قــلـب مــا
الشدای وسیع نما
مسکن و حدود ما
بشنو به نام مســیح
این دعــا`;

// به‌روزرسانی متن
data[songIndex].lyrics.fa = newLyrics;

// نوشتن فایل
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log('✅ متن سرود الشدای با موفقیت به‌روزرسانی شد!');
console.log('📝 متن جدید:');
console.log(newLyrics);
console.log('\n🎵 این متن دقیقاً با فایل timing (29 کلمه آخر تکراری) هماهنگ است.');
