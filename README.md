<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Iran Church DC Website

## Prerequisites
- Node.js 16+
- PostgreSQL or Supabase account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/helpsystem/Mychurch.git
cd Mychurch
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
Copy `.env.example` to `.env` and fill in your Supabase details:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

4. Initialize database:
```bash
# Create Bible tables in Supabase
node scripts/db/create-bible-tables.js

# Import Bible data from SQLite
node scripts/db/import-bible-data.js
```

5. Start the development server:
```bash
# Start backend
npm run server

# In another terminal, start frontend
npm run dev
```

The site will be available at http://localhost:5173

## Development

### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key
- `DATABASE_URL`: Optional - Direct PostgreSQL connection string (if not using Supabase)
- `DEV_USE_MOCK_BIBLE`: Set to "true" to use mock Bible data instead of database

### Database Migration

The Bible content is stored in three tables:

- `bible_books`: Book metadata (name, testament, etc.)
- `bible_chapters`: Chapter information
- `bible_verses`: Actual verse content in English and Persian

### Bible Data Import

You can import Bible data from either a SQLite file or a directory containing `books.json` and `verses.json` (or CSV equivalents).

#### 1) SQLite Mode (default)
```bash
export SUPABASE_URL=... # or set in .env
export SUPABASE_KEY=...
export SQLITE_PATH=./attached_assets/bible_fa_en_1758111193552.sqlite
npm run bible:sqlite
```

#### 2) Directory Mode
Prepare a folder (e.g. `C:/Users/Sami/Desktop/En Fr Bible`) containing:
```
books.json   # [{ "book_number":1, "name_en":"Genesis", "name_fa":"پیدایش", "testament":"old", "chapters_count":50 }, ...]
verses.json  # [{ "book_number":1, "chapter":1, "verse":1, "text_en":"...", "text_fa":"..." }, ...]
```
Then run:
```bash
export BIBLE_SOURCE_MODE=directory
export BIBLE_DIR_PATH="C:/Users/Sami/Desktop/En Fr Bible"
export SECOND_LANG_CODE=fa   # or fr, etc.
npm run bible:dir
```

Both modes upsert into:
`bible_books (book_number)` and `bible_verses (book_id, chapter, verse)`.

If you need to (re)create the tables locally (PostgreSQL connection via `DATABASE_URL`):
```bash
npm run db:create:bible
```

### Frontend Development

The site uses:
- React + TypeScript
- Vite for bundling
- Tailwind CSS for styling
- `react-pageflip` for the Bible reader

Key components:
- `BibleReader.tsx`: Main Bible reading interface
- `AudioBible.tsx`: Audio player component
- Other components in `components/`

### Deployment

1. Build the frontend:
```bash
npm run build
```

2. Backend deployment (example with pm2):
```bash
cd backend
npm install
pm2 start server.js --name church-api
pm2 save
```

3. Serve frontend (options):
	 - Upload `dist/` to static host
	 - Or serve via nginx:
```nginx
server {
	server_name samanabyar.online;
	root /var/www/mychurch/dist;
	index index.html;

	location /api/ {
		proxy_pass http://127.0.0.1:5000/api/;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
	}

	location / {
		try_files $uri /index.html;
	}
}
```

4. Set environment variables (backend):
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `NODE_ENV=production`
- `DATABASE_URL` (if direct Postgres)
- `FTP_HOST/FTP_USER/FTP_PASS/DOMAIN` for image upload
- (Optional) `BIBLE_SOURCE_MODE`, `SQLITE_PATH`, or `BIBLE_DIR_PATH`
