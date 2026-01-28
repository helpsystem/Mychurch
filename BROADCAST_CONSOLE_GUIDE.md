# 🎬 Broadcast Console Pro - راهنمای کامل

## 📍 مسیر دسترسی
```
/#/admin/broadcast
```

## 🎯 قابلیت‌ها

### ✅ قابلیت‌های فعال

#### 1. 📺 ساخت اسلاید
- **آیات کتاب مقدس** - جستجو و انتخاب از کتابخانه
- **متن سرود** - انتخاب از 364+ سرود سایت
- **تصویر/ویدیو** - آپلود و drag-drop

#### 2. 🎵 سیستم Karaoke
- نمایش متن با highlight کلمه‌به‌کلمه
- نمایش همزمان finglish
- اتصال به 364 فایل timing موجود
- پشتیبانی از overlay برای پخش زنده

#### 3. 🤖 Gemini AI
- ترجمه خودکار FA ↔ EN
- جستجوی هوشمند آیات کتاب مقدس
- تولید Lower Third دوزبانه
- تولید متن دعا
- پیشنهاد محتوای هوشمند

#### 4. 🎬 ضبط و استریم
- **ضبط محلی** - WebM با کیفیت بالا
- **YouTube Live** - استریم مستقیم با RTMP
- **ذخیره لوکال** - File System API
- **سینک کلود** - HiDrive و Google Drive

#### 5. 💾 ذخیره Session
- ذخیره در Supabase
- بازیابی session های قبلی
- Template های آماده
- Auto-save محلی

#### 6. 🔌 WebSocket Sync
- سینک چند دستگاه real-time
- کنترل از راه دور
- چت تیم

#### 7. 📊 Export پاورپوینت
- PPTX با فونت Vazirmatn
- پشتیبانی از RTL
- ProPresenter export
- Plain text برای teleprompter

---

## 📁 ساختار فایل‌ها

```
frontend/src/components/broadcast/
├── index.ts                 # Module exports
├── types.ts                 # TypeScript types
├── dataService.ts           # API services
├── BroadcastConsole.tsx     # Main component
├── SlideBuilder.tsx         # Slide creation UI
├── LiveConsole.tsx          # Live preview
├── KaraokeLyricsDisplay.tsx # Karaoke system
├── RecordingPanel.tsx       # Recording controls
├── useHybridRecorder.ts     # Recording hook
├── useWebSocketSync.ts      # WebSocket sync
├── geminiService.ts         # AI services
├── sessionStorage.ts        # Session persistence
└── pptxExport.ts           # PowerPoint export

backend/routes/
├── broadcastAiRoutes.js     # AI API endpoints
└── broadcastSessionRoutes.js # Session API endpoints

migrations/
└── broadcast_sessions.sql   # Database table
```

---

## 🔧 API Endpoints

### AI Services
| Method | Endpoint | توضیح |
|--------|----------|-------|
| POST | `/api/broadcast-ai/translate` | ترجمه متن |
| POST | `/api/broadcast-ai/scripture-search` | جستجوی آیات با AI |
| POST | `/api/broadcast-ai/scripture-suggest` | پیشنهاد آیه |
| POST | `/api/broadcast-ai/content-suggest` | پیشنهاد محتوا |
| POST | `/api/broadcast-ai/lower-third` | تولید Lower Third |
| POST | `/api/broadcast-ai/generate-prayer` | تولید متن دعا |
| POST | `/api/broadcast-ai/correct-persian` | اصلاح متن فارسی |

### Session Storage
| Method | Endpoint | توضیح |
|--------|----------|-------|
| GET | `/api/broadcast-sessions` | لیست session ها |
| GET | `/api/broadcast-sessions/:id` | دریافت یک session |
| POST | `/api/broadcast-sessions` | ایجاد session |
| PATCH | `/api/broadcast-sessions/:id` | بروزرسانی |
| DELETE | `/api/broadcast-sessions/:id` | حذف |
| POST | `/api/broadcast-sessions/:id/duplicate` | کپی |

---

## 🚀 استفاده

### شروع ساده
```tsx
import { BroadcastConsole } from '@/components/broadcast';

<BroadcastConsole initialLang="fa" />
```

### استفاده از Karaoke
```tsx
import { KaraokeLyricsDisplay } from '@/components/broadcast';

<KaraokeLyricsDisplay
  songId={123}
  audioUrl="/worship/audio/song_123.mp3"
  title="سرود"
  lang="fa"
  showFinglish={true}
/>
```

### استفاده از Recording Hook
```tsx
import { useHybridRecorder } from '@/components/broadcast';

const {
  state,
  startRecording,
  stopRecording,
  saveLocal,
  startYouTubeStream,
  syncToCloud
} = useHybridRecorder();
```

### استفاده از WebSocket Sync
```tsx
import { useWebSocketSync } from '@/components/broadcast';

const {
  state,
  connect,
  sendSlideChange,
  sendPlayControl
} = useWebSocketSync({ deviceName: 'Controller' });

// ایجاد session
const sessionId = createSession();

// اتصال device دیگر
connect(sessionId);
```

---

## 📝 Migration

برای ایجاد جدول در دیتابیس:
```bash
# اجرا در Supabase SQL Editor
cat migrations/broadcast_sessions.sql
```

---

## 🔐 دسترسی‌ها

این صفحه فقط برای نقش‌های زیر قابل دسترس است:
- `SUPER_ADMIN`
- `MANAGER`
- `WORSHIP_LEADER`

---

## 📱 Responsive

- ✅ Desktop (Full features)
- ✅ Tablet (Slide builder + Preview)
- ⚠️ Mobile (Preview only - محدود)

---

## 🔮 ویژگی‌های آینده

- [ ] OBS Integration via WebSocket
- [ ] Automatic scene switching
- [ ] AI-generated backgrounds
- [ ] Chord overlay on lyrics
- [ ] Multi-camera switching
- [ ] Audio mixing console

---

## 📞 پشتیبانی

مشکلات را در Issues گزارش دهید یا با تیم توسعه تماس بگیرید.
