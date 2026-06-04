"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Youtube, Music, AlignLeft, Guitar, Heart, Mic2,
  Play, Pause, ChevronDown, Zap, Radio, Music2, Maximize2, Minimize2, Loader2
} from "lucide-react";
import { type WorshipSong, toggleLikeWorshipSong } from "@/actions/worship";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { SongSectionsAccordion } from "./SongSectionsAccordion";
import { SmartWorshipPlayer, getSafeAudioUrl } from "./SmartWorshipPlayer";

interface Props {
  song: WorshipSong;
  onClose: () => void;
  initialLiked?: boolean;
  onLikeChange?: (songId: string, liked: boolean, count: number) => void;
  autoPlay?: boolean;
}

// ── Strip inline chord annotations [Am] [F]
function stripChords(text: string): string {
  return text.replace(/\[[A-G][^\[\]]*\]/g, "").replace(/  +/g, " ");
}

// ── Section types for Live Lyrics view
const SECTION_PATTERN = /^(Verse[\s\d]*|Chorus|Bridge|Intro|Outro|Pre-?[Cc]horus|Tag|Interlude)\s*$/i;
const SECTION_LABELS: Record<string, string> = {
  verse: "بند", "verse 1": "بند ۱", "verse 2": "بند ۲", "verse 3": "بند ۳",
  chorus: "ترجیع‌بند", bridge: "پل", intro: "مقدمه",
  outro: "پایان‌بندی", "pre-chorus": "پیش ترجیع", tag: "تگ", interlude: "میانی",
};

// ── Parse lyrics into sections for Live Lyrics view
function parseSections(text: string): { type: string; label: string; lines: string[] }[] {
  const clean = stripChords(text);
  const rawLines = clean.split("\n");
  const sections: { type: string; label: string; lines: string[] }[] = [];
  let current: { type: string; label: string; lines: string[] } = { type: "body", label: "", lines: [] };

  rawLines.forEach(line => {
    const t = line.trim();
    if (!t) return;
    if (SECTION_PATTERN.test(t)) {
      if (current.lines.length > 0) sections.push(current);
      current = { type: t.toLowerCase(), label: SECTION_LABELS[t.toLowerCase()] || t, lines: [] };
    } else {
      current.lines.push(t);
    }
  });
  if (current.lines.length > 0) sections.push(current);
  return sections;
}

// ── Inline Live Karaoke component for the main tab
function KaraokeLyrics({
  text,
  timingData,
  currentTime,
  dir = "rtl",
  isExpanded = false
}: {
  text: string;
  timingData?: any;
  currentTime?: number;
  dir?: "rtl" | "ltr";
  isExpanded?: boolean;
}) {
  // If we have AI timing data, render a fully synced live scrollable text
  if (timingData && timingData.lines && timingData.lines.length > 0) {
    return (
      <div dir={dir} className="space-y-4 font-[Vazirmatn] select-text py-4 overflow-y-auto max-h-[60vh] custom-scrollbar scroll-smooth">
        {timingData.lines.map((line: any, lineIdx: number) => {
          const start = line.words[0]?.start_time || 0;
          const end = line.words[line.words.length - 1]?.end_time || 0;
          const isPast = (currentTime || 0) > end;
          const isActive = (currentTime || 0) >= start && (currentTime || 0) <= end + 0.5;

          return (
            <p key={lineIdx} className={cn(
              "leading-[2] transition-all duration-300",
              isExpanded ? "text-3xl sm:text-4xl font-black py-4" : "text-xl sm:text-2xl font-bold",
              isActive ? "text-primary scale-105 origin-right" : isPast ? "text-foreground opacity-90" : "text-muted-foreground/60"
            )}>
              {line.words.map((word: any, wIdx: number) => {
                const isWordActive = (currentTime || 0) >= word.start_time && (currentTime || 0) <= word.end_time;
                const isWordPast = (currentTime || 0) > word.end_time;
                return (
                  <span key={wIdx} className={cn(
                    "inline-block mr-1.5 transition-colors duration-200",
                    isWordActive ? "text-primary drop-shadow-md" : isPast ? "" : isWordPast ? "text-foreground opacity-90" : ""
                  )}>
                    {word.word}
                  </span>
                );
              })}
              
              {line.translations?.finglish && (
                 <span className={cn(
                    "block font-mono text-sm sm:text-lg mt-2 tracking-wide transition-opacity duration-300",
                    isActive ? "text-primary/90" : "text-muted-foreground/40"
                 )} dir="ltr">
                    {line.translations.finglish}
                 </span>
              )}

              {line.translations?.english && (
                 <span className={cn(
                    "block font-sans text-xs sm:text-base mt-1 tracking-wide transition-opacity duration-300",
                    isActive ? "text-foreground/80" : "text-muted-foreground/30"
                 )} dir="ltr">
                    {line.translations.english}
                 </span>
              )}
            </p>
          );
        })}
      </div>
    );
  }

  // Fallback to static text parsing
  const clean = stripChords(text);
  const lines = clean.split("\n");
  
  return (
    <div dir={dir} className="space-y-3 font-[Vazirmatn] select-text py-4">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-2" />;
        return (
          <p key={lineIdx} className={cn(
             "leading-[2] text-foreground transition-all duration-500",
             isExpanded ? "text-2xl sm:text-3xl font-bold py-2" : "text-lg md:text-xl font-medium"
          )}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}


type Tab = "lyrics-fa" | "lyrics-en" | "chords";
type FocusMode = "lyrics" | "media" | null;

export function SongDetailsModal({ song, onClose, initialLiked = false, onLikeChange, autoPlay = false }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(song.likes_count || 0);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("lyrics-fa");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLiveLyrics, setShowLiveLyrics] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusMode>(null);
  const [youtubeKey, setYoutubeKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  // rAF loop for smooth karaoke time sync
  const startTimeSync = useCallback(() => {
    const tick = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimeSync = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const hasLyricsFA = !!song.lyrics_fa;
  const hasLyricsEN = !!song.lyrics_en;
  const hasSeparateChords = !!(song as any).chords;
  const lyricsHaveChords = hasLyricsFA && /\[[A-G]/.test(song.lyrics_fa || "");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    ...(hasLyricsFA ? [{ id: "lyrics-fa" as Tab, label: "متن فارسی", icon: Mic2 }] : []),
    ...(hasLyricsEN ? [{ id: "lyrics-en" as Tab, label: "English", icon: AlignLeft }] : []),
    ...(lyricsHaveChords || hasSeparateChords ? [{ id: "chords" as Tab, label: "🎸 آکوردها", icon: Guitar }] : []),
  ];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, []);

  useEffect(() => {
    if (autoPlay && audioRef.current && song.audio_url) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [autoPlay, song.audio_url]);

  // ── SMART STOP: If audio starts, ensure YouTube is reset and Cinema mode exited
  useEffect(() => {
    if (isPlaying) {
      setYoutubeKey(k => k + 1);
      setFocusMode(prev => prev === "media" ? null : prev);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { 
      audioRef.current.pause();
      stopTimeSync();
      setIsPlaying(false); 
    } else { 
      audioRef.current.play().then(() => { setIsPlaying(true); startTimeSync(); }).catch(() => {}); 
    }
  };

  const handleSetFocusMode = (mode: FocusMode | ((prev: FocusMode) => FocusMode)) => {
    setFocusMode(prev => {
      const next = typeof mode === "function" ? mode(prev) : mode;
      // ── SMART STOP: If focusing on media, stop audio
      if (next === "media") {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
      return next;
    });
  };

  const handleLike = async () => {
    if (!user) { alert("لطفاً برای لایک کردن ابتدا وارد شوید"); return; }
    const { success, liked: newLiked, count } = await toggleLikeWorshipSong(song.id, user.id);
    if (success) { setLiked(newLiked); setLikeCount(count); onLikeChange?.(song.id, newLiked, count); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4" style={{ top: "64px" }} dir="ltr">
      <div className="absolute inset-x-0 bottom-0 top-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250" 
        style={{ maxHeight: "calc(100vh - 76px)", marginBottom: "env(safe-area-inset-bottom, 0px)" }} dir="rtl">

        {showLiveLyrics && hasLyricsFA && song.timing_data && (
          <div className="absolute inset-0 z-20 flex flex-col bg-background/98 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
            <button 
                onClick={() => setShowLiveLyrics(false)}
                className="absolute top-4 left-6 z-[99] shrink-0 p-3 flex items-center gap-2 bg-black/40 hover:bg-red-500 hover:text-white rounded-full text-white backdrop-blur-md transition-all shadow-xl border border-white/10"
                title="خروج از حالت کارائوکه">
                <ChevronDown className="w-5 h-5" />
            </button>
            <div className="flex-1 w-full relative">
              <SmartWorshipPlayer 
                timingData={song.timing_data} 
                audioSrc={song.audio_url ? getSafeAudioUrl(song.audio_url) : ""} 
                viewOnly={true}
                externalCurrentTime={currentTime}
                onClose={() => setShowLiveLyrics(false)}
              />
            </div>
          </div>
        )}

        {/* ── Header (Collapsible) */}
        <div className={cn(
          "px-5 border-b border-border shrink-0 bg-secondary/30 transition-all duration-500 ease-in-out overflow-hidden flex items-start justify-between",
          focusMode ? "h-0 opacity-0 py-0 border-b-0" : "h-auto opacity-100 py-5"
        )}>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-foreground leading-tight">{song.title_fa}</h2>
            {song.title_en && <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{song.title_en}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {song.artist && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-secondary border border-border px-2.5 py-1 rounded-xl">
                  <Music className="w-3 h-3 text-primary" /> {song.artist}
                </span>
              )}
              {song.youtube_id && (
                <button
                  onClick={() => handleSetFocusMode(m => m === "media" ? null : "media")}
                  className={cn("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border transition-all",
                    focusMode === "media" ? "bg-red-500 text-white border-red-500" : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/15")}>
                  <Youtube className="w-3 h-3" /> یوتیوب
                </button>
              )}
              <button onClick={handleLike} title={liked ? "برداشتن لایک" : "لایک"}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all",
                  liked ? "bg-pink-500/15 text-pink-500 border-pink-500/30" : "bg-secondary text-muted-foreground border-border hover:text-pink-500 hover:border-pink-500/30")}>
                <Heart className={cn("w-3 h-3", liked && "fill-current")} /> {likeCount}
              </button>
            </div>
          </div>
          <button onClick={onClose} title="بستن"
            className="flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Media Container (Master of Transitions) */}
        <div className="relative flex-none">
          {/* YouTube PIP / Player */}
          {song.youtube_id && (
            <div className={cn(
              "transition-all duration-500 ease-in-out z-10",
              focusMode === "lyrics" 
                ? "absolute top-4 left-4 w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-primary shadow-2xl scale-125 origin-top-left" 
                : "relative w-full px-5 py-3 border-b border-border bg-secondary/10",
              focusMode === "media" && "py-0 px-0"
            )}>
              <div className={cn(
                "overflow-hidden bg-black border border-border transition-all duration-500",
                focusMode === "lyrics" ? "w-full h-full rounded-full" : "rounded-2xl aspect-video mx-auto",
                focusMode === "media" && "rounded-none w-full h-[35vh] sm:h-[45vh] border-none"
              )}>
                {focusMode === "lyrics" ? (
                  <div className="w-full h-full flex items-center justify-center bg-red-600 cursor-pointer group"
                    onClick={() => handleSetFocusMode("media")}>
                    <Youtube className="w-6 h-6 text-white group-hover:scale-125 transition-transform" />
                  </div>
                ) : (
                  <iframe key={youtubeKey} title={`${song.title_fa} — YouTube`}
                    src={`https://www.youtube.com/embed/${song.youtube_id}?rel=0&autoplay=${focusMode === "media" ? '1' : '0'}`}
                    className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                )}
              </div>
              {/* Media Focus Badge */}
              {focusMode === "media" && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                   <button onClick={() => handleSetFocusMode(null)} title="خروج از سینما"
                     className="p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 border border-white/20 transition-all">
                     <Minimize2 className="w-4 h-4" />
                   </button>
                </div>
              )}
            </div>
          )}

          {/* Audio Player (Compact - hidden in karaoke mode, SmartWorshipPlayer handles audio) */}
          {song.audio_url && !(focusMode === "lyrics" && song.timing_data) && (
            <div className={cn(
              "px-5 border-b border-border shrink-0 bg-gradient-to-r from-primary/5 to-purple-500/5 transition-all duration-500",
              focusMode === "media" ? "py-2 opacity-80 hover:opacity-100" : "py-3"
            )}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <audio ref={audioRef} src={song.audio_url ? getSafeAudioUrl(song.audio_url) : ""} className={cn("w-full transition-all", focusMode === "media" ? "h-6" : "h-8")}
                    onPlay={() => { startTimeSync(); setIsPlaying(true); }} onPause={() => { stopTimeSync(); setIsPlaying(false); }} onEnded={() => { stopTimeSync(); setIsPlaying(false); }}
                    controls preload="metadata" controlsList="nodownload" />
                </div>
                {hasLyricsFA && focusMode === null && (
                  <button onClick={() => setShowLiveLyrics(v => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs shrink-0 transition-all bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/15">
                    <Zap className="w-3.5 h-3.5" /> Live Lyrics
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs (Universal Focus Toggles) */}
        <div className={cn(
          "flex items-center gap-1.5 px-5 py-2.5 shrink-0 border-b border-border bg-secondary/10 transition-all",
          focusMode === "media" && "opacity-50 pointer-events-none grayscale"
        )}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            const isFocused = focusMode === "lyrics" && tab.id === "lyrics-fa";
            return (
              <button 
                key={tab.id} 
                onClick={() => {
                  if (tab.id === "lyrics-fa") {
                    if (isTabActive) handleSetFocusMode(f => f === "lyrics" ? null : "lyrics");
                    else { setActiveTab(tab.id); handleSetFocusMode("lyrics"); }
                  } else {
                    setActiveTab(tab.id);
                    handleSetFocusMode(null);
                  }
                }}
                className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all relative",
                  isTabActive
                    ? tab.id === "chords" ? "bg-purple-500/15 text-purple-600 border-purple-500/30" : "bg-primary/10 text-primary border-primary/25"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground",
                  isFocused && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}>
                <Icon className={cn("w-3.5 h-3.5", isFocused && "animate-bounce")} />
                {tab.label}
                {isFocused && (
                   <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content (Smart Transitions) */}
        <div className={cn(
          "flex-1 overflow-y-auto px-5 py-4 custom-scrollbar transition-all duration-500 ease-in-out bg-background/50",
          focusMode === "lyrics" ? "py-8 px-6 sm:px-10" : "py-4 px-5",
          focusMode === "media" && "bg-black/20"
        )}>
          {focusMode === "lyrics" && (
            <div className="flex items-center justify-between mb-6 animate-in fade-in slide-in-from-top-2 duration-400">
               <div className="flex items-center gap-3">
                 <span className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/25">
                   <Maximize2 className="w-4 h-4" /> نمای متمرکز متن
                 </span>
                 <p className="text-xs text-muted-foreground font-bold hidden sm:block">یوتیوب به حالت PIP (تصویر در تصویر) درآمد</p>
               </div>
               <button onClick={() => handleSetFocusMode(null)} title="خروج از تمرکز"
                 className="p-2.5 bg-secondary rounded-full hover:bg-secondary/80 text-foreground transition-all border border-border shadow-sm">
                 <ChevronDown className="w-5 h-5" />
               </button>
            </div>
          )}
          
          {activeTab === "lyrics-fa" && hasLyricsFA && (
            <div className={cn(
              "bg-card border border-border rounded-2xl shadow-sm transition-all duration-500 overflow-hidden",
              focusMode === "lyrics" && "shadow-[0_25px_70px_-15px_rgba(0,0,0,0.4)] border-primary/40 ring-2 ring-primary/5"
            )}>
              {/* ✨ SmartWorshipPlayer (Karaoke): controls its own audio when timing_data exists in focus mode */}
              {focusMode === "lyrics" && song.timing_data ? (
                <SmartWorshipPlayer
                  timingData={song.timing_data}
                  audioSrc={song.audio_url ? getSafeAudioUrl(song.audio_url) : ""}
                  onTimeUpdate={(t) => {
                    // If karaoke is playing, stop YouTube (mutual exclusion)
                    if (t > 0) {
                      setYoutubeKey(k => k + 1);
                      setFocusMode(prev => prev === "media" ? "lyrics" : prev);
                    }
                  }}
                  onClose={() => handleSetFocusMode(null)}
                  backgroundImage={song.youtube_id
                    ? `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`
                    : undefined
                  }
                  backgroundOpacity={45}
                  backgroundBlur={4}
                  textShadow={true}
                />
              ) : (
                <div className="px-5 pb-6">
                  <KaraokeLyrics 
                     text={song.lyrics_fa || ""} 
                     timingData={song.timing_data}
                     currentTime={currentTime}
                     isExpanded={focusMode === "lyrics"} 
                     dir="rtl"
                  />
                </div>
              )}
            </div>
          )}
          {activeTab === "lyrics-en" && hasLyricsEN && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm" dir="ltr">
              <KaraokeLyrics text={song.lyrics_en || ""} dir="ltr" />
            </div>
          )}
          {activeTab === "chords" && (
            <div className="space-y-4 select-text font-sans">
              {hasSeparateChords && song.chords && (
                <pre className="whitespace-pre-wrap font-mono text-sm sm:text-base leading-relaxed p-4 bg-secondary/40 rounded-2xl border border-border/80 text-foreground" dir="ltr">
                  {song.chords}
                </pre>
              )}
              {lyricsHaveChords && song.lyrics_fa && (
                <SongSectionsAccordion lyrics={song.lyrics_fa} showChords={true} />
              )}
            </div>
          )}
        </div>

        {/* ── Sticky Footer */}
        <div className="shrink-0 border-t border-border bg-secondary/30 px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] sm:pb-3 flex items-center justify-between gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 text-red-500 font-bold text-sm transition-all">
            <X className="w-4 h-4" /> بستن
          </button>
          <div className="flex gap-2">
            {hasLyricsFA && (
              <button 
                onClick={() => handleSetFocusMode(f => f === "lyrics" ? null : "lyrics")}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border",
                  focusMode === "lyrics" ? "bg-primary text-white border-primary" : "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20")}>
                <Maximize2 className="w-4 h-4" /> نمای تمام متن
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
