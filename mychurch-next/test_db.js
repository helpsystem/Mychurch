const { dbAll } = require('./src/lib/bibleDb.ts');

async function test() {
  try {
    const res = await dbAll("SELECT * FROM versions LIMIT 1");
    console.log("SQL.JS Query Result:", res);
  } catch (err) {
    console.error("SQL.JS Failed:", err);
  }
}

test();
