# WordPress AlHayat GPT Integration Guide

این راهنما برای ادغام ویجت Al Hayat GPT در سایت‌های WordPress نوشته شده است.

## روش 1: استفاده از Custom HTML Block (ساده‌ترین روش)

### مرحله 1: اضافه کردن Custom HTML Block
1. در ویرایشگر WordPress، یک بلاک "Custom HTML" به صفحه یا پست خود اضافه کنید
2. این بلاک را در محلی قرار دهید که می‌خواهید ویجت نمایش داده شود

### مرحله 2: کپی کردن کد HTML

#### نسخه تمام صفحه (پیشنهادی):
```html
<!-- Full-screen widget (recommended - covers entire viewport) -->
<div id="alhayat-gpt-widget" style="width: 100%; height: 100vh;"></div>

<script src="https://www.alhayatgpt.com/sdk.js" defer></script>
<script>
    window.addEventListener('AlHayatGPTSDKReady', () => {
        if (document.getElementById('alhayat-gpt-widget')) {
            AlHayatGPT.createWidget({
                containerId: 'alhayat-gpt-widget'
            });
        }
    });
</script>
```

#### نسخه سفارشی با ارتفاع مشخص:
```html
<!-- Full-width but custom height -->
<div id="alhayat-gpt-widget" style="width: 100%; height: 70vh; min-height: 500px;"></div>

<script src="https://www.alhayatgpt.com/sdk.js" defer></script>
<script>
    window.addEventListener('AlHayatGPTSDKReady', () => {
        if (document.getElementById('alhayat-gpt-widget')) {
            AlHayatGPT.createWidget({
                containerId: 'alhayat-gpt-widget'
            });
        }
    });
</script>
```

#### نسخه استایل سفارشی:
```html
<!-- Styled widget with custom appearance -->
<div id="alhayat-gpt-widget" style="width: 100%; max-width: 500px; height: 600px; margin: 0 auto;"></div>

<script src="https://www.alhayatgpt.com/sdk.js" defer></script>
<script>
    window.addEventListener('AlHayatGPTSDKReady', () => {
        if (document.getElementById('alhayat-gpt-widget')) {
            AlHayatGPT.createWidget({
                containerId: 'alhayat-gpt-widget',
                style: {
                    borderRadius: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    border: '2px solid #e0e0e0'
                }
            });
        }
    });
</script>
```

## روش 2: اضافه کردن به theme (برای کاربران پیشرفته)

### مرحله 1: ویرایش functions.php
کد زیر را به فایل `functions.php` تم خود اضافه کنید:

```php
<?php
// Add AlHayat GPT SDK
function add_alhayat_gpt_sdk() {
    wp_enqueue_script(
        'alhayat-gpt-sdk', 
        'https://www.alhayatgpt.com/sdk.js', 
        array(), 
        '1.0', 
        true
    );
}
add_action('wp_enqueue_scripts', 'add_alhayat_gpt_sdk');

// Add AlHayat GPT shortcode
function alhayat_gpt_shortcode($atts) {
    $atts = shortcode_atts(array(
        'width' => '100%',
        'height' => '600px',
        'container_id' => 'alhayat-gpt-' . uniqid(),
        'style' => 'default'
    ), $atts);
    
    $styles = '';
    switch ($atts['style']) {
        case 'fullscreen':
            $styles = 'width: 100%; height: 100vh;';
            break;
        case 'compact':
            $styles = 'width: 400px; height: 600px; margin: 0 auto;';
            break;
        case 'mobile':
            $styles = 'width: 320px; height: 480px; margin: 0 auto;';
            break;
        default:
            $styles = "width: {$atts['width']}; height: {$atts['height']};";
    }
    
    ob_start();
    ?>
    <div id="<?php echo esc_attr($atts['container_id']); ?>" style="<?php echo esc_attr($styles); ?>"></div>
    
    <script>
    (function() {
        function initAlHayatWidget() {
            if (window.AlHayatGPT && document.getElementById('<?php echo esc_js($atts['container_id']); ?>')) {
                AlHayatGPT.createWidget({
                    containerId: '<?php echo esc_js($atts['container_id']); ?>'
                });
            }
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                window.addEventListener('AlHayatGPTSDKReady', initAlHayatWidget);
                if (window.AlHayatGPT) initAlHayatWidget();
            });
        } else {
            window.addEventListener('AlHayatGPTSDKReady', initAlHayatWidget);
            if (window.AlHayatGPT) initAlHayatWidget();
        }
    })();
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('alhayat_gpt', 'alhayat_gpt_shortcode');
?>
```

### مرحله 2: استفاده از Shortcode
حالا می‌توانید از shortcode در هر جای WordPress استفاده کنید:

#### تمام صفحه:
```
[alhayat_gpt style="fullscreen"]
```

#### اندازه سفارشی:
```
[alhayat_gpt width="500px" height="700px"]
```

#### فشرده:
```
[alhayat_gpt style="compact"]
```

#### موبایل:
```
[alhayat_gpt style="mobile"]
```

## روش 3: استفاده در Elementor

اگر از Elementor استفاده می‌کنید:

1. یک ویجت "HTML" اضافه کنید
2. کد HTML بالا را در آن کپی کنید
3. تنظیمات ارتفاع و عرض را در Elementor انجام دهید

## روش 4: استفاده در Gutenberg

1. بلاک "Custom HTML" را اضافه کنید
2. کد مربوطه را کپی کنید
3. استایل‌های اضافی را از طریق Additional CSS اضافه کنید

## نکات مهم

### 🚀 بهینه‌سازی عملکرد:
- SDK با `defer` لود می‌شود تا سرعت صفحه را متأثر نکند
- ویجت تنها زمانی initialize می‌شود که SDK آماده باشد

### 🎨 سفارشی‌سازی استایل:
```css
/* اضافه کنید به Additional CSS در WordPress */
#alhayat-gpt-widget {
    border-radius: 15px !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
    border: 2px solid #e0e0e0 !important;
}
```

### 📱 Responsive Design:
```css
/* Responsive styles for mobile */
@media (max-width: 768px) {
    #alhayat-gpt-widget {
        width: 100% !important;
        height: 70vh !important;
        min-height: 500px !important;
    }
}
```

### 🔧 عیب‌یابی:
اگر ویجت نمایش داده نمی‌شود:

1. Console browser را چک کنید (F12)
2. مطمئن شوید که SDK درست لود شده است
3. ID container یکتا باشد
4. از cache browser پاک کنید

## مثال‌های کاربردی

### صفحه مخصوص Chat:
یک صفحه جدید ایجاد کنید و کد تمام صفحه را اضافه کنید.

### Sidebar Widget:
در ویجت‌های WordPress، Custom HTML اضافه کنید با اندازه مناسب.

### صفحه About با Chat:
ترکیب محتوای معمولی با ویجت در انتهای صفحه.

---

این راهنما همه چیزهایی که برای ادغام Al Hayat GPT در WordPress نیاز دارید را شامل می‌شود. برای سوالات بیشتر، با تیم پشتیبانی تماس بگیرید.