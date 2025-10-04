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

To re-import Bible data:

1. Ensure you have the SQLite file in `attached_assets/bible_fa_en_1758111193552.sqlite`
2. Run:
```bash
node scripts/db/import-bible-data.js
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

2. Deploy the `dist` folder to your hosting service

3. Set up environment variables on your hosting platform:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `NODE_ENV=production`
