# AI Coding Agent Instructions - Iranian Christian Church DC Website

## 🎯 Project Overview
Bilingual (Persian/English) church website built with React + Vite frontend, Node.js/Express backend, and Supabase PostgreSQL database. Features include Bible reader, worship songs with timing sync, AI chat, sermons, events, and admin dashboard.

## 🏗️ Architecture

### Frontend (Port 5173)
- **Tech**: React 18 + TypeScript + Vite 6
- **State**: Context API (`AuthContext`, `LanguageContext`, `ContentContext`)
- **Routing**: React Router v7 with HashRouter (`#/path`)
- **Styling**: Tailwind CSS + custom gradients
- **Key Pattern**: Bilingual components use `useLanguage()` hook with `lang` prop for `'fa'` | `'en'`

### Backend (Port 3001)
- **Tech**: Express.js + PostgreSQL (Supabase)
- **Auth**: JWT tokens in cookies
- **API**: RESTful `/api/*` proxied through Vite
- **Key Files**: 
  - `backend/server.js` - Production server
  - `backend/dev-server.js` - Development with hot reload
  - `backend/db-postgres.js` - Database connection

### Database (Supabase)
- Tables: `users`, `bible_verses`, `bible_books`, `worship_songs`, `sermons`, `events`, etc.
- Multi-translation Bible: `mojdeh`, `qadim`, `tafsiri_ot`, `tafsiri_nt`

## 🔑 Critical Commands

```bash
# Development (Frontend only)
npm run dev

# Development (Frontend + Backend)
npm run dev:full

# Backend only
npm run backend
# or: node backend/dev-server.js

# Production build
npm run build

# Preview production build
npm run preview

# Deploy to Render
git push origin main  # Auto-deploys via GitHub webhook
```

## 📁 Key Directories

```
components/        # Reusable React components
pages/            # Top-level page components (HomePage, BiblePage, etc.)
hooks/            # Custom hooks (useLanguage, useAuth, useContent)
context/          # React Context providers
services/         # API clients and external services
lib/              # Utilities (auth.ts, theme.ts, etc.)
backend/routes/   # Express API endpoints
public/worship/   # Static worship song data & timing files
```

## 🎨 Code Patterns

### 1. Bilingual Components
**Always support Persian (RTL) and English:**
```tsx
const MyComponent: React.FC = () => {
  const { lang, t } = useLanguage();
  
  return (
    <div dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <h1>{t('myKey')}</h1>
      {/* Or direct: */}
      <p>{lang === 'fa' ? 'متن فارسی' : 'English text'}</p>
    </div>
  );
};
```

### 2. Data Fetching
**Use `useContent()` hook for site-wide data:**
```tsx
const { content, loading } = useContent();
const songs = content.worshipSongs || [];
```

**Or fetch directly from public JSON:**
```tsx
fetch('/worship/data/worship_songs.json')
  .then(res => res.json())
  .then(setSongs);
```

### 3. API Calls
**Backend proxied through `/api`:**
```tsx
import axios from 'axios';

// Automatically routes to http://localhost:3001/api/worship-songs
const response = await axios.get('/api/worship-songs');
```

### 4. Authentication
**Check user role:**
```tsx
const { user, isAuthenticated } = useAuth();

// Roles: 'SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER', 'MEMBER'
if (user?.role === 'SUPER_ADMIN') {
  // Admin-only feature
}
```

**Protected routes:**
```tsx
<Route path="/admin/*" element={
  <ProtectedRoute roles={['SUPER_ADMIN', 'MANAGER']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### 5. Worship Songs with Timing
**Timing files stored in:** `public/worship/data/timings/song_{id}_timing.json`

**Format:**
```json
{
  "metadata": {
    "title": "Song Title",
    "totalDuration": 245.6,
    "wordCount": 324
  },
  "words": [
    {"word": "کلمه", "start": 0.42, "end": 0.75}
  ],
  "lines": [...]
}
```

**Usage:**
```tsx
import LocalAudioPlayerWithSyncedLyrics from '@/components/LocalAudioPlayerWithSyncedLyrics';

<LocalAudioPlayerWithSyncedLyrics
  audioUrl={song.audioUrl}
  lyrics={song.lyrics?.fa}
  lang="fa"
  title={song.title?.fa}
/>
```

## 🛠️ Common Tasks

### Adding a New Page
1. Create `pages/MyNewPage.tsx`
2. Add route in `App.tsx`:
   ```tsx
   <Route path="my-page" element={<MyNewPage />} />
   ```
3. Add translations in component or `context/LanguageContext.tsx`

### Adding a New API Endpoint
1. Create route file: `backend/routes/myRoutes.js`
2. Register in `backend/server.js`:
   ```javascript
   const myRoutes = require('./routes/myRoutes');
   app.use('/api/my-endpoint', myRoutes);
   ```
3. Add database queries in route handler

### Debugging Issues
- **Frontend not loading data**: Check if backend is running (`npm run backend`)
- **API errors**: Check browser DevTools Network tab, backend logs
- **Persian text garbled**: Ensure file encoding is UTF-8
- **Build errors**: Check `get_errors` tool output
- **Vite cache issues**: Delete `node_modules/.vite` or restart dev server

## 🚨 Important Notes

1. **Always use HashRouter paths**: `/#/page` not `/page`
2. **File encoding**: All files must be UTF-8 (especially for Persian text)
3. **Backend must run**: Frontend alone won't load dynamic content
4. **No direct DB access from frontend**: Always use `/api` endpoints
5. **Timing Recorder**: Standalone HTML at `/timing-recorder.html` for worship song timing capture
6. **Admin credentials**: `help.system@ymail.com` / `Samyar@1989` (dev only)

## 🔗 External Dependencies

- **Supabase**: Cloud PostgreSQL database (connection via env vars)
- **Google Gemini**: AI chat for Bible questions (`GEMINI_API_KEY`)
- **Render.com**: Production hosting (auto-deploy from GitHub)
- **FTP**: Optional file upload for assets (basic-ftp package)

## 📚 Documentation Files

- `SITE_ARCHITECTURE.md` - Full architecture diagrams
- `WORSHIP_TIMING_SYSTEM.md` - Worship song timing system
- `BIBLE_TTS_GUIDE.md` - Text-to-speech for Bible
- `DEPLOYMENT_GUIDE.md` - Production deployment steps
- `README_DEV.md` - Developer setup instructions

## 🎯 Current Focus Areas

1. **Worship Songs**: Adding timing sync, chord display, admin management
2. **Bible Reader**: 3D flipbook view, TTS, multi-translation support
3. **Admin Dashboard**: Content management for leaders and admins
4. **AI Chat**: Bible Q&A with Gemini API integration

---

**When making changes:**
- Test with both Persian and English languages
- Ensure responsive design (mobile + desktop)
- Check backend logs for API errors
- Verify database queries work with Supabase
- Test admin features with proper role permissions
