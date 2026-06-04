const songTitle = "آمد مسیح اندر جهانگ.نوراللـه";
const fileName = "آمد مسیح اندر جهان.mp3";

function normalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/\.mp3$/i, '')
        .replace(/\.m4a$/i, '')
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/ٔ/g, '')
        .replace(/‌/g, ' ')
        .replace(/[0-9\(\)\[\]\-\_\.\,\+\']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

console.log("Song title normalized:", normalize(songTitle));
console.log("File name normalized:", normalize(fileName));
console.log("Includes:", normalize(songTitle).includes(normalize(fileName)));

// Character by character code points
console.log("\nSong Title code points:");
for (let i = 0; i < songTitle.length; i++) {
    console.log(`- ${songTitle[i]}: ${songTitle.charCodeAt(i)}`);
}

console.log("\nFile Name code points:");
for (let i = 0; i < fileName.length; i++) {
    console.log(`- ${fileName[i]}: ${fileName.charCodeAt(i)}`);
}
