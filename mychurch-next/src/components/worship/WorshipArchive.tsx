"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Search, Play, Pause, FileText, Music, LayoutGrid, Youtube,
  List, Filter, Shuffle, SkipForward, SkipBack, X, Volume2,
  Mic, ExternalLink, Heart, ChevronDown
} from "lucide-react";
import { DynamicWatermark } from "@/components/ui/DynamicWatermark";
import { useLanguage } from "@/providers/LanguageProvider";
import { type WorshipSong, toggleLikeWorshipSong, getUserLikedSongs } from "@/actions/worship";
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { getSafeAudioUrl } from "./SmartWorshipPlayer";

const KaraokeModal = dynamic(
  () => import('./KaraokeModal').then(mod => ({ default: mod.KaraokeModal })),
  { ssr: false }
);

const SongDetailsModal = dynamic(
  () => import('./SongDetailsModal').then(mod => ({ default: mod.SongDetailsModal })),
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
  const [songs, setSongs] = useState<WorshipSong[]>(initialSongs);

  // ── Auth & User State
  const [user, setUser] = useState<any>(null);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  // ── Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlphabet, setSelectedAlphabet] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArtistFilter, setShowArtistFilter] = useState(false);

  // ── Karaoke & Details
  const [activeKaraokeSong, setActiveKaraokeSong] = useState<WorshipSong | null>(null);
  const [detailsSong, setDetailsSong] = useState<WorshipSong | null>(null);

  // ── Audio Player
  const audioRef = useRef<HTMLAudioElement>(null);
  const [player, setPlayer] = useState<PlayState>({
    song: null, index: -1, playlist: [], isPlaying: false, progress: 0, duration: 0
  });

  // ── Effects
  React.useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const likes = await getUserLikedSongs(user.id);
        setLikedSongs(new Set(likes));
      }
    };
    init();
  }, []);

  const handleToggleLike = async (songId: string) => {
    if (!user) {
      alert("لطفاً برای لایک کردن ابتدا وارد حساب خود شوید / Please login to like");
      return;
    }

    const { success, liked, count } = await toggleLikeWorshipSong(songId, user.id);
    if (success) {
      setLikedSongs(prev => {
        const next = new Set(prev);
        if (liked) next.add(songId);
        else next.delete(songId);
        return next;
      });

      // Update the song count in local state
      setSongs(prev => prev.map(s => 
        s.id === songId ? { ...s, likes_count: count } : s
      ));
    }
  };

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

  const playSong = useCallback((song: WorshipSong, playlist: WorshipSong[]) => {
    if (!song.audio_url) {
      setDetailsSong(song);
      return;
    }
    if (player.song?.id === song.id) {
      togglePlay();
      return;
    }
    const index = playlist.findIndex(s => s.id === song.id);
    setPlayer(p => ({ ...p, song, index, playlist, isPlaying: true, progress: 0 }));
    if (audioRef.current) {
      audioRef.current.src = getSafeAudioUrl(song.audio_url);
      audioRef.current.play().catch(console.error);
    }
  }, [player.song?.id, togglePlay]);

  const playNext = useCallback(() => {
    const next = (player.index + 1) % player.playlist.length;
    playSong(player.playlist[next], player.playlist);
  }, [player, playSong]);

  const playPrev = useCallback(() => {
    const prev = player.index === 0 ? player.playlist.length - 1 : player.index - 1;
    playSong(player.playlist[prev], player.playlist);
  }, [player, playSong]);

  const playAll = (shuffle = false) => {
    const songsToPlay = [...filteredSongs].filter(s => s.audio_url);
    if (!songsToPlay.length) return;
    const list = shuffle ? songsToPlay.sort(() => Math.random() - 0.5) : songsToPlay;
    playSong(list[0], list);
  };

  // ── Derived Data
  const alphabet = useMemo(() => {
    const letters = new Set<string>();
    songs.forEach(song => {
      const c = song.title_fa?.trim().charAt(0);
      if (c) letters.add(c);
    });
    return Array.from(letters).sort();
  }, [songs]);

  const artists = useMemo(() => {
    const set = new Set<string>();
    songs.forEach(s => { if (s.artist) set.add(s.artist); });
    return Array.from(set).sort();
  }, [songs]);

  const filteredSongs = useMemo(() => {
    let result = songs;
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
  }, [songs, searchQuery, selectedAlphabet, selectedArtist]);

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
              isLiked={likedSongs.has(song.id)}
              onToggleLike={() => handleToggleLike(song.id)}
              isCurrentlyPlaying={player.song?.id === song.id && player.isPlaying}
              isCurrentSong={player.song?.id === song.id}
              onPlay={() => playSong(song, filteredSongs)}
              onKaraoke={() => setActiveKaraokeSong(song)}
              onViewDetails={() => setDetailsSong(song)}
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
              isLiked={likedSongs.has(song.id)}
              onToggleLike={() => handleToggleLike(song.id)}
              isCurrentlyPlaying={player.song?.id === song.id && player.isPlaying}
              isCurrentSong={player.song?.id === song.id}
              onPlay={() => playSong(song, filteredSongs)}
              onKaraoke={() => setActiveKaraokeSong(song)}
              onViewDetails={() => setDetailsSong(song)}
            />
          )) : <EmptyState />}
        </div>
      )}

      {/* ── Karaoke Modal */}
      {activeKaraokeSong && (
        <KaraokeModal song={activeKaraokeSong} onClose={() => setActiveKaraokeSong(null)} />
      )}

      {/* ── Details Modal */}
      {detailsSong && (
        <SongDetailsModal
          song={detailsSong}
          onClose={() => setDetailsSong(null)}
          initialLiked={likedSongs.has(detailsSong.id)}
          onLikeChange={(songId, liked, count) => {
            setLikedSongs(prev => {
              const next = new Set(prev);
              if (liked) next.add(songId); else next.delete(songId);
              return next;
            });
            setSongs(prev => prev.map(s => s.id === songId ? { ...s, likes_count: count } : s));
          }}
        />
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
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] md:bottom-0 left-0 right-0 z-[45] bg-card/95 backdrop-blur-2xl border-t border-border/50 shadow-2xl transition-all">
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
                <p className="text-xs text-muted-foreground truncate font-medium">{player.song.artist || "ناشناس"}</p>
              </div>

              {/* Transport */}
              <div className="flex items-center gap-2 shrink-0">
                <button title="Previous" onClick={playPrev} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  title={player.isPlaying ? "Pause" : "Play"}
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-95"
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
function SongCard({ song, isCurrentlyPlaying, isCurrentSong, onPlay, onKaraoke, onViewDetails, isLiked, onToggleLike }: {
  song: WorshipSong;
  isCurrentlyPlaying: boolean;
  isCurrentSong: boolean;
  isLiked: boolean;
  onPlay: () => void;
  onKaraoke: () => void;
  onViewDetails: () => void;
  onToggleLike: () => void;
}) {
  const isNew = song.created_at && (new Date().getTime() - new Date(song.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-3xl bg-secondary/30 border backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 p-5 flex flex-col gap-4",
      isCurrentSong ? "border-primary/60 shadow-lg shadow-primary/15 ring-1 ring-primary/40 bg-primary/5" : "border-border/50"
    )}>
      {/* Now Playing badge */}
      {isCurrentlyPlaying && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full text-primary-foreground text-[10px] font-black shadow-lg">
          <div className="flex items-end gap-0.5 h-3">
            {[0, 100, 200].map(d => (
              <div key={d} className="w-1 bg-current rounded-full animate-bounce" style={{ height: '100%', animationDelay: `${d}ms` }} />
            ))}
          </div>
          در حال پخش
        </div>
      )}

      {/* New Badge */}
      {isNew && (
        <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-black shadow-lg animate-pulse">
          جدید / NEW
        </div>
      )}

      {/* Thumbnail with direct Play overlay */}
      <div 
        onClick={song.audio_url ? onPlay : onViewDetails}
        className="w-full h-36 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 overflow-hidden relative flex flex-col justify-end p-4 border border-border/30 cursor-pointer group/thumb"
      >
        {song.youtube_id && (
          <img src={`https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`} alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover/thumb:scale-110 transition-transform duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
        
        {/* Play hover button overlay */}
        {song.audio_url && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300",
            isCurrentlyPlaying ? "opacity-100 bg-black/40 backdrop-blur-[2px]" : "opacity-0 group-hover/thumb:opacity-100 bg-black/30 backdrop-blur-[2px]"
          )}>
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 transform group-hover/thumb:scale-110 transition-transform">
              {isCurrentlyPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
            </div>
          </div>
        )}

        <h3 className="relative font-bold text-lg text-foreground truncate drop-shadow-md z-10" dir="rtl">{song.title_fa}</h3>
        {song.title_en && <p className="relative text-xs text-muted-foreground/80 mt-0.5 z-10">{song.title_en}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-widest text-primary/60 font-black">خواننده:</span>
        <div className="flex items-center gap-2 text-sm text-foreground/80">
          <Music className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-bold truncate">{song.artist || "ناشناس"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border/50">
        <button
            onClick={onToggleLike}
            title={isLiked ? "Unlike" : "Like"}
            className={cn(
              "flex items-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all",
              isLiked ? "bg-pink-500/20 text-pink-500 border border-pink-500/30" : "bg-secondary hover:bg-white/10 text-muted-foreground border border-white/10"
            )}
        >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            {song.likes_count || 0}
        </button>

        {/* Dedicated Audio Play / Pause button */}
        {song.audio_url ? (
          <button
            onClick={onPlay}
            title={isCurrentlyPlaying ? "توقف پخش" : "پخش سرود"}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95",
              isCurrentlyPlaying
                ? "bg-primary text-primary-foreground shadow-primary/30 ring-2 ring-primary/40"
                : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 hover:scale-[1.02]"
            )}
          >
            {isCurrentlyPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>توقف</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>پخش</span>
              </>
            )}
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 font-bold px-2 py-2 border border-border/30 rounded-xl bg-secondary/30">
            فقط متن
          </span>
        )}

        {/* View Details / Lyrics */}
        <button
            onClick={onViewDetails}
            title="مشاهده متن کامل، آکورد و جزئیات"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-xl font-bold text-xs transition-all bg-secondary hover:bg-white/10 text-foreground border border-white/10"
        >
            <FileText className="w-3.5 h-3.5" />
            نمایش
        </button>

        {/* Live Lyrics / Karaoke button */}
        {song.audio_url && (
          <button
            onClick={onKaraoke}
            title="پخش با متن زنده (Live Lyrics)"
            className="flex items-center justify-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 py-2.5 px-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <Play className="w-3 h-3" />
            <span>Live</span>
          </button>
        )}

        {song.youtube_id && (
          <button
            onClick={onViewDetails}
            title="پخش ویدیو یوتیوب داخل مودال"
            className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2.5 px-2.5 rounded-xl transition-all"
          >
            <Youtube className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Song List Item ────────────────────────────────────────────────────────
function SongListItem({ song, index, isCurrentlyPlaying, isCurrentSong, onPlay, onKaraoke, onViewDetails, isLiked, onToggleLike }: {
  song: WorshipSong; index: number; isCurrentlyPlaying: boolean; isCurrentSong: boolean;
  isLiked: boolean; onPlay: () => void; onKaraoke: () => void; onViewDetails: () => void;
  onToggleLike: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 md:gap-4 p-3.5 md:p-4 rounded-2xl border transition-all hover:-translate-x-1",
      isCurrentSong ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30" : "border-border/40 bg-secondary/20 hover:bg-secondary/40"
    )}>
      {/* Play/State Button */}
      <button
        onClick={song.audio_url ? onPlay : onViewDetails}
        title={isCurrentlyPlaying ? "توقف" : song.audio_url ? "پخش سرود" : "مشاهده"}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
          isCurrentlyPlaying
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40"
            : song.audio_url
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-secondary/40 text-muted-foreground/40 cursor-default"
        )}
      >
        {isCurrentlyPlaying ? (
          <Pause className="w-4 h-4" />
        ) : song.audio_url ? (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        ) : (
          <span className="text-xs font-black text-muted-foreground">{index + 1}</span>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-bold truncate text-sm md:text-base" dir="rtl">{song.title_fa}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] uppercase font-black text-primary/50">خواننده:</span>
          <p className="text-xs text-muted-foreground truncate font-medium">{song.artist || "ناشناس"}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <button title="Like" onClick={onToggleLike}
          className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", isLiked ? "bg-pink-500/20 text-pink-500 border border-pink-500/30" : "bg-secondary hover:bg-white/10 border border-border/40 text-muted-foreground")}>
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </button>

        <button title="مشاهده کامل" onClick={onViewDetails}
          className="w-9 h-9 rounded-full flex items-center justify-center border transition-all bg-secondary border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30">
          <FileText className="w-4 h-4" />
        </button>

        {song.audio_url && (
          <button title="پخش با متن زنده" onClick={onKaraoke}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 transition-all font-bold text-[10px]">
            Live
          </button>
        )}

        {song.youtube_id && (
          <button title="پخش یوتیوب" onClick={onViewDetails}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all">
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
