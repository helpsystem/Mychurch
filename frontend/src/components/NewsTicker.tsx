import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

interface NewsItem {
  id: number;
  text: { en: string; fa: string };
  link?: string;
}

// Temporary mock data. In a real app this would come from useContent() or an API.
const MOCK_NEWS: NewsItem[] = [
  { id: 1, text: { en: 'Welcome to the new Iranian Church DC Platform.', fa: 'به پلتفرم جدید کلیسای ایرانیان دی‌سی خوش آمدید.' } },
  { id: 2, text: { en: 'Join us for Sunday Worship at 10:30 AM.', fa: 'برای جلسه پرستشی یکشنبه ساعت ۱۰:۳۰ صبح به ما بپیوندید.' }, link: '/live' },
  { id: 3, text: { en: 'Our new AI Assistant is now live!', fa: 'دستیار هوشمند هوش مصنوعی ما اکنون در دسترس است!' }, link: '/ai-helper' },
];

const NewsTicker: React.FC = () => {
  const { lang, t } = useLanguage();
  const isRtl = lang === 'fa';

  if (!MOCK_NEWS || MOCK_NEWS.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm py-1.5 overflow-hidden flex items-center relative border-b border-indigo-500/30 shadow-md">
      <div className="container mx-auto flex items-center px-4 relative z-10">
        
        {/* News Badge */}
        <div className={`flex items-center gap-1.5 font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-xs shadow-sm backdrop-blur-sm whitespace-nowrap z-20 ${isRtl ? 'ml-4' : 'mr-4'}`}>
          <Sparkles className="w-3 h-3 text-yellow-300" />
          {lang === 'fa' ? 'تازه‌ها' : 'Latest News'}
        </div>

        {/* Scrolling text container */}
        <div className="flex-1 overflow-hidden relative h-6 mx-2 mask-edges">
            <div className={`flex items-center absolute whitespace-nowrap ${isRtl ? 'animate-marquee-rtl' : 'animate-marquee-ltr'} hover:pause-animation`}>
                {/* Duplicate the items to make the loop seamless */}
                {[...MOCK_NEWS, ...MOCK_NEWS, ...MOCK_NEWS].map((news, index) => (
                    <div key={`${news.id}-${index}`} className="flex items-center mx-8 group">
                        <span className="opacity-90 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {news.text[lang]}
                        </span>
                        {news.link && (
                            <a href={news.link} className="ml-2 rtl:mr-2 rtl:ml-0 inline-flex items-center text-yellow-300 hover:text-yellow-100 underline decoration-yellow-500/50 hover:decoration-yellow-100 transition-colors">
                                {lang === 'fa' ? 'بیشتر بخوانید' : 'Read more'}
                                {isRtl ? <ArrowLeft className="w-3 h-3 mr-1" /> : <ArrowRight className="w-3 h-3 ml-1" />}
                            </a>
                        )}
                        <span className="mx-8 text-white/30">•</span>
                    </div>
                ))}
            </div>
        </div>

      </div>

      <style>{`
        .mask-edges {
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
        @keyframes marquee-ltr {
            0% { transform: translateX(10%); }
            100% { transform: translateX(-100%); }
        }
        @keyframes marquee-rtl {
            0% { transform: translateX(-10%); }
            100% { transform: translateX(100%); }
        }
        .animate-marquee-ltr {
            animation: marquee-ltr 45s linear infinite;
        }
        .animate-marquee-rtl {
            animation: marquee-rtl 45s linear infinite;
            /* In RTL, the text naturally flows right-to-left, so we tweak the transform direction */
        }
        .pause-animation {
            animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;
