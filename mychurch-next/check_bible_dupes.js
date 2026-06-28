// Script to check for duplicate books in the Bible database
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'Bible', 'bible_output', 'bible_complete.db');

try {
    const db = new Database(DB_PATH, { readonly: true });

    console.log("=== VERSIONS IN DATABASE ===");
    const versions = db.prepare("SELECT version_id, abbr, name, language FROM versions ORDER BY version_id").all();
    versions.forEach(v => console.log(`  [${v.version_id}] ${v.abbr} — ${v.name} (${v.language})`));
    console.log(`Total versions: ${versions.length}\n`);

    console.log("=== BOOKS COUNT PER VERSION ===");
    const bookCounts = db.prepare("SELECT version_id, COUNT(*) as cnt FROM books GROUP BY version_id").all();
    bookCounts.forEach(r => {
        const v = versions.find(v => v.version_id === r.version_id);
        console.log(`  Version ${r.version_id} (${v?.abbr || '?'}): ${r.cnt} books`);
    });

    console.log("\n=== CHECKING FOR DUPLICATE BOOK_IDs PER VERSION ===");
    const bsbVersion = versions.find(v => v.abbr === 'BSB');
    if (bsbVersion) {
        const dupes = db.prepare(`
            SELECT book_id, COUNT(*) as cnt 
            FROM books WHERE version_id = ? 
            GROUP BY book_id HAVING cnt > 1
        `).all(bsbVersion.version_id);
        if (dupes.length > 0) {
            console.log(`  BSB has ${dupes.length} DUPLICATE book_ids:`);
            dupes.forEach(d => console.log(`    book_id='${d.book_id}' appears ${d.cnt} times`));
        } else {
            console.log("  No duplicates found in BSB version.");
        }
    }

    console.log("\n=== TOTAL UNIQUE BOOKS (all versions) ===");
    const uniqueBooks = db.prepare("SELECT DISTINCT book_id FROM books ORDER BY book_id").all();
    console.log(`  ${uniqueBooks.length} unique book_ids`);

    db.close();
} catch (err) {
    console.error("Error:", err.message);
    console.log("Trying alternate path...");
    const paths = ['./bible.db', './Bible/bible.db', './data/bible.db'];
    for (const p of paths) {
        try {
            const db2 = require('better-sqlite3')(path.join(__dirname, p), { readonly: true });
            const v = db2.prepare("SELECT COUNT(*) as cnt FROM versions").get();
            console.log(`Found DB at ${p} with ${v.cnt} versions`);
            db2.close();
        } catch {}
    }
}
