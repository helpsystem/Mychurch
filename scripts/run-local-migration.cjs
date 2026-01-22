const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ⚠️ تنظیمات دیتابیس لوکال
// اگر خطا گرفتید، چک کنید که این مقادیر با سیستم شما یکی باشد
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'mychurch', // نام دیتابیس پروژه را چک کنید (شاید mychurch_db باشد)
    password: 'admin',    // پسورد دیتابیس لوکال خود را اینجا وارد کنید
    port: 5432,
};

// اگر فایل .env دارید می‌توانیم از آن هم بخوانیم
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// اولویت با متغیرهای محیطی است اگر ست شده باشند
if (process.env.DATABASE_URL) {
    dbConfig.connectionString = process.env.DATABASE_URL;
}

const pool = new Pool(dbConfig);

async function runLocalMigration() {
    console.log('🔌 Connecting to local database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   DB:   ${dbConfig.database}`);

    try {
        const client = await pool.connect();
        console.log('✅ Connected successfully!');

        // خواندن فایل migration
        const migrationPath = path.join(__dirname, '../backend/migrations/add_worship_notes_attachments.sql');

        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📄 Running migration: ${path.basename(migrationPath)}`);

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migration executed successfully!');
        client.release();

    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.error('\n❌ Connection Failed: Is PostgreSQL running?');
            console.error('   Check if the service is active on port 5432');
        } else {
            console.error('\n❌ Migration Error:', err.message);
            if (err.message.includes('password authentication failed')) {
                console.error('   💡 Hint: Check the password in scripts/run-local-migration.cjs');
            }
            if (err.message.includes('database "mychurch" does not exist')) {
                console.error('   💡 Hint: Check the database name in scripts/run-local-migration.cjs');
            }
        }
    } finally {
        await pool.end();
    }
}

runLocalMigration();
