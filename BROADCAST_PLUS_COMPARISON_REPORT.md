# 📊 گزارش کامل Broadcast Console Pro Plus

## 🎯 خلاصه اجرایی

**نسخه جدید "broadcast-console-pro plus"** شامل 3 قابلیت پیشرفته است که در نسخه فعلی سایت وجود ندارد:

1. **🎤 Karaoke Lyrics Display** - نمایش متن کاراوکه همزمان با صدا
2. **🎥 Hybrid Recorder** - ضبط ویدیو با آپلود همزمان به cloud + دیسک
3. **🔄 WebSocket Sync** - همگام‌سازی اسلایدها بین دستگاه‌های مختلف

---

## 🆚 مقایسه نسخه فعلی سایت vs نسخه Plus

| ویژگی | نسخه فعلی سایت | نسخه Plus | وضعیت ادغام |
|-------|---------------|-----------|-------------|
| **SlideBuilder** | ✅ کامل با 4 نوع اسلاید | ✅ 3 نوع (بدون Announcement) | ✅ سایت بهتر است |
| **LiveConsole** | ✅ Layout + Overlays + Settings | ✅ مشابه اما ساده‌تر | ✅ سایت بهتر است |
| **داده‌های سایت** | ✅ 364 آهنگ + Bible API | ❌ Mock data | ✅ سایت متصل است |
| **Karaoke Display** | ❌ ندارد | ✅ دارد (ساده) | 🔄 نیاز به ادغام |
| **Hybrid Recorder** | ❌ ندارد | ✅ دارد (شبیه‌سازی) | 🔄 نیاز به پیاده‌سازی |
| **WebSocket Sync** | ❌ ندارد | ✅ دارد (Mock) | 🔄 نیاز به backend |

---

## 📁 ساختار فایل‌های نسخه Plus

```
broadcast-console-pro plus/
├── components/
│   ├── BroadcastConsole.tsx      ← کامپوننت اصلی
│   ├── SlideBuilder.tsx          ← مشابه سایت اما ساده‌تر
│   ├── LiveConsole.tsx           ← مشابه سایت اما کمتر
│   ├── PreFlightCheck.tsx        ← تست دوربین/میک
│   └── KaraokeLyricsDisplay.tsx  ← 🆕 کاراوکه جدید
├── hooks/
│   ├── useHybridRecorder.ts      ← 🆕 ضبط ویدیو
│   └── useWebSocketSync.ts       ← 🆕 همگام‌سازی
├── services/
│   ├── geminiService.ts          ← API هوش مصنوعی
│   └── socketService.ts          ← Mock WebSocket
├── backend/
│   └── server.js                 ← Express + Socket.io
└── types.ts                      ← تعاریف Type
```

---

## 🔍 تحلیل قابلیت‌های جدید

### 1️⃣ Karaoke Lyrics Display

**فایل:** `components/KaraokeLyricsDisplay.tsx`

**قابلیت‌ها:**
- نمایش متن آهنگ با هایلایت زنده
- پخش صوتی با audioRef
- Finglish اختیاری
- انیمیشن smooth با blur و scale

**نحوه کار:**
```typescript
interface KaraokeLyricsDisplayProps {
  songId?: number;
  audioUrl?: string;
  title: string;
  syncData?: { time: number; text: string }[];
}

// Logic:
const activeIndex = syncData.findIndex((item, idx) => {
  const nextItem = syncData[idx + 1];
  return currentTime >= item.time && (!nextItem || currentTime < nextItem.time);
});
```

**مقایسه با سایت:**
- ✅ سایت دارد: `KaraokeWorshipPlayer.tsx` (1405 خط)
  - دقت 0.01 ثانیه
  - تایمینگ کلمه‌به‌کلمه
  - 364 فایل timing
  - Finglish اتوماتیک
- ❌ نسخه Plus: ساده‌تر، فقط خط‌به‌خط

**نتیجه:** 🏆 **سایت فعلی بهتر است!**

---

### 2️⃣ Hybrid Recorder (ضبط ویدیو)

**فایل:** `hooks/useHybridRecorder.ts`

**قابلیت‌ها:**
- ضبط همزمان به 2 مسیر:
  - **Path A:** دیسک محلی (File System Access API)
  - **Path B:** Cloud upload (chunk-by-chunk)
- MediaRecorder API با WebM + VP9 + Opus
- Auto-slice هر 1 ثانیه برای امنیت
- Timer برای tracking زمان

**کد کلیدی:**
```typescript
mediaRecorder.ondataavailable = async (event) => {
  // Path A: Write to Local Disk
  if (fileWritableRef.current) {
    await fileWritableRef.current.write(event.data);
  }

  // Path B: Cloud Upload
  uploadChunkToCloud(event.data, chunkIndex++);
};
```

**وضعیت فعلی:**
- ❌ `uploadChunkToCloud()` فقط `console.log` است
- ❌ نیاز به API endpoint واقعی (S3/GCP signed URL)
- ✅ File System API واقعی کار می‌کند (Chromium only)

**نحوه پیاده‌سازی واقعی:**
```typescript
// backend/routes/uploadRoutes.js
app.post('/api/upload/init', async (req, res) => {
  // 1. Generate signed URL from S3/GCP
  const signedUrl = await generateSignedUrl();
  res.json({ uploadUrl: signedUrl, sessionId: uuid() });
});

// frontend
const uploadChunkToCloud = async (blob: Blob) => {
  const response = await fetch('/api/upload/init');
  const { uploadUrl } = await response.json();
  await fetch(uploadUrl, { method: 'PUT', body: blob });
};
```

**نتیجه:** 🔄 **نیاز به پیاده‌سازی backend واقعی**

---

### 3️⃣ WebSocket Sync (همگام‌سازی دستگاه‌ها)

**فایل‌ها:** 
- `hooks/useWebSocketSync.ts`
- `services/socketService.ts`
- `backend/server.js`

**قابلیت‌ها:**
- همگام‌سازی اسلاید بین دستگاه‌ها
- Real-time slide change broadcast
- Session-based rooms
- Play/pause control sync

**معماری:**
```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Device 1   │◄───────►│  WebSocket   │◄───────►│   Device 2   │
│  (Leader)    │         │   Server     │         │  (Viewer)    │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       │  slide_change          │  broadcast             │
       ├───────────────────────►│───────────────────────►│
       │  { slideId: '123' }    │                        │
```

**Backend (Express + Socket.io):**
```javascript
io.on('connection', (socket) => {
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
  });

  socket.on('slide_change', (data) => {
    socket.to(data.sessionId).emit('slide_change', {
      slideId: data.slideId,
      timestamp: Date.now()
    });
  });
});
```

**Frontend Hook:**
```typescript
const { state, sendSlideChange } = useWebSocketSync({
  onSlideChange: (slideId) => {
    // تغییر اسلاید در دستگاه‌های دیگر
    setActiveSlideIndex(parseInt(slideId));
  }
});
```

**وضعیت فعلی:**
- ❌ `socketService.ts` فقط Mock است
- ❌ نیاز به اجرای `backend/server.js`
- ✅ کد backend آماده است

**نتیجه:** 🔄 **نیاز به اجرای backend و اتصال واقعی**

---

## 🛠️ نحوه ادغام با سایت

### گام 1: کپی فایل‌های جدید

```bash
# کپی به frontend
cp "Project/broadcast-console-pro plus/components/KaraokeLyricsDisplay.tsx" \
   "frontend/src/components/broadcast/"

cp "Project/broadcast-console-pro plus/hooks/useHybridRecorder.ts" \
   "frontend/src/components/broadcast/hooks/"

cp "Project/broadcast-console-pro plus/hooks/useWebSocketSync.ts" \
   "frontend/src/components/broadcast/hooks/"
```

### گام 2: ایجاد Backend Broadcast

```bash
# ایجاد سرور WebSocket
mkdir -p backend/broadcast
cp "Project/broadcast-console-pro plus/backend/server.js" \
   "backend/broadcast/broadcast-server.js"
```

### گام 3: آپدیت LiveConsole

در `LiveConsole.tsx` اضافه کنید:

```typescript
import { useHybridRecorder } from './hooks/useHybridRecorder';
import { useWebSocketSync } from './hooks/useWebSocketSync';

// استفاده:
const { isRecording, startRecording, stopRecording } = useHybridRecorder(mediaStream);
const { state, sendSlideChange } = useWebSocketSync({
  onSlideChange: (slideId) => setActiveSlideIndex(parseInt(slideId))
});
```

### گام 4: اضافه کردن Karaoke به SlideBuilder

```typescript
// در modal Lyrics:
<button onClick={() => setShowKaraoke(true)}>
  🎤 Karaoke Mode
</button>

{showKaraoke && (
  <KaraokeLyricsDisplay
    audioUrl={selectedSong?.audioUrl}
    title={selectedSong?.title.fa}
    syncData={timingData}  // از فایل timing
    lang={lang}
  />
)}
```

---

## 📊 وابستگی‌های داده

| منبع | نسخه Plus | نسخه سایت |
|------|-----------|-----------|
| **Worship Songs** | ❌ Mock | ✅ `worship_songs.json` (364 songs) |
| **Bible Verses** | ❌ Gemini API | ✅ `bibleData.ts` + API |
| **Timing Data** | ❌ ندارد | ✅ 364 فایل timing |
| **WebSocket** | ❌ Mock | ❌ نیاز به پیاده‌سازی |
| **Cloud Upload** | ❌ شبیه‌سازی | ❌ نیاز به S3/GCP |

---

## ⚠️ اقدامات لازم برای استفاده واقعی

### 1️⃣ برای Karaoke (اولویت پایین)
- ✅ سایت قبلاً دارد! استفاده از `KaraokeWorshipPlayer.tsx`
- اگر می‌خواهید نسخه Plus استفاده شود:
  - اتصال `syncData` به فایل‌های `song_X_timing.json`
  - تبدیل فرمت timing به `{ time, text }[]`

### 2️⃣ برای Hybrid Recorder (اولویت متوسط)
```bash
# backend
npm install multer @aws-sdk/client-s3

# backend/routes/uploadRoutes.js
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

router.post('/init', async (req, res) => {
  const key = `recordings/${Date.now()}.webm`;
  const url = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 });
  res.json({ uploadUrl: url, key });
});
```

### 3️⃣ برای WebSocket Sync (اولویت بالا)
```bash
# اجرای backend
cd backend/broadcast
node broadcast-server.js
# Port: 3001

# frontend - تغییر socketService.ts از Mock به واقعی
import io from 'socket.io-client';

class RealSocketService {
  private socket: Socket;
  
  connect() {
    this.socket = io('http://localhost:3001');
  }
  
  emitSlideChange(slideId: string) {
    this.socket.emit('slide_change', { slideId, sessionId });
  }
}
```

---

## 🎯 نتیجه‌گیری

### ✅ چیزهایی که سایت فعلی بهتر دارد:
1. **Slide Types:** 4 نوع (Scripture, Lyrics, Media, Announcement)
2. **Data Integration:** 364 آهنگ + کتاب مقدس کامل
3. **Karaoke System:** دقت 0.01s با 364 فایل timing
4. **UI/UX:** کامل‌تر و حرفه‌ای‌تر

### 🆕 قابلیت‌های جدید نسخه Plus:
1. **useHybridRecorder:** ضبط ویدیو (نیاز به cloud setup)
2. **useWebSocketSync:** همگام‌سازی (نیاز به backend)
3. **KaraokeLyricsDisplay:** نسخه ساده (سایت بهتر دارد)

### 📝 توصیه نهایی:
✅ **سایت فعلی را نگه دارید**
✅ **فقط 2 قابلیت را اضافه کنید:**
   - Hybrid Recorder (برای ضبط مراسم)
   - WebSocket Sync (برای چند دستگاه)

---

## 📞 مراحل بعدی

1. **الان:** بررسی کنید آیا WebSocket Sync واقعاً نیاز است؟
2. **اگر بله:** من backend/broadcast-server.js را راه‌اندازی می‌کنم
3. **اگر خیر:** فقط Hybrid Recorder را با S3/GCP پیاده‌سازی می‌کنیم

**آیا می‌خواهید این 2 قابلیت را الان پیاده‌سازی کنم؟** 🚀
