import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";
import axios from "axios";
import { BookOpen, Volume2, Loader2, AlertTriangle, Play, Pause, Check } from "lucide-react";

const voices = [
  { id: "Kore", name: "کوره", description: "صدای زنانه گرم", icon: "" },
  { id: "Puck", name: "پوک", description: "صدای مردانه پرانرژی", icon: "" },
  { id: "Charon", name: "کارون", description: "صدای مردانه عمیق", icon: "" },
  { id: "Fenrir", name: "فنریر", description: "صدای مردانه قدرتمند", icon: "" },
  { id: "Zephyr", name: "زِفیر", description: "صدای زنانه ملایم", icon: "" }
];

interface BibleBook {
  key: string;
  name: {
    fa: string;
    en: string;
  };
  chapters: number;
  testament: string;
}

const BibleWithTTS: React.FC = () => {
  const { lang } = useLanguage();
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>("GEN");
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [chapterText, setChapterText] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("Zephyr");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await axios.get("/api/bible/books");
        if (response.data.success) {
          setBooks(response.data.books || []);
        }
      } catch (err) {
        console.error("Error loading books:", err);
      }
    };
    loadBooks();
  }, []);

  useEffect(() => {
    const loadChapterText = async () => {
      if (!selectedBook || !selectedChapter) return;
      try {
        const response = await axios.get(`/api/bible/content/${selectedBook}/${selectedChapter}`);
        if (response.data.success) {
          const verses = response.data.verses;
          const text = lang === "fa" ? verses.fa?.filter(Boolean).join(" ") || "" : verses.en?.filter(Boolean).join(" ") || "";
          setChapterText(text);
        }
      } catch (err) {
        console.error("Error loading chapter:", err);
        setChapterText("");
      }
    };
    loadChapterText();
  }, [selectedBook, selectedChapter, lang]);

  useEffect(() => {
    const checkCache = async () => {
      if (!selectedBook || !selectedChapter || !selectedVoice) return;
      try {
        const response = await axios.get(`/api/bible-audio/check/${selectedBook}/${selectedChapter}/${selectedVoice}`);
        if (response.data.exists) {
          setIsCached(true);
          setAudioUrl(response.data.url);
        } else {
          setIsCached(false);
          setAudioUrl(null);
        }
      } catch (err) {
        setIsCached(false);
        setAudioUrl(null);
      }
    };
    checkCache();
  }, [selectedBook, selectedChapter, selectedVoice]);

  const generateAudio = async () => {
    if (!chapterText || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await axios.post("/api/bible-audio/generate", { bookCode: selectedBook, chapter: selectedChapter, voice: selectedVoice, text: chapterText });
      if (response.data.success) {
        setAudioUrl(response.data.url);
        setIsCached(true);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
            audioRef.current.play();
            setIsPlaying(true);
          }
        }, 100);
      } else {
        setError(response.data.error || "خطا در تولید صدا");
      }
    } catch (err: any) {
      console.error("Error generating audio:", err);
      setError(err.response?.data?.error || "خطا در ارتباط با سرور");
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const currentBook = books.find(b => b.key === selectedBook);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-amber-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">{lang === "fa" ? "کتاب مقدس صوتی" : "Audio Bible"}</h1>
              <p className="text-stone-600 mt-1">{lang === "fa" ? "کلام خدا را با صدای هوش مصنوعی بشنوید" : "Listen to the Word of God with AI voice"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">{lang === "fa" ? " کتاب" : " Book"}</label>
              <select value={selectedBook} onChange={(e) => { setSelectedBook(e.target.value); setSelectedChapter(1); }} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold text-stone-700 hover:border-amber-300" dir={lang === "fa" ? "rtl" : "ltr"}>
                <optgroup label={lang === "fa" ? "عهد عتیق" : "Old Testament"}>
                  {books.filter(b => b.testament === "OT").map(book => (<option key={book.key} value={book.key}>{lang === "fa" ? book.name.fa : book.name.en}</option>))}
                </optgroup>
                <optgroup label={lang === "fa" ? "عهد جدید" : "New Testament"}>
                  {books.filter(b => b.testament === "NT").map(book => (<option key={book.key} value={book.key}>{lang === "fa" ? book.name.fa : book.name.en}</option>))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">{lang === "fa" ? " باب" : " Chapter"}</label>
              <select value={selectedChapter} onChange={(e) => setSelectedChapter(Number(e.target.value))} className="w-full px-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-500 transition-all font-semibold text-stone-700 hover:border-amber-300" dir={lang === "fa" ? "rtl" : "ltr"}>
                {Array.from({ length: currentBook?.chapters || 1 }, (_, i) => i + 1).map(num => (<option key={num} value={num}>{lang === "fa" ? `باب ${num}` : `Chapter ${num}`}</option>))}
              </select>
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-semibold text-stone-700 mb-3">{lang === "fa" ? " انتخاب صدا" : " Voice Selection"}</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {voices.map(voice => (<button key={voice.id} onClick={() => setSelectedVoice(voice.id)} className={`p-4 rounded-xl border-2 transition-all text-center ${selectedVoice === voice.id ? "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-600 text-white shadow-lg scale-105" : "bg-white border-stone-200 text-stone-700 hover:border-amber-400 hover:shadow-md"}`}><div className="text-2xl mb-1">{voice.icon}</div><div className="text-sm font-bold">{voice.name}</div><div className="text-xs opacity-80 mt-1">{voice.description}</div></button>))}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <button onClick={generateAudio} disabled={isGenerating || !chapterText} className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${isGenerating || !chapterText ? "bg-stone-300 text-stone-500 cursor-not-allowed" : "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-95"}`}>{isGenerating ? (<><Loader2 className="w-6 h-6 animate-spin" /><span>{lang === "fa" ? "در حال تولید صدا..." : "Generating Audio..."}</span></>) : (<><Volume2 className="w-6 h-6" /><span>{lang === "fa" ? "تولید صدا" : "Generate Audio"}</span></>)}</button>
            {isCached && (<div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 font-semibold"><Check className="w-5 h-5" /><span>{lang === "fa" ? "ذخیره شده" : "Cached"}</span></div>)}
          </div>
          {audioUrl && (<div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Volume2 className="w-6 h-6 text-amber-600" /><div><div className="font-bold text-stone-800">{lang === "fa" ? currentBook?.name.fa : currentBook?.name.en}</div><div className="text-sm text-stone-600">{lang === "fa" ? `باب ${selectedChapter}` : `Chapter ${selectedChapter}`}</div></div></div><button onClick={isPlaying ? pauseAudio : playAudio} className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all hover:scale-110">{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}</button></div><audio ref={audioRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} controls className="w-full" /></div>)}
          {error && (<div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3"><AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" /><div><div className="font-bold text-red-800 mb-1">{lang === "fa" ? "خطا" : "Error"}</div><div className="text-red-700" dir={lang === "fa" ? "rtl" : "ltr"}>{error}</div></div></div>)}
          {chapterText && (<div className="mt-6"><label className="block text-sm font-semibold text-stone-700 mb-2">{lang === "fa" ? " متن باب" : " Chapter Text"}</label><div className="p-4 bg-stone-50 border-2 border-stone-200 rounded-xl max-h-40 overflow-y-auto text-stone-700 leading-relaxed" dir={lang === "fa" ? "rtl" : "ltr"}>{chapterText.substring(0, 500)}{chapterText.length > 500 && "..."}</div><div className="text-xs text-stone-500 mt-2 text-center">{chapterText.length} {lang === "fa" ? "کاراکتر" : "characters"}</div></div>)}
        </div>
        <div className="text-center text-stone-600 text-sm">
          <p className="flex items-center justify-center gap-2"><span>{lang === "fa" ? "طراحی شده توسط" : "Designed by"}</span><span className="font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Google Gemini 2.5 Flash TTS</span></p>
          <p className="mt-2 text-stone-500">{lang === "fa" ? " کلیسای مسیحیان ایرانی واشنگتن دی‌سی" : " Iranian Christian Church DC"}</p>
        </div>
      </div>
    </div>
  );
};

export default BibleWithTTS;
