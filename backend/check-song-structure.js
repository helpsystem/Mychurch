const fs = require('fs');
const songs = JSON.parse(fs.readFileSync('public/worship/data/worship_songs.json', 'utf8'));

console.log('Sample song structure:');
console.log(JSON.stringify(songs[0], null, 2));
