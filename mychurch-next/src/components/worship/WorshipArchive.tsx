"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Search, Play, Pause, FileText, Music, LayoutGrid, Youtube,
  List, Filter, Shuffle, SkipForward, SkipBack, X, Volume2,
  Mic, ExternalLink, Heart, ChevronDown
} from "lucide-react";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";
import { useLanguage } from "@/providers/LanguageProvider";
import { type WorshipSong } from "@/actions/worship";
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";

const KaraokeModal = dynamic(
  () => import('./KaraokeModal').then(mod => ({ default: mod.KaraokeModal })),
  { ssr: false }
);

// ─── Global Audio Player State ─────────────────────────────────────────────
type PlayState = {
  song: WorshipSong | null;
  index: number;
  playlist: WorshipSong[];
  isPlaying: boolean;
  progress: number;
  duration: number;
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function WorshipArchive({ initialSongs }: { initialSongs: WorshipSong[] }) {
  const { t } = useLanguage();

  // ── Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArtistFilter, setShowArtistFilter] = useState(false);

  // ── Karaoke
  const [activeKaraokeSong, setActiveKaraokeSong] = useState<WorshipSong | null>(null);

  // ── Audio Player
  const audioRef = useRef<HTMLAudioElement>(null);
  const [player, setPlayer] = useState<PlayState>({
    song: null, index: -1, playlist: [], isPlaying: false, progress: 0, duration: 0
  });

  const playSong = useCallback((song: WorshipSong, playlist: WorshipSong[]) => {
    if (!song.audio_url) return;
    const index = playlist.findIndex(s => s.id === song.id);
    setPlayer(p => ({ ...p, song, index, playlist, isPlaying: true, progress: 0 }));
    if (audioRef.current) {
      audioRef.current.src = song.audio_url;
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (player.isPlaying) {
      audioRef.current.pause();
      setPlayer(p => ({ ...p, isPlaying: false }));
    } else {
      audioRef.current.play().catch(console.error);
      setPlayer(p => ({ ...p, isPlaying: true }));
    }
  }, [player.isPlaying]);

  const playNext = useCallback(() => {
    const next = (player.index + 1) % player.playlist.length;
    playSong(player.playlist[next], player.playlist);
  }, [player, playSong]);

  const playPrev = useCallback(() => {
    const prev = player.index === 0 ? player.playlist.length - 1 : player.index - 1;
    playSong(player.playlist[prev], player.playlist);
  }, [player, playSong]);

  const playAll = (shuffle = false) => {
    const songs = [...filteredSongs].filter(s => s.audio_url);
    if (!songs.length) return;
    const list = shuffle ? songs.sort(() => Math.random() - 0.5) : songs;
    playSong(list[0], list);
  };

  // ── Derived Data
  const alphabet = useMemo(() => {
    const letters = new Set<string>();
    initialSongs.forEach(song => {
      const c = song.title_fa?.trim().charAt(0);
      if (c) letters.add(c);
    });
    return Array.from(letters).sort();
  }, [initialSongs]);

  const artists = useMemo(() => {
    const set = new Set<string>();
    initialSongs.forEach(s => { if (s.artist) set.add(s.artist); });
    return Array.from(set).sort();
  }, [initialSongs]);

  const filteredSongs = useMemo(() => {
    let result = initialSongs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.title_fa?.includes(searchQuery) ||
        s.title_en?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q)
      );
    } else {
      if (selectedAlphabet) result = result.filter(s => s.title_fa?.trim().startsWith(selectedAlphabet));
      if (selectedArtist !== "all") result = result.filter(s => s.artist === selectedArtist);
    }
    return result;
  }, [initialSongs, searchQuery, selectedAlphabet, selectedArtist]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-10 lg:px-12 relative z-10 pb-36">
      <DynamicWatermark defaultSize={600} defaultPosition="center" defaultOpacity={2} className="-z-10" />

      {/* ── Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black tracking-widest mb-4 border border-primary/20">
            <Music className="w-4 h-4" /> WORSHIP CENTER
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 tracking-tight mb-2">
            {t.worshipTitle}
          </h1>
          <p className="text-muted-foreground font-medium">{t.worshipDesc}</p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 group shrink-0">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-secondary/80 border border-border/50 rounded-2xl px-4 py-3 shadow-sm gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full text-foreground placeholder:text-muted-foreground/50 text-sm font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} title="Clear search">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-secondary/20 border border-border/40 rounded-2xl backdrop-blur-sm">
        {/* Play All */}
        <button
          onClick={() => playAll(false)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 shrink-0"
        >
          <Play className="w-4 h-4 fill-current" /> {t.playAll ?? "Play All"}
        </button>
        <button
          onClick={() => playAll(true)}
          className="flex items-center gap-2 bg-secondary text-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary/80 transition-all border border-border/50 shrink-0"
        >
          <Shuffle className="w-4 h-4" /> {t.shuffle ?? "Shuffle"}
        </button>

        {/* Artist Filter */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowArtistFilter(v => !v)}
            className="flex items-center gap-2 bg-secondary text-foreground px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary/80 transition-all border border-border/50"
          >
            <Filter className="w-4 h-4" />
            {selectedArtist === "all" ? "All Artists" : selectedArtist}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
          {showArtistFilter && (
            <div className="absolute top-full mt-2 left-0 z-50 w-56 max-h-60 overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl p-2">
              {["all", ...artists].map(a => (
                <button
                  key={a}
                  onClick={() => { setSelectedArtist(a); setShowArtistFilter(false); }}
                  className={cn(
                    "w-full text-right px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    selectedArtist === a ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                  )}
                >
                  {a === "all" ? "همه خوانندگان" : a}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View Mode */}
        <div className="flex bg-secondary border border-border/40 rounded-xl p-1 ml-auto shrink-0">
          <button
            title="Grid view"
            onClick={() => setViewMode('grid')}
            className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}
          ><LayoutGrid className="w-4 h-4" /></button>
          <button
            title="List view"
            onClick={() => setViewMode('list')}
            className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}
          ><List className="w-4 h-4" /></button>
        </div>

        <span className="text-muted-foreground text-xs font-bold">
          {filteredSongs.length} {t.songsFound ?? "سرود"}
        </span>
      </div>

      {/* ── Alphabet Filter */}
      {!searchQuery && (
        <div className="flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-border/40">
          <button
            onClick={() => setSelectedAlphabet(null)}
            className={cn(
              "h-10 px-4 rounded-xl font-bold text-sm transition-all border",
              selectedAlphabet === null
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary"
            )}
          >{t.all ?? "همه"}</button>
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedAlphabet(selectedAlphabet === letter ? null : letter)}
              className={cn(
                "w-10 h-10 flex items-center justify-center text-sm font-bold rounded-xl transition-all",
                selectedAlphabet === letter
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-secondary text-muted-foreground"
              )}
            >{letter}</button>
          ))}
        </div>
      )}

      {/* ── Song Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSongs.length > 0 ? filteredSongs.map(song => (
            <SongCard
              key={song.id}
              song={song}
              isCurrentlyPlaying={player.song?.id === song.id && player.isPlaying}
              isCurrentSong={player.song?.id === song.id}
              onPlay={() => playSong(song, filteredSongs)}
              onKaraoke={() => setActiveKaraokeSong(song)}
            />
          )) : <EmptyState />}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSongs.length > 0 ? filteredSongs.map((song, i) => (
            <SongListItem
              key={song.id}
              song={song}
              index={i}
              isCurrentlyPlaying={player.song?.id === song.id && player.isPlaying}
              isCurrentSong={player.song?.id === song.id}
              onPlay={() => playSong(song, filteredSongs)}
              onKaraoke={() => setActiveKaraokeSong(song)}
            />
          )) : <EmptyState />}
        </div>
      )}

      {/* ── Karaoke Modal */}
      {activeKaraokeSong && (
        <KaraokeModal song={activeKaraokeSong} onClose={() => setActiveKaraokeSong(null)} />
      )}

      {/* ── Global Audio Player Bar */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => audioRef.current && setPlayer(p => ({ ...p, progress: audioRef.current!.currentTime }))}
        onDurationChange={() => audioRef.current && setPlayer(p => ({ ...p, duration: audioRef.current!.duration || 0 }))}
        onPlay={() => setPlayer(p => ({ ...p, isPlaying: true }))}
        onPause={() => setPlayer(p => ({ ...p, isPlaying: false }))}
        onEnded={playNext}
      />

      {player.song && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Progress Bar */}
            <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="w-8 text-right tabular-nums">{formatTime(player.progress)}</span>
              <div className="relative flex-1 h-3 group cursor-pointer" onClick={e => {
                if (!audioRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = pct * player.duration;
              }}>
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-[width]" style={{ width: `${(player.progress / (player.duration || 1)) * 100}%` }} />
                </div>
              </div>
              <span className="w-8 tabular-nums">{formatTime(player.duration)}</span>
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 to-blue-600/30 shrink-0 flex items-center justify-center">
                {player.song.youtube_id
                  ? <img src={`https://img.youtube.com/vi/${player.song.youtube_id}/default.jpg`} alt="" className="w-full h-full object-cover" />
                  : <Music className="w-5 h-5 text-primary/80" />}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" dir="rtl">{player.song.title_fa}</p>
                <p className="text-xs text-muted-foreground truncate">{player.song.artist}</p>
              </div>

              {/* Transport */}
              <div className="flex items-center gap-2 shrink-0">
                <button title="Previous" onClick={playPrev} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  title={player.isPlaying ? "Pause" : "Play"}
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
                >
                  {player.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
                </button>
                <button title="Next" onClick={playNext} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button title="Close player" onClick={() => { audioRef.current?.pause(); setPlayer(p => ({ ...p, song: null })); }} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors ml-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Song Card (Grid) ──────────────────────────────────────────────────────
function SongCard({ song, isCurrentlyPlaying, isCurrentSong, onPlay, onKaraoke }: {
  song: WorshipSong;
  isCurrentlyPlaying: boolean;
  isCurrentSong: boolean;
  onPlay: () => void;
  onKaraoke: () => void;
}) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-3xl bg-secondary/30 border backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 p-5 flex flex-col gap-4",
      isCurrentSong ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/50"
    )}>
      {/* Now Playing */}
      {isCurrentlyPlaying && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full text-primary-foreground text-[10px] font-black shadow-lg">
          <div className="flex items-end gap-0.5 h-3">
            {[0, 100, 200].map(d => (
              <div key={d} className="w-1 bg-current rounded-full animate-bounce" style={{ height: '100%', animationDelay: `${d}ms` }} />
            ))}
          </div>
          در حال پخش
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 overflow-hidden relative flex flex-col justify-end p-4 border border-border/30">
        {song.youtube_id && (
          <img src={`https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`} alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
        <h3 className="relative font-bold text-lg text-foreground truncate drop-shadow-md" dir="rtl">{song.title_fa}</h3>
        {song.title_en && <p className="relative text-xs text-muted-foreground/80 mt-0.5">{song.title_en}</p>}
      </div>

      {/* Artist */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Music className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="font-medium truncate">{song.artist || "ناشناس"}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50">
        {song.audio_url && (
          <button
            onClick={onPlay}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all",
              isCurrentlyPlaying
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            )}
          >
            {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isCurrentlyPlaying ? "متوقف" : (song.audio_url ? "پخش" : "—")}
          </button>
        )}
        {song.audio_url && (
          <button
            onClick={onKaraoke}
            title="Live Lyrics"
            className="flex items-center justify-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border border-purple-500/20 py-2.5 px-3 rounded-xl font-bold text-sm transition-all"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
        {song.youtube_id && (
          <button
            onClick={() => window.open(`https://www.youtube.com/watch?v=${song.youtube_id}`, '_blank')}
            title="YouTube"
            className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2.5 px-3 rounded-xl transition-all"
          >
            <Youtube className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Song List Item ────────────────────────────────────────────────────────
function SongListItem({ song, index, isCurrentlyPlaying, isCurrentSong, onPlay, onKaraoke }: {
  song: WorshipSong; index: number; isCurrentlyPlaying: boolean; isCurrentSong: boolean;
  onPlay: () => void; onKaraoke: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl border transition-all hover:-translate-x-1",
      isCurrentSong ? "border-primary/40 bg-primary/5" : "border-border/40 bg-secondary/20 hover:bg-secondary/40"
    )}>
      {/* Number / state */}
      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-blue-600/20 shrink-0 flex items-center justify-center">
        {song.youtube_id
          ? <img src={`https://img.youtube.com/vi/${song.youtube_id}/default.jpg`} alt="" className="w-full h-full object-cover" />
          : <span className="text-xs font-black text-muted-foreground">{index + 1}</span>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate" dir="rtl">{song.title_fa}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist || "ناشناس"}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {song.audio_url && (
          <button title="Play" onClick={onPlay}
            className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", isCurrentlyPlaying ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-primary/20 border border-border/40")}
          >
            {isCurrentlyPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}
        {song.audio_url && (
          <button title="Live Lyrics" onClick={onKaraoke}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary hover:bg-purple-500/20 border border-border/40 text-muted-foreground hover:text-purple-500 transition-all">
            <Mic className="w-4 h-4" />
          </button>
        )}
        {song.youtube_id && (
          <button title="YouTube" onClick={() => window.open(`https://www.youtube.com/watch?v=${song.youtube_id}`, '_blank')}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-secondary hover:bg-red-500/20 border border-border/40 text-muted-foreground hover:text-red-500 transition-all">
            <Youtube className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center opacity-50">
      <Music className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
      <h3 className="text-xl font-bold text-foreground mb-2">سرودی یافت نشد</h3>
      <p className="text-muted-foreground text-sm">لطفاً کلمات جستجو یا فیلترها را تغییر دهید</p>
    </div>
  );
}
