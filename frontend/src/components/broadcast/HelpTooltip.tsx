/**
 * 🔮 Help Tooltip Component
 * کامپوننت راهنمایی دوزبانه با آیکون ❓
 */

import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
    textFa: string;
    textEn: string;
    lang: 'fa' | 'en';
    position?: 'top' | 'bottom' | 'left' | 'right';
    size?: 'sm' | 'md' | 'lg';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
    textFa,
    textEn,
    lang,
    position = 'top',
    size = 'md'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const text = lang === 'fa' ? textFa : textEn;
    const isRTL = lang === 'fa';

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                className="text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none"
                title={lang === 'fa' ? 'راهنمایی' : 'Help'}
                aria-label={lang === 'fa' ? 'راهنمایی' : 'Help'}
            >
                <HelpCircle className={sizeClasses[size]} />
            </button>

            {isVisible && (
                <div
                    className={`absolute z-50 ${positionClasses[position]}`}
                    dir={isRTL ? 'rtl' : 'ltr'}
                >
                    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px]">
                        <div className="flex items-start gap-2">
                            <p className={`text-sm text-slate-200 leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                {text}
                            </p>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-slate-500 hover:text-white flex-shrink-0"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {/* Arrow */}
                    <div className={`absolute w-2 h-2 bg-slate-900 border-slate-700 rotate-45 ${position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-b border-r' :
                            position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-l' :
                                position === 'left' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-t border-r' :
                                    'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-b border-l'
                        }`} />
                </div>
            )}
        </div>
    );
};

// راهنمایی‌های از پیش تعریف شده
export const HELP_TEXTS = {
    layout: {
        fa: 'انتخاب نحوه نمایش تصویر: تمام صفحه، تصویر در تصویر، تقسیم یا فقط اسلاید',
        en: 'Choose display mode: Full camera, Picture-in-Picture, Split view, or Slides only'
    },
    videoShape: {
        fa: 'تنظیم شکل تصویر رهبر: مستطیل، مربع یا دایره',
        en: 'Set leader video shape: Rectangle, Square, or Circle'
    },
    logo: {
        fa: 'آپلود لوگوی کلیسا برای نمایش در گوشه صفحه',
        en: 'Upload church logo to display in screen corner'
    },
    lowerThird: {
        fa: 'افزودن اطلاعات افراد (نام و سمت) برای نمایش در پایین صفحه',
        en: 'Add person info (name and role) to show at bottom of screen'
    },
    prayerWall: {
        fa: 'نمایش درخواست‌های دعا به صورت متن متحرک در پایین صفحه',
        en: 'Show prayer requests as scrolling text at bottom of screen'
    },
    donations: {
        fa: 'نمایش QR کد و لینک‌های پرداخت هدایا',
        en: 'Display donation QR codes and payment links'
    },
    sync: {
        fa: 'همگام‌سازی اسلایدها با دستگاه‌های دیگر. فقط رهبر می‌تواند اسلاید را تغییر دهد.',
        en: 'Sync slides with other devices. Only the leader can change slides.'
    },
    recording: {
        fa: 'ضبط ویدیوی جلسه و ذخیره در فضای ابری',
        en: 'Record session video and save to cloud storage'
    },
    scripture: {
        fa: 'کتاب، باب و آیات مورد نظر را انتخاب کنید. می‌توانید متن انگلیسی را نیز نمایش دهید.',
        en: 'Select book, chapter and verses. You can also show English text.'
    },
    lyrics: {
        fa: 'انتخاب سرود از کتابخانه. سرودهای دارای علامت 🎤 قابلیت کاراکه دارند.',
        en: 'Select song from library. Songs with 🎤 icon have karaoke support.'
    }
};

export default HelpTooltip;
