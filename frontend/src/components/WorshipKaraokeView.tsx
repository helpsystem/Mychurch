import React, { useEffect, useRef, useState } from 'react';

interface WordTiming {
    word: string;
    finglish: string;
    start: number;
    end: number;
}

interface LineTiming {
    line: string;
    start: number;
    end: number;
    words: WordTiming[];
    label?: string;
}

interface TimingData {
    songId: number;
    generatedAt: string;
    version: string;
    model: string;
    schema: string;
    lines: LineTiming[];
}

interface WorshipKaraokeViewProps {
    songId: number;
    currentTime: number;
    isPlaying: boolean;
}

const WorshipKaraokeView: React.FC<WorshipKaraokeViewProps> = ({
    songId,
    currentTime,
    isPlaying,
}) => {
    const [timingData, setTimingData] = useState<TimingData | null>(null);
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Load timing data
    useEffect(() => {
        const loadTiming = async () => {
            try {
                const response = await fetch(
                    `/worship/data/timings/song_${songId}_timing.json`
                );
                if (response.ok) {
                    const data = await response.json();
                    setTimingData(data);
                }
            } catch (error) {
                console.error('Error loading timing data:', error);
            }
        };

        loadTiming();
    }, [songId]);

    // Update current line and word based on time
    useEffect(() => {
        if (!timingData) return;

        // Find current line
        const lineIndex = timingData.lines.findIndex(
            (line) => currentTime >= line.start && currentTime < line.end
        );

        if (lineIndex !== -1 && lineIndex !== currentLineIndex) {
            setCurrentLineIndex(lineIndex);
        }

        // Find current word within all words
        let globalWordIndex = -1;
        let foundWord = false;

        for (let i = 0; i < timingData.lines.length; i++) {
            for (let j = 0; j < timingData.lines[i].words.length; j++) {
                globalWordIndex++;
                const word = timingData.lines[i].words[j];
                if (currentTime >= word.start && currentTime < word.end) {
                    if (globalWordIndex !== currentWordIndex) {
                        setCurrentWordIndex(globalWordIndex);
                    }
                    foundWord = true;
                    break;
                }
            }
            if (foundWord) break;
        }

        // If no word is active, reset
        if (!foundWord && currentWordIndex !== -1) {
            setCurrentWordIndex(-1);
        }
    }, [currentTime, timingData, currentLineIndex, currentWordIndex]);

    // Auto-scroll to active line
    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentLineIndex]);

    if (!timingData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-white text-lg">در حال بارگذاری داده‌های تایمینگ...</div>
                </div>
            </div>
        );
    }

    let globalWordIndex = -1;

    return (
        <div
            ref={containerRef}
            className="max-w-5xl mx-auto px-4 py-8 min-h-[500px] overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 300px)' }}
        >
            <div className="space-y-8">
                {timingData.lines.map((line, lineIndex) => {
                    const isActiveLine = lineIndex === currentLineIndex;

                    return (
                        <div
                            key={lineIndex}
                            ref={isActiveLine ? activeLineRef : null}
                            className={`transition-all duration-300 ${isActiveLine ? 'opacity-100 scale-105' : 'opacity-40 scale-100'
                                }`}
                        >
                            {/* Line Label (if exists) */}
                            {line.label && (
                                <div className="text-xs text-blue-400 uppercase tracking-wider mb-2 text-center font-semibold">
                                    {line.label}
                                </div>
                            )}

                            {/* Words Display */}
                            <div className="flex flex-wrap justify-center items-end gap-4 px-4">
                                {line.words.map((word, wordIndex) => {
                                    globalWordIndex++;
                                    const isActiveWord = globalWordIndex === currentWordIndex;

                                    return (
                                        <div
                                            key={wordIndex}
                                            className="flex flex-col items-center gap-1 transition-all duration-200"
                                        >
                                            {/* Persian Word (Top) */}
                                            <div
                                                className={`text-2xl md:text-3xl font-bold transition-all duration-200 ${isActiveWord
                                                    ? 'text-yellow-400 scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]'
                                                    : 'text-gray-400'
                                                    }`}
                                                dir="rtl"
                                            >
                                                {word.word}
                                            </div>

                                            {/* Finglish Word (Bottom) */}
                                            <div
                                                className={`text-base md:text-lg font-medium transition-all duration-200 ${isActiveWord
                                                    ? 'text-blue-300 scale-105 drop-shadow-[0_0_8px_rgba(147,197,253,0.6)]'
                                                    : 'text-gray-500'
                                                    }`}
                                                dir="ltr"
                                            >
                                                {word.finglish}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Timing Debug Info (Optional - can be removed) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono">
                    <div>Time: {currentTime.toFixed(2)}s</div>
                    <div>Line: {currentLineIndex + 1} / {timingData.lines.length}</div>
                    <div>Word: {currentWordIndex + 1}</div>
                </div>
            )}
        </div>
    );
};

export default WorshipKaraokeView;
