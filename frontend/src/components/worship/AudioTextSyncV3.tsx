import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { 
    Upload, Download, Music, Book, Palette, Code, Edit, Save, 
    Play, Pause, SkipBack, SkipForward, Volume2, Languages,
    FileAudio, CheckCircle, AlertCircle, Loader2, Presentation,
    Hand, Globe, FileDown
} from 'lucide-react';

type WordSegment = {
  word: string;
  start_time: number;
  end_time: number;
};

type LineType = 'book_title' | 'chapter_title' | 'verse' | 'text' | 'lyric';

type LineSegment = {
    type: LineType;
    label?: string;
    content: string;
    words: WordSegment[];
};

type TranscriptData = {
  lines: LineSegment[];
  fullTranscript: string;
};

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

export const AudioTextSyncV3: React.FC = () => {
    const [status, setStatus] = useState<Status>('idle');
    const [mode, setMode] = useState<Mode>('song');
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
    const [chords, setChords] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
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

    // Editing & Sync State
    const [isEditing, setIsEditing] = useState(false);
    const [isSyncMode, setIsSyncMode] = useState(false);

    // Appearance
    const [showAppearance, setShowAppearance] = useState(false);
    const [wordHighlightColor, setWordHighlightColor] = useState('#2dd4bf');
    const [lineHighlightColor, setLineHighlightColor] = useState('#1e293b');

    const audioRef = useRef<HTMLAudioElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const transcriptContainerRef = useRef<HTMLDivElement>(null);
    const translationContainerRef = useRef<HTMLDivElement>(null);

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
        setDuration(0);
        setIsPlaying(false);
        setSyncDelay(0);
        setExportProgress(0);
        setTotalSlides(0);
        setTranslations({ persian: null, english: null, finglish: null });
        setIsTranslating(false);
        setIsEditing(false);
        setIsSyncMode(false);
    }, [audioUrl]);

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
            if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not found.");
            
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
                model: 'gemini-2.5-flash',
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
            } catch(parseErr) {
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
            if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not found.");
            
            setStatus('detecting_chords');
            const ai = new GoogleGenAI({ apiKey });
            const audioPart = await fileToGenerativePart(audioFile);

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
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
            setError("فرمت فایل نامعتبر است. لطفاً یک فایل صوتی بارگذاری کنید.");
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
    }, [mode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-teal-400');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('border-teal-400'); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-teal-400'); };
    
    // --- Editing Functions ---
    const handleLineChange = (lineIndex: number, newContent: string) => {
        setTranscriptData(prev => {
            if (!prev) return null;
            const newLines = [...prev.lines];
            const line = newLines[lineIndex];
            
            const startTime = line.words[0]?.start_time || 0;
            const endTime = line.words[line.words.length - 1]?.end_time || 0;
            const duration = Math.max(0.1, endTime - startTime); 

            const newWordsStr = newContent.trim().split(/\s+/).filter(w => w.length > 0);
            const wordDuration = newWordsStr.length > 0 ? duration / newWordsStr.length : 0;

            const newWords: WordSegment[] = newWordsStr.map((w, i) => ({
                word: w,
                start_time: Number((startTime + (i * wordDuration)).toFixed(2)),
                end_time: Number((startTime + ((i + 1) * wordDuration)).toFixed(2))
            }));

            if (newWords.length === 0) {
                 newWords.push({ word: '', start_time: startTime, end_time: endTime });
            }

            newLines[lineIndex] = {
                ...line,
                content: newContent,
                words: newWords
            };

            return { 
                ...prev, 
                lines: newLines, 
                fullTranscript: newLines.map(l => l.content).join('\n') 
            };
        });
    };

    const handleTranslationChange = (lineIndex: number, newContent: string) => {
        setTranslations(prev => {
            const currentLangLines = prev[activeTab];
            if (!currentLangLines) return prev;
            
            const newLines = [...currentLangLines];
            newLines[lineIndex] = newContent;
            
            return {
                ...prev,
                [activeTab]: newLines
            };
        });
    };

    // --- Manual Sync Function ---
    const handleManualSync = (lineIndex: number, wordIndex: number) => {
        if (!audioRef.current) return;
        const time = audioRef.current.currentTime;
        const formattedTime = Number(time.toFixed(2));

        setTranscriptData(prev => {
            if (!prev) return null;
            const newLines = [...prev.lines];
            
            const line = {...newLines[lineIndex]};
            const newWords = [...line.words];
            const word = {...newWords[wordIndex]};

            const oldDuration = word.end_time - word.start_time;
            word.start_time = formattedTime;
            word.end_time = Number((formattedTime + oldDuration).toFixed(2));
            
            newWords[wordIndex] = word;
            line.words = newWords;
            newLines[lineIndex] = line;

            let prevLineIndex = lineIndex;
            let prevWordIndex = wordIndex - 1;

            if (prevWordIndex < 0) {
                prevLineIndex = lineIndex - 1;
                while (prevLineIndex >= 0 && newLines[prevLineIndex].words.length === 0) {
                    prevLineIndex--;
                }
                if (prevLineIndex >= 0) {
                    prevWordIndex = newLines[prevLineIndex].words.length - 1;
                }
            }

            if (prevLineIndex >= 0 && prevWordIndex >= 0) {
                 const pLine = newLines[prevLineIndex] === line ? line : {...newLines[prevLineIndex]};
                 const pWords = pLine === line ? newWords : [...pLine.words];
                 const prevWord = {...pWords[prevWordIndex]};
                 
                 prevWord.end_time = formattedTime;
                 
                 pWords[prevWordIndex] = prevWord;
                 pLine.words = pWords;
                 newLines[prevLineIndex] = pLine;
            }

            return { ...prev, lines: newLines };
        });
    };

    const handleDownloadTranscript = () => {
        if (!transcriptData) return;
        const blob = new Blob([transcriptData.fullTranscript], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file?.name.split('.')[0]}_transcript.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadProjectJSON = () => {
        if (!transcriptData) return;
        
        const mergedLines = transcriptData.lines.map((line, index) => ({
            ...line,
            translations: {
                persian: translations.persian?.[index] || null,
                english: translations.english?.[index] || null,
                finglish: translations.finglish?.[index] || null
            }
        }));

        const dataToSave = {
            metadata: {
                filename: file?.name,
                generated_at: new Date().toISOString(),
                mode: mode,
                type: 'project_full'
            },
            structure: mergedLines
        };
        const jsonContent = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file?.name.split('.')[0]}_full_project.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadSpecificJSON = (target: 'original' | 'persian' | 'english' | 'finglish') => {
        if (!transcriptData) return;

        let linesToSave = [];
        
        if (target === 'original') {
            linesToSave = transcriptData.lines;
        } else {
             const translatedLines = translations[target];
             if (!translatedLines) {
                 alert(`ترجمه ${target} موجود نیست.`);
                 return;
             }
             
             linesToSave = transcriptData.lines.map((line, index) => ({
                 content: translatedLines[index],
                 start_time: line.words[0]?.start_time || 0,
                 end_time: line.words[line.words.length-1]?.end_time || 0,
                 type: line.type,
                 label: line.label
             }));
        }

        const dataToSave = {
            metadata: {
                filename: file?.name,
                language: target,
                generated_at: new Date().toISOString(),
                mode: mode,
                type: 'single_language_timing'
            },
            lines: linesToSave
        };
        
        const jsonContent = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file?.name.split('.')[0]}_${target}_timing.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportToPowerPoint = async () => {
        if (!transcriptData || !file || !audioUrl) return;
        setStatus('exporting');
        setExportProgress(0);
        setError(null);
        try {
            const PptxGenJS = (await import('pptxgenjs')).default;
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not found.");
            const ai = new GoogleGenAI({ apiKey });
            const pres = new PptxGenJS();
            
            pres.layout = 'LAYOUT_16x9';
            const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(transcriptData.fullTranscript);
            pres.rtl = isRtl;

            let chunks: { text: string; start: number; end: number; label?: string }[] = [];
            const lines = transcriptData.lines;

            if (mode === 'song') {
                for (let i = 0; i < lines.length; i += 4) {
                    const slice = lines.slice(i, i + 4);
                    const text = slice.map(l => l.content).join('\n');
                    const start = slice[0]?.words[0]?.start_time || 0;
                    const lastLine = slice[slice.length-1];
                    const end = lastLine?.words[lastLine.words.length-1]?.end_time || 0;
                    chunks.push({ text, start, end });
                }
            } else {
                let currentChunkLines: string[] = [];
                let chunkStart = 0;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineStart = line.words[0]?.start_time || 0;
                    const lineEnd = line.words[line.words.length-1]?.end_time || 0;

                    if (line.type === 'book_title' || line.type === 'chapter_title') {
                        if (currentChunkLines.length > 0) {
                             chunks.push({ text: currentChunkLines.join(' '), start: chunkStart, end: lines[i-1].words.at(-1)?.end_time || 0 });
                             currentChunkLines = [];
                        }
                        chunks.push({ text: line.content, start: lineStart, end: lineEnd });
                        chunkStart = 0;
                    } else {
                        if (currentChunkLines.length === 0) chunkStart = lineStart;
                        const labelPrefix = line.label ? `[${line.label}] ` : '';
                        currentChunkLines.push(labelPrefix + line.content);

                        if (currentChunkLines.length >= 3 || i === lines.length - 1) {
                            chunks.push({ text: currentChunkLines.join(' '), start: chunkStart, end: lineEnd });
                            currentChunkLines = [];
                        }
                    }
                }
            }

            setTotalSlides(chunks.length);
            let firstSlideReference: any = null;

            for (const [index, chunk] of chunks.entries()) {
                const slide = pres.addSlide();
                if (index === 0) firstSlideReference = slide;
                // @ts-ignore
                slide.transition = { type: 'cube', duration: 800 };

                const imagePrompt = mode === 'song' 
                    ? `Abstract, spiritual, or worship background image suitable for these song lyrics: "${chunk.text}". No text in image. High quality, 4k, soft lighting.`
                    : `Create a descriptive illustration for this text: "${chunk.text}". No text in image. Cinematic lighting, professional photography style.`;

                try {
                    const imageResponse = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: imagePrompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg' } });
                    const b64Image = imageResponse.generatedImages[0].image.imageBytes;
                    slide.addImage({ data: `data:image/jpeg;base64,${b64Image}`, w: '100%', h: '100%' });
                } catch (imgErr) {
                    console.warn("Image gen failed for slide", index, imgErr);
                    slide.background = { color: '111827' };
                }

                slide.addShape("roundRect", { 
                    x: '10%', y: '15%', w: '80%', h: '70%', 
                    fill: { color: '000000', transparency: 40 },
                    rectRadius: 0.5,
                    line: { color: 'FFFFFF', width: 1, transparency: 60 },
                    shadow: { type: 'outer', color: '000000', blur: 10, offset: 5, angle: 90 }
                });
                
                const fontSize = mode === 'song' ? 32 : 24;
                slide.addText(chunk.text, { 
                    x: '10%', y: '15%', w: '80%', h: '70%', 
                    align: 'center', valign: 'middle', 
                    color: 'FFFFFF', fontSize: fontSize, bold: true, 
                    fontFace: isRtl ? 'Vazirmatn' : 'Segoe UI',
                    rtlMode: isRtl
                });

                slide.addText("کلیسای ایرانیان واشنگتن دی سی", {
                    x: 0, y: '92%', w: '100%', h: 0.5,
                    align: 'center', fontSize: 12, color: 'E5E7EB',
                    fontFace: 'Vazirmatn',
                    bold: true,
                    shadow: { type: 'outer', color: '000000', blur: 2, offset: 1, angle: 45 }
                });
                
                slide.addNotes(`Audio Segment: ${chunk.start.toFixed(2)}s - ${chunk.end.toFixed(2)}s`);

                setExportProgress(index + 1);
            }

            if (chunks.length > 0 && firstSlideReference) {
                  const audioPart = await fileToGenerativePart(file);
                  firstSlideReference.addMedia({ type: 'audio', data: `data:${file.type};base64,${audioPart.inlineData.data}`, x: 0.5, y: 0.5, w:1, h:1 });
                  firstSlideReference.addText( 'POWERED BY GEMINI', { x: 0, y: '95%', w: '100%', h: 0.25, align: 'center', fontSize: 10, color: 'AAAAAA' } );
            }
            
            await pres.writeFile({ fileName: `${file.name.split('.')[0]}_${mode}.ppsx` });
            setStatus('done');
        } catch (err) {
            console.error("PowerPoint Export Error:", err);
            setError("خطا در ساخت پاورپوینت. لطفاً دوباره تلاش کنید.");
            setStatus('error');
        } finally {
           setExportProgress(0);
           setTotalSlides(0);
        }
    };

    const handleTranslate = async (target: TranslationTarget) => {
        if (!transcriptData) return;
        setIsTranslating(true);
        setError(null);
        setActiveTab(target); 

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not found.");
            const ai = new GoogleGenAI({ apiKey });
            
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
                model: 'gemini-2.5-flash', 
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
            setError(`خطا در ترجمه.`);
        } finally {
            setIsTranslating(false);
        }
    };

    // Audio Player Controls
    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const skip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };
    
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

        const onPlay = () => { setIsPlaying(true); loop(); };
        const onPause = () => { setIsPlaying(false); cancelAnimationFrame(animationFrameId); };
        const onLoadedMetadata = () => setDuration(audio.duration);
        
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onPause);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onPause);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
            cancelAnimationFrame(animationFrameId);
        };
    }, [audioUrl, status]);

    // Scroll Logic
    useEffect(() => {
        if (!transcriptData || !transcriptContainerRef.current || isEditing || isSyncMode) return;
        const activeLineIndex = transcriptData.lines.findIndex(line => {
             const start = line.words[0]?.start_time;
             const end = line.words[line.words.length - 1]?.end_time;
             return start !== undefined && end !== undefined && effectiveTime >= start && effectiveTime <= end;
        });

        if (activeLineIndex !== -1) {
            const container = transcriptContainerRef.current;
            const activeLineElement = container.children[activeLineIndex] as HTMLElement;
            if (activeLineElement) {
                 const containerRect = container.getBoundingClientRect();
                 const elementRect = activeLineElement.getBoundingClientRect();
                 if (elementRect.top < containerRect.top + 20 || elementRect.bottom > containerRect.bottom - 20) {
                     activeLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
            }
        }
    }, [effectiveTime, transcriptData, isEditing, isSyncMode]);

    useEffect(() => {
        if (!translations[activeTab] || !translationContainerRef.current || !transcriptData || isEditing || isSyncMode) return;
        const activeLineIndex = transcriptData.lines.findIndex(line => {
             const start = line.words[0]?.start_time;
             const end = line.words[line.words.length - 1]?.end_time;
             return start !== undefined && end !== undefined && effectiveTime >= start && effectiveTime <= end;
        });

         if (activeLineIndex !== -1) {
            const container = translationContainerRef.current;
            const activeLineElement = container.children[activeLineIndex] as HTMLElement;
            if (activeLineElement) {
                 const containerRect = container.getBoundingClientRect();
                 const elementRect = activeLineElement.getBoundingClientRect();
                 if (elementRect.top < containerRect.top + 20 || elementRect.bottom > containerRect.bottom - 20) {
                     activeLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
            }
        }
    }, [effectiveTime, transcriptData, activeTab, translations, isEditing, isSyncMode]);

    const renderTranscript = () => {
        if (!transcriptData) return null;

        const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(transcriptData.fullTranscript);
        const direction = isRtl ? 'rtl' : 'ltr';

        return (
            <div className="space-y-4" dir={direction}>
                {transcriptData.lines.map((line, lineIndex) => {
                    if (isEditing) {
                        return (
                            <div key={lineIndex} className="mb-2">
                                <textarea
                                    value={line.content}
                                    onChange={(e) => handleLineChange(lineIndex, e.target.value)}
                                    className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-teal-500 outline-none resize-none overflow-hidden min-h-[50px]"
                                    placeholder="متن اصلاح شده را وارد کنید..."
                                />
                                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                     <span>{line.type}</span>
                                     <span>{(line.words[line.words.length-1]?.end_time - line.words[0]?.start_time).toFixed(1)}s</span>
                                </div>
                            </div>
                        );
                    }

                    const lineStart = line.words[0]?.start_time || 0;
                    const lineEnd = line.words[line.words.length - 1]?.end_time || 0;
                    const isLineActive = effectiveTime >= lineStart && effectiveTime <= lineEnd;

                    if (line.type === 'book_title') {
                        return (
                            <div key={lineIndex} className={`w-full bg-blue-900/40 border-blue-500 rounded-xl p-4 mb-6 transition-all duration-500 ${isLineActive ? 'shadow-lg shadow-blue-500/20 scale-[1.02] border-2' : 'border border-blue-900'}`}>
                                <h2 className="text-2xl font-bold text-center text-blue-100 uppercase tracking-widest drop-shadow-md">
                                    {line.content}
                                </h2>
                            </div>
                        );
                    }

                    if (line.type === 'chapter_title') {
                        return (
                            <div key={lineIndex} className={`w-full bg-slate-700/40 border-teal-500 rounded-lg py-2 px-4 mb-4 transition-all duration-500 ${isLineActive ? 'shadow-md shadow-teal-500/20 scale-[1.01] border-l-4' : 'border-l-2'}`}>
                                <h3 className="text-xl font-semibold text-center text-teal-200">
                                    {line.content}
                                </h3>
                            </div>
                        );
                    }

                    const isVerse = line.type === 'verse';
                    const textAlign = mode === 'song' ? 'text-center' : (isRtl ? 'text-right' : 'text-left');
                    
                    return (
                        <div 
                            key={lineIndex} 
                            className={`p-3 rounded-lg transition-all duration-300 ${textAlign} relative`}
                            style={{ 
                                backgroundColor: isLineActive ? `${lineHighlightColor}80` : 'transparent', 
                                borderRight: isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                                borderLeft: !isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                                transform: isLineActive ? 'scale(1.02)' : 'scale(1)',
                                boxShadow: isLineActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none'
                            }}
                        >
                            {isVerse && line.label && (
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mx-2 mb-1 align-middle ${isLineActive ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                    {line.label}
                                </span>
                            )}

                            {line.words.map((wordObj, wordIndex) => {
                                const isWordActive = effectiveTime >= wordObj.start_time && effectiveTime < wordObj.end_time;
                                return (
                                    <span 
                                        key={wordIndex}
                                        onClick={() => isSyncMode && handleManualSync(lineIndex, wordIndex)}
                                        className={`inline-block mx-1 transition-all duration-100 px-0.5 rounded 
                                            ${isWordActive ? 'font-bold' : 'text-slate-300'} 
                                            ${isSyncMode ? 'cursor-pointer hover:bg-yellow-500/30 hover:text-yellow-200 border-b border-dashed border-yellow-600' : ''}`}
                                        style={{ 
                                            color: isWordActive ? wordHighlightColor : undefined,
                                            textShadow: isWordActive ? `0 0 10px ${wordHighlightColor}66` : 'none',
                                            transform: isWordActive ? 'scale(1.1)' : 'scale(1)',
                                        }}
                                        title={isSyncMode ? "کلیک کنید تا این کلمه با زمان فعلی صدا هماهنگ شود" : ""}
                                    >
                                        {wordObj.word}
                                    </span>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        );
    };
    
    const renderTranslationContent = () => {
         const lines = translations[activeTab];
         if (!lines || !transcriptData) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Languages className="w-8 h-8 mb-2 opacity-50" />
                    <p className="mb-2">ترجمه‌ای موجود نیست</p>
                    <button onClick={() => handleTranslate(activeTab)} className="mt-2 text-blue-400 hover:underline">ایجاد ترجمه</button>
                </div>
             );
         }
         
         const isRtl = activeTab === 'persian';
         
         return (
             <div ref={translationContainerRef} className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
                 {lines.map((lineText, index) => {
                     const originalLine = transcriptData.lines[index];
                     if (!originalLine) return null;
                     
                     if (isEditing) {
                        return (
                            <div key={index} className="mb-2">
                                <textarea
                                    value={lineText}
                                    onChange={(e) => handleTranslationChange(index, e.target.value)}
                                    className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 focus:border-blue-500 outline-none resize-none overflow-hidden min-h-[50px]"
                                    placeholder="متن ترجمه اصلاح شده..."
                                />
                            </div>
                        );
                     }
                     
                     const lineStart = originalLine.words[0]?.start_time || 0;
                     const lineEnd = originalLine.words[originalLine.words.length - 1]?.end_time || 0;
                     const isLineActive = effectiveTime >= lineStart && effectiveTime <= lineEnd;
                     
                     return (
                         <div 
                             key={index}
                             className={`p-3 rounded-lg transition-all duration-300 ${mode === 'song' ? 'text-center' : (isRtl ? 'text-right' : 'text-left')}`}
                             style={{ 
                                backgroundColor: isLineActive ? `${lineHighlightColor}80` : 'transparent',
                                borderRight: isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                                borderLeft: !isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : '4px solid transparent',
                                transform: isLineActive ? 'scale(1.02)' : 'scale(1)',
                                color: isLineActive ? '#ffffff' : '#9ca3af'
                            }}
                         >
                            {lineText}
                         </div>
                     );
                 })}
             </div>
         );
    };

    const renderModeSelector = () => (
        <div className="flex justify-center mb-6 bg-slate-900/40 p-1 rounded-xl w-fit mx-auto border border-slate-700">
            <button
                onClick={() => setMode('speech')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${mode === 'speech' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Book className="w-4 h-4" /> قرائت کتاب‌مقدس
            </button>
            <button
                onClick={() => setMode('song')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${mode === 'song' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Music className="w-4 h-4" /> سرود پرستشی
            </button>
        </div>
    );

    const renderContent = () => {
        if (status === 'idle' || (status === 'error' && !file)) {
            return (
                <div className="text-center">
                    {renderModeSelector()}
                    <div 
                        className="relative border-2 border-dashed border-slate-600 rounded-xl p-12 cursor-pointer transition-colors hover:border-teal-500 bg-slate-800/50"
                        onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input type="file" ref={inputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
                        <Upload className="w-12 h-12 mx-auto text-slate-500" />
                        <p className="mt-4 text-slate-400">
                            {mode === 'speech' ? 'بارگذاری فایل صوتی (کتاب مقدس یا کتاب صوتی)' : 'بارگذاری فایل صوتی (سرود پرستشی)'}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                             {mode === 'speech' ? 'تمرکز: متن‌نگاری دقیق، زمان‌بندی، ترجمه' : 'تمرکز: آکورد، متن شعر، ساخت اسلاید'}
                        </p>
                        {error && <p className="mt-2 text-red-400">{error}</p>}
                    </div>
                </div>
            );
        }

        if (status !== 'done' && status !== 'error' ) {
             return (
                <div className="text-center p-12">
                    <Loader2 className="w-12 h-12 mx-auto text-teal-400 animate-spin" />
                    <p className="mt-4 text-lg text-slate-300">{STATUS_MESSAGES[status]}</p>
                    {status === 'exporting' && totalSlides > 0 && (
                        <div className="mt-4 w-full max-w-xs mx-auto">
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-teal-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(exportProgress / totalSlides) * 100}%` }}></div>
                            </div>
                            <p className="mt-2 text-sm text-slate-400">{`در حال ساخت اسلاید ${exportProgress} از ${totalSlides}...`}</p>
                        </div>
                    )}
                </div>
            );
        }

        const hasAnyTranslation = Object.values(translations).some(t => t !== null);

        return (
            <div dir="rtl">
                 {error && <p className="mb-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
                
                {/* Action Buttons */}
                <div className="mb-4 flex flex-wrap gap-2 justify-center items-center text-sm">
                    <button onClick={resetState} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">فایل جدید</button>
                    <button onClick={handleDownloadTranscript} className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">دانلود متن (TXT)</button>
                    <button onClick={handleDownloadProjectJSON} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                        <Code className="w-5 h-5" /> دانلود پروژه (JSON)
                    </button>
                    <button onClick={handleExportToPowerPoint} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                      <Presentation className="w-5 h-5" /> خروجی پاورپوینت
                    </button>
                    
                    {/* Translation Buttons */}
                     <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 gap-1">
                        <button onClick={() => handleTranslate('persian')} disabled={isTranslating} className="px-3 py-2 text-sm rounded transition-colors hover:bg-blue-600 hover:text-white text-slate-300 disabled:opacity-50">
                            به فارسی
                        </button>
                        <button onClick={() => handleTranslate('english')} disabled={isTranslating} className="px-3 py-2 text-sm rounded transition-colors hover:bg-indigo-600 hover:text-white text-slate-300 disabled:opacity-50">
                            به انگلیسی
                        </button>
                        <button onClick={() => handleTranslate('finglish')} disabled={isTranslating} className="px-3 py-2 text-sm rounded transition-colors hover:bg-purple-600 hover:text-white text-slate-300 disabled:opacity-50">
                            به فینگلیش
                        </button>
                     </div>

                    {/* Edit Toggle */}
                    <button 
                        onClick={() => { setIsEditing(!isEditing); if(!isEditing) setIsSyncMode(false); }} 
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 font-bold ${isEditing ? 'bg-yellow-600 text-white shadow-lg' : 'bg-slate-800 text-yellow-500 hover:bg-slate-700'}`}
                        title={isEditing ? "ذخیره تغییرات" : "ویرایش متن"}
                    >
                         {isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                         {isEditing ? 'ذخیره' : ''}
                    </button>

                    {/* Manual Sync Toggle */}
                    <button 
                        onClick={() => { setIsSyncMode(!isSyncMode); if(!isSyncMode) setIsEditing(false); }} 
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 font-bold ${isSyncMode ? 'bg-red-600 text-white shadow-lg animate-pulse' : 'bg-slate-800 text-red-500 hover:bg-slate-700'}`}
                        title={isSyncMode ? "خروج از حالت هماهنگی" : "حالت هماهنگی لمسی"}
                    >
                         <Hand className="w-5 h-5" />
                         {isSyncMode ? 'هماهنگی لمسی' : ''}
                    </button>

                    <button onClick={() => setShowAppearance(!showAppearance)} className={`p-2 rounded-lg transition-colors ${showAppearance ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                         <Palette className="w-6 h-6" />
                    </button>
                </div>

                {/* Appearance Settings */}
                {showAppearance && (
                    <div className="mb-6 bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-wrap justify-center gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <label className="text-xs text-slate-400 uppercase font-semibold">رنگ هایلایت کلمه</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={wordHighlightColor} 
                                    onChange={(e) => setWordHighlightColor(e.target.value)} 
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-sm font-mono text-slate-300">{wordHighlightColor}</span>
                            </div>
                        </div>
                         <div className="flex flex-col items-center gap-2">
                            <label className="text-xs text-slate-400 uppercase font-semibold">رنگ هایلایت خط (پس‌زمینه)</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={lineHighlightColor} 
                                    onChange={(e) => setLineHighlightColor(e.target.value)} 
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-sm font-mono text-slate-300">{lineHighlightColor}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Audio Player */}
                <div className="mb-6 bg-slate-800/70 rounded-xl p-4 border border-slate-700" dir="ltr">
                    <audio ref={audioRef} src={audioUrl!} className="hidden" />
                    
                    {/* Progress Bar */}
                    <div
                        className="w-full h-2 bg-slate-700 rounded-full mb-4 cursor-pointer overflow-hidden"
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const pos = (e.clientX - rect.left) / rect.width;
                            if (audioRef.current && duration) audioRef.current.currentTime = pos * duration;
                        }}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-teal-400 to-indigo-500 rounded-full transition-all duration-100"
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => skip(-10)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                <SkipBack className="w-5 h-5" />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-12 h-12 flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-400 text-black transition-transform hover:scale-105"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                            <button onClick={() => skip(10)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                <SkipForward className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-mono text-slate-300 ml-3">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-slate-400" />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                defaultValue="1"
                                onChange={(e) => {
                                    if (audioRef.current) audioRef.current.volume = parseFloat(e.target.value);
                                }}
                                className="w-20 accent-teal-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Sync Controls */}
                <div className="flex flex-col items-center justify-center gap-2 mb-6 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-300 text-sm mb-1">
                        <span className="font-semibold text-teal-400">تنظیم دستی زمان</span>
                        <span className="text-xs text-slate-500">(اصلاح جلو یا عقب افتادن متن)</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-900 rounded-lg p-1.5 border border-slate-700">
                         <button 
                            onClick={() => setSyncDelay(d => Math.max(d - 0.1, -5))} 
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors border border-slate-700"
                        >
                            متن عقبه (-)
                        </button>
                        <div className="flex flex-col items-center w-20">
                            <span className={`font-mono font-bold text-lg ${syncDelay !== 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                {syncDelay > 0 ? '+' : ''}{syncDelay.toFixed(2)}s
                            </span>
                        </div>
                        <button 
                            onClick={() => setSyncDelay(d => Math.min(d + 0.1, 10))} 
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors border border-slate-700"
                        >
                             متن جلوئه (+)
                        </button>
                    </div>
                </div>
                
                <div className={`grid gap-4 ${hasAnyTranslation ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Original Section */}
                    <div className="flex flex-col h-[500px]">
                         <div className="flex justify-between items-center mb-2 px-2">
                            <h3 className="font-semibold text-lg text-teal-400">متن اصلی ({mode === 'song' ? 'شعر' : 'متن'})</h3>
                            <button onClick={() => handleDownloadSpecificJSON('original')} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-3 text-sm rounded-lg transition-colors flex items-center gap-1.5" title="دانلود زمان‌بندی (JSON)">
                                <FileDown className="w-4 h-4" /> JSON
                            </button>
                        </div>
                        <div ref={transcriptContainerRef} className="p-6 bg-slate-900/70 rounded-lg overflow-y-auto border border-slate-700 flex-grow scrollbar-thin scrollbar-thumb-slate-600 text-right">
                            {renderTranscript()}
                        </div>
                    </div>

                    {/* Translation Section */}
                    {hasAnyTranslation && (
                         <div className="flex flex-col h-[500px]">
                            {/* Translation Tabs */}
                            <div className="flex border-b border-slate-700 mb-2 text-sm">
                                <button onClick={() => setActiveTab('persian')} className={`px-4 py-2 font-medium ${activeTab === 'persian' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}>
                                    فارسی
                                </button>
                                <button onClick={() => setActiveTab('english')} className={`px-4 py-2 font-medium ${activeTab === 'english' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}>
                                    انگلیسی
                                </button>
                                <button onClick={() => setActiveTab('finglish')} className={`px-4 py-2 font-medium ${activeTab === 'finglish' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}>
                                    فینگلیش
                                </button>
                            </div>

                            <div className="flex justify-between items-center mb-2 px-2">
                                 <h3 className="font-semibold text-lg text-slate-200">ترجمه {activeTab === 'persian' ? 'فارسی' : activeTab === 'english' ? 'انگلیسی' : 'فینگلیش'}</h3>
                                 {translations[activeTab] && (
                                    <button onClick={() => handleDownloadSpecificJSON(activeTab)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-3 text-sm rounded-lg transition-colors flex items-center gap-1.5">
                                        <FileDown className="w-4 h-4" /> JSON
                                    </button>
                                 )}
                            </div>
                            
                            <div className="p-6 bg-slate-900/70 rounded-lg overflow-y-auto border border-slate-700 flex-grow scrollbar-thin scrollbar-thumb-slate-600">
                                {isTranslating ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                                    </div>
                                ) : renderTranslationContent()}
                            </div>
                         </div>
                    )}
                </div>

                {chords && (
                    <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-teal-500/30" dir="ltr">
                        <h3 className="text-lg font-semibold text-teal-400 mb-2 flex items-center gap-2 text-right w-full justify-end">
                            <span className="mr-auto"></span> آکوردهای تشخیص داده شده <Music className="w-5 h-5" />
                        </h3>
                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 overflow-x-auto text-left">
                            {chords}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                        استودیو هوشمند ستایش
                    </h1>
                    <p className="mt-2 text-slate-400">
                        تبدیل صدا به متن با دقت ۰.۰۱ ثانیه، ترجمه، و ساخت پاورپوینت با هوش مصنوعی
                    </p>
                </header>
                
                <main className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AudioTextSyncV3;
