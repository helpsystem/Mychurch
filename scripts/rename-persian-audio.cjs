/**
 * Script to rename Persian audio files to Finglish (transliterated) names
 * and update worship_songs.json accordingly
 */

const fs = require('fs');
const path = require('path');

// Complete Persian to Finglish mapping
const charMap = {
    'آ': 'a', 'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z',
    'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
    'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f',
    'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'و': 'o', 'ه': 'h', 'ی': 'i', 'ي': 'i', 'ئ': 'y', 'ء': '',
    'ة': 'h', 'أ': 'a', 'إ': 'e', 'ؤ': 'o', 'ى': 'a', 'ك': 'k',
    '‌': '', '‍': '', // Zero-width chars
};

function transliterate(text) {
    let result = '';
    for (const char of text) {
        if (charMap[char] !== undefined) {
            result += charMap[char];
        } else if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(char)) {
            // Skip unknown Persian/Arabic chars
        } else {
            result += char;
        }
    }
    return result;
}

function hasPersian(text) {
    return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

function cleanFilename(name) {
    return name
        .replace(/[^\w\s\-_.]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

const audioDir = path.join(__dirname, '../frontend/public/worship/audio/kalameh');
const songsJsonPath = path.join(__dirname, '../frontend/public/worship/data/worship_songs.json');

console.log('Reading audio directory...');
const files = fs.readdirSync(audioDir);
const persianFiles = files.filter(f => f.endsWith('.mp3') && hasPersian(f));

console.log(`Found ${persianFiles.length} Persian-named files\n`);

// Create rename map
const renameMap = {};
const usedNames = new Set(files.map(f => f.toLowerCase()));

for (const file of persianFiles) {
    const ext = path.extname(file);
    const base = path.basename(file, ext);

    let newBase = transliterate(base);
    newBase = cleanFilename(newBase);

    if (!newBase || newBase.length < 2) {
        newBase = 'song_' + Math.random().toString(36).substr(2, 8);
    }

    let newName = newBase + ext;
    let counter = 1;

    while (usedNames.has(newName.toLowerCase())) {
        newName = `${newBase}_${counter}${ext}`;
        counter++;
    }

    usedNames.add(newName.toLowerCase());
    renameMap[file] = newName;
}

// Show and perform renames
console.log('Renaming files:\n');
let renameCount = 0;
let errorCount = 0;

for (const [oldName, newName] of Object.entries(renameMap)) {
    const oldPath = path.join(audioDir, oldName);
    const newPath = path.join(audioDir, newName);

    try {
        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`OK: ${oldName}`);
            console.log(`  -> ${newName}\n`);
            renameCount++;
        } else {
            console.log(`SKIP: ${oldName} (not found)\n`);
        }
    } catch (err) {
        console.log(`ERR: ${oldName} - ${err.message}\n`);
        errorCount++;
    }
}

console.log(`\nRenamed ${renameCount} files, ${errorCount} errors\n`);

// Update JSON
console.log('Updating worship_songs.json...');
const songs = JSON.parse(fs.readFileSync(songsJsonPath, 'utf8'));

let jsonUpdates = 0;
for (const song of songs) {
    if (song.audioUrl) {
        const filename = path.basename(song.audioUrl);
        if (renameMap[filename]) {
            song.audioUrl = song.audioUrl.replace(filename, renameMap[filename]);
            jsonUpdates++;
        }
    }
}

fs.writeFileSync(songsJsonPath, JSON.stringify(songs, null, 4), 'utf8');
console.log(`Updated ${jsonUpdates} entries in JSON\n`);

console.log('Done!');
