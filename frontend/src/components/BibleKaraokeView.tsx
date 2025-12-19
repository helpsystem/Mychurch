import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Zap } from 'lucide-react';

interface BibleKaraokeViewProps {
    verses: { number: number; text: string; words: string[] }[];
    audioUrl: string;
    timingUrl: string;
    onPlayStateChange: (isPlaying: boolean) => void;
    lang: 'fa' | 'en';
}

interface TimingWord {
    word: string;
    start: number;
    end: number;
}

interface TimingData {
    words: TimingWord[];
}

const BibleKaraokeView: React.FC<BibleKaraokeViewProps> = ({
    verses,
    audioUrl,
    timingUrl,
    onPlayStateChange,
    lang
}) => {
    const [timingData, setTimingData] = useState<TimingData | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const [audioProgress, setAudioProgress] = useState(0);
    const [speed, setSpeed] = useState(1.0); // Default speed normal
    const [isLoadingTiming, setIsLoadingTiming] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const animationRef = useRef<number>();
    const containerRef = useRef<HTMLDivElement>(null);

    // Load timing data
    useEffect(() => {
        const loadTiming = async () => {
            setIsLoadingTiming(true);
            try {
                console.log('Fetching timing from:', timingUrl);
                const response = await fetch(timingUrl);
                if (response.ok) {
                    const data = await response.json();
                    setTimingData(data);
                    console.log('✅ Timing data loaded');
                } else {
                    console.log('⚠️ No timing data found, falling back to estimation');
                    setTimingData(null);
                }
            } catch (error) {
                console.error('Error loading timing:', error);
                setTimingData(null);
            } finally {
                setIsLoadingTiming(false);
            }
        };

        if (timingUrl) {
            loadTiming();
        }
    }, [timingUrl]);

    // Audio Sync Logic
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateHighlight = () => {
            if (!isPlaying) return;

            const currentTime = audio.currentTime;
            setAudioProgress((currentTime / audio.duration) * 100 || 0);

            if (timingData) {
                // Exact timing
                const index = timingData.words.findIndex(
                    w => currentTime >= w.start && currentTime <= w.end
                );

                if (index !== -1 && index !== currentWordIndex) {
                    setCurrentWordIndex(index);
                    scrollToWord(index);
                }
            } else {
                // Estimation fallback
                // Estimate based on average reading speed (approx 2 words/sec adjusted by speed)
                // This is a rough approximation
                const estimatedIndex = Math.floor(currentTime * 2 * speed);
                if (estimatedIndex !== currentWordIndex) {
                    setCurrentWordIndex(estimatedIndex);
                }
            }

            animationRef.current = requestAnimationFrame(updateHighlight);
        };

        if (isPlaying) {
            animationRef.current = requestAnimationFrame(updateHighlight);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, timingData, currentWordIndex, speed]);

    const scrollToWord = (index: number) => {
        const element = document.getElementById(`word-${index}`);
        if (element && containerRef.current) {
            // Simple scroll into view logic
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
            onPlayStateChange(!isPlaying);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = percent * audioRef.current.duration;
            setAudioProgress(percent * 100);
        }
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Flatten verses into words for rendering
    let globalWordIndex = 0;

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 overflow-hidden flex flex-col h-[600px]">
            {/* Audio Controls Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePlayPause}
                        className={`p-3 rounded-full shadow-lg transition-all transform hover:scale-105 ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>

                    <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden" onClick={handleSeek}>
                            <div
                                className="h-full bg-blue-500 transition-all duration-100"
                                style={{ width: `${audioProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                            <span>{formatTime(audioRef.current?.duration || 0)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Volume2 size={18} />
                        {timingData ? (
                            <span className="text-green-600 flex items-center gap-1 text-xs font-bold bg-green-100 px-2 py-1 rounded-full">
                                <Zap size={12} /> Sync
                            </span>
                        ) : (
                            <span className="text-amber-600 text-xs bg-amber-100 px-2 py-1 rounded-full">Auto</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Lyrics/Text Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                dir={lang === 'fa' ? 'rtl' : 'ltr'}
            >
                {verses.map((verse) => (
                    <div key={verse.number} className="flex gap-4 items-start">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold border border-blue-200">
                            {verse.number}
                        </span>
                        <p className="text-xl leading-loose text-gray-800">
                            {verse.words.map((word, wIdx) => {
                                const myIndex = globalWordIndex++;
                                const isActive = myIndex === currentWordIndex;
                                const isPast = myIndex < currentWordIndex;

                                return (
                                    <span
                                        key={wIdx}
                                        id={`word-${myIndex}`}
                                        className={`inline-block px-1 rounded transition-all duration-200 mx-0.5 ${isActive
                                                ? 'bg-amber-300 text-black font-bold scale-110 shadow-sm transform'
                                                : isPast
                                                    ? 'text-gray-600'
                                                    : 'text-gray-800'
                                            }`}
                                    >
                                        {word}
                                    </span>
                                );
                            })}
                        </p>
                    </div>
                ))}
            </div>

            <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => {
                    setIsPlaying(false);
                    onPlayStateChange(false);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
        </div>
    );
};

export default BibleKaraokeView;
