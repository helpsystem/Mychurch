const fs = require('fs');
const path = require('path');

// The path provided by the user
const SOURCE_DIR = 'D:\\https___www.wordproject.org_bibles_audio_01_english_index.htm';

console.log(`🔍 Analyzing folder: ${SOURCE_DIR}`);

if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ Directory not found!');
    process.exit(1);
}

function scanDir(dir) {
    const results = {
        mp3: [],
        html: [],
        txt: [],
        other: []
    };

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Recursive scan? Maybe just 1 level deep for now
            // const subResults = scanDir(fullPath);
            // ... merge
        } else {
            const ext = path.extname(file).toLowerCase();
            if (ext === '.mp3') results.mp3.push(file);
            else if (ext === '.html' || ext === '.htm') results.html.push(file);
            else if (ext === '.txt') results.txt.push(file);
            else results.other.push(file);
        }
    }
    return results;
}

try {
    const files = scanDir(SOURCE_DIR);

    console.log('\n📊 Scan Results:');
    console.log(`🎵 MP3 Files: ${files.mp3.length}`);
    console.log(`📄 HTML Files: ${files.html.length}`);
    console.log(`📝 Text Files: ${files.txt.length}`);
    console.log(`📁 Other Files: ${files.other.length}`);

    if (files.mp3.length > 0) {
        console.log('\nSample MP3s:');
        files.mp3.slice(0, 5).forEach(f => console.log(` - ${f}`));
    }

    if (files.html.length > 0) {
        console.log('\nSample HTMLs:');
        files.html.slice(0, 5).forEach(f => console.log(` - ${f}`));
    }

} catch (err) {
    console.error('Error scanning directory:', err);
}
