import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import {
    Mic,
    Square,
    Upload,
    Download,
    Presentation,
    Globe,
    Activity,
    Music,
    Book,
    Palette,
    Code,
    Edit,
    Save,
    MousePointer2,
    FileAudio,
    CheckCircle,
    AlertCircle,
    Loader2,
    Play,
    Pause,
    SkipBack,
    SkipForward
} from 'lucide-react';
import { LineType, LineSegment, WordSegment, TranscriptData } from '../../types/worship-sync';

type Status = 'idle' | 'reading' | 'transcribing' | 'detecting_chords' | 'exporting' | 'done' | 'error';
type Mode = 'speech' | 'song';
type TranslationTarget = 'persian' | 'english' | 'finglish';

const STATUS_MESSAGES: Record<Status, string> = {
    idle: 'فایل صوتی را اینجا رها کنید یا کلیک کنید',
    reading: 'در حال خواندن فایل...',
    transcribing: 'در حال تبدیل صدا به متن و ساختاردهی...',
    detecting_chords: 'در حال تشخیص آکوردهای موسیقی...',
    exporting: 'در حال ساخت پاورپوینت (اسلاید + تصاویر)...',
    done: 'پردازش تکمیل شد.',
    error: 'خطایی رخ داد.',
};

export const AudioTextSyncStudio: React.FC = () => {
    const [status, setStatus] = useState<Status>('idle');
    const [mode, setMode] = useState<Mode>('song'); // Default to song for this context
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
    const [chords, setChords] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [exportProgress, setExportProgress] = useState(0);
    const [totalSlides, setTotalSlides] = useState(0);

    // Sync Adjustment
    const [syncDelay, setSyncDelay] = useState(0);

    // Translation
    const [translations, setTranslations] = useState<{
        persian: string[] | null;
        english: string[] | null;
        finglish: string[] | null;
    }>({ persian: null, english: null, finglish: null });
    const [activeTab, setActiveTab] = useState<TranslationTarget>('persian');
    const [isTranslating, setIsTranslating] = useState(false);

    // Audio Gen
    const [generatedAudioUrls, setGeneratedAudioUrls] = useState<{
        original: string | null;
        persian: string | null;
        english: string | null;
        finglish: string | null;
    }>({ original: null, persian: null, english: null, finglish: null });

    const audioRef = useRef<HTMLAudioElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Calculate effective time for highlighting
    const effectiveTime = Math.max(0, currentTime - syncDelay);

    const resetState = useCallback(() => {
        setStatus('idle');
        setError(null);
        setFile(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setTranscriptData(null);
        setChords(null);
        setCurrentTime(0);
        setSyncDelay(0);
        setExportProgress(0);
        setTotalSlides(0);
        setTranslations({ persian: null, english: null, finglish: null });
        setIsTranslating(false);

        Object.values(generatedAudioUrls).forEach(url => {
            if (typeof url === 'string') URL.revokeObjectURL(url);
        });
        setGeneratedAudioUrls({ original: null, persian: null, english: null, finglish: null });
    }, [audioUrl, generatedAudioUrls]);

    const fileToGenerativePart = async (file: File) => {
        const base64EncodedData = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (result) {
                    resolve(result.split(',')[1]);
                } else {
                    resolve('');
                }
            };
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: base64EncodedData, mimeType: file.type },
        };
    };

    const transcribeAudio = async (audioFile: File, selectedMode: Mode) => {
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API_KEY not found in environment variables.");

            setStatus('transcribing');
            const ai = new GoogleGenAI({ apiKey });
            const audioPart = await fileToGenerativePart(audioFile);

            let promptText = "";
            if (selectedMode === 'song') {
                promptText = "Transcribe this worship song. Group words into natural lyric lines/stanzas in the 'lines' array. Set type to 'lyric'. Do NOT merge stanzas into big blocks. CRITICAL: Provide highly accurate timestamps for every single word, down to the hundredth of a second (0.01s), for perfect karaoke-style synchronization.";
            } else {
                promptText = `
Transcribe this Bible reading or Speech.
Analyze the structure carefully:
1. If you detect a Book Title (e.g., 'The Book of Genesis', 'Gospel of John'), create a line with type 'book_title'.
2. If you detect a Chapter Title (e.g., 'Chapter One'), create a line with type 'chapter_title'.
3. For Verses, create a line with type 'verse'. IMPORTANT: Extract the verse number (e.g., '1', '12') and put it in the 'label' field.
4. For general text, use type 'text'.
Group words into these structural lines.
CRITICAL: Provide highly accurate timestamps for every single word, down to the hundredth of a second (0.01s), to ensure perfect synchronization with the audio.
                `;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{
                    parts: [
                        audioPart,
                        { text: promptText }
                    ]
                }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            lines: {
                                type: Type.ARRAY,
                                description: "Array of structured lines.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        type: {
                                            type: Type.STRING,
                                            enum: ['book_title', 'chapter_title', 'verse', 'text', 'lyric'],
                                            description: "The structural type of this line."
                                        },
                                        label: {
                                            type: Type.STRING,
                                            description: "The verse number (e.g. '1', '2') if this is a verse."
                                        },
                                        content: { type: Type.STRING, description: "The full text content of this line." },
                                        words: {
                                            type: Type.ARRAY,
                                            items: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    word: { type: Type.STRING },
                                                    start_time: { type: Type.NUMBER },
                                                    end_time: { type: Type.NUMBER },
                                                },
                                                required: ['word', 'start_time', 'end_time']
                                            }
                                        }
                                    },
                                    required: ['content', 'words', 'type']
                                }
                            }
                        },
                        required: ['lines']
                    }
                }
            });

            try {
                const jsonString = response.text?.trim();
                if (!jsonString) throw new Error("Empty response text");
                const data = JSON.parse(jsonString);
                const fullTranscript = data.lines.map((l: LineSegment) => l.content).join('\n');

                const finalData: TranscriptData = {
                    lines: data.lines,
                    fullTranscript: fullTranscript
                };

                setTranscriptData(finalData);
                return finalData;
            } catch (parseErr) {
                console.error("JSON Parsing Error. Raw model output:", response.text, parseErr);
                throw new Error("Failed to parse the structured response from the model.");
            }
        } catch (err) {
            console.error("Transcription error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during transcription.";
            setError(`Failed to transcribe the audio. ${errorMessage}`);
            setStatus('error');
            return null;
        }
    };

    const detectChords = async (audioFile: File, transcript: string) => {
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) return;

            setStatus('detecting_chords');
            const ai = new GoogleGenAI({ apiKey });
            const audioPart = await fileToGenerativePart(audioFile);

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{
                    parts: [
                        audioPart,
                        { text: `Analyze this audio file (Transcript: "${transcript}"). Identify the musical chords being played. List the chords in order of appearance or by section (Verse, Chorus, etc.). If no chords are detectable, respond with "none".` }
                    ],
                }],
            });

            const chordText = response.text?.trim();
            if (chordText && chordText.toLowerCase() !== 'none' && chordText.length > 0) {
                setChords(chordText);
            }
        } catch (err) {
            console.error("Chord detection error:", err);
        }
    };

    const handleFile = useCallback(async (selectedFile: File) => {
        if (!selectedFile.type.startsWith('audio/')) {
            setError("Invalid file type. Please upload an audio file.");
            setStatus('error');
            return;
        }

        setStatus('reading');
        setFile(selectedFile);
        setAudioUrl(URL.createObjectURL(selectedFile));

        const transcription = await transcribeAudio(selectedFile, mode);

        if (transcription) {
            if (mode === 'song') {
                await detectChords(selectedFile, transcription.fullTranscript);
            }
            setStatus('done');
        }
    }, [mode, resetState]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('border-teal-400', 'bg-teal-50'); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50'); };

    const handleTranslate = async (target: TranslationTarget) => {
        if (!transcriptData) return;
        setIsTranslating(true);
        setError(null);
        setActiveTab(target);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const ai = new GoogleGenAI({ apiKey: apiKey! });

            let systemInstruction = "";
            let userPrompt = "";
            const linesContent = transcriptData.lines.map(l => l.content);

            if (target === 'persian') {
                systemInstruction = "You are a professional translator. Translate each line of the provided array to fluent, formal Iranian Persian (Farsi). Maintain the exact number of lines and the order.";
                userPrompt = `Translate these lines:\n${JSON.stringify(linesContent)}`;
            } else if (target === 'english') {
                systemInstruction = "You are a professional translator. Translate each line of the provided array to fluent English. Maintain the exact number of lines and the order.";
                userPrompt = `Translate these lines:\n${JSON.stringify(linesContent)}`;
            } else if (target === 'finglish') {
                systemInstruction = "You are a transliteration expert. Convert each line of the provided array to Finglish (Persian language using English alphabet). If input is English, translate to Persian first, then transliterate. Maintain the exact number of lines and the order.";
                userPrompt = `Convert these lines:\n${JSON.stringify(linesContent)}`;
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                config: {
                    systemInstruction,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            translated_lines: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        }
                    }
                },
                contents: [{ parts: [{ text: userPrompt }] }],
            });

            const result = JSON.parse(response.text || "{}");
            if (result.translated_lines && Array.isArray(result.translated_lines)) {
                setTranslations(prev => ({ ...prev, [target]: result.translated_lines }));
            } else {
                throw new Error("Invalid response format from translation.");
            }
        } catch (err) {
            console.error("Translation error:", err);
            setError(`Translation failed.`);
        } finally {
            setIsTranslating(false);
        }
    };

    // Export JSON for SmartWorshipPlayer
    const handleExportJSON = () => {
        if (!transcriptData) return;

        const songId = prompt('شماره سرود را وارد کنید (مثال: 335):', '335');
        if (!songId) return;

        // Generate finglish for each word if translations exist
        const finglishLines = translations.finglish || [];

        const output = {
            songId: parseInt(songId) || 0,
            version: "2.0",
            generatedAt: new Date().toISOString(),
            source: "audio-text-sync-studio",
            totalDuration: transcriptData.lines.reduce((max, line) => {
                const lastWord = line.words[line.words.length - 1];
                return Math.max(max, lastWord?.end_time || 0);
            }, 0),
            lines: transcriptData.lines.map((line, lineIdx) => {
                // Split finglish line into words if available
                const finglishWords = finglishLines[lineIdx]?.split(/\s+/) || [];

                return {
                    line: line.content,
                    start: line.words[0]?.start_time || 0,
                    end: line.words[line.words.length - 1]?.end_time || 0,
                    words: line.words.map((w, wIdx) => ({
                        word: w.word,
                        start: w.start_time,
                        end: w.end_time,
                        finglish: finglishWords[wIdx] || ""
                    }))
                };
            })
        };

        // Download
        const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `song_${songId}_timing.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ... (Skipping TTS logic for brevity, implementing PPTX below)

    const handleExportToPowerPoint = async () => {
        if (!transcriptData || !file || !audioUrl) return;
        setStatus('exporting');
        setExportProgress(0);
        setError(null);
        try {
            // Dynamic import
            // @ts-ignore
            const PptxGenJS = (await import('pptxgenjs')).default;
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const ai = new GoogleGenAI({ apiKey: apiKey! });
            const pres = new PptxGenJS();

            pres.layout = 'LAYOUT_16x9';
            const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(transcriptData.fullTranscript);
            pres.rtl = isRtl;

            let chunks: { text: string; start: number; end: number; label?: string }[] = [];
            const lines = transcriptData.lines;

            // Simplified chunking logic
            if (mode === 'song') {
                for (let i = 0; i < lines.length; i += 4) {
                    const slice = lines.slice(i, i + 4);
                    const text = slice.map(l => l.content).join('\n');
                    const start = slice[0]?.words[0]?.start_time || 0;
                    const lastLine = slice[slice.length - 1];
                    const end = lastLine?.words[lastLine.words.length - 1]?.end_time || 0;
                    chunks.push({ text, start, end });
                }
            } else {
                chunks = lines.map(l => ({
                    text: l.content,
                    start: l.words[0]?.start_time || 0,
                    end: l.words[l.words.length - 1]?.end_time || 0
                }));
            }

            setTotalSlides(chunks.length);

            // Limited demo due to API costs/complexity in one file, but implementing loop
            for (const [index, chunk] of chunks.entries()) {
                const slide = pres.addSlide();
                // @ts-ignore
                slide.transition = { type: 'cube', duration: 800 };
                slide.background = { color: '111827' }; // Dark default

                // Generate image
                const imagePrompt = `Abstract, spiritual, or worship background image suitable for these song lyrics: "${chunk.text}". No text in image. High quality, 4k, soft lighting.`;

                try {
                    // Try/Catch per slide for image gen
                    const imageResponse = await ai.models.generateImages({ model: 'imagen-3.0-generate-002', prompt: imagePrompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg' } });
                    // Note: using available imagen model
                    const b64Image = imageResponse.generatedImages?.[0]?.image?.imageBytes;
                    if (b64Image) {
                        // @ts-ignore
                        slide.addImage({ data: `data:image/jpeg;base64,${b64Image}`, w: '100%', h: '100%' });
                    }
                } catch (e) {
                    console.warn("Image gen failed", e);
                    // Fallback to gradient if image fails
                }

                slide.addShape("roundRect", {
                    x: '10%', y: '15%', w: '80%', h: '70%',
                    fill: { color: '000000', transparency: 40 },
                    rectRadius: 0.5,
                    line: { color: 'FFFFFF', width: 1, transparency: 60 }
                });

                slide.addText(chunk.text, {
                    x: '10%', y: '15%', w: '80%', h: '70%',
                    align: 'center', valign: 'middle',
                    color: 'FFFFFF', fontSize: 32, bold: true,
                    fontFace: isRtl ? 'Vazirmatn' : 'Segoe UI',
                    rtlMode: isRtl
                });

                setExportProgress(index + 1);
            }

            await pres.writeFile({ fileName: `${file.name.split('.')[0]}_${mode}.ppsx` });
            setStatus('done');

        } catch (err) {
            console.error("PPTX Error", err);
            setError("Failed to generate PowerPoint.");
            setStatus('error');
        }
    };

    // Playback loop
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        let animationFrameId: number;
        const loop = () => {
            setCurrentTime(audio.currentTime);
            if (!audio.paused && !audio.ended) {
                animationFrameId = requestAnimationFrame(loop);
            }
        };

        const onPlay = () => loop();
        const onPause = () => cancelAnimationFrame(animationFrameId);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onPause);
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));

        return () => {
            audio.removeEventListener('play', onPlay);
            cancelAnimationFrame(animationFrameId);
        };
    }, [audioUrl]);


    return (
        <div className="w-full max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen font-sans text-slate-800" dir="rtl">
            <header className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                    <Music className="w-8 h-8 text-teal-600" />
                    استودیوی هوشمند ستایش
                </h1>
                <p className="text-slate-600">نسل سوم ابزار هماهنگ‌سازی و تولید محتوای پرستشی با هوش مصنوعی</p>
            </header>

            {/* Status Bar */}
            <div className={`mb-6 p-4 rounded-xl flex items-center justify-center gap-3 transition-colors duration-300 ${status === 'error' ? 'bg-red-50 text-red-600' : 'bg-white shadow-sm border border-slate-200'}`}>
                {status === 'reading' || status === 'transcribing' || status === 'detecting_chords' || status === 'exporting' ? <Loader2 className="w-5 h-5 animate-spin text-teal-600" /> :
                    status === 'done' ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                        status === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                            <Activity className="w-5 h-5 text-slate-400" />}
                <span className="font-medium">{error || STATUS_MESSAGES[status]}</span>
            </div>

            {/* Main Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input & Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Upload Area */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onClick={() => inputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${file ? 'border-teal-500 ' : 'border-slate-300 hover:border-teal-400'}`}
                    >
                        <input type="file" ref={inputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                        {file ? (
                            <div className="space-y-2">
                                <FileAudio className="w-12 h-12 text-teal-500 mx-auto" />
                                <p className="font-medium text-slate-700">{file.name}</p>
                                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
                                    <Upload className="w-8 h-8 text-teal-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-700">فایل صوتی را اینجا رها کنید</p>
                                    <p className="text-sm text-slate-500 mt-1">یا برای انتخاب کلیک کنید</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mode Selection */}
                    {!file && (
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                            <button onClick={() => setMode('song')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'song' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Music className="w-4 h-4" /> سرود پرستشی
                            </button>
                            <button onClick={() => setMode('speech')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'speech' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Book className="w-4 h-4" /> قرائت کتاب‌مقدس
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    {transcriptData && (
                        <div className="space-y-3">
                            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> ترجمه هوشمند
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['persian', 'english', 'finglish'] as const).map(target => (
                                        <button
                                            key={target}
                                            onClick={() => handleTranslate(target)}
                                            disabled={isTranslating}
                                            className={`px-2 py-2 text-xs rounded-lg font-medium border transition-colors ${activeTab === target ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {target === 'persian' ? 'فارسی' : target === 'english' ? 'English' : 'Finglish'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleExportJSON}
                                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all font-bold flex items-center justify-center gap-3"
                            >
                                <Download className="w-5 h-5" />
                                <span>💾 دانلود JSON Player</span>
                            </button>

                            <button
                                onClick={handleExportToPowerPoint}
                                disabled={status === 'exporting'}
                                className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all font-bold flex items-center justify-center gap-3"
                            >
                                {status === 'exporting' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>در حال ساخت اسلاید {exportProgress}/{totalSlides}...</span>
                                    </>
                                ) : (
                                    <>
                                        <Presentation className="w-5 h-5" />
                                        <span>خروجی پاورپوینت هوشمند</span>
                                    </>
                                )}
                            </button>

                            {/* Chords Box */}
                            {chords && (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {chords}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Visualization & Lyrics */}
                <div className="lg:col-span-2 space-y-6">
                    {audioUrl && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                controls
                                className="w-full mb-6 accent-teal-500"
                            />

                            {/* Karaoke Display */}
                            {transcriptData ? (
                                <div className="h-[400px] overflow-y-auto pr-2 space-y-6 relative" dir="rtl">
                                    {transcriptData.lines.map((line, lineIdx) => {
                                        const isActiveLine = line.words.some(w => effectiveTime >= w.start_time && effectiveTime <= w.end_time);

                                        return (
                                            <div key={lineIdx} className={`transition-all duration-300 ${isActiveLine ? 'scale-105 opacity-100' : 'opacity-60'}`}>
                                                <div className="flex flex-wrap gap-1.5 justify-center mb-1">
                                                    {line.words.map((word, wIdx) => {
                                                        const isActive = effectiveTime >= word.start_time && effectiveTime <= word.end_time;
                                                        return (
                                                            <span
                                                                key={wIdx}
                                                                className={`cursor-pointer px-1 rounded transition-colors duration-100 text-xl font-bold ${isActive ? 'text-teal-600 bg-teal-50' : 'text-slate-700 hover:bg-slate-100'}`}
                                                                onClick={() => {
                                                                    if (audioRef.current) audioRef.current.currentTime = word.start_time;
                                                                }}
                                                            >
                                                                {word.word}
                                                            </span>
                                                        )
                                                    })}
                                                </div>

                                                {/* Translations */}
                                                {translations.finglish && translations.finglish[lineIdx] && (
                                                    <p className="text-center text-sm text-indigo-500 font-mono mb-1">{translations.finglish[lineIdx]}</p>
                                                )}
                                                {translations.english && translations.english[lineIdx] && (
                                                    <p className="text-center text-sm text-slate-500">{translations.english[lineIdx]}</p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-slate-300">
                                    <Activity className="w-16 h-16 opacity-20" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
