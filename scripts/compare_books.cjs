const fs = require('fs');
const path = require('path');

const baseMojdeh = 'bible_data/text/MOJDEH';
const baseQadim = 'bible_data/text/QADIM';

const qadimBooks = fs.readdirSync(baseQadim);
const mojdehBooks = fs.readdirSync(baseMojdeh);

console.log('کتاب‌های کم در مژده:\n');

qadimBooks.forEach(book => {
    const qadimPath = path.join(baseQadim, book);
    const mojdehPath = path.join(baseMojdeh, book);

    if (!fs.statSync(qadimPath).isDirectory()) return;

    const qadimChapters = fs.readdirSync(qadimPath).filter(f => f.endsWith('.json')).length;
    const mojdehChapters = fs.existsSync(mojdehPath) && fs.statSync(mojdehPath).isDirectory()
        ? fs.readdirSync(mojdehPath).filter(f => f.endsWith('.json')).length
        : 0;

    if (mojdehChapters < qadimChapters) {
        console.log(`${book}: مژده ${mojdehChapters} فصل، قدیم ${qadimChapters} فصل (${qadimChapters - mojdehChapters} کم)`);
    }
});
