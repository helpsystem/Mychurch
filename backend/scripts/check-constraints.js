const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkConstraints() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'bible_translations' 
            AND character_maximum_length IS NOT NULL;
        `);
        
        console.log('Character length constraints for bible_translations:');
        result.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.character_maximum_length} chars`);
        });
        
        // Also check bible_books
        const booksResult = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'bible_books' 
            AND character_maximum_length IS NOT NULL;
        `);
        
        console.log('\nCharacter length constraints for bible_books:');
        booksResult.rows.forEach(row => {
            console.log(`  ${row.column_name}: ${row.character_maximum_length} chars`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkConstraints();