/**
 * Converter: Audio-Text-Sync Project JSON → System Timing Format
 * 
 * تبدیل خروجی ابزار audio-text-sync به فرمت قابل استفاده در سیستم
 */

const fs = require('fs');
const path = require('path');

// Input: فایل JSON که از ابزار audio-text-sync گرفتید
const inputFile = process.argv[2];
// Output: فایل timing برای سیستم
const outputFile = process.argv[3] || inputFile.replace('_full_project.json', '_timing.json');

if (!inputFile) {
    console.error('❌ Usage: node convert-timing.cjs <input_project.json> [output_timing.json]');
    process.exit(1);
}

console.log('🔄 Converting Audio-Text-Sync JSON to System Timing Format...\n');

try {
    // Read input file
    const projectData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

    console.log(`✓ Loaded project file: ${inputFile}`);
    console.log(`  Metadata:`, projectData.metadata);
    console.log(`  Lines count: ${projectData.structure?.length || 0}\n`);

    if (!projectData.structure || !Array.isArray(projectData.structure)) {
        throw new Error('Invalid format: missing structure array');
    }

    // Extract song ID from metadata filename if possible
    let songId = null;
    const filenameMatch = projectData.metadata?.filename?.match(/(\d+)/);
    if (filenameMatch) {
        songId = parseInt(filenameMatch[1]);
    }

    // Convert to system format
    const systemFormat = {
        songId: songId,
        version: "2.0",
        generatedAt: projectData.metadata?.generated_at || new Date().toISOString(),
        source: "audio-text-sync-v3",
        totalDuration: 0,
        lines: []
    };

    // Process each line
    projectData.structure.forEach((item, index) => {
        if (!item.words || item.words.length === 0) {
            console.warn(`  ⚠️  Line ${index} has no words, skipping`);
            return;
        }

        const line = {
            line: item.content,
            start: item.words[0].start_time,
            end: item.words[item.words.length - 1].end_time,
            words: item.words.map(w => ({
                word: w.word,
                start: w.start_time,
                end: w.end_time,
                // Add finglish from translations if available
                finglish: item.translations?.finglish || null
            }))
        };

        systemFormat.lines.push(line);

        // Update total duration
        if (line.end > systemFormat.totalDuration) {
            systemFormat.totalDuration = line.end;
        }
    });

    console.log(`✓ Converted ${systemFormat.lines.length} lines`);
    console.log(`✓ Total duration: ${systemFormat.totalDuration.toFixed(2)}s\n`);

    // Add finglish data if available in translations
    let finglishAdded = 0;
    if (projectData.structure.some(item => item.translations?.finglish)) {
        console.log('📝 Processing Finglish translations...');

        projectData.structure.forEach((item, lineIndex) => {
            if (item.translations?.finglish && systemFormat.lines[lineIndex]) {
                const finglishLine = item.translations.finglish;
                const words = finglishLine.split(/\s+/).filter(w => w.length > 0);

                // Match finglish words to timing
                systemFormat.lines[lineIndex].words.forEach((wordObj, wordIndex) => {
                    if (words[wordIndex]) {
                        wordObj.finglish = words[wordIndex];
                        finglishAdded++;
                    }
                });
            }
        });

        console.log(`  ✓ Added Finglish to ${finglishAdded} words\n`);
    }

    // Write output
    fs.writeFileSync(outputFile, JSON.stringify(systemFormat, null, 2), 'utf8');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ CONVERSION SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`📄 Output file: ${outputFile}`);
    console.log(`📊 Stats:`);
    console.log(`   - Lines: ${systemFormat.lines.length}`);
    console.log(`   - Total words: ${systemFormat.lines.reduce((sum, l) => sum + l.words.length, 0)}`);
    console.log(`   - Duration: ${systemFormat.totalDuration.toFixed(2)}s`);
    console.log(`   - Finglish support: ${finglishAdded > 0 ? 'Yes' : 'No'}`);
    console.log('');

    // Show sample
    if (systemFormat.lines.length > 0) {
        console.log('📝 Sample (first line):');
        console.log(JSON.stringify(systemFormat.lines[0], null, 2));
    }

} catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
}
