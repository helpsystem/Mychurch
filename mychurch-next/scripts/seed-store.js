const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Custom simple dotenv parser to load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const index = trimmed.indexOf('=');
            if (index !== -1) {
                const key = trimmed.slice(0, index).trim();
                let value = trimmed.slice(index + 1).trim();
                // Strip quotes if any
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        }
    });
    console.log('📋 Loaded environment from .env.local');
} else {
    console.error('❌ .env.local not found');
    process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

const seedSql = `
INSERT INTO public.products (title, description, image_url, price, weight_grams, inventory)
VALUES 
('Worship Lyrics Guide Book', 'A comprehensive guide to worship leading, lyrics structure, and projection setup in English & Persian.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop', 15.00, 200.00, 50),
('MyChurch Premium Mug', 'Sleek black ceramic mug with golden MyChurch logo, perfect for morning coffee or tea.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop', 12.50, 400.00, 100),
('Persian Bible (Leather Bound)', 'Beautifully bound Holy Bible in modern Persian translation (NMV), gilded edges with ribbon marker.', 'https://images.unsplash.com/photo-1504052434569-70ad58c6744a?w=600&auto=format&fit=crop', 25.00, 900.00, 30),
('MyChurch Branded Hoodie', 'Comfortable, premium cotton hoodie in charcoal grey with subtle embroidered branding.', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop', 35.00, 600.00, 40)
ON CONFLICT DO NOTHING;
`;

async function seed() {
    try {
        console.log('🌱 Seeding products...');
        await pool.query(seedSql);
        console.log('✅ Seeding completed successfully!');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seed();
