const fs = require('fs');
const path = require('path');

const translations = ['MOJDEH', 'QADIM', 'NET'];

translations.forEach(t => {
    const base = `bible_data/text/${t}`;
    if (fs.existsSync(base)) {
        const books = fs.readdirSync(base);
        let totalChapters = 0;

        books.forEach(b => {
            const bookPath = path.join(base, b);
            if (fs.statSync(bookPath).isDirectory()) {
                const chaps = fs.readdirSync(bookPath).filter(f => f.endsWith('.json'));
                totalChapters += chaps.length;
            }
        });

        console.log(`${t}: ${books.length} books, ${totalChapters} chapters`);
    }
});
