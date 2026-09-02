const Database = require('/root/mychurch-v2/mychurch-next/standalone/node_modules/better-sqlite3');

function checkDb(path) {
  console.log("=== Checking", path, "===");
  try {
    const db = new Database(path, { readonly: true });
    const versions = db.prepare("SELECT * FROM versions").all();
    console.log("Versions:", versions.map(v => ({ id: v.version_id, abbr: v.abbr, name: v.name })));
    const bookCount = db.prepare("SELECT count(DISTINCT book_id) as count FROM verses").get();
    console.log("Unique books:", bookCount);
    const versesCount = db.prepare("SELECT count(1) as count FROM verses").get();
    console.log("Total verses:", versesCount);
    const genVerses = db.prepare("SELECT count(1) as count FROM verses WHERE book_id = 'GEN'").get();
    console.log("GEN verses:", genVerses);
    const books = db.prepare("SELECT DISTINCT book_id FROM verses LIMIT 20").all();
    console.log("Sample book_ids:", books.map(b => b.book_id));
  } catch(e) {
    console.error("Error checking", path, e.message);
  }
}

checkDb('/root/mychurch-v2/mychurch-next/standalone/Bible/bible_output/bible_complete.db');
checkDb('/root/mychurch-v2/mychurch-next/Bible/bible_output/bible_complete.db');
