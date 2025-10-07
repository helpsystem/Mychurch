#!/bin/bash

# Church Management System - Server PostgreSQL Setup Script
# This script sets up PostgreSQL on the server and imports Bible data

set -e

echo "🚀 Starting Church Management System Server Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="mychurch"
DB_USER="postgres"
DB_PASSWORD="SamyarBB1989"
PROJECT_DIR="/root/Mychurch"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_status "Step 1: Updating system packages..."
apt update && apt upgrade -y

print_status "Step 2: Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

print_status "Step 3: Starting PostgreSQL service..."
systemctl enable postgresql
systemctl start postgresql

print_status "Step 4: Configuring PostgreSQL..."
# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';"

# Create database
sudo -u postgres createdb $DB_NAME

print_success "PostgreSQL installed and configured!"

print_status "Step 5: Updating project on server..."
cd $PROJECT_DIR
git pull origin main

print_status "Step 6: Installing Node.js dependencies..."
cd $PROJECT_DIR/backend
npm install

print_status "Step 7: Creating database tables..."
export PGPASSWORD=$DB_PASSWORD
psql -U postgres -d $DB_NAME -f ../scripts/db/schema.sql

print_status "Step 8: Installing Python dependencies for import script..."
cd $PROJECT_DIR
pip3 install -r requirements.txt

print_status "Step 9: Converting import script to work with server PostgreSQL..."
# Create server-specific import script
cat > scripts/db/import-bible-data-server.cjs << 'EOF'
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Server PostgreSQL configuration
const pool = new Pool({
  user: 'postgres',
  password: 'SamyarBB1989',
  host: 'localhost',
  port: 5432,
  database: 'mychurch',
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

const SQLITE_PATH = './attached_assets/bible_fa_en_1758111193552.sqlite';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function upsertInChunks(table, rows, chunkSize) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    
    if (table === 'bible_books') {
      for (const row of chunk) {
        const query = `
          INSERT INTO bible_books (book_number, name_en, name_fa, testament, abbreviation, chapters_count)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (book_number) DO UPDATE SET
          name_en = EXCLUDED.name_en,
          name_fa = EXCLUDED.name_fa,
          testament = EXCLUDED.testament,
          abbreviation = EXCLUDED.abbreviation,
          chapters_count = EXCLUDED.chapters_count
        `;
        await pool.query(query, [row.book_number, row.name_en, row.name_fa, row.testament, row.abbreviation, row.chapters_count]);
      }
    } else if (table === 'bible_verses') {
      for (const row of chunk) {
        const query = `
          INSERT INTO bible_verses (book_id, chapter, verse, text_en, text_fa)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (book_id, chapter, verse) DO UPDATE SET
          text_en = EXCLUDED.text_en,
          text_fa = EXCLUDED.text_fa
        `;
        await pool.query(query, [row.book_id, row.chapter, row.verse, row.text_en, row.text_fa]);
      }
    }
    
    await delay(50);
  }
}

async function buildBookIdMap() {
  const result = await pool.query('SELECT id, book_number FROM bible_books');
  const map = new Map();
  result.rows.forEach(row => map.set(row.book_number, row.id));
  return map;
}

async function ensureUniqueConstraints() {
  try {
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bible_books_book_number_key') THEN
          ALTER TABLE bible_books ADD CONSTRAINT bible_books_book_number_key UNIQUE (book_number);
        END IF;
      END $$;
    `);
    
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bible_verses_book_chapter_verse_key') THEN
          ALTER TABLE bible_verses ADD CONSTRAINT bible_verses_book_chapter_verse_key UNIQUE (book_id, chapter, verse);
        END IF;
      END $$;
    `);
    
    console.log('✅ Unique constraints ensured');
  } catch (error) {
    console.warn('⚠️ Could not add unique constraints:', error.message);
  }
}

async function importFromSQLite() {
  console.log(`🔄 Starting import from SQLite: ${SQLITE_PATH}`);
  const sqlite = sqlite3.verbose();
  const db = new sqlite.Database(SQLITE_PATH, sqlite3.OPEN_READONLY);

  const all = (sql, params = []) => new Promise((res, rej) => {
    db.all(sql, params, (e, rows) => e ? rej(e) : res(rows));
  });

  console.log('📚 Loading books...');
  const bookRows = await all(`SELECT id, code, name_en, name_fa, testament FROM books ORDER BY id`);
  
  const books = bookRows.map(r => ({
    book_number: Number(r.code),
    name_en: r.name_en,
    name_fa: r.name_fa,
    testament: (r.testament || '').toUpperCase() === 'OT' ? 'old' : 'new',
    abbreviation: (r.name_en || '').substring(0, 10).replace(/\s+/g, '').toUpperCase() || String(r.code),
    chapters_count: 0
  }));
  
  await upsertInChunks('bible_books', books, 50);
  console.log(`✅ Upserted ${books.length} books`);

  const bookIdMap = await buildBookIdMap();

  console.log('📝 Streaming verses... (this may take a while)');
  const chapters = await all(`SELECT id, book_id, chapter_number FROM chapters ORDER BY book_id, chapter_number`);
  const verseBatch = [];
  
  for (const chap of chapters) {
    const verses = await all(`SELECT verse_number, text_en, text_fa FROM verses WHERE chapter_id = ? ORDER BY verse_number`, [chap.id]);
    const bookId = bookIdMap.get(chap.book_id);
    if (!bookId) continue;
    
    for (const v of verses) {
      verseBatch.push({
        book_id: bookId,
        chapter: chap.chapter_number,
        verse: v.verse_number,
        text_en: v.text_en,
        text_fa: v.text_fa
      });
      
      if (verseBatch.length >= 500) {
        await upsertInChunks('bible_verses', verseBatch.splice(0), 500);
        process.stdout.write('.');
      }
    }
  }
  
  if (verseBatch.length) {
    await upsertInChunks('bible_verses', verseBatch, 500);
  }
  
  console.log('\n✅ Verses imported successfully!');
  db.close();
}

async function main() {
  console.log(`🚀 Starting Bible import on server...`);
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection OK');
    
    await ensureUniqueConstraints();
    await importFromSQLite();
    console.log('🎉 Bible data import completed successfully!');
  } catch (err) {
    console.error('❌ Import failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
EOF

print_status "Step 10: Running Bible data import..."
cd $PROJECT_DIR
node scripts/db/import-bible-data-server.cjs

print_status "Step 11: Updating production environment file..."
cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
DOMAIN=samanabyar.online
SSL_EMAIL=admin@samanabyar.online

# Database Configuration
POSTGRES_PASSWORD=SamyarBB1989
DATABASE_URL=postgresql://postgres:SamyarBB1989@localhost:5432/mychurch
DIRECT_DATABASE_URL=postgresql://postgres:SamyarBB1989@localhost:5432/mychurch

# Application Configuration
PORT=3001
JWT_SECRET=super-secure-jwt-secret-key-for-production-2025

# External Services (Optional - for backup)
SUPABASE_URL=https://wxzhzsqicgwfxffxayhy.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emh6c3FpY2d3ZnhmZnhheWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjA3MjksImV4cCI6MjA3NTMzNjcyOX0.fUKJahkSpjqaBaSCP3jukAXkbPcLSUkkcDEtYzF0ShI

# FTP Configuration (Optional)
FTP_HOST=samanabyar.online
FTP_USER=root
FTP_PASS=jIVeuzsrkoWPkhUY
FTP_PORT=21
FTP_SECURE=false
FTP_BASE_DIR=public_html
UPLOADS_DIR=uploads

# Monitoring
GRAFANA_PASSWORD=admin123
PROMETHEUS_RETENTION=30d

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@samanabyar.online
SMTP_PASS=email_app_password

# CORS Configuration
CORS_ORIGIN=https://samanabyar.online,https://www.samanabyar.online
EOF

print_status "Step 12: Testing backend server..."
cd $PROJECT_DIR/backend
NODE_ENV=production node server.js &
SERVER_PID=$!
sleep 5

# Test API endpoints
print_status "Testing API endpoints..."
curl -s http://localhost:3001/api/health || print_warning "Health check failed"
curl -s http://localhost:3001/api/bible/books | head -c 100 || print_warning "Bible API test failed"

kill $SERVER_PID 2>/dev/null || true

print_success "🎉 Server setup completed successfully!"
print_status "✅ PostgreSQL installed and running"
print_status "✅ Database '$DB_NAME' created"
print_status "✅ Bible data imported"
print_status "✅ Backend tested"

echo ""
print_success "Next steps:"
echo "1. Run: cd $PROJECT_DIR && docker-compose up -d"
echo "2. Check: https://samanabyar.online"
echo "3. Monitor: docker-compose logs -f"

print_success "Setup completed! Your Church Management System is ready! 🎉"