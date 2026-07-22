const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'Bible', 'bible_output', 'bible_complete.db');
const db = new Database(dbPath, { readonly: true });

// Query versions
const versions = db.prepare("SELECT * FROM versions WHERE abbr IN ('TPV', 'POV-FAS', 'مژده', 'تفسیری')").all();
console.log("Found Versions:");
console.table(versions);

// Count verses for each version
for (const v of versions) {
    const count = db.prepare("SELECT COUNT(*) as count FROM verses WHERE version_id = ?").get(v.version_id);
    console.log(`Verses for version_id ${v.version_id} (${v.abbr}):`, count.count);
    
    if (count.count > 0 && count.count < 30000) {
        // If incomplete, get which books/chapters are available
        const books = db.prepare("SELECT DISTINCT book_id FROM verses WHERE version_id = ?").all(v.version_id);
        console.log(`Books available for ${v.abbr}:`, books.length);
    }
}
