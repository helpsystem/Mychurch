/**
 * 🎨 AI-Powered Image Slider with Professional Church Photos
 * اسلایدر حرفه‌ای با تصاویر کلیسا
 * 
 * Features:
 * - استفاده از تصاویر واقعی کلیسا
 * - Autoplay با fade transition
 * - نمایش آیات کتاب مقدس روی تصویر
 * - Responsive و mobile-friendly
 * - Lazy loading برای بهینه‌سازی
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChurchImage {
  id: number;
  title: { fa: string; en: string };
  verse: { fa: string; en: string };
  reference: { fa: string; en: string };
}

// تصاویر کلیسا با آیات مرتبط
const CHURCH_IMAGES: ChurchImage[] = [
  {
    id: 1,
    title: {
      fa: 'محل پرستش',
      en: 'Place of Worship',
    },
    verse: {
      fa: 'زیرا جایی که دو یا سه نفر به نام من جمع شوند، من در میان ایشان هستم.',
      en: 'For where two or three gather in my name, there am I with them.',
    },
    reference: {
      fa: 'متی 18:20',
      en: 'Matthew 18:20',
    },
  },
  {
    id: 2,
    title: {
      fa: 'نور الهی',
      en: 'Divine Light',
    },
    verse: {
      fa: 'من نور جهان هستم. کسی که از من پیروی کند، هرگز در تاریکی راه نخواهد رفت.',
      en: 'I am the light of the world. Whoever follows me will never walk in darkness.',
    },
    reference: {
      fa: 'یوحنا 8:12',
      en: 'John 8:12',
    },
  },
  {
    id: 3,
    title: {
      fa: 'خانه دعا',
      en: 'House of Prayer',
    },
    verse: {
      fa: 'خانه من خانه دعا خوانده خواهد شد برای همه قومها.',
      en: 'My house will be called a house of prayer for all nations.',
    },
    reference: {
      fa: 'اشعیا 56:7',
      en: 'Isaiah 56:7',
    },
  },
  {
    id: 4,
    title: {
      fa: 'صلیب نجات',
      en: 'Cross of Salvation',
    },
    verse: {
      fa: 'زیرا خدا جهان را چنان محبت نمود که پسر یگانه خود را بخشید.',
      en: 'For God so loved the world that he gave his one and only Son.',
    },
    reference: {
      fa: 'یوحنا 3:16',
      en: 'John 3:16',
    },
  },
  {
    id: 5,
    title: {
      fa: 'پرستش و ستایش',
      en: 'Worship and Praise',
    },
    verse: {
      fa: 'با سرودهای شکرگزاری به درگاه او داخل شوید و با ستایش به خانه او وارد گردید.',
      en: 'Enter his gates with thanksgiving and his courts with praise.',
    },
    reference: {
      fa: 'مزامیر 100:4',
      en: 'Psalm 100:4',
    },
  },
  {
    id: 6,
    title: {
      fa: 'نمای کلیسا',
      en: 'Church View',
    },
    verse: {
      fa: 'من نیز می‌گویم که تو پطرس هستی و بر این صخره کلیسای خود را بنا خواهم کرد.',
      en: 'I will build my church, and the gates of Hades will not overcome it.',
    },
    reference: {
      fa: 'متی 16:18',
      en: 'Matthew 16:18',
    },
  },
];

interface AIImageSliderProps {
  autoPlayInterval?: number; // milliseconds
  showNavigationButtons?: boolean;
  showIndicators?: boolean;
  className?: string;
}

const AIImageSlider: React.FC<AIImageSliderProps> = ({
  autoPlayInterval = 5000,
  showNavigationButtons = true,
  showIndicators = true,
  className = '',
}) => {
  const { lang } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [currentIndex, autoPlayInterval]);

  // Preload adjacent images
  useEffect(() => {
    const imagesToLoad = [
      currentIndex,
      (currentIndex + 1) % CHURCH_IMAGES.length,
      (currentIndex - 1 + CHURCH_IMAGES.length) % CHURCH_IMAGES.length,
    ];

    imagesToLoad.forEach((index) => {
      if (!loadedImages.has(index)) {
        const img = new Image();
        img.src = `/church-photos/photo${CHURCH_IMAGES[index].id}.jpg`;
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, index]));
        };
      }
    });
  }, [currentIndex]);

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % CHURCH_IMAGES.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + CHURCH_IMAGES.length) % CHURCH_IMAGES.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const currentImage = CHURCH_IMAGES[currentIndex];

  return (
    <div
      className={`relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden rounded-lg shadow-2xl ${className}`}
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
    >
      {/* Background Images */}
      {CHURCH_IMAGES.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ pointerEvents: index === currentIndex ? 'auto' : 'none' }}
        >
          <img
            src={`/church-photos/photo${image.id}.jpg`}
            alt={image.title[lang]}
            className="w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
          
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
      ))}

      {/* Text Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
        <div
          className={`max-w-4xl transition-all duration-700 ${
            isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Title */}
          <h2
            className={`text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 ${
              lang === 'fa' ? 'font-persian text-right' : 'text-left'
            }`}
          >
            {currentImage.title[lang]}
          </h2>

          {/* Verse */}
          <p
            className={`text-lg md:text-xl lg:text-2xl text-gray-100 mb-3 leading-relaxed ${
              lang === 'fa' ? 'font-persian text-right' : 'text-left'
            }`}
          >
            "{currentImage.verse[lang]}"
          </p>

          {/* Reference */}
          <p
            className={`text-sm md:text-base lg:text-lg text-cyan-300 font-semibold ${
              lang === 'fa' ? 'font-persian text-right' : 'text-left'
            }`}
          >
            {currentImage.reference[lang]}
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      {showNavigationButtons && (
        <>
          <button
            onClick={goToPrevious}
            disabled={isTransitioning}
            className={`absolute top-1/2 -translate-y-1/2 ${
              lang === 'fa' ? 'right-4' : 'left-4'
            } z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={lang === 'fa' ? 'تصویر قبلی' : 'Previous image'}
          >
            {lang === 'fa' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>

          <button
            onClick={goToNext}
            disabled={isTransitioning}
            className={`absolute top-1/2 -translate-y-1/2 ${
              lang === 'fa' ? 'left-4' : 'right-4'
            } z-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={lang === 'fa' ? 'تصویر بعدی' : 'Next image'}
          >
            {lang === 'fa' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {CHURCH_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`w-2 h-2 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`${lang === 'fa' ? 'برو به تصویر' : 'Go to slide'} ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Loading indicator for current image */}
      {!loadedImages.has(currentIndex) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent" />
        </div>
      )}
    </div>
  );
};

export default AIImageSlider;
