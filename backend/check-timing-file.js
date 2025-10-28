const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('public/worship/data/timings/song_1_timing.json', 'utf8'));
    
    console.log('📊 Metadata:');
    console.log(JSON.stringify(data.metadata, null, 2));
    
    console.log('\n📝 اولین 5 کلمه:');
    data.words.slice(0, 5).forEach((w, i) => {
        console.log(`  ${i + 1}. "${w.word}" - ${w.start}s`);
    });
    
    console.log('\n📊 آمار:');
    console.log(`  کل کلمات: ${data.words.length}`);
    console.log(`  کل خطوط: ${data.lines.length}`);
    console.log(`  مدت زمان: ${data.metadata.totalDuration}s`);
    
    if (data.metadata.recordedAt) {
        console.log(`  تاریخ ضبط: ${new Date(data.metadata.recordedAt).toLocaleString('fa-IR')}`);
    }
    
    console.log('\n✅ فایل timing معتبر است و آماده استفاده!');
    
} catch (error) {
    console.error('❌ خطا:', error.message);
}
