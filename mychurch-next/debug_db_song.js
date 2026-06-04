const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres.xjliwbfdzmxncyebblxw:OExGvmxE8SsoIUGH@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

function normalize(str) {
    if (!str) return '';
    return str
        .normalize('NFC')
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

async function main() {
    try {
        const { rows } = await pool.query("SELECT id, title_fa FROM church_worship_songs WHERE title_fa LIKE '%آمد مسیح%'");
        console.log("DB rows found:", rows);

        const audioDir = path.join(process.cwd(), 'public', 'worship', 'audio', 'kalameh');
        const files = fs.readdirSync(audioDir);
        const matchFile = files.find(f => f.includes("آمد") || f.includes("آمد"));
        console.log("Disk file found:", matchFile);

        if (rows.length > 0 && matchFile) {
            const dbNorm = normalize(rows[0].title_fa);
            const fileNorm = normalize(matchFile);
            console.log("Normalized DB Title:", dbNorm);
            console.log("Normalized File Name:", fileNorm);
            console.log("DB Norm codes:", dbNorm.split('').map(c => c.charCodeAt(0)).join(','));
            console.log("File Norm codes:", fileNorm.split('').map(c => c.charCodeAt(0)).join(','));
            console.log("Includes:", dbNorm.includes(fileNorm));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
