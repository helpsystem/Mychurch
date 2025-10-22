# Auto Contrast System

## Overview
این سیستم به صورت خودکار تضاد رنگ متن را با پس‌زمینه تشخیص داده و بهترین رنگ متن را برای خوانایی حداکثر اعمال می‌کند.

## Features
✅ تشخیص خودکار رنگ پس‌زمینه  
✅ محاسبه تضاد بر اساس استاندارد WCAG 2.1  
✅ پشتیبانی از Level AA (4.5:1) و AAA (7:1)  
✅ سازگاری با تم‌های تیره و روشن  
✅ به‌روزرسانی خودکار هنگام تغییر DOM  
✅ پشتیبانی از حالت High Contrast  
✅ بهینه‌سازی عملکرد با Debouncing  

## How It Works

### 1. Hook: useContrastColor
```typescript
import { useContrastColor } from './hooks/useContrastColor';

function MyComponent() {
  const ref = useRef<HTMLDivElement>(null);
  const textColor = useContrastColor(ref);
  
  return <div ref={ref} style={{ color: textColor }}>متن با تضاد بالا</div>;
}
```

### 2. Component: AutoContrast
این کامپوننت به صورت خودکار در کل سایت اعمال می‌شود:
```typescript
import AutoContrast from './components/AutoContrast';

<AutoContrast />
```

### 3. CSS Variables
```css
:root {
  --text-on-light: #1a1a1a;  /* متن روی پس‌زمینه روشن */
  --text-on-dark: #ffffff;    /* متن روی پس‌زمینه تیره */
  --bg-contrast-light: rgba(255, 255, 255, 0.95);
  --bg-contrast-dark: rgba(0, 0, 0, 0.85);
}
```

## WCAG Compliance

### Contrast Ratios
- **Level AA**: 4.5:1 برای متن عادی  
- **Level AAA**: 7:1 برای متن عادی  
- **Large Text**: 3:1 (بالای 18pt یا 14pt bold)  

### Formula
```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
```
که L1 و L2 مقادیر luminance نسبی رنگ‌های روشن‌تر و تیره‌تر هستند.

## Usage Examples

### Example 1: Manual Color Selection
```typescript
import { getContrastColor } from './hooks/useContrastColor';

const bgColor = '#3498db';
const textColor = getContrastColor(bgColor); // Returns '#ffffff'
```

### Example 2: Accessible Color with Minimum Contrast
```typescript
import { getAccessibleColor } from './hooks/useContrastColor';

const bgColor = '#ffffff';
const preferredColor = '#cccccc';
const textColor = getAccessibleColor(bgColor, preferredColor, 4.5);
// Returns a color with at least 4.5:1 contrast
```

### Example 3: CSS Class
```html
<div class="auto-contrast">
  این متن به صورت خودکار رنگ مناسب را دریافت می‌کند
</div>
```

## Browser Support
✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  

## Performance
- استفاده از `MutationObserver` برای تشخیص تغییرات DOM  
- Debouncing با تاخیر 100ms  
- فقط المان‌های با محتوای متنی پردازش می‌شوند  
- کش کردن محاسبات برای المان‌های تکراری  

## Accessibility Features
- پشتیبانی از `prefers-contrast: high`  
- پشتیبانی از `prefers-reduced-motion`  
- Focus indicators با تضاد بالا  
- ARIA attributes محفوظ می‌مانند  

## Testing
برای تست تضاد رنگ‌ها:
```bash
npm run test:contrast
```

## Configuration
می‌توانید minimum contrast ratio را تغییر دهید:
```typescript
// در useContrastColor.ts
const MIN_CONTRAST_AA = 4.5;
const MIN_CONTRAST_AAA = 7.0;
```

## Known Issues
- رنگ‌های gradient ممکن است دقیق محاسبه نشوند  
- المان‌های position: fixed ممکن است تاخیر داشته باشند  
- تصاویر background-image در نظر گرفته نمی‌شوند  

## Future Improvements
- [ ] پشتیبانی از gradient backgrounds  
- [ ] تشخیص تصاویر پس‌زمینه با Computer Vision  
- [ ] کش کردن هوشمندتر محاسبات  
- [ ] Web Worker برای محاسبات سنگین  
- [ ] پشتیبانی از color schemes دلخواه  

## License
MIT

## Author
Created for Iran Church DC Website
