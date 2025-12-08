import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env (local) or .env.server
const envServerPath = path.join(__dirname, '..', '.env.server');
const envLocalPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envServerPath)) {
    console.log('Loading environment from .env.server');
    dotenv.config({ path: envServerPath });
} else {
    console.log('Loading environment from .env');
    dotenv.config({ path: envLocalPath });
}

async function applyRpc() {
    console.log('🔧 Applying RPC Function...');

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL is not defined.');
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        const sqlPath = path.join(__dirname, 'bible_import_rpc.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Executing SQL...');
        await client.query(sql);

        console.log('✅ RPC function created successfully!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

applyRpc();
