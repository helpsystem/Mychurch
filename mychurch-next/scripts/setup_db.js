const { Pool } = require('pg');
require('dotenv').config({ path: './mychurch-next/.env.local' });
require('dotenv').config({ path: './.env' }); // Fallback to root .env

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'mychurch',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function runSetup() {
    console.log("Setting up local Postgres DB for Next.js App...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create Widgets Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS widgets (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT true,
                icon VARCHAR(50),
                color VARCHAR(50),
                config JSONB DEFAULT '{}'::jsonb,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Users Table (RBAC)
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                role VARCHAR(50) DEFAULT 'User' CHECK (role IN ('Admin', 'Leader', 'Operator', 'User')),
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                permissions JSONB DEFAULT '{}'::jsonb
            );
        `);

        // Insert initial mock widgets if empty
        const widgetsCount = await client.query('SELECT COUNT(*) FROM widgets');
        if (parseInt(widgetsCount.rows[0].count) === 0) {
            console.log("Inserting default widgets...");
            const defaultWidgets = [
                ['w_audio_sync', 'Audio-Text-Sync Pro', 'Advanced karaoke-style playback functionality.', true, 'Music', 'text-blue-500'],
                ['w_cal', 'Persian Smart Calendar', 'Jalali integrated calendar with church events.', true, 'Calendar', 'text-purple-500'],
                ['w_qr', 'Pro QR-Code Studio', 'Dynamic landing and connection cards generation.', false, 'QrCode', 'text-emerald-500'],
                ['w_bible', 'Bible-Unified-Pro', 'Multilingual integrated scripture search engine.', true, 'BookOpen', 'text-amber-500'],
                ['w_watermark', 'Global Watermark Config', 'Configure the global watermark size, opacity, and position.', true, 'LayoutTemplate', 'text-indigo-500']
            ];

            for (const w of defaultWidgets) {
                await client.query(
                    'INSERT INTO widgets (id, name, description, is_active, icon, color) VALUES ($1, $2, $3, $4, $5, $6)',
                    w
                );
            }
        }

        // Insert initial mock admin inside users if empty
        const usersCount = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(usersCount.rows[0].count) === 0) {
            console.log("Inserting default Admin user...");
            await client.query(`
                INSERT INTO users (name, email, role) 
                VALUES ('Saman Abyar', 'saman@iranianchristianchurch.com', 'Admin')
            `);
        }

        await client.query('COMMIT');
        console.log("Database setup completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Database setup failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

runSetup();
