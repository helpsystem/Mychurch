// تست بارگذاری فایل timing
const fs = require('fs');
const path = require('path');

const timingPath = path.join(__dirname, '..', 'public', 'worship', 'data', 'timings', 'song_1_timing.json');

console.log('📂 Reading timing file from:', timingPath);

try {
  const data = fs.readFileSync(timingPath, 'utf8');
  const timing = JSON.parse(data);
  
  console.log('\n✅ Timing file loaded successfully!');
  console.log('\n📊 Metadata:');
  console.log('  - Title:', timing.metadata.title);
  console.log('  - Words:', timing.metadata.wordCount);
  console.log('  - Lines:', timing.metadata.lineCount);
  console.log('  - Duration:', timing.metadata.totalDuration, 'seconds');
  console.log('  - Method:', timing.metadata.recordingMethod);
  
  console.log('\n📝 First 3 lines:');
  timing.lines.slice(0, 3).forEach((line, i) => {
    console.log(`  ${i + 1}. "${line.line}" (${line.words.length} words)`);
    console.log(`     Start: ${line.start}s, End: ${line.end}s`);
    console.log(`     Words: ${line.words.map(w => w.word).join(' ')}`);
  });
  
  console.log('\n📝 Last line:');
  const lastLine = timing.lines[timing.lines.length - 1];
  console.log(`  "${lastLine.line.substring(0, 50)}..." (${lastLine.words.length} words)`);
  console.log(`  Start: ${lastLine.start}s, End: ${lastLine.end}s`);
  
  console.log('\n✅ Total words in lines:', timing.lines.reduce((sum, line) => sum + line.words.length, 0));
  console.log('✅ Total words in metadata:', timing.metadata.wordCount);
  
  if (timing.lines.reduce((sum, line) => sum + line.words.length, 0) === timing.metadata.wordCount) {
    console.log('\n🎉 Word count matches! Everything looks good.');
  } else {
    console.log('\n⚠️ Word count mismatch!');
  }
  
} catch (error) {
  console.error('❌ Error reading timing file:', error.message);
}
