const fs = require('fs');
const path = require('path');

// Direct conversion for song 335
const inputFile = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\Project\\آرامی دلهایی_full_project.json';
const outputFile = 'D:\\Windows.old\\Users\\Sami\\Desktop\\Iran Church DC\\Git\\Mychurch\\frontend\\public\\worship\\data\\timings\\song_335_timing.json';

console.log('🔄 Converting song 335 timing file...\n');

try {
    const projectData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    const systemFormat = {
        songId: 335,
        version: "2.0",
        generatedAt: projectData.metadata?.generated_at || new Date().toISOString(),
        source: "audio-text-sync-v3",
        totalDuration: 0,
        lines: []
    };

    projectData.structure.forEach((item, index) => {
        if (!item.words || item.words.length === 0) {
            return;
        }

        systemFormat.lines.push({
            line: item.content,
            start: item.words[0].start_time,
            end: item.words[item.words.length - 1].end_time,
            words: item.words.map(w => ({
                word: w.word,
                start: w.start_time,
                end: w.end_time,
                finglish: null  // Will be added later if needed
            }))
        });

        const lastTime = item.words[item.words.length - 1].end_time;
        if (lastTime > systemFormat.totalDuration) {
            systemFormat.totalDuration = lastTime;
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(systemFormat, null, 2), 'utf8');

    console.log('✅ SUCCESS!');
    console.log(`✓ Lines: ${systemFormat.lines.length}`);
    console.log(`✓ Duration: ${systemFormat.totalDuration.toFixed(2)}s`);
    console.log(`✓ Output: ${outputFile}`);

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
