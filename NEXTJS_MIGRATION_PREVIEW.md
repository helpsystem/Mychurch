# 🚀 Next.js Migration Preview

این سند تفاوت بین پروژه فعلی (React SPA) و پروژه آینده (Next.js) را نشان می‌دهد تا بتوانید برای مهاجرت تصمیم بگیرید.

---

## 1. 📂 تفاوت ساختار پروژه (Project Structure)

در Next.js جدید (App Router)، سیستم Routing بر اساس پوشه‌بندی است و نیازی به `react-router-dom` نیست.

### 🔴 ساختار فعلی (React)
```
src/
  App.tsx            (تعریف همه Route ها اینجا انجام می‌شود)
  main.tsx           (نقطه شروع برنامه)
  pages/
    HomePage.tsx     (کد صفحه اصلی)
    AboutPage.tsx
  components/
    Layout.tsx       (هدر و فوتر)
```

### 🟢 ساختار پیشنهادی (Next.js)
```
app/
  layout.tsx         (هدر و فوتر سراسری - فقط یکبار نوشته می‌شود)
  page.tsx           (همان HomePage.tsx - صفحه اصلی سایت)
  about/
    page.tsx         (همان AboutPage.tsx)
  leaders/
    page.tsx         (صفحه لیدرها)
  components/        (کامپوننت‌های قبلی اینجا می‌مانند)
```

---

## 2. 💻 مقایسه کد صفحه اصلی (HomePage)

تفاوت اصلی اینجاست: در React کد در مرورگر کاربر اجرا می‌شود (CSR)، اما در Next.js در سرور اجرا می‌شود (SSR) که برای گوگل عالی است.

### 🔴 React (کد فعلی)
مشکل: گوگل وقتی صفحه را باز می‌کند، ممکن است چند ثانیه صفحه سفید ببیند تا JS لود شود.

```tsx
// src/pages/HomePage.tsx
import React, { useEffect } from 'react';
import { SEOHead } from '../components/SEO/SEOHead'; // متاتگ‌ها با جاوااسکریپت تزریق می‌شوند

const HomePage = () => {
  // این کدها در مرورگر کاربر اجرا می‌شوند
  useEffect(() => {
    // Fetch data from API...
  }, []);

  return (
    <div>
      <SEOHead title="Home" />
      <h1>Welcome to Iran Church</h1>
      {/* محتوا بعد از لود شدن JS دیده می‌شود */}
    </div>
  );
};
```

### 🟢 Next.js (کد آینده)
مزیت: گوگل بلافاصله متن و محتوا را می‌بیند (مثل یک فایل HTML آماده).

```tsx
// app/page.tsx
import { Metadata } from 'next';
import HeroSection from '@/components/HeroSection'; // کامپوننت‌های تعاملی جدا می‌شوند

// ✅ 1. سئو (SEO) استاتیک و قدرتمند
export const metadata: Metadata = {
  title: 'پلتفرم هوشمند کلیسای ایرانیان',
  description: 'اولین پلتفرم تعاملی مسیحی با هوش مصنوعی...',
};

// ✅ 2. این کامپوننت در سرور اجرا می‌شود (Server Component)
export default async function HomePage() {
  // 🚀 دیتاها همینجا در سرور فچ می‌شوند (بدون نیاز به useEffect)
  // const leaders = await fetchLeaders(); 

  return (
    <main className="bg-primary w-full overflow-hidden">
      {/* محتوا به صورت HTML خالص به گوگل ارسال می‌شود */}
      <div className="flex justify-center items-start min-h-[90vh]">
        <div className="xl:max-w-[1280px] w-full">
           <HeroSection /> {/* کامپوننت‌های کلاینت مثل اسلایدر جداگانه لود می‌شوند */}
        </div>
      </div>
      
      {/* بقیه سکشن‌ها... */}
    </main>
  );
}
```

---

## 3. 🎯 چرا Next.js برای شما بهتر است؟

1. **SEO (سئو):**
   - **React:** گوگل باید صبر کند تا جاوااسکریپت لود شود. گاهی محتوا را ایندکس نمی‌کند.
   - **Next.js:** صفحه به صورت HTML کامل به گوگل داده می‌شود. تمام متن‌ها (موعظه‌ها، بلاگ‌ها) بلافاصله ایندکس می‌شوند.

2. **Performance (سرعت):**
   - عکس‌ها (`next/image`) خودکار فشرده و WebP می‌شوند.
   - فونت‌ها (`next/font`) بهینه لود می‌شوند و پرش متن (Layout Shift) ندارید.

3. **Routing:**
   - نیازی به مدیریت دستی Route ها نیست. فقط کافیست یک فایل در پوشه مربوطه بسازید.

---

## 4. ⚠️ چالش‌ها و زمان‌بندی

همانطور که گفتم، حدود **۳ تا ۵ روز** زمان می‌برد تا فرانت‌اند را منتقل کنیم.

#### چه چیزهایی باید تغییر کند؟
- **کامپوننت‌های تعاملی (Interactive):** کامپوننت‌هایی مثل `FullscreenKaraokePlayer` یا `ParticleCanvas` که انیمیشن دارند یا از `window` استفاده می‌کنند، باید بالای فایلشان `'use client'` اضافه شود.
- **Link:** به جای `react-router-dom` از `next/link` استفاده می‌شود.
- **Images:** تگ `<img>` با `<Image />` جایگزین می‌شود (برای سرعت بیشتر).

#### پیشنهاد نهایی
با توجه به اینکه سایت شما محتوای متنی و چندرسانه‌ای زیادی دارد، **مهاجرت به Next.js ارزشش را دارد.**

می‌توانیم در یک شاخه (Branch) جداگانه شروع کنیم و هر وقت راضی بودید، آن را جایگزین سایت اصلی کنیم.
