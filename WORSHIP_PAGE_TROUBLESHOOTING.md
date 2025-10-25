# Worship Page Troubleshooting Guide

## مشکل: صفحه Worship همیشه صفحه اصلی رو نشون میده

### ✅ چیزهایی که چک کردیم:
1. ✅ Route در App.tsx تعریف شده: `<Route path="worship" element={<WorshipPage />} />`
2. ✅ WorshipPage.tsx بدون خطا
3. ✅ worship_songs.json در سرور موجود هست (364 songs)
4. ✅ Symlink درست کار میکنه
5. ✅ Build جدید (Oct 24 17:27) upload شده

### 🔍 علت احتمالی:
**Browser Cache** - فایل‌های JavaScript قدیمی cache شده‌اند

### 💡 راه حل:

#### روش 1: Hard Refresh
- Windows: `Ctrl + Shift + R` یا `Ctrl + F5`
- Mac: `Cmd + Shift + R`

#### روش 2: Clear Browser Cache
1. `Ctrl + Shift + Delete`
2. انتخاب "Cached images and files"
3. Clear data

#### روش 3: Incognito/Private Mode
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- سپس برو به: https://samanabyar.online/#/worship

#### روش 4: Check Console
1. باز کن DevTools: `F12`
2. برو tab Console
3. باید ببینی: `🎵 WorshipPage loaded! { songsCount: 364, isLoading: false }`
4. اگر این رو نمی‌بینی، یعنی component load نمیشه

### 🛠️ اگر هنوز کار نمیکنه:

بذار console errors رو چک کنیم. احتمالاً یکی از این مشکلات هست:

1. **Import Error**: WorshipPage به درستی import نشده
2. **ContentContext Error**: worship songs load نمیشه
3. **React Router**: route به درستی match نمیشه

### 📊 Current Status:
- Production Build: Oct 24, 2025 17:27
- JSON File: 364 songs (272,863 bytes)
- Server: samanabyar.online
- Path: /root/Mychurch/dist/
- Symlink: worship -> /var/www/mychurch-frontend/dist/worship
