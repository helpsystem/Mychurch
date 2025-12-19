
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { TimedWord } from '../types';
import { secureGeminiService } from '../services/secureGeminiService';
import Spinner from '../components/Spinner';

interface PresentationContent {
    verses: { en: string[], fa: string[] };
    reference: { en: string, fa: string };
    timedWords: TimedWord[];
    audioSrc: string | null;
    settings: { audio: boolean, highlight: boolean };
}

const PresentationPage: React.FC = () => {
    const { t } = useLanguage();
    const [content, setContent] = useState<PresentationContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const channel = new BroadcastChannel('bible_presentation');
    
        const handleMessage = async (event: MessageEvent) => {
            // Clear previous state
            setContent(null);
            setCurrentWordIndex(-1);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }

            const { type, book, chapter, verseNum, text, verses, startVerse, endVerse, settings } = event.data;
            
            if (type === 'PRESENT_SINGLE') {
                setContent({
                     reference: { en: `${book.en} ${chapter}:${verseNum}`, fa: `${book.fa} ${chapter}:${verseNum}` },
                     verses: { en: [text.en], fa: [text.fa] },
                     timedWords: [],
                     audioSrc: null,
                     settings: { audio: false, highlight: false },
                });
            } else if (type === 'PRESENT_RANGE') {
                setIsLoading(true);
                const reference = { 
                    en: `${book.en} ${chapter}:${startVerse}-${endVerse}`,
                    fa: `${book.fa} ${chapter}:${startVerse}-${endVerse}`
                };
                
                let audioSrc = null;
                let timedWords: TimedWord[] = [];

                if (settings.audio) {
                    const farsiTextToSpeak = verses.fa.join(' ');
                    try {
                        const ttsResponse = await secureGeminiService.textToSpeech(farsiTextToSpeak);
                        audioSrc = `data:audio/mpeg;base64,${ttsResponse.audioB64}`;
                        timedWords = ttsResponse.timedWords;
                    } catch (e) {
                        console.error("TTS generation failed", e);
                        // TODO: Display an error on the presentation screen
                    }
                }
                
                setContent({
                    verses,
                    reference,
                    timedWords,
                    audioSrc,
                    settings
                });
                setIsLoading(false);
            }
        };

        channel.addEventListener('message', handleMessage);

        return () => {
          channel.removeEventListener('message', handleMessage);
          channel.close();
        };
    }, []);
    
    useEffect(() => {
        const audio = audioRef.current;
        if (content?.audioSrc && audio) {
            audio.src = content.audioSrc;
            audio.play().catch(e => console.error("Audio playback failed:", e));
        }
    }, [content?.audioSrc]);
    
    const onTimeUpdate = () => {
        if (!audioRef.current || !content || !content.settings.highlight || content.timedWords.length === 0) return;

        const currentTime = audioRef.current.currentTime;
        // Find the index of the word that should be currently highlighted
        const wordIndex = content.timedWords.findIndex(word => currentTime >= word.startTime && currentTime < word.endTime);

        if (wordIndex !== -1 && wordIndex !== currentWordIndex) {
            setCurrentWordIndex(wordIndex);
        }
    };
    
    const renderFarsiText = () => {
        if (!content) return null;

        if (content.settings.highlight && content.timedWords.length > 0) {
            return (
                <p dir="rtl" lang="fa" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight font-bold font-vazir mb-12">
                    {content.timedWords.map((word, index) => (
                        <span key={index} className={index === currentWordIndex ? 'highlighted-word' : ''}>
                            {word.word}{' '}
                        </span>
                    ))}
                </p>
            );
        }
        
        return (
            <p dir="rtl" lang="fa" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-tight font-bold font-vazir mb-12">
                {content.verses.fa.join(' ')}
            </p>
        );
    };

    return (
        <div 
            dir="ltr"
            className="w-screen h-screen bg-primary text-white flex flex-col items-center justify-center p-8 transition-all duration-500 font-poppins"
        >
             <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={() => setCurrentWordIndex(-1)} />
             <div className="text-center w-full max-w-7xl flex-grow flex flex-col justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <Spinner size="12"/>
                        <p className="mt-4 text-2xl text-dimWhite">{t('generatingAudio')}</p>
                    </div>
                ) : content ? (
                    <>
                        {renderFarsiText()}
                        <p dir="ltr" lang="en" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight font-bold opacity-70">
                           {content.verses.en.join(' ')}
                        </p>
                        <div className="mt-16 text-center animate-fade-in-slow">
                            <p className="text-5xl font-vazir font-bold text-gradient">آمین</p>
                            <p className="text-4xl font-poppins font-bold text-gradient opacity-80 mt-2">Amen</p>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-6xl font-bold">{t('presentationMode')}</p>
                        <p className="mt-4 text-3xl text-dimWhite">{t('presentationReady')}</p>
                    </>
                )}
            </div>
            <div className="flex-shrink-0 flex justify-center items-center gap-x-12 mt-8 opacity-80" dir="ltr">
                {content && <p className="text-2xl sm:text-3xl md:text-4xl font-vazir">{content.reference.fa}</p>}
                {content && <p className="text-2xl sm:text-3xl md:text-4xl">{content.reference.en}</p>}
            </div>
        </div>
    );
};

export default PresentationPage;