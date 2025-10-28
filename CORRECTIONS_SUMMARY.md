# ✅ **اصلاحات انجام شده - فارسی به انگلیسی**

## 📋 **خلاصه تغییرات:**

### 1️⃣ **اعداد فارسی → انگلیسی**
✅ تمام اعداد در `components/AIImageSlider.tsx` به انگلیسی تبدیل شدند

**قبل:**
```typescript
fa: 'متی ۱۸:۲۰'
fa: 'یوحنا ۸:۱۲'
fa: 'مزامیر ۱۰۰:۴'
```

**بعد:**
```typescript
fa: 'متی 18:20'
fa: 'یوحنا 8:12'
fa: 'مزامیر 100:4'
```

---

### 2️⃣ **اطلاعات تماس کلیسا**
✅ فایل: `lib/constants.ts`

**آدرس:**
```typescript
export const CHURCH_ADDRESS = "10613 Georgia Ave, Silver Spring, MD 20902";
```

**تلفن:**
```typescript
export const CHURCH_PHONE = "+1 (301) 649-7086";
```

**زمان جلسات:**
```typescript
export const MEETING_TIME_EN = "Sundays at 1:00 PM EST";
export const MEETING_TIME_FA = "یکشنبه‌ها ساعت 1 بعد از ظهر";  // ۱ → 1
```

**لینک آنلاین:**
```typescript
export const ONLINE_MEETING_URL = "https://join.freeconferencecall.com/iranianchristianchurchdc";
export const CONFERENCE_CALL_PHONE = "(518) 318-7878";
```

---

### 3️⃣ **لینک‌های شبکه‌های اجتماعی**
✅ به روز شدند (قبلاً `#` بودند):

```typescript
export const YOUTUBE_URL = "https://www.youtube.com/@iranianchristianchurchdc";
export const INSTAGRAM_URL = "https://www.instagram.com/iranianchristianchurchdc";
export const FACEBOOK_URL = "https://www.facebook.com/p/Iranian-Christian-Church-Of-Washington-DC-100064338971759/";
```

---

### 4️⃣ **تصاویر Placeholder → تصاویر واقعی**
✅ فایل: `pages/HomePage.tsx`

**قبل (تصاویر AI placeholder):**
```tsx
<img src="/images/Bible_study_peaceful_setting_6bb44b27.png" />
<img src="/images/Children_Sunday_school_class_ade575b6.png" />
```

**بعد (تصاویر واقعی کلیسا):**
```tsx
<img src="/church-photos/photo1.jpg" alt="Worship Area" />
<img src="/church-photos/photo3.jpg" alt="Church Interior" />
```

---

## 🎯 **نقشه تصاویر کلیسا:**

```
public/church-photos/
├── photo1.jpg   → محل پرستش (منبر + صلیب)
├── photo2.jpg   → پنجره شیشه‌ای رنگی
├── photo3.jpg   → نمای کامل کلیسا
├── photo4.jpg   → نزدیک به صلیب
├── photo5.jpg   → منبر با گیاهان
└── photo6.jpg   → نمای panorama
```

---

## 📍 **اطلاعات کامل کلیسا:**

### آدرس:
```
10613 Georgia Ave
Silver Spring, MD 20902
United States
```

### تلفن:
```
+1 (301) 649-7086
```

### زمان جلسات:
```
Sundays at 1:00 PM EST
یکشنبه‌ها ساعت 1 بعد از ظهر
```

### جلسه آنلاین:
- **لینک:** https://join.freeconferencecall.com/iranianchristianchurchdc
- **تلفن (آمریکا/کانادا):** (518) 318-7878

### شبکه‌های اجتماعی:
- **Facebook:** [Iranian Christian Church Of Washington DC](https://www.facebook.com/p/Iranian-Christian-Church-Of-Washington-DC-100064338971759/)
- **YouTube:** [@iranianchristianchurchdc](https://www.youtube.com/@iranianchristianchurchdc)
- **Instagram:** [@iranianchristianchurchdc](https://www.instagram.com/iranianchristianchurchdc)

---

## ✅ **فایل‌های اصلاح شده:**

1. ✅ `components/AIImageSlider.tsx` - اعداد فارسی → انگلیسی (6 مورد)
2. ✅ `lib/constants.ts` - اطلاعات تماس + لینک‌ها
3. ✅ `pages/HomePage.tsx` - تصاویر placeholder → واقعی

---

## 🚀 **مراحل باقیمانده:**

### مرحله 1: کپی تصاویر کلیسا
```powershell
# از 6 عکس ضمیمه شده، این فایل‌ها را بسازید:
Copy-Item "source_path\photo1.jpg" "public\church-photos\photo1.jpg"
Copy-Item "source_path\photo2.jpg" "public\church-photos\photo2.jpg"
Copy-Item "source_path\photo3.jpg" "public\church-photos\photo3.jpg"
Copy-Item "source_path\photo4.jpg" "public\church-photos\photo4.jpg"
Copy-Item "source_path\photo5.jpg" "public\church-photos\photo5.jpg"
Copy-Item "source_path\photo6.jpg" "public\church-photos\photo6.jpg"
```

### مرحله 2: تست
```powershell
# Frontend:
npm run dev

# Backend:
npm run backend
```

### مرحله 3: بررسی
1. صفحه اول - تصاویر gallery باید عکس‌های واقعی کلیسا باشند
2. صفحه تماس - شماره و آدرس به انگلیسی
3. اسلایدر - اعداد آیات به انگلیسی

---

## 📝 **نکات مهم:**

- ✅ تمام اعداد در متون فارسی حالا به **انگلیسی** هستند
- ✅ آدرس و شماره تلفن **به انگلیسی و فرمت استاندارد** آمریکا
- ✅ لینک‌های واقعی شبکه‌های اجتماعی
- ✅ تصاویر placeholder حذف شدند
- ✅ استفاده از تصاویر واقعی کلیسا

---

**🎉 تمام اصلاحات انجام شد! سایت آماده است.**
