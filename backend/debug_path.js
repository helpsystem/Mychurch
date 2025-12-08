const fs = require('fs');
const path = require('path');

const BIBLE_TEXT_BASE = path.join(__dirname, '..', 'public', 'text', 'bible');

console.log('Base Path:', BIBLE_TEXT_BASE);
console.log('Exists?', fs.existsSync(BIBLE_TEXT_BASE));

const faPath = path.join(BIBLE_TEXT_BASE, 'fa', '01', '1.json');
console.log('Sample FA Path:', faPath);
console.log('Exists?', fs.existsSync(faPath));

if (fs.existsSync(faPath)) {
    console.log('Reading sample:', fs.readFileSync(faPath, 'utf8').substring(0, 50));
}
