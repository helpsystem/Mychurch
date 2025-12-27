import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { X, BookOpen, Hand } from 'lucide-react';
import { getRandomImage } from '../lib/theme';
import HTMLFlipBook from 'react-pageflip';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import { INITIAL_BIBLE_CONTENT, INITIAL_BIBLE_BOOKS } from '../lib/bibleData';

interface Verse {
    verse: {
        details: {
            text: string;
            reference: string;
        };
    };
}

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
    const [verseEn, setVerseEn] = useState<Verse | null>(null);
    const [verseFa, setVerseFa] = useState<Verse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookImage, setBookImage] = useState<string>('');
    const [dateEn, setDateEn] = useState<string>('');
    const [dateFa, setDateFa] = useState<string>('');
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchVerse = async () => {
            try {
                setLoading(true);

                // Get random verse from local data
                const bookKeys = Object.keys(INITIAL_BIBLE_CONTENT);
                if (bookKeys.length > 0) {
                    const randomBookKey = bookKeys[Math.floor(Math.random() * bookKeys.length)];
                    const bookContent = INITIAL_BIBLE_CONTENT[randomBookKey];
                    const chapterKeys = Object.keys(bookContent);

                    if (chapterKeys.length > 0) {
                        const randomChapterKey = chapterKeys[Math.floor(Math.random() * chapterKeys.length)];
                        const chapterContent = bookContent[randomChapterKey];

                        const versesEnList = chapterContent.en;
                        const versesFaList = chapterContent.fa;

                        if (versesEnList && versesFaList && versesEnList.length > 0) {
                            const maxIndex = Math.min(versesEnList.length, versesFaList.length);
                            const randomVerseIndex = Math.floor(Math.random() * maxIndex);

                            const bookInfo = INITIAL_BIBLE_BOOKS.find(b => b.key === randomBookKey);
                            const bookNameEn = bookInfo?.name.en || randomBookKey;
                            const bookNameFa = bookInfo?.name.fa || randomBookKey;

                            setVerseEn({
                                verse: {
                                    details: {
                                        text: versesEnList[randomVerseIndex],
                                        reference: `${bookNameEn} ${randomChapterKey}:${randomVerseIndex + 1}`
                                    }
                                }
                            });

                            setVerseFa({
                                verse: {
                                    details: {
                                        text: versesFaList[randomVerseIndex],
                                        reference: `${bookNameFa} ${randomChapterKey}:${randomVerseIndex + 1}`
                                    }
                                }
                            });
                        } else {
                            throw new Error("No verses found");
                        }
                    } else {
                        throw new Error("No chapters found");
                    }
                } else {
                    throw new Error("No books found");
                }

            } catch (err) {
                console.error("Error fetching verse:", err);
                // Fallback if something goes wrong
                setVerseFa({
                    verse: {
                        details: {
                            text: 'زیرا خدا جهان را اینقدر محبت نمود که پسر یگانه خود را داد تا هر که بر او ایمان آورد هلاک نگردد بلکه حیات جاودانی یابد.',
                            reference: 'یوحنا ۳:۱۶'
                        }
                    }
                });
                setVerseEn({
                    verse: {
                        details: {
                            text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
                            reference: 'John 3:16'
                        }
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchVerse();
        setBookImage(getRandomImage());

        const now = new Date();
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setDateEn(now.toLocaleDateString('en-US', options));
        setDateFa(now.toLocaleDateString('fa-IR', options));

    }, []);

    const PageTurnHint = () => (
        <div className="flex items-center gap-2 text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm animate-pulse">
            <Hand size={16} />
            <span className="text-xs">{t('dragToFlip')}</span>
        </div>
    );

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] p-4 transition-opacity duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verse-title"
            style={{ touchAction: 'auto' }}
            onClick={(e) => {
                // Close modal when clicking on backdrop (not on content)
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="relative transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                {verseEn && verseFa && !loading && !error && bookImage ? (
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
                            usePortrait={isMobile}
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
                            onChangeOrientation={() => { }}
                            onChangeState={() => { }}
                            onInit={() => { }}
                        >
                            <PageCover>
                                <div className="flex flex-col justify-around items-center h-full text-center">
                                    <BookOpen size={64} className="text-white/50" />
                                    <div>
                                        <h2 className="text-4xl font-bold" id="verse-title">{t('verseForToday')}</h2>
                                        <div className="mt-4 space-y-2">
                                            <p className="text-sm text-dimWhite" dir="ltr">{dateEn}</p>
                                            <p className="text-sm text-dimWhite font-farsi" dir="rtl">{dateFa}</p>
                                        </div>
                                    </div>
                                    <LatinCrossIcon size={120} className="text-yellow-400" />
                                </div>
                            </PageCover>

                            <Page number={2} style={{ backgroundImage: `linear-gradient(rgba(13, 17, 28, 0.85), rgba(13, 17, 28, 0.85)), url(${bookImage})` }}>
                                <div className="h-full flex flex-col justify-center p-6">
                                    <h3 className="text-2xl font-bold text-gradient mb-6 text-center" dir="ltr">{verseEn.verse.details.reference}</h3>
                                    <p className="text-xl text-white leading-relaxed text-center font-serif italic" dir="ltr">"{verseEn.verse.details.text}"</p>
                                </div>
                            </Page>

                            <Page number={3} style={{ backgroundImage: `linear-gradient(rgba(13, 17, 28, 0.85), rgba(13, 17, 28, 0.85)), url(${bookImage})` }}>
                                <div className="h-full flex flex-col justify-center p-6">
                                    <h3 className="text-2xl font-bold text-gradient mb-6 text-center" dir="rtl">{verseFa.verse.details.reference}</h3>
                                    <p className="text-xl text-white leading-relaxed text-center font-farsi" dir="rtl">«{verseFa.verse.details.text}»</p>
                                </div>
                            </Page>

                            <PageCover isBackCover={true}>
                                <div className="flex flex-col justify-center items-center h-full text-center">
                                    <img src={content.settings.logoUrl} alt="Church Logo" className="w-20 h-20 mb-4" />

                                    {content.settings.verseOfTheDayAttribution?.[lang as 'en' | 'fa'] && (
                                        <div className="mb-4 px-4 border-t border-b border-gray-700 py-3">
                                            <p className="whitespace-pre-wrap text-sm text-dimWhite">
                                                {content.settings.verseOfTheDayAttribution[lang as 'en' | 'fa']}
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
                    <div style={{ width: 350, height: 500 }} className="flex justify-center items-center bg-black-gradient rounded-lg border border-gray-700">
                        {loading ? <Spinner size="12" /> : <p className="text-red-500">{error}</p>}
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