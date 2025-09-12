


import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Language } from '../types';
import { X, BookOpen, ChevronLeft, ChevronRight, RotateCcw, Hand } from 'lucide-react';
import { getRandomImage } from '../lib/theme';
import HTMLFlipBook from 'react-pageflip';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent';

const CURATED_VERSES = [
    {
        en: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
        fa: "زیرا خدا جهانیان را آن‌قدر محبت کرد که پسر یگانه خود را داد تا هر که به او ایمان آورد، هلاک نگردد، بلکه حیات جاودان یابد.",
        reference: { en: "John 3:16", fa: "یوحنا ۳:۱۶" }
    },
    {
        en: "The Lord is my shepherd, I shall not be in want. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
        fa: "خداوند شبان من است، محتاج به هیچ چیز نخواهم بود. او مرا در مراتع سرسبز می‌خواباند و نزد آبهای آرام رهبری می‌کند و جانم را تازه می‌سازد.",
        reference: { en: "Psalm 23:1-3", fa: "مزمور ۲۳:۱-۳" }
    },
    {
        en: "I can do all this through him who gives me strength.",
        fa: "قادرم همه کارها را از طریق او که به من قوت می‌بخشد، انجام دهم.",
        reference: { en: "Philippians 4:13", fa: "فیلیپیان ۴:۱۳" }
    },
    {
        en: "For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.",
        fa: "خداوند می‌گوید: «زیرا من فکرهایی را که برای شما دارم می‌دانم، فکرهایی برای سلامتی و نه برای بدی، تا به شما امید و آینده‌ای ببخشم.»",
        reference: { en: "Jeremiah 29:11", fa: "ارمیا ۲۹:۱۱" }
    },
    {
        en: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
        fa: "با تمام دل خود بر خداوند توکل کن و بر فهم خود تکیه منما؛ در همه راه‌های خود او را بشناس، و او مسیرهایت را راست خواهد گردانید.",
        reference: { en: "Proverbs 3:5-6", fa: "امثال ۳:۵-۶" }
    }
];

const LatinCrossIcon: React.FC<{ className?: string, size?: number }> = ({ className, size = 24 }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 5v14" />
        <path d="M7 9h10" />
    </svg>
);

const Page = React.forwardRef<HTMLDivElement, { children: React.ReactNode, number?: number, className?: string, style?: React.CSSProperties }>((props, ref) => {
    return (
        <div className={`page ${props.className || ''}`} ref={ref} style={props.style}>
            <div className="page-content">{props.children}</div>
            {props.number && <div className="page-footer">{props.number}</div>}
        </div>
    );
});

const PageCover = React.forwardRef<HTMLDivElement, { children: React.ReactNode, isBackCover?: boolean }>((props, ref) => {
    return (
        <div className={`page page--cover ${props.isBackCover ? 'page--cover-back' : ''}`} ref={ref}>
            <div className="page-content">{props.children}</div>
        </div>
    );
});

const VerseOfTheDayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t, lang } = useLanguage();
    const { content } = useContent();
    const [verse, setVerse] = useState<(typeof CURATED_VERSES)[0] | null>(null);
    const [bookImage, setBookImage] = useState('');
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        setVerse(CURATED_VERSES[Math.floor(Math.random() * CURATED_VERSES.length)]);
        setBookImage(getRandomImage());
        
        const now = new Date();
        const optionsDate: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        // Use 'en-US' locale to ensure Gregorian calendar date format.
        const formattedDate = now.toLocaleDateString('en-US', optionsDate);
        const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setCurrentDateTime(`${formattedDate} | ${formattedTime}`);

    }, []);
    
    const PageTurnHint = () => (
      <div className="page-turn-hint-container flex items-center justify-center">
          <div className="bg-black/80 p-4 rounded-full animate-bounce border border-white/20">
              <span className="text-4xl cursor-pointer">👉</span>
          </div>
      </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] p-4 transition-opacity duration-300" 
            role="dialog" 
            aria-modal="true"
            aria-labelledby="verse-title"
        >
            <div className="relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                {verse && bookImage ? (
                    <>
                        <HTMLFlipBook
                            width={350}
                            height={500}
                            showCover={true}
                            className="flip-book"
                            style={{}}
                            startPage={0}
                            size="stretch"
                            minWidth={315}
                            maxWidth={1000}
                            minHeight={400}
                            maxHeight={1500}
                            drawShadow={true}
                            flippingTime={1000}
                            usePortrait={true}
                            startZIndex={0}
                            autoSize={true}
                            maxShadowOpacity={0.5}
                            mobileScrollSupport={true}
                            clickEventForward={true}
                            useMouseEvents={true}
                            swipeDistance={3}
                            showPageCorners={true}
                            disableFlipByClick={false}
                            onFlip={() => setHasInteracted(true)}
                            onChangeOrientation={() => {}}
                            onChangeState={() => {}}
                            onInit={() => {}}
                        >
                            <PageCover>
                                <div className="flex flex-col justify-around items-center h-full text-center">
                                    <BookOpen size={64} className="text-white/50" />
                                    <div>
                                        <h2 className="text-4xl font-bold" id="verse-title">{t('verseForToday')}</h2>
                                        <p className="text-sm text-dimWhite mt-2" dir="ltr">{currentDateTime}</p>
                                    </div>
                                    <LatinCrossIcon size={120} className="text-yellow-400" />
                                </div>
                            </PageCover>
                            
                            <Page number={2} style={{backgroundImage: `linear-gradient(rgba(13, 17, 28, 0.85), rgba(13, 17, 28, 0.85)), url(${bookImage})`}}>
                                <h3 className="text-2xl font-bold text-gradient mb-4 text-center" dir="ltr">{verse.reference.en}</h3>
                                <p className="text-xl text-white leading-relaxed">{verse.en}</p>
                            </Page>
                            
                            <Page number={3} style={{backgroundImage: `linear-gradient(rgba(13, 17, 28, 0.85), rgba(13, 17, 28, 0.85)), url(${bookImage})`}}>
                                <h3 className="text-2xl font-bold text-gradient mb-4 text-center" dir="ltr">{verse.reference.fa}</h3>
                                <p className="text-xl text-white leading-relaxed text-right" dir="rtl">{verse.fa}</p>
                            </Page>

                            <PageCover isBackCover={true}>
                                 <div className="flex flex-col justify-center items-center h-full text-center">
                                    <img src={content.settings.logoUrl} alt="Church Logo" className="w-20 h-20 mb-4" />
                                    
                                    {content.settings.verseOfTheDayAttribution?.[lang as 'en'|'fa'] && (
                                        <div className="mb-4 px-4 border-t border-b border-gray-700 py-3">
                                            <p className="whitespace-pre-wrap text-sm text-dimWhite">
                                                {content.settings.verseOfTheDayAttribution[lang as 'en'|'fa']}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-4 w-full px-8">
                                        <Link to="/" onClick={onClose} className="block w-full py-3 px-4 font-medium text-lg text-primary bg-blue-gradient rounded-[10px] outline-none hover:opacity-90 transition-opacity">
                                            {t('enterWebsite')}
                                        </Link>
                                        <button onClick={onClose} className="block w-full py-3 px-4 font-medium text-lg text-white bg-gray-600 hover:bg-gray-500 rounded-[10px] outline-none transition-colors">
                                            {t('close')}
                                        </button>
                                    </div>
                                </div>
                            </PageCover>
                        </HTMLFlipBook>
                        {!hasInteracted && (
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                                <PageTurnHint />
                            </div>
                        )}
                    </>
                ) : (
                     <div style={{width: 350, height: 500}} className="flex justify-center items-center bg-black-gradient rounded-lg border border-gray-700">
                        <Spinner size="12" />
                    </div>
                )}

                <button onClick={onClose} aria-label={t('close')} className="absolute -top-3 -right-3 sm:top-2 sm:right-2 p-2 bg-black/50 rounded-full text-gray-300 hover:text-white hover:bg-black/80 transition-colors z-10">
                    <X size={24} />
                </button>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    0% {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.3s forwards ease-out;
                }
                .flip-book { display: block; }
            `}</style>
        </div>
    );
};

export default VerseOfTheDayModal;