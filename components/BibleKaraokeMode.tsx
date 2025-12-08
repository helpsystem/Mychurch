import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface WordTiming {
    word: string;
    start_time: number;
    end_time: number;
}

type LineType = 'book_title' | 'chapter_title' | 'verse' | 'text';

interface LineSegment {
    type: LineType;
    label?: string;
    content: string;
    words: WordTiming[];
}

interface BibleVerse {
    verse_number: number;
    text_fa: string;
    book_code?: string;
    book_name_fa?: string;
}

interface BibleKaraokeModeProps {
    translation?: 'TPV' | 'NMV' | 'MOJDEH';
    initialBook?: string;
    initialChapter?: number;
}

const BibleKaraokeMode: React.FC<BibleKaraokeModeProps> = ({
    translation = 'TPV',
    initialBook = 'GEN',
    initialChapter = 1
}) => {
    const [currentBook] = useState(initialBook);
    const [currentChapter] = useState(initialChapter);
    const [currentTime, setCurrentTime] = useState(0);

    const [bookNameFa, setBookNameFa] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [lines, setLines] = useState<LineSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const wordHighlightColor = '#2dd4bf';

    // Load data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Get chapter_id from bible_chapters
                const { data: chapters, error: chapterError } = await supabase
                    .from('bible_chapters')
                    .select('id')
                    .eq('book_iso', currentBook)
                    .eq('chapter_number', currentChapter);

                if (chapterError) {
                    throw new Error(`Chapter error: ${chapterError.message}`);
                }

                if (!chapters || chapters.length === 0) {
                    throw new Error(`فصل پیدا نشد: ${currentBook} ${currentChapter}`);
                }

                const chapterId = chapters[0].id;

                // 2. Get verses from bible_verses using chapter_id
                const translationMap: Record<string, number> = { 'TPV': 1, 'NMV': 2, 'MOJDEH': 3 };
                const translationId = translationMap[translation] || 1;

                const { data: verses, error: versesError } = await supabase
                    .from('bible_verses')
                    .select('*')
                    .eq('chapter_id', chapterId)
                    .eq('translation_id', translationId)
                    .order('verse_number', { ascending: true });

                if (versesError) {
                    throw new Error(`Verses error: ${versesError.message}`);
                }

                if (!verses || verses.length === 0) {
                    throw new Error(`آیات پیدا نشد`);
                }

                setBookNameFa(currentBook);
                setAudioUrl(`/bible_data/audio/${translation}/${currentBook}/${currentChapter}.mp3`);

                // 3. Fetch timestamp file
                const timestampUrl = `/bible_data/timestamps/${translation}/${currentBook}/${currentChapter}.json`;
                const timestampRes = await fetch(timestampUrl);

                if (!timestampRes.ok) {
                    console.warn('⚠️ No timestamp file');
                    const verseLines: LineSegment[] = verses.map((v: BibleVerse) => ({
                        type: 'verse',
                        label: String(v.verse_number),
                        content: v.text_fa,
                        words: []
                    }));
                    setLines(verseLines);
                    return;
                }

                const timestampData = await timestampRes.json();
                const processedLines: LineSegment[] = [];

                // 4. Add intro
                if (timestampData.intro) {
                    processedLines.push({
                        type: 'book_title',
                        content: timestampData.intro.text,
                        words: timestampData.intro.words || []
                    });
                }

                // 5. Match verses by TEXT CONTENT
                if (timestampData.verses && Array.isArray(timestampData.verses)) {
                    timestampData.verses.forEach((tsVerse: any) => {
                        const tsText = tsVerse.text.trim();
                        const matchingVerse = verses.find((v: BibleVerse) => {
                            const dbText = v.text_fa.trim();
                            return dbText.substring(0, 50) === tsText.substring(0, 50);
                        });

                        if (matchingVerse) {
                            processedLines.push({
                                type: 'verse',
                                label: String(matchingVerse.verse_number),
                                content: matchingVerse.text_fa,
                                words: tsVerse.words || []
                            });
                        } else {
                            const isChapterTitle = tsVerse.text.includes('فصل') ||
                                tsVerse.text.includes('باب') ||
                                tsVerse.text.includes('Chapter');

                            processedLines.push({
                                type: isChapterTitle ? 'chapter_title' : 'text',
                                content: tsVerse.text,
                                words: tsVerse.words || []
                            });
                        }
                    });
                }

                console.log(`✅ Loaded ${processedLines.length} lines`);
                setLines(processedLines);

            } catch (err) {
                console.error('❌ Error:', err);
                setError(err instanceof Error ? err.message : 'خطا در بارگذاری');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [translation, currentBook, currentChapter]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
    };

    const handleLineClick = (line: LineSegment) => {
        if (audioRef.current && line.words.length > 0) {
            audioRef.current.currentTime = line.words[0].start_time + 0.1;
            audioRef.current.play();
        }
    };

    // Auto-scroll
    useEffect(() => {
        if (lines.length === 0 || !containerRef.current) return;

        const activeIndex = lines.findIndex(line => {
            if (line.words.length === 0) return false;
            const start = line.words[0]?.start_time;
            const end = line.words[line.words.length - 1]?.end_time;
            return start !== undefined && end !== undefined && currentTime >= start && currentTime <= end;
        });

        if (activeIndex !== -1) {
            const activeEl = lineRefs.current[activeIndex];
            if (activeEl && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const elRect = activeEl.getBoundingClientRect();

                if (elRect.top < containerRect.top + 50 || elRect.bottom > containerRect.bottom - 50) {
                    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }, [currentTime, lines]);

    const renderLine = (line: LineSegment, lineIndex: number) => {
        const lineStart = line.words[0]?.start_time || 0;
        const lineEnd = line.words[line.words.length - 1]?.end_time || 0;
        const isActive = line.words.length > 0 && currentTime >= lineStart && currentTime <= lineEnd;

        if (line.type === 'book_title') {
            return (
                <div
                    key={lineIndex}
                    ref={el => { lineRefs.current[lineIndex] = el; }}
                    className={`w-full bg-blue-900/40 border-blue-500 rounded-xl p-4 mb-6 transition-all duration-500 ${isActive ? 'shadow-lg border-2' : 'border'}`}
                >
                    <h2 className="text-2xl font-bold text-center text-blue-100 font-vazir">
                        {line.content}
                    </h2>
                </div>
            );
        }

        if (line.type === 'chapter_title') {
            return (
                <div
                    key={lineIndex}
                    ref={el => { lineRefs.current[lineIndex] = el; }}
                    className={`w-full bg-gray-700/40 border-teal-500 rounded-lg py-2 px-4 mb-4 transition-all ${isActive ? 'border-l-4' : 'border-l-2'}`}
                >
                    <h3 className="text-xl font-semibold text-center text-teal-200 font-vazir">
                        {line.content}
                    </h3>
                </div>
            );
        }

        return (
            <div
                key={lineIndex}
                ref={el => { lineRefs.current[lineIndex] = el; }}
                onClick={() => handleLineClick(line)}
                className={`p-4 rounded-xl transition-all cursor-pointer border-2 ${isActive ? 'bg-teal-900/20 border-teal-400 shadow-lg' : 'border-transparent hover:bg-gray-50'}`}
                style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: isActive ? wordHighlightColor : 'transparent'
                }}
            >
                <div className="flex items-center gap-2 mb-2" dir="rtl">
                    {line.type === 'verse' && line.label && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isActive ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                            آیه {line.label}
                        </span>
                    )}
                </div>

                <div className="text-right leading-relaxed text-lg font-vazir" dir="rtl">
                    {line.words.length > 0 ? (
                        line.words.map((w, i) => {
                            const isWordActive = currentTime >= w.start_time && currentTime < w.end_time;
                            return (
                                <span
                                    key={i}
                                    className={`inline-block mx-1 transition-all px-1 rounded ${isWordActive ? 'font-bold' : ''}`}
                                    style={{
                                        color: isWordActive ? wordHighlightColor : undefined,
                                        textShadow: isWordActive ? `0 0 10px ${wordHighlightColor}66` : 'none',
                                        transform: isWordActive ? 'scale(1.1)' : 'scale(1)',
                                    }}
                                >
                                    {w.word}
                                </span>
                            );
                        })
                    ) : (
                        <p className="text-gray-700">{line.content}</p>
                    )}
                </div>
            </div>
        );
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-gray-900 py-8">
            <div className="max-w-5xl mx-auto px-4 space-y-4">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-right">
                            <h2 className="text-2xl font-bold text-gray-800 font-vazir">
                                {bookNameFa} - فصل {currentChapter}
                            </h2>
                            <p className="text-teal-600 font-medium mt-1">
                                {isPlaying ? 'در حال پخش' : 'متوقف'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-full border">
                            <button
                                title="عقب"
                                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
                                className="p-2 text-gray-500 hover:text-teal-600"
                            >
                                <SkipBack size={20} />
                            </button>
                            <button
                                title="پخش/توقف"
                                onClick={togglePlay}
                                className="w-12 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-lg"
                            >
                                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                            </button>
                            <button
                                title="جلو"
                                onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 10); }}
                                className="p-2 text-gray-500 hover:text-teal-600"
                            >
                                <SkipForward size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                        <span className="text-xs font-mono text-gray-500">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            title="Timeline"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }}
                            className="flex-1 h-2 bg-gray-200 rounded-lg cursor-pointer accent-teal-600"
                        />
                        <span className="text-xs font-mono text-gray-500">{formatTime(duration)}</span>
                    </div>
                </div>

                <audio
                    ref={audioRef}
                    src={audioUrl}
                    preload="metadata"
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onTimeUpdate={() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                />

                <div ref={containerRef} className="bg-white rounded-2xl shadow-inner p-6 space-y-4 border min-h-[600px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full"></div></div>
                    ) : error ? (
                        <div className="text-center py-10 text-red-500"><AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}</div>
                    ) : (
                        lines.map((line, i) => renderLine(line, i))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BibleKaraokeMode;
