# 🎨 راهنمای استفاده از Tailwind CSS در پروژه

## ویژگی‌های کاربردی Tailwind که می‌تونیم استفاده کنیم:

### 1. 🌓 Dark Mode (حالت شب)

```tsx
// در کامپوننت‌ها:
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold dark:text-blue-400">عنوان</h1>
  <p className="text-gray-600 dark:text-gray-300">متن</p>
</div>

// فعال‌سازی در tailwind.config.js:
module.exports = {
  darkMode: 'class', // یا 'media' برای خودکار
}
```

### 2. 📱 Responsive Design (طراحی واکنشگرا)

```tsx
<div className="
  grid 
  grid-cols-1    /* موبایل: 1 ستون */
  sm:grid-cols-2 /* تبلت کوچک: 2 ستون */
  md:grid-cols-3 /* تبلت: 3 ستون */
  lg:grid-cols-4 /* لپتاپ: 4 ستون */
  xl:grid-cols-5 /* دسکتاپ: 5 ستون */
  gap-4
">
  {/* محتوا */}
</div>

// Breakpoints:
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

### 3. 🎭 Animations & Transitions

```tsx
// انیمیشن‌های آماده:
<button className="
  transition-all duration-300
  hover:scale-110
  hover:shadow-xl
  hover:bg-blue-600
  active:scale-95
">
  کلیک کن
</button>

// Fade In:
<div className="animate-fade-in">محتوا</div>

// Slide Up:
<div className="animate-slide-up">محتوا</div>

// Bounce:
<div className="animate-bounce">محتوا</div>

// Spin:
<div className="animate-spin">محتوا</div>

// Pulse:
<div className="animate-pulse">محتوا</div>
```

### 4. 🌈 Gradients (گرادیانت‌ها)

```tsx
// Gradient از چپ به راست:
<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  گرادیانت افقی
</div>

// Gradient از بالا به پایین:
<div className="bg-gradient-to-b from-pink-500 via-purple-500 to-indigo-500">
  گرادیانت عمودی
</div>

// Gradient مورب:
<div className="bg-gradient-to-br from-cyan-400 to-blue-600">
  گرادیانت مورب
</div>

// Text Gradient:
<h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
  متن گرادیانت
</h1>
```

### 5. 🪟 Glassmorphism (شیشه‌ای)

```tsx
<div className="
  backdrop-blur-lg
  bg-white/30
  dark:bg-gray-800/30
  border border-white/20
  rounded-xl
  shadow-xl
">
  کارت شیشه‌ای
</div>
```

### 6. 🎯 Cards (کارت‌های مدرن)

```tsx
<div className="
  group
  relative
  overflow-hidden
  rounded-2xl
  bg-white dark:bg-gray-800
  shadow-lg hover:shadow-2xl
  transition-all duration-300
  hover:-translate-y-2
">
  {/* تصویر */}
  <div className="overflow-hidden">
    <img 
      className="
        w-full h-48 object-cover
        transform transition-transform duration-500
        group-hover:scale-110
      "
      src="/image.jpg"
      alt="تصویر"
    />
  </div>
  
  {/* محتوا */}
  <div className="p-6">
    <h3 className="text-xl font-bold mb-2">عنوان</h3>
    <p className="text-gray-600 dark:text-gray-300">توضیحات</p>
  </div>
  
  {/* Badge */}
  <div className="absolute top-4 right-4">
    <span className="
      px-3 py-1
      bg-blue-500 text-white
      rounded-full text-sm font-semibold
    ">
      جدید
    </span>
  </div>
</div>
```

### 7. 🔘 Buttons (دکمه‌های حرفه‌ای)

```tsx
// دکمه ساده:
<button className="
  px-6 py-3
  bg-blue-600 hover:bg-blue-700
  text-white font-semibold
  rounded-lg
  transition-colors duration-200
">
  کلیک کنید
</button>

// دکمه با سایه و انیمیشن:
<button className="
  px-8 py-4
  bg-gradient-to-r from-purple-600 to-pink-600
  hover:from-purple-700 hover:to-pink-700
  text-white font-bold
  rounded-full
  shadow-lg hover:shadow-2xl
  transform hover:-translate-y-1
  transition-all duration-300
">
  دکمه خاص
</button>

// دکمه Outline:
<button className="
  px-6 py-3
  border-2 border-blue-600
  text-blue-600 hover:bg-blue-600 hover:text-white
  font-semibold rounded-lg
  transition-all duration-200
">
  Outline
</button>

// دکمه Ghost:
<button className="
  px-6 py-3
  text-gray-600 hover:bg-gray-100
  dark:text-gray-300 dark:hover:bg-gray-800
  font-semibold rounded-lg
  transition-colors duration-200
">
  Ghost
</button>
```

### 8. 📝 Forms (فرم‌های زیبا)

```tsx
<div className="space-y-4">
  {/* Input */}
  <div>
    <label className="block text-sm font-medium mb-2">
      نام
    </label>
    <input 
      type="text"
      className="
        w-full px-4 py-3
        border-2 border-gray-300
        focus:border-blue-500 focus:ring-2 focus:ring-blue-200
        rounded-lg
        transition-all duration-200
        dark:bg-gray-800 dark:border-gray-600
      "
      placeholder="نام خود را وارد کنید"
    />
  </div>
  
  {/* Textarea */}
  <div>
    <label className="block text-sm font-medium mb-2">
      پیام
    </label>
    <textarea 
      className="
        w-full px-4 py-3
        border-2 border-gray-300
        focus:border-blue-500 focus:ring-2 focus:ring-blue-200
        rounded-lg
        transition-all duration-200
        dark:bg-gray-800 dark:border-gray-600
      "
      rows={4}
      placeholder="پیام خود را بنویسید"
    />
  </div>
  
  {/* Checkbox */}
  <div className="flex items-center">
    <input 
      type="checkbox"
      className="
        w-5 h-5
        text-blue-600
        border-gray-300 rounded
        focus:ring-2 focus:ring-blue-500
      "
    />
    <label className="mr-2">قوانین را می‌پذیرم</label>
  </div>
</div>
```

### 9. 🔔 Alerts & Notifications

```tsx
// Success Alert:
<div className="
  flex items-center gap-3
  p-4
  bg-green-50 dark:bg-green-900/20
  border-l-4 border-green-500
  rounded-lg
">
  <span className="text-green-600 dark:text-green-400">✓</span>
  <p className="text-green-700 dark:text-green-300">
    عملیات با موفقیت انجام شد!
  </p>
</div>

// Error Alert:
<div className="
  flex items-center gap-3
  p-4
  bg-red-50 dark:bg-red-900/20
  border-l-4 border-red-500
  rounded-lg
">
  <span className="text-red-600 dark:text-red-400">✕</span>
  <p className="text-red-700 dark:text-red-300">
    خطایی رخ داده است!
  </p>
</div>

// Warning Alert:
<div className="
  flex items-center gap-3
  p-4
  bg-yellow-50 dark:bg-yellow-900/20
  border-l-4 border-yellow-500
  rounded-lg
">
  <span className="text-yellow-600 dark:text-yellow-400">⚠</span>
  <p className="text-yellow-700 dark:text-yellow-300">
    توجه داشته باشید!
  </p>
</div>

// Info Alert:
<div className="
  flex items-center gap-3
  p-4
  bg-blue-50 dark:bg-blue-900/20
  border-l-4 border-blue-500
  rounded-lg
">
  <span className="text-blue-600 dark:text-blue-400">ℹ</span>
  <p className="text-blue-700 dark:text-blue-300">
    اطلاعیه مهم
  </p>
</div>
```

### 10. 🎯 Loading States

```tsx
// Spinner:
<div className="
  w-10 h-10
  border-4 border-blue-200
  border-t-blue-600
  rounded-full
  animate-spin
"/>

// Skeleton Loading:
<div className="space-y-4 animate-pulse">
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"/>
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"/>
  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"/>
</div>

// Progress Bar:
<div className="w-full bg-gray-200 rounded-full h-2">
  <div className="
    bg-blue-600 h-2 rounded-full
    transition-all duration-500
  " style={{ width: '60%' }}/>
</div>
```

---

## 🚀 کامپوننت‌های پیشنهادی برای سایت کلیسا:

### 1. Hero Section (بخش اصلی)
```tsx
<div className="
  relative
  min-h-screen
  flex items-center justify-center
  bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600
  overflow-hidden
">
  {/* Background Pattern */}
  <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"/>
  
  {/* Content */}
  <div className="
    relative z-10
    text-center text-white
    px-6 max-w-4xl
  ">
    <h1 className="
      text-5xl md:text-7xl
      font-bold
      mb-6
      animate-fade-in
    ">
      کلیسای ایرانیان واشنگتن DC
    </h1>
    <p className="
      text-xl md:text-2xl
      mb-8
      animate-slide-up
    ">
      جایی که ایمان با فرهنگ ملاقات می‌کند
    </p>
    <button className="
      px-8 py-4
      bg-white text-blue-600
      font-bold rounded-full
      shadow-2xl
      hover:shadow-3xl
      transform hover:scale-105
      transition-all duration-300
    ">
      بیشتر بدانید
    </button>
  </div>
</div>
```

### 2. Sermon Cards (کارت‌های موعظه)
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {sermons.map(sermon => (
    <div className="
      group
      bg-white dark:bg-gray-800
      rounded-2xl
      overflow-hidden
      shadow-lg hover:shadow-2xl
      transition-all duration-300
      hover:-translate-y-2
    ">
      {/* Thumbnail */}
      <div className="relative overflow-hidden h-48">
        <img 
          src={sermon.thumbnail}
          className="
            w-full h-full object-cover
            transform group-hover:scale-110
            transition-transform duration-500
          "
        />
        {/* Play Button Overlay */}
        <div className="
          absolute inset-0
          bg-black/40 group-hover:bg-black/60
          flex items-center justify-center
          transition-colors duration-300
        ">
          <div className="
            w-16 h-16
            bg-white rounded-full
            flex items-center justify-center
            transform group-hover:scale-110
            transition-transform duration-300
          ">
            <PlayIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="
            px-3 py-1
            bg-blue-100 dark:bg-blue-900
            text-blue-600 dark:text-blue-300
            rounded-full text-sm font-semibold
          ">
            {sermon.category}
          </span>
        </div>
        <h3 className="
          text-xl font-bold mb-2
          text-gray-900 dark:text-white
        ">
          {sermon.title}
        </h3>
        <p className="
          text-gray-600 dark:text-gray-300
          text-sm mb-4
        ">
          {sermon.description}
        </p>
        <div className="
          flex items-center justify-between
          text-sm text-gray-500 dark:text-gray-400
        ">
          <span>{sermon.date}</span>
          <span>{sermon.duration}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

### 3. Event Calendar Card
```tsx
<div className="
  bg-white dark:bg-gray-800
  rounded-2xl
  p-6
  shadow-lg
">
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold">رویدادهای پیش رو</h2>
    <button className="
      text-blue-600 hover:text-blue-700
      font-semibold
    ">
      همه →
    </button>
  </div>
  
  {/* Events List */}
  <div className="space-y-4">
    {events.map(event => (
      <div className="
        flex gap-4
        p-4
        rounded-xl
        hover:bg-gray-50 dark:hover:bg-gray-700
        transition-colors duration-200
        cursor-pointer
      ">
        {/* Date Badge */}
        <div className="
          flex-shrink-0
          w-16 h-16
          bg-gradient-to-br from-blue-500 to-purple-600
          rounded-xl
          flex flex-col items-center justify-center
          text-white
          font-bold
        ">
          <span className="text-2xl">{event.day}</span>
          <span className="text-xs">{event.month}</span>
        </div>
        
        {/* Event Info */}
        <div className="flex-1">
          <h3 className="font-bold mb-1">{event.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {event.time} · {event.location}
          </p>
        </div>
        
        {/* Attendees */}
        <div className="flex -space-x-2">
          {event.attendees.slice(0, 3).map(attendee => (
            <img 
              src={attendee.avatar}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          ))}
          {event.attendees.length > 3 && (
            <div className="
              w-8 h-8 rounded-full
              bg-gray-200 dark:bg-gray-600
              border-2 border-white
              flex items-center justify-center
              text-xs font-bold
            ">
              +{event.attendees.length - 3}
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 💡 نکات مهم:

1. **Performance**: همیشه از `transition-*` استفاده کن تا انیمیشن‌ها smooth باشن
2. **Dark Mode**: همه کامپوننت‌ها رو با `dark:` prefix برای حالت شب آماده کن
3. **RTL**: برای فارسی از `ms-*` و `me-*` به جای `ml-*` و `mr-*` استفاده کن
4. **Mobile First**: اول برای موبایل طراحی کن، بعد breakpoint ها رو اضافه کن
5. **Accessibility**: همیشه `aria-label` و `alt` رو فراموش نکن

---

می‌خوای کدوم بخش سایت رو با این استایل‌های Tailwind بازسازی کنیم؟ 🚀
