"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  Play, Pause, Upload, Trash2, Edit3, Check, Plus, 
  Settings, Download, Music, Volume2, Languages, 
  FileSpreadsheet, Sparkles, AlertCircle, RefreshCw 
} from "lucide-react";

type WordSegment = {
  word: string;
  start_time: number;
  end_time: number;
};

type LineType = "book_title" | "chapter_title" | "verse" | "text" | "lyric";

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

type Status = "idle" | "reading" | "transcribing" | "detecting_chords" | "exporting" | "done" | "error";
type Mode = "speech" | "song";
type TranslationTarget = "persian" | "english" | "finglish";

const STATUS_MESSAGES: Record<Status, string> = {
  idle: "فایل صوتی را اینجا رها کنید یا کلیک کنید",
  reading: "در حال خواندن فایل...",
  transcribing: "در حال تبدیل صدا به متن و استخراج زمان‌بندی دقیق با هوش مصنوعی...",
  detecting_chords: "در حال تشخیص آکوردهای موسیقی با جمینای...",
  exporting: "در حال ساخت پاورپوینت (اسلاید + تصاویر هوشمند)...",
  done: "پردازش صوتی با موفقیت تکمیل شد.",
  error: "خطایی در پردازش رخ داد.",
};

const getApiHost = () => {
  if (typeof window === "undefined") return "";
  const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isDev) {
    return window.location.port === "3000" ? "" : "http://localhost:3000";
  }
  return "";
};

class SecureGoogleGenAI {
  models = {
    generateContent: async (config: any) => {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/admin/gemini-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: `models/${config.model || "gemini-2.5-flash"}:generateContent`,
          payload: {
            contents: config.contents,
            generationConfig: config.config ? {
              responseMimeType: config.config.responseMimeType,
              responseSchema: config.config.responseSchema,
              responseModalities: config.config.responseModalities,
            } : undefined,
            systemInstruction: config.config?.systemInstruction 
              ? { parts: [{ text: config.config.systemInstruction }] }
              : undefined,
            speechConfig: config.config?.speechConfig
          }
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server returned ${res.status}`);
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return {
        text,
        response: { text: () => text },
        candidates: data.candidates
      };
    },
    generateImages: async (config: any) => {
      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/admin/gemini-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: `models/${config.model || "imagen-3.0-generate-002"}:generateImages`,
          payload: {
            prompt: config.prompt,
            numberOfImages: config.config?.numberOfImages || 1,
            outputMimeType: config.config?.outputMimeType || "image/jpeg",
            aspectRatio: "16:9"
          }
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server returned ${res.status}`);
      }
      const data = await res.json();
      return {
        generatedImages: data.generatedImages || []
      };
    }
  };
}

export default function AudioSyncClient() {
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("speech");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [chords, setChords] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [syncDelay, setSyncDelay] = useState(0);

  const [translations, setTranslations] = useState<{
    persian: string[] | null;
    english: string[] | null;
    finglish: string[] | null;
  }>({ persian: null, english: null, finglish: null });
  
  const [activeTab, setActiveTab] = useState<TranslationTarget>("persian");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncMode, setIsSyncMode] = useState(false);

  const [isGeneratingAudio, setIsGeneratingAudio] = useState<string | false>(false);
  const [generatedAudioUrls, setGeneratedAudioUrls] = useState<{
    original: string | null;
    persian: string | null;
    english: string | null;
    finglish: string | null;
  }>({ original: null, persian: null, english: null, finglish: null });

  const [showAppearance, setShowAppearance] = useState(false);
  const [wordHighlightColor, setWordHighlightColor] = useState("#2dd4bf"); 
  const [lineHighlightColor, setLineHighlightColor] = useState("#1e293b"); 

  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const translationContainerRef = useRef<HTMLDivElement>(null);

  const effectiveTime = Math.max(0, currentTime - syncDelay);

  const resetState = useCallback(() => {
    setStatus("idle");
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
    setIsEditing(false);
    setIsSyncMode(false);
    setIsGeneratingAudio(false);
    
    Object.values(generatedAudioUrls).forEach(url => {
      if (typeof url === "string") URL.revokeObjectURL(url);
    });
    setGeneratedAudioUrls({ original: null, persian: null, english: null, finglish: null });
  }, [audioUrl, generatedAudioUrls]);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result ? result.split(",")[1] : "");
      };
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: base64EncodedData, mimeType: file.type },
    };
  };

  const transcribeAudio = async (audioFile: File, selectedMode: Mode) => {
    try {
      setStatus("transcribing");
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result ? result.split(",")[1] : "");
        };
        reader.readAsDataURL(audioFile);
      });

      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/admin/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: audioFile.type,
          mode: selectedMode
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server status ${res.status}`);
      }

      const data = await res.json();
      const fullTranscript = data.lines.map((l: LineSegment) => l.content).join("\n");
      
      const finalData: TranscriptData = {
        lines: data.lines,
        fullTranscript: fullTranscript
      };

      setTranscriptData(finalData);
      return finalData;
    } catch (err: any) {
      console.error("Transcription error:", err);
      setError(`خطا در پردازش هوش مصنوعی: ${err.message || "خطای ناشناخته"}`);
      setStatus("error");
      return null;
    }
  };

  const detectChords = async (audioFile: File, transcript: string) => {
    try {
      setStatus("detecting_chords");
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result ? result.split(",")[1] : "");
        };
        reader.readAsDataURL(audioFile);
      });

      const apiHost = getApiHost();
      const res = await fetch(`${apiHost}/api/admin/detect-chords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: audioFile.type,
          transcript
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.chords && data.chords.toLowerCase() !== "none") {
          setChords(data.chords);
        }
      }
    } catch (err) {
      console.error("Chord detection error:", err);
    }
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.type.startsWith("audio/")) {
      setError("فرمت فایل نامعتبر است. لطفا فقط فایل صوتی آپلود کنید.");
      setStatus("error");
      return;
    }
    
    setStatus("reading");
    setFile(selectedFile);
    setAudioUrl(URL.createObjectURL(selectedFile));

    const transcription = await transcribeAudio(selectedFile, mode);
    
    if (transcription) {
      if (mode === "song") {
        await detectChords(selectedFile, transcription.fullTranscript);
      }
      setStatus("done");
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
    e.currentTarget.classList.remove("border-teal-400");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add("border-teal-400"); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove("border-teal-400"); };
  
  const handleLineChange = (lineIndex: number, newContent: string) => {
    setTranscriptData(prev => {
      if (!prev) return null;
      const newLines = [...prev.lines];
      newLines[lineIndex] = { ...newLines[lineIndex], content: newContent };
      return { ...prev, lines: newLines };
    });
  };

  const handleTranslationChange = (lineIndex: number, newContent: string) => {
    setTranslations(prev => {
      const currentList = prev[activeTab];
      if (!currentList) return prev;
      const newList = [...currentList];
      newList[lineIndex] = newContent;
      return { ...prev, [activeTab]: newList };
    });
  };

  const handleManualSync = (lineIndex: number, wordIndex: number) => {
    if (!audioRef.current || !transcriptData) return;
    const clickTime = audioRef.current.currentTime;
    setTranscriptData(prev => {
      if (!prev) return null;
      const newLines = [...prev.lines];
      const line = { ...newLines[lineIndex] };
      const words = [...line.words];
      
      const prevWord = words[wordIndex - 1];
      const nextWord = words[wordIndex + 1];

      const start = clickTime;
      const end = nextWord ? nextWord.start_time : clickTime + 0.5;

      words[wordIndex] = { ...words[wordIndex], start_time: start, end_time: end };
      if (prevWord) {
        words[wordIndex - 1] = { ...prevWord, end_time: start };
      }

      line.words = words;
      newLines[lineIndex] = line;
      return { ...prev, lines: newLines };
    });
  };

  const handleTranslate = async (target: TranslationTarget) => {
    if (!transcriptData) return;
    setIsTranslating(true);
    setError(null);
    setActiveTab(target); 

    try {
      const apiHost = getApiHost();
      const linesContent = transcriptData.lines.map(l => l.content);

      const res = await fetch(`${apiHost}/api/admin/nvidia-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: linesContent,
          target
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server status ${res.status}`);
      }

      const result = await res.json();
      if (result.translated_lines && Array.isArray(result.translated_lines)) {
        setTranslations(prev => ({ ...prev, [target]: result.translated_lines }));
      } else {
        throw new Error("ساختار دیتای دریافتی اشتباه است.");
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      setError(`خطا در ترجمه خودکار با انویدیا: ${err.message || "خطای ناشناخته"}`);
    } finally {
      setIsTranslating(false);
    }
  };

  function decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const handleGenerateAudio = async (sourceKey: "original" | "persian" | "english" | "finglish") => {
    let textToSpeak = "";
    
    if (sourceKey === "original") {
      textToSpeak = transcriptData?.fullTranscript || "";
    } else {
      const lines = translations[sourceKey as TranslationTarget];
      textToSpeak = lines ? lines.join("\n") : "";
    }
    
    if (!textToSpeak) return;

    setIsGeneratingAudio(sourceKey);
    setError(null);

    try {
      const ai = new SecureGoogleGenAI();
      let prompt = "";
      const isPersian = sourceKey === "persian" || (sourceKey === "original" && /[\u0600-\u06FF]/.test(textToSpeak));
      
      if (isPersian) {
        prompt = `You are a highly skilled Iranian voice actor. Read this Persian text with a polished, standard Iranian (Tehrani) accent. Be expressive. Text: "${textToSpeak}"`;
      } else {
        prompt = `Read this with a clear, engaging, and natural tone: "${textToSpeak}"`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBytes = decodeBase64(base64Audio);
        const pcmData = new Int16Array(audioBytes.buffer);
        const sampleRate = 24000, numChannels = 1, bytesPerSample = 2;
        const dataSize = pcmData.length * bytesPerSample;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);
        view.setUint32(0, 0x52494646, false); 
        view.setUint32(4, 36 + dataSize, true);
        view.setUint32(8, 0x57415645, false); 
        view.setUint32(12, 0x666d7420, false); 
        view.setUint16(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
        view.setUint16(32, numChannels * bytesPerSample, true);
        view.setUint16(34, bytesPerSample * 8, true);
        view.setUint32(36, 0x64617461, false); 
        view.setUint32(40, dataSize, true);
        for (let i = 0; i < pcmData.length; i++) {
          view.setInt16(44 + i * 2, pcmData[i], true);
        }
        const audioBlob = new Blob([view], { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setGeneratedAudioUrls(prev => ({ ...prev, [sourceKey]: url }));
      } else {
        throw new Error("هیچ دیتای صوتی تولید نشد.");
      }
    } catch (err: any) {
      console.error("TTS Generation error:", err);
      setError(`خطا در ساخت صوت خودکار: ${err.message || "خطای نامشخص"}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleExportToPowerPoint = async () => {
    if (!transcriptData || !file || !audioUrl) return;
    setStatus("exporting");
    setExportProgress(0);
    setError(null);
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const ai = new SecureGoogleGenAI();
      const pres = new PptxGenJS();
      
      pres.layout = "LAYOUT_16x9";
      const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(transcriptData.fullTranscript);
      pres.rtl = isRtl;

      let chunks: { text: string; start: number; end: number; label?: string }[] = [];
      const lines = transcriptData.lines;

      if (mode === "song") {
        for (let i = 0; i < lines.length; i += 4) {
          const slice = lines.slice(i, i + 4);
          const text = slice.map(l => l.content).join("\n");
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

          if (line.type === "book_title" || line.type === "chapter_title") {
            if (currentChunkLines.length > 0) {
              chunks.push({ 
                text: currentChunkLines.join(" "), 
                start: chunkStart, 
                end: lines[i-1].words.at(-1)?.end_time || 0 
              });
              currentChunkLines = [];
            }
            chunks.push({ text: line.content, start: lineStart, end: lineEnd });
            chunkStart = 0;
          } else {
            if (currentChunkLines.length === 0) chunkStart = lineStart;
            const labelPrefix = line.label ? `[${line.label}] ` : "";
            currentChunkLines.push(labelPrefix + line.content);

            if (currentChunkLines.length >= 3 || i === lines.length - 1) {
              chunks.push({ text: currentChunkLines.join(" "), start: chunkStart, end: lineEnd });
              currentChunkLines = [];
            }
          }
        }
      }

      setTotalSlides(chunks.length);

      for (const [index, chunk] of chunks.entries()) {
        const slide = pres.addSlide();
        // @ts-ignore
        slide.transition = { type: "cube", duration: 800 };

        const imagePrompt = mode === "song" 
          ? `Abstract, spiritual, or worship background image suitable for these song lyrics: "${chunk.text}". No text in image. High quality, 4k, soft lighting.`
          : `Create a descriptive illustration for this text: "${chunk.text}". No text in image. Cinematic lighting, professional photography style.`;

        try {
          const imageResponse = await ai.models.generateImages({ 
            model: "imagen-3.0-generate-002", 
            prompt: imagePrompt 
          });
          const b64Image = imageResponse.generatedImages[0].image.imageBytes;
          slide.addImage({ data: `data:image/jpeg;base64,${b64Image}`, w: "100%", h: "100%" });
        } catch (imgErr) {
          console.warn("Image gen failed for slide", index, imgErr);
          slide.background = { color: "111827" };
        }

        slide.addShape("roundRect", { 
          x: "10%", y: "15%", w: "80%", h: "70%", 
          fill: { color: "000000", transparency: 40 },
          rectRadius: 0.5,
          line: { color: "FFFFFF", width: 1, transparency: 60 },
          shadow: { type: "outer", color: "000000", blur: 10, offset: 5, angle: 90 }
        });
        
        const fontSize = mode === "song" ? 32 : 24;
        slide.addText(chunk.text, { 
          x: "10%", y: "15%", w: "80%", h: "70%", 
          align: "center", valign: "middle", 
          color: "FFFFFF", fontSize: fontSize, bold: true, 
          fontFace: isRtl ? "Vazirmatn" : "Segoe UI",
          rtlMode: isRtl
        });

        slide.addText("کلیسای ایرانیان واشنگتن دی سی", {
          x: 0, y: "92%", w: "100%", h: 0.5,
          align: "center", fontSize: 12, color: "E5E7EB",
          fontFace: "Vazirmatn",
          bold: true,
          shadow: { type: "outer", color: "000000", blur: 2, offset: 1, angle: 45 }
        });
        
        slide.addNotes(`Audio Segment: ${chunk.start.toFixed(2)}s - ${chunk.end.toFixed(2)}s`);

        setExportProgress(index + 1);
      }

      await pres.writeFile({ fileName: `${file.name.split(".")[0]}_presentation.pptx` });
      setStatus("done");
    } catch (err) {
      console.error("PPT generation error:", err);
      setError("خطا در تولید پاورپوینت.");
      setStatus("error");
    } finally {
      setExportProgress(0);
      setTotalSlides(0);
    }
  };

  const handleExportJson = (target: "original" | TranslationTarget) => {
    if (!transcriptData) return;
    
    let dataToSave;
    if (target === "original") {
      dataToSave = transcriptData;
    } else {
      const translatedLines = translations[target];
      if (!translatedLines) return;
      
      const mappedLines = transcriptData.lines.map((orig, index) => ({
        ...orig,
        content: translatedLines[index] || ""
      }));
      dataToSave = { ...transcriptData, lines: mappedLines };
    }
    
    const jsonContent = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.split(".")[0]}_${target}_timing.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    const onPlay = () => loop();
    const onPause = () => cancelAnimationFrame(animationFrameId);
    
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioUrl, status]);

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
          activeLineElement.scrollIntoView({ behavior: "smooth", block: "center" });
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
          activeLineElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [effectiveTime, transcriptData, activeTab, translations, isEditing, isSyncMode]);

  const renderTranscript = () => {
    if (!transcriptData) return null;

    const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(transcriptData.fullTranscript);
    const direction = isRtl ? "rtl" : "ltr";
    const fontFamily = isRtl ? "font-[Vazirmatn]" : "";

    return (
      <div className={`space-y-4 ${fontFamily}`} dir={direction}>
        {transcriptData.lines.map((line, lineIndex) => {
          if (isEditing) {
            return (
              <div key={lineIndex} className="mb-2">
                <textarea
                  value={line.content}
                  onChange={(e) => handleLineChange(lineIndex, e.target.value)}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:border-teal-500 outline-none resize-none overflow-hidden min-h-[50px] text-sm"
                  style={{ height: `${Math.max(50, line.content.length / 1.8)}px` }}
                  placeholder="Type corrected text here..."
                />
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between px-1">
                  <span>{line.type}</span>
                  <span>{(line.words[line.words.length-1]?.end_time - line.words[0]?.start_time).toFixed(1)}s</span>
                </div>
              </div>
            );
          }

          const lineStart = line.words[0]?.start_time || 0;
          const lineEnd = line.words[line.words.length - 1]?.end_time || 0;
          const isLineActive = effectiveTime >= lineStart && effectiveTime <= lineEnd;

          if (line.type === "book_title") {
            return (
              <div key={lineIndex} className={`w-full bg-blue-950/40 border-blue-600 rounded-xl p-4 mb-6 transition-all duration-500 ${isLineActive ? "shadow-lg shadow-blue-500/20 scale-[1.02] border-2" : "border border-blue-950"}`}>
                <h2 className="text-2xl font-bold text-center text-blue-100 uppercase tracking-widest drop-shadow-md">
                  {line.content}
                </h2>
              </div>
            );
          }

          if (line.type === "chapter_title") {
            return (
              <div key={lineIndex} className={`w-full bg-slate-850/40 border-teal-500 rounded-lg py-2.5 px-4 mb-4 transition-all duration-500 ${isLineActive ? "shadow-md shadow-teal-500/20 scale-[1.01] border-l-4" : "border-l-2 border-slate-700"}`}>
                <h3 className="text-xl font-semibold text-center text-teal-200">
                  {line.content}
                </h3>
              </div>
            );
          }

          const isVerse = line.type === "verse";
          const textAlign = mode === "song" ? "text-center" : (isRtl ? "text-right" : "text-left");
          
          return (
            <div 
              key={lineIndex} 
              className={`p-3 rounded-xl transition-all duration-300 ${textAlign} relative`}
              style={{ 
                backgroundColor: isLineActive ? `${lineHighlightColor}80` : "transparent", 
                borderRight: isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : "4px solid transparent",
                borderLeft: !isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : "4px solid transparent",
                transform: isLineActive ? "scale(1.015)" : "scale(1)",
                boxShadow: isLineActive ? "0 4px 12px -2px rgba(0, 0, 0, 0.3)" : "none"
              }}
            >
              {isVerse && line.label && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mx-2 mb-1 align-middle ${isLineActive ? "bg-teal-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                  {line.label}
                </span>
              )}

              {line.words.map((wordObj, wordIndex) => {
                const isWordActive = effectiveTime >= wordObj.start_time && effectiveTime < wordObj.end_time;
                return (
                  <span 
                    key={wordIndex}
                    onClick={() => isSyncMode && handleManualSync(lineIndex, wordIndex)}
                    className={`inline-block mx-1 transition-all duration-100 px-0.5 rounded text-base
                      ${isWordActive ? "font-bold" : "text-slate-300"} 
                      ${isSyncMode ? "cursor-pointer hover:bg-yellow-500/30 hover:text-yellow-200 border-b border-dashed border-yellow-600" : ""}`}
                    style={{ 
                      color: isWordActive ? wordHighlightColor : undefined,
                      textShadow: isWordActive ? `0 0 10px ${wordHighlightColor}66` : "none",
                      transform: isWordActive ? "scale(1.08)" : "scale(1)",
                    }}
                    title={isSyncMode ? "Tap to sync this word to current audio time" : ""}
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
        <div className="flex flex-col items-center justify-center h-52 text-slate-500 font-[Vazirmatn]">
          <Languages className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
          <p className="mb-2">ترجمه‌ای موجود نیست</p>
          <button onClick={() => handleTranslate(activeTab)} className="mt-2 text-teal-400 hover:text-teal-300 font-bold hover:underline flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> ایجاد ترجمه هوشمند
          </button>
        </div>
      );
    }
     
    const isRtl = activeTab === "persian";
    const fontFamily = isRtl ? "font-[Vazirmatn]" : "";
     
    return (
      <div ref={translationContainerRef} className={`space-y-4 ${fontFamily}`} dir={isRtl ? "rtl" : "ltr"}>
        {lines.map((lineText, index) => {
          const originalLine = transcriptData.lines[index];
          if (!originalLine) return null;
          
          if (isEditing) {
            return (
              <div key={index} className="mb-2">
                <textarea
                  value={lineText}
                  onChange={(e) => handleTranslationChange(index, e.target.value)}
                  className="w-full bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 focus:border-teal-500 outline-none resize-none overflow-hidden min-h-[50px] text-sm"
                  style={{ height: `${Math.max(50, lineText.length / 1.8)}px` }}
                  placeholder="Type translated text here..."
                />
              </div>
            );
          }
          
          const lineStart = originalLine.words[0]?.start_time || 0;
          const lineEnd = originalLine.words[originalLine.words.length - 1]?.end_time || 0;
          const isLineActive = effectiveTime >= lineStart && effectiveTime <= lineEnd;
          
          if (originalLine.type === "book_title") {
            return (
              <div key={index} className="w-full text-center py-2 mb-6 border-b border-dashed border-slate-700 text-blue-300 font-bold text-xl">
                {lineText}
              </div>
            );
          }
          
          if (originalLine.type === "chapter_title") {
            return (
              <div key={index} className="w-full text-center py-1 mb-4 text-teal-300 font-semibold text-lg">
                {lineText}
              </div>
            );
          }
          
          const textAlign = mode === "song" ? "text-center" : (isRtl ? "text-right" : "text-left");
          
          return (
            <div 
              key={index}
              className={`p-3 rounded-xl transition-all duration-300 ${textAlign}`}
              style={{
                backgroundColor: isLineActive ? `${lineHighlightColor}80` : "transparent",
                borderRight: isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : "4px solid transparent",
                borderLeft: !isRtl && isLineActive ? `4px solid ${wordHighlightColor}` : "4px solid transparent",
                transform: isLineActive ? "scale(1.015)" : "scale(1)",
                boxShadow: isLineActive ? "0 4px 12px -2px rgba(0, 0, 0, 0.3)" : "none"
              }}
            >
              {originalLine.type === "verse" && originalLine.label && (
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mx-1.5 align-middle ${isLineActive ? "bg-teal-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                  {originalLine.label}
                </span>
              )}
              <span className="text-base text-slate-100">{lineText}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Audio-Text Sync & Highlight
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                همگام‌سازی هوشمند فایل صوتی با متن و ترجمه به همراه هایلایت کارائوکه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAppearance(!showAppearance)}
              className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-colors"
              title="تنظیمات ظاهری"
            >
              <Settings className="w-5 h-5" />
            </button>
            {file && (
              <button 
                onClick={resetState}
                className="px-4 py-2.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-semibold transition-all duration-200 flex items-center gap-1.5 text-sm"
              >
                <Trash2 className="w-4 h-4" /> شروع مجدد
              </button>
            )}
          </div>
        </header>

        {showAppearance && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">رنگ هایلایت کلمات</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={wordHighlightColor} 
                  onChange={(e) => setWordHighlightColor(e.target.value)} 
                  className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-sm text-slate-300 uppercase">{wordHighlightColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">رنگ بک‌گراند سطر فعال</label>
              <div className="flex items-center gap-3">
                <input 
                  type="color" 
                  value={lineHighlightColor} 
                  onChange={(e) => setLineHighlightColor(e.target.value)} 
                  className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span className="font-mono text-sm text-slate-300 uppercase">{lineHighlightColor}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">خطایی رخ داد</h4>
              <p className="text-xs text-red-300/90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {status === "idle" && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-xl p-8 rounded-3xl bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-teal-500/30 transition-all duration-300 flex flex-col items-center justify-center relative group">
              <div 
                className="absolute inset-0 z-10 cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
              />
              
              <div className="w-16 h-16 rounded-2xl bg-teal-500/5 flex items-center justify-center text-teal-400 border border-teal-500/10 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-8 h-8" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-200 mt-6 font-[Vazirmatn]">
                {STATUS_MESSAGES.idle}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-[Vazirmatn] text-center">
                فایل‌های صوتی با فرمت MP3, WAV, M4A یا AAC تا سقف ۲۰۰ مگابایت
              </p>
              
              <input 
                type="file" 
                ref={inputRef} 
                onChange={handleFileChange} 
                accept="audio/*" 
                className="hidden" 
              />
            </div>

            <div className="mt-8 flex items-center justify-center gap-8 bg-slate-900/30 p-2.5 rounded-2xl border border-white/5 font-[Vazirmatn]">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider px-2">حالت پردازش:</span>
              <button 
                onClick={() => setMode("speech")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === "speech" ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20" : "text-slate-400 hover:text-slate-200"}`}
              >
                موعظه و سخنرانی
              </button>
              <button 
                onClick={() => setMode("song")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === "song" ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20" : "text-slate-400 hover:text-slate-200"}`}
              >
                سرود پرستشی (کارائوکه)
              </button>
            </div>
          </div>
        )}

        {(status === "reading" || status === "transcribing" || status === "detecting_chords" || status === "exporting") && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
              <Sparkles className="w-6 h-6 text-teal-400 absolute animate-pulse" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-200 mt-6 font-[Vazirmatn] tracking-wide">
              {STATUS_MESSAGES[status]}
            </h3>
            
            {status === "exporting" && totalSlides > 0 && (
              <div className="w-64 mt-4">
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-teal-400 h-full transition-all duration-300"
                    style={{ width: `${(exportProgress / totalSlides) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-2 text-center font-mono">
                  Slide {exportProgress} of {totalSlides}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "done" && transcriptData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Left Side: Audio and Original Transcript */}
            <div className="p-5 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-xl flex flex-col h-[75vh]">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2 font-[Vazirmatn]">
                  <Music className="w-5 h-5 text-teal-400" />
                  <span className="font-bold text-slate-200">متن صوتی و زمان‌بندی</span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isEditing ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    {isEditing ? "ذخیره متن" : "ویرایش دستی"}
                  </button>
                  
                  <button 
                    onClick={() => setIsSyncMode(!isSyncMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${isSyncMode ? "bg-yellow-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                    disabled={isEditing}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {isSyncMode ? "پایان همگام‌سازی" : "همگام‌سازی زنده"}
                  </button>
                </div>
              </div>

              {/* Scrollable Transcript Area */}
              <div 
                ref={transcriptContainerRef}
                className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar"
              >
                {renderTranscript()}
              </div>

              {/* Bottom Audio Controller */}
              {audioUrl && (
                <div className="border-t border-white/5 pt-4 mt-4 space-y-4">
                  <audio 
                    ref={audioRef}
                    src={audioUrl} 
                    controls 
                    className="w-full filter invert hue-rotate-180 brightness-95" 
                  />

                  {/* Sync Delay Slider */}
                  <div className="flex items-center justify-between gap-4 bg-slate-950 p-2.5 rounded-xl border border-white/5 text-xs text-slate-400 font-mono">
                    <span className="font-[Vazirmatn]">تعدیل زمان‌بندی همزمان (ثانیه):</span>
                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                      <input 
                        type="range" 
                        min="-2" 
                        max="2" 
                        step="0.05"
                        value={syncDelay} 
                        onChange={(e) => setSyncDelay(parseFloat(e.target.value))}
                        className="w-full accent-teal-400"
                      />
                      <span>{syncDelay > 0 ? `+${syncDelay.toFixed(2)}` : syncDelay.toFixed(2)}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Translation, Audio Synthesis, and Chords */}
            <div className="space-y-6">
              
              {/* Tab Header for Translation / Chords */}
              <div className="p-5 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-xl flex flex-col h-[60vh]">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-2 font-[Vazirmatn]">
                    <Languages className="w-5 h-5 text-teal-400" />
                    <span className="font-bold text-slate-200">ترجمه و بومی‌سازی اسلایدها</span>
                  </div>

                  <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5 text-xs">
                    <button 
                      onClick={() => { setActiveTab("persian"); handleTranslate("persian"); }}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${activeTab === "persian" ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      فارسی
                    </button>
                    <button 
                      onClick={() => { setActiveTab("english"); handleTranslate("english"); }}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${activeTab === "english" ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      English
                    </button>
                    <button 
                      onClick={() => { setActiveTab("finglish"); handleTranslate("finglish"); }}
                      className={`px-3 py-1.5 rounded-md font-semibold transition-all ${activeTab === "finglish" ? "bg-teal-500 text-slate-950" : "text-slate-400 hover:text-slate-200"}`}
                    >
                      Finglish
                    </button>
                  </div>
                </div>

                <div 
                  ref={translationContainerRef}
                  className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar"
                >
                  {isTranslating ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 font-[Vazirmatn]">
                      <RefreshCw className="w-8 h-8 animate-spin mb-2 text-teal-400" />
                      <p>در حال ایجاد ترجمه خودکار با هوش مصنوعی...</p>
                    </div>
                  ) : renderTranslationContent()}
                </div>
              </div>

              {/* Chords Block */}
              {mode === "song" && chords && (
                <div className="p-5 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-xl">
                  <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2 font-[Vazirmatn]">
                    <Music className="w-4.5 h-4.5 text-teal-400" /> آکوردهای تشخیص داده شده سرود
                  </h4>
                  <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl text-sm font-mono text-teal-300 overflow-x-auto whitespace-pre-wrap">
                    {chords}
                  </pre>
                </div>
              )}

              {/* Export Panel */}
              <div className="p-5 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-xl grid grid-cols-2 gap-3 font-[Vazirmatn]">
                <button 
                  onClick={handleExportToPowerPoint}
                  className="p-3.5 rounded-2xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-all flex flex-col items-center gap-2 text-xs"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  ساخت پاورپوینت هوشمند
                </button>

                <button 
                  onClick={() => handleExportJson("original")}
                  className="p-3.5 rounded-2xl bg-slate-800 text-slate-200 font-semibold border border-white/5 hover:bg-slate-700 transition-all flex flex-col items-center gap-2 text-xs"
                >
                  <Download className="w-5 h-5" />
                  دانلود فایل JSON زمان‌بندی
                </button>
              </div>

              {/* Text to Speech Panel */}
              <div className="p-5 rounded-3xl bg-slate-900/30 border border-white/5 backdrop-blur-xl">
                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 font-[Vazirmatn]">
                  <Volume2 className="w-4.5 h-4.5 text-teal-400" /> تبدیل متن به صدای طبیعی (TTS)
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs font-[Vazirmatn]">
                  {(["original", "persian", "english", "finglish"] as const).map(key => {
                    const hasData = key === "original" ? !!transcriptData : !!translations[key];
                    const audioUrl = generatedAudioUrls[key];
                    
                    return (
                      <div key={key} className="p-2.5 rounded-xl bg-slate-950 border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="capitalize font-semibold text-slate-400">
                            {key === "original" ? "متن اصلی" : key}
                          </span>
                          
                          {!audioUrl && (
                            <button
                              onClick={() => handleGenerateAudio(key)}
                              disabled={!hasData || !!isGeneratingAudio}
                              className="px-2 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 font-semibold transition-colors disabled:opacity-50 text-[10px] flex items-center gap-1"
                            >
                              {isGeneratingAudio === key ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                              تولید
                            </button>
                          )}
                        </div>

                        {audioUrl && (
                          <audio src={audioUrl} controls className="w-full scale-90 origin-left filter invert brightness-95" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
