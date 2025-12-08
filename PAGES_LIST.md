# 📚 لیست کامل صفحات Bible و Worship

## 📖 صفحات کتاب مقدس (Bible Pages)

### صفحات اصلی
1. **Bible Unified Page** (صفحه یکپارچه)
   - Route: `/bible`
   - فایل: `pages/BibleUnifiedPage.tsx`
   - توضیح: صفحه اصلی با حالت‌های مختلف (خواندن، کارائوکه، سه‌بعدی)

2. **Bible Page** (صفحه قدیمی)
   - Route: `/bible-old` (احتمالاً)
   - فایل: `pages/BiblePage.tsx`
   - توضیح: صفحه قدیمی با layout دو ستونی فارسی/انگلیسی

3. **Bible Reader Page**
   - Route: `/bible/reader`
   - فایل: `pages/BibleReaderPage.tsx`
   - توضیح: صفحه خواننده تعاملی

### صفحات صوتی (Audio Pages)
4. **Audio Bible Page**
   - Route: `/bible/audio`
   - فایل: `pages/AudioBiblePage.tsx`
   - توضیح: پخش صدای کتاب مقدس

5. **Bible Audio Suite Page**
   - Route: `/bible/audio-suite`
   - فایل: `pages/BibleAudioSuitePage.tsx`
   - توضیح: مجموعه ابزارهای صوتی

6. **Bible Audio Sync Page**
   - Route: `/bible/audio-sync`
   - فایل: `pages/BibleAudioSyncPage.tsx`
   - توضیح: همگام‌سازی صدا با متن

7. **Bible Audio Sync Demo**
   - Route: `/bible/audio-sync-demo`
   - فایل: `pages/BibleAudioSyncDemoPage.tsx`
   - توضیح: نمایش همگام‌سازی

8. **Bible Audio Test**
   - Route: `/bible/audio-test`
   - فایل: `pages/BibleAudioTestPage.tsx`
   - توضیح: تست پخش صدا

9. **Bible Audio YouVersion Test**
   - Route: `/bible/audio-youversion`
   - فایل: `pages/BibleAudioYouVersionTestPage.tsx`
   - توضیح: تست با فرمت YouVersion

10. **Bible Sync Test**
    - Route: `/bible/sync-test`
    - فایل: `pages/BibleSyncTestPage.tsx`
    - توضیح: تست همگام‌سازی

### صفحات TTS (Text-to-Speech)
11. **Bible TTS Page**
    - Route: `/bible/tts`
    - فایل: `pages/BibleTTSPage.tsx`
    - توضیح: تولید صدا از متن

12. **Persian Bible TTS**
    - Route: `/bible-fa/tts/:book/:chapter`
    - فایل: `pages/PersianBibleTTSPage.tsx`
    - توضیح: TTS فارسی

### صفحات ویژه
13. **Bible Text Only**
    - Route: `/bible/text-only`
    - فایل: `pages/BibleTextOnlyPage.tsx`
    - توضیح: فقط متن بدون امکانات اضافی

14. **Bible Flipbook 3D**
    - Route: `/bible-flipbook/:book/:chapter`
    - فایل: `pages/BibleFlipbook3DPage.tsx`
    - توضیح: نمایش سه‌بعدی صفحه‌برگردان

15. **Bible Study Page**
    - Route: `/bible/study`
    - فایل: `pages/BibleStudyPage.tsx`
    - توضیح: مطالعه کتاب مقدس

16. **Bible Presentation Creator**
    - Route: `/bible/presentation`
    - فایل: `pages/BiblePresentationCreatorPage.tsx`
    - توضیح: ساخت ارائه

17. **Bible AI Chat**
    - Route: `/bible/ai-chat`
    - فایل: `pages/BibleAIChatPage.tsx`
    - توضیح: چت هوش مصنوعی درباره کتاب مقدس

18. **Bible Voice Chat**
    - Route: `/bible/voice-chat`
    - فایل: `pages/BibleVoiceChatPage.tsx`
    - توضیح: چت صوتی

19. **Modern Bible Test**
    - Route: `/bible/modern-test`
    - فایل: `pages/ModernBibleTestPage.tsx`
    - توضیح: تست UI مدرن

---

## 🎵 صفحات سرود پرستشی (Worship Pages)

### صفحات اصلی
1. **Worship Page** (صفحه اصلی)
   - Route: `/worship`
   - فایل: `pages/WorshipPage.tsx`
   - توضیح: صفحه اصلی لیست سرودها با پخش و کارائوکه

2. **Worship Songs Page**
   - Route: `/worship-songs`
   - فایل: `pages/WorshipSongsPage.tsx`
   - توضیح: لیست سرودها

3. **Worship Song Viewer**
   - Route: `/worship/:id`
   - فایل: `pages/WorshipSongViewerPage.tsx`
   - توضیح: نمایش سرود خاص

4. **Simple Worship Page**
   - Route: `/worship/simple`
   - فایل: `pages/SimpleWorshipPage.tsx`
   - توضیح: نسخه ساده

### صفحات ویژه
5. **Worship Presentation**
   - Route: `/worship-presentation`
   - فایل: `pages/WorshipPresentationPage.tsx`
   - توضیح: ارائه سرود روی پروژکتور

6. **Worship Audio Suite**
   - Route: `/worship/audio-suite`
   - فایل: `pages/WorshipAudioSuitePage.tsx`
   - توضیح: مجموعه ابزارهای صوتی

7. **Worship Sync Test**
   - Route: `/worship/sync-test`
   - فایل: `pages/WorshipSyncTestPage.tsx`
   - توضیح: تست همگام‌سازی

### صفحه مدیریت
8. **Admin Worship Management**
   - Route: `/admin/worship`
   - فایل: `pages/AdminWorshipManagementPage.tsx`
   - توضیح: مدیریت سرودها (فقط Admin)

---

## 🚀 چطور تست کنید؟

1. **Development Server را اجرا کنید:**
   ```bash
   npm run dev
   ```

2. **سپس هر یک از URL های زیر را در مرورگر باز کنید:**
   
   **Bible:**
   - http://localhost:3000/bible
   - http://localhost:3000/bible/audio
   - http://localhost:3000/bible/reader
   - http://localhost:3000/bible/audio-suite
   - http://localhost:3000/bible/text-only
   - (و سایر route های فوق...)
   
   **Worship:**
   - http://localhost:3000/worship
   - http://localhost:3000/worship-songs
   - http://localhost:3000/worship-presentation
   - (و سایر route های فوق...)

---

## 📝 توصیه‌های من

**برای شروع بررسی، این صفحات را در اولویت قرار دهید:**

### Bible - اولویت بالا:
1. ✅ `/bible` - صفحه اصلی
2. ✅ `/bible/audio` - برای یکپارچگی با فایل‌های صوتی آپلود شده
3. ✅ `/bible/reader` - صفحه خواننده

### Worship - اولویت بالا:
1. ✅ `/worship` - صفحه اصلی
2. ✅ `/worship-songs` - لیست سرودها
3. ✅ `/worship-presentation` - برای نمایش روی پروژکتور

**صفحات Test و Demo را می‌توانید در اولویت بعدی قرار دهید.**
