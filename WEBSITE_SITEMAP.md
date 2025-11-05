# 🗺️ WEBSITE SITEMAP - Iranian Christian Church DC

## Visual Navigation Tree

```
http://localhost:5173/
│
├── 🏠 HOME (/)
│   └── Landing page with hero section, features, and calls-to-action
│
├── ℹ️ ABOUT & CHURCH INFO
│   ├── /about - Church history, mission, vision
│   ├── /leaders - Leadership team profiles
│   └── /testimonials - Member testimonies
│
├── 📖 BIBLE SECTION ⭐ MAJOR FEATURE
│   ├── /bible - Bible hub (main entry point)
│   │
│   ├── 📚 READERS
│   │   ├── /bible/reader - Bilingual Bible Reader (FA/EN parallel)
│   │   ├── /bible-reader - Alternative Bible Reader
│   │   ├── /bible-karaoke - Karaoke-style display with highlighting
│   │   └── /bible-study - Bible study tools and notes
│   │
│   ├── 🔊 AUDIO BIBLES
│   │   ├── /bible/audio - Main audio Bible page
│   │   ├── /bible-audio-tts - Bible with Text-to-Speech
│   │   ├── /bible/audio-sync-demo - Audio synchronization demo
│   │   ├── /bible/audio-test - Audio testing environment
│   │   └── /bible/audio-youversion - YouVersion professional audio test ⭐
│   │
│   └── 🖥️ PRESENTATION MODES
│       ├── /bible-presentation-sample - Static presentation demo
│       └── /bible-presentation - Dynamic presentation (API-powered) ⭐
│
├── 🎵 WORSHIP & MUSIC
│   ├── /worship - Worship ministry overview
│   ├── /worship-songs - Song catalog with audio
│   ├── /worship-presentation - Presentation mode for projection
│   └── /worship/:id - Individual song viewer
│
├── 🙏 PRAYER & DEVOTIONAL
│   ├── /prayer - Prayer page and resources
│   ├── /prayer-requests - Submit and view prayer requests
│   └── /daily-devotional - Daily devotional content
│
├── 📅 EVENTS & CALENDAR
│   ├── /events - Upcoming events list
│   ├── /calendar - Interactive calendar view
│   └── /announcements - Church announcements and news
│
├── 📖 MINISTRIES & SERVICES
│   ├── /sermons - Sermon archive with audio/video
│   ├── /live - Live streaming service
│   └── /giving - Online giving and donation page
│
├── 🤝 CONNECT & COMMUNITY
│   ├── /new-here - First-time visitor information
│   ├── /connect - Connection opportunities and small groups
│   ├── /gallery - Photo gallery of church events
│   ├── /help-center - Help, FAQs, and support
│   └── /contact - Contact form and information
│
├── 🤖 AI ASSISTANT (Al Hayat GPT) ⭐
│   ├── [WIDGET] - Floating chat widget (visible on all pages)
│   ├── /ai-helper - AI Bible assistant main page
│   └── /ai-examples - Usage examples and prompts
│
├── 👤 USER AREA
│   ├── /login - User login
│   ├── /signup - New account registration
│   ├── /verify-email - Email verification
│   ├── /profile 🔒 - User profile (protected)
│   └── /notification-center - Notifications and alerts
│
├── 🛡️ ADMIN PANEL (Protected) 🔒
│   ├── /admin/login - Admin authentication
│   ├── /admin 🔒 - Admin dashboard (SUPER_ADMIN, MANAGER)
│   ├── /admin/worship-management 🔒 - Worship content management
│   ├── /admin/configure-backend 🔒 - Backend configuration (SUPER_ADMIN only)
│   ├── /admin/tts-usage - TTS usage statistics
│   └── /daily-messages 🔒 - Daily messages management (SUPER_ADMIN, MANAGER)
│
└── 🔧 SPECIAL PAGES
    ├── /presentation - Full-screen presentation mode
    ├── /tailwind-demo - Component showcase (dev)
    └── /p/:slug - Dynamic custom pages
```

---

## 🎯 QUICK ACCESS BY CATEGORY

### 📖 Bible Features (11 pages)
All Bible-related features including readers, audio sync, and presentations.
```
/bible                         → Main Bible hub
/bible/reader                  → Bilingual reader (FA/EN)
/bible/audio                   → Audio Bible
/bible/audio-youversion        → YouVersion professional audio ⭐
/bible-audio-tts              → Text-to-speech Bible
/bible-presentation           → Dynamic presentation ⭐
/bible-presentation-sample    → Static presentation demo
/bible-karaoke                → Karaoke-style display
/bible-study                  → Study tools
/bible/audio-sync-demo        → Sync demonstration
/bible/audio-test             → Testing page
```

### 🎵 Worship (3 pages)
Worship songs, lyrics, and presentation tools.
```
/worship                      → Worship ministry
/worship-songs                → Song catalog
/worship-presentation         → Presentation mode
```

### 🙏 Prayer (3 pages)
Prayer resources and request management.
```
/prayer                       → Prayer page
/prayer-requests              → Prayer request system
/daily-devotional             → Daily devotions
```

### 👥 Community (7 pages)
Connection opportunities and community engagement.
```
/new-here                     → First-time visitors
/connect                      → Small groups and connections
/gallery                      → Photo gallery
/testimonials                 → Member testimonies
/help-center                  → Help and support
/giving                       → Online donations
/contact                      → Contact information
```

### 📅 Church Activities (5 pages)
Events, services, and announcements.
```
/sermons                      → Sermon archive
/events                       → Upcoming events
/calendar                     → Calendar view
/announcements                → News and updates
/live                         → Live streaming
```

### 🤖 AI Tools (2 pages + widget)
AI-powered Bible assistant.
```
/ai-helper                    → AI assistant page
/ai-examples                  → Usage examples
[Widget on all pages]         → Floating chat
```

### 🔐 Protected Areas (7 pages)
User accounts and admin features.
```
/profile 🔒                   → User profile
/daily-messages 🔒            → Daily messages (admin)
/admin 🔒                     → Admin dashboard
/admin/worship-management 🔒  → Worship admin
/admin/configure-backend 🔒   → Backend config (super admin)
/admin/tts-usage              → TTS statistics
/notification-center          → Notifications
```

---

## 🌐 PUBLIC vs PROTECTED ROUTES

### 🔓 Public Routes (41 pages)
Accessible to all visitors without authentication.

### 🔒 Protected Routes (7 pages)
Require authentication and specific roles:

| Page | Roles Required | Purpose |
|------|----------------|---------|
| `/profile` | MEMBER+ | User profile management |
| `/daily-messages` | SUPER_ADMIN, MANAGER | Daily message administration |
| `/admin` | SUPER_ADMIN, MANAGER | Main admin dashboard |
| `/admin/worship-management` | SUPER_ADMIN, MANAGER, WORSHIP_LEADER | Worship content management |
| `/admin/configure-backend` | SUPER_ADMIN | Backend configuration |

---

## 🎯 KEY USER JOURNEYS

### Journey 1: First-Time Visitor
```
/ (Home)
  → /new-here (Learn about church)
    → /about (Church history)
      → /events (Find upcoming events)
        → /signup (Create account)
```

### Journey 2: Bible Study
```
/ (Home)
  → /bible (Bible hub)
    → /bible/reader (Read bilingual text)
      → /bible/audio-youversion (Listen with sync) ⭐
        → /bible-study (Take notes)
```

### Journey 3: Worship Leader
```
/login (Authenticate)
  → /admin/worship-management (Manage songs) 🔒
    → /worship-presentation (Present during service)
```

### Journey 4: Regular Member
```
/ (Home)
  → /sermons (Watch latest sermon)
    → /prayer-requests (Submit prayer request)
      → /giving (Make donation)
```

---

## 📊 ROUTE STATISTICS

### By Access Level
- **Public:** 41 pages (85%)
- **Protected:** 7 pages (15%)

### By Category
- **Bible:** 11 pages (23%) ⭐ Largest section
- **Community:** 7 pages (15%)
- **Admin:** 7 pages (15%)
- **Ministries:** 5 pages (10%)
- **Main:** 4 pages (8%)
- **Worship:** 3 pages (6%)
- **Prayer:** 3 pages (6%)
- **Auth:** 4 pages (8%)
- **AI:** 2 pages (4%)
- **Special:** 2 pages (4%)

### By Functionality
- **Content Pages:** 28 (58%)
- **Interactive Tools:** 11 (23%)
- **Admin/Management:** 7 (15%)
- **Authentication:** 4 (8%)

---

## 🔗 EXTERNAL INTEGRATIONS

### APIs & Services
- **YouVersion API** - Professional Bible audio (Elam Ministries)
- **Google Gemini** - AI Bible assistant
- **Supabase** - PostgreSQL database and authentication
- **Edge TTS** - Text-to-speech generation

### CDN Resources
- **Tailwind CSS** - Styling framework
- **Lucide Icons** - Icon library
- **Google Fonts** - Typography (Vazir, Poppins)

---

## 🚀 DEPLOYMENT NOTES

### HashRouter Benefits
All routes use `#/path` format, enabling:
- ✅ Works on any hosting provider
- ✅ No server-side routing needed
- ✅ GitHub Pages compatible
- ✅ Netlify/Render compatible
- ✅ Direct URL sharing works

### Environment Requirements
- **Frontend:** Vite dev server (port 5173)
- **Backend:** Node.js/Express (port 3001)
- **Database:** Supabase PostgreSQL
- **API Keys:** Gemini, Supabase

---

## 📝 NOTES

### Featured Pages ⭐
Three pages marked as featured due to unique functionality:
1. `/bible/audio-youversion` - Professional audio with word-level sync
2. `/bible-presentation` - Dynamic bilingual presentation mode
3. AI Chat Widget - Available globally on all pages

### Maintenance
- Total pages to maintain: **48**
- Dynamic content pages: **20** (require database)
- Static pages: **28** (self-contained)

---

**Sitemap Version:** 1.0  
**Last Updated:** November 4, 2025  
**Total Routes:** 48 functional pages
