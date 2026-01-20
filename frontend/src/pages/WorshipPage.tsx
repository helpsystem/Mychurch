import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { WorshipSong } from '../types';
import { useContent } from '../hooks/useContent';
import { Youtube, FileText, FileMusic, Play, Mic, ExternalLink, Presentation, Music2, Shuffle, PlayCircle, SkipBack, SkipForward } from 'lucide-react';
import { useAudioPlayer, Song } from '../contexts/AudioPlayerContext';
import UniversalMediaPlayer from '../components/UniversalMediaPlayer';
import AudioPlayerWithLyrics from '../components/AudioPlayerWithLyrics';
import YouTubePlayerWithLyrics from '../components/YouTubePlayerWithLyrics';
import KaraokeWorshipPlayer from '../components/KaraokeWorshipPlayer';
import UniversalAudioPlayer from '../components/UniversalAudioPlayer';
import ChordLyricsDisplay from '../components/ChordLyricsDisplay';

// 🔹 تایپ برای فایل timing
interface TimingWord {
  word: string;
  start: number;
  end: number;
  lineIndex?: number;
}

interface TimingLine {
  line: string;
  start: number;
  end: number;
  words: TimingWord[];
}

interface TimingData {
  metadata: {
    title: string;
    artist?: string;
    totalDuration: number;
    wordCount: number;
  };
  words: TimingWord[];
  lines: TimingLine[];
}

// 🔹 Modal Portal Component - renders directly to body for true fullscreen
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // IMPORTANT: Always use document.body to escape parent restrictions
  console.log('🚀 ModalPortal: Rendering to document.body');
  return ReactDOM.createPortal(children, document.body);
};

// 🔹 کارت نمایش سرود با پلیر و دکمه‌ها
const WorshipSongCard: React.FC<{ song: WorshipSong; onClick?: () => void; onKaraoke?: () => void }> = ({ song, onClick, onKaraoke }) => {
  const { lang } = useLanguage();
  const hasYoutube = !!song.youtubeId;
  // Check for valid audio URL (not empty and starts with / or http)
  const hasAudio = !!(song.audioUrl && song.audioUrl.trim() !== '' && (song.audioUrl.startsWith('/') || song.audioUrl.startsWith('http')));
  const thumbnailUrl = hasYoutube ? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg` : '/images/Prayer_circle_hands_together_feb88f83.png';

  const handleCardClick = () => {
    console.log('🎵 Card Clicked:', song.title?.[lang]);
    onClick?.();
  };

  const handleKaraokeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onKaraoke?.();
  };

  const handleYoutubeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.youtube.com/watch?v=${song.youtubeId}`, '_blank');
  };

  // Convert song to MediaItem for UniversalMediaPlayer
  const mediaItem = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    audioUrl: song.audioUrl,
    videoUrl: song.videoUrl,
    type: 'song' as const,
    lyrics: song.lyrics
  };

  return (
    <div
      className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/30 rounded-[20px] overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:border-purple-500/60 transition-all duration-300"
    >
      {/* Thumbnail - clickable for details */}
      <div
        className="relative overflow-hidden cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      >
        <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-40 object-cover blur-sm scale-110 opacity-50" aria-hidden="true" />
        <img src={thumbnailUrl} alt={song.title?.[lang] || 'Song'} className="relative w-full h-40 object-cover" />
        {hasYoutube && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
            <Play size={48} className="text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="p-4 bg-black/30 backdrop-blur-sm">
        <h3
          className="text-lg font-bold text-white text-center drop-shadow-md cursor-pointer hover:text-purple-300 transition"
          onClick={handleCardClick}
        >
          {song.title?.[lang]}
        </h3>
        <p className="text-gray-300 text-sm text-center mt-1">{song.artist}</p>

        {/* Integrated Player */}
        {hasAudio && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <UniversalMediaPlayer
              item={mediaItem}
              mode="card"
              className="bg-purple-900/30 rounded-lg"
            />
          </div>
        )}

        {/* YouTube Embed Player - for songs without local audio */}
        {!hasAudio && hasYoutube && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video rounded-lg overflow-hidden bg-black/50">
              <iframe
                src={`https://www.youtube.com/embed/${song.youtubeId}?rel=0&modestbranding=1`}
                title={song.title?.[lang] || 'Worship Song'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-3 justify-center">
          {/* متن زنده (Live Text) Button */}
          {hasAudio && (
            <button
              onClick={handleKaraokeClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg transition-all text-xs font-medium shadow-lg shadow-purple-500/30"
              title={lang === 'fa' ? 'حالت متن زنده' : 'Live Text Mode'}
            >
              <Mic size={14} />
              <span>{lang === 'fa' ? 'متن زنده' : 'Live Text'}</span>
            </button>
          )}

          {/* YouTube Button */}
          {hasYoutube && (
            <button
              onClick={handleYoutubeClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-xs font-medium"
              title="YouTube"
            >
              <ExternalLink size={14} />
              <span>YouTube</span>
            </button>
          )}

          {/* PowerPoint Download */}
          {(song as any).presentationFileUrl && (
            <a
              href={(song as any).presentationFileUrl}
              download
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-xs font-medium"
              title="PowerPoint"
            >
              <Presentation size={14} />
              <span>PPT</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// 🔹 اسکلت لودینگ
const LoadingSkeleton: React.FC = () => (
  <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-[20px] overflow-hidden animate-pulse border border-gray-600/30">
    <div className="bg-gray-600/40 h-48"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-600/50 rounded w-3/4 mx-auto"></div>
      <div className="h-4 bg-gray-600/40 rounded w-1/2 mx-auto"></div>
    </div>
  </div>
);


const WorshipPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { content, loading: isLoading } = useContent();
  const songs = content.worshipSongs || [];

  // 🎵 Global Audio Player Context for Archive Playback
  const {
    playSong: playGlobalSong,
    playAll: playAllGlobal,
    currentSong: globalCurrentSong,
    isPlaying: globalIsPlaying
  } = useAudioPlayer();

  // Check if user is admin or leader
  const isAdminOrLeader = user && ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'].includes(user.role);

  const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [loadingTiming, setLoadingTiming] = useState(false);
  const [activeLetterFilter, setActiveLetterFilter] = useState<string | null>(null);

  // Karaoke Mode State
  const [showKaraokeMode, setShowKaraokeMode] = useState(false);
  const [karaokeSong, setKaraokeSong] = useState<WorshipSong | null>(null);

  // 🔤 سورت کردن سرودها بر اساس حروف الفبا
  const sortedSongs = React.useMemo(() => {
    return [...songs].sort((a, b) => {
      const titleA = (a.title?.[lang] || a.title?.fa || a.title?.en || '').trim();
      const titleB = (b.title?.[lang] || b.title?.fa || b.title?.en || '').trim();
      return titleA.localeCompare(titleB, lang === 'fa' ? 'fa' : 'en');
    });
  }, [songs, lang]);

  // 🔤 استخراج حروف اول سرودها
  const availableLetters = React.useMemo(() => {
    const letters = new Set<string>();
    sortedSongs.forEach(song => {
      const title = (song.title?.[lang] || song.title?.fa || song.title?.en || '').trim();
      if (title) {
        letters.add(title[0].toUpperCase());
      }
    });
    return Array.from(letters).sort((a, b) => a.localeCompare(b, lang === 'fa' ? 'fa' : 'en'));
  }, [sortedSongs, lang]);

  // 🔤 فیلتر کردن سرودها بر اساس حرف انتخاب شده
  const filteredSongs = React.useMemo(() => {
    if (!activeLetterFilter) return sortedSongs;
    return sortedSongs.filter(song => {
      const title = (song.title?.[lang] || song.title?.fa || song.title?.en || '').trim();
      return title[0]?.toUpperCase() === activeLetterFilter;
    });
  }, [sortedSongs, activeLetterFilter, lang]);

  // 🔤 گروه‌بندی سرودها بر اساس حرف اول (برای نمایش با header)
  const groupedSongs = React.useMemo(() => {
    const groups: { [key: string]: WorshipSong[] } = {};
    const songsToGroup = activeLetterFilter ? filteredSongs : sortedSongs;

    songsToGroup.forEach(song => {
      const title = (song.title?.[lang] || song.title?.fa || song.title?.en || '').trim();
      const firstLetter = title[0]?.toUpperCase() || '#';
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(song);
    });

    return groups;
  }, [sortedSongs, filteredSongs, activeLetterFilter, lang]);

  // 🆕 جدیدترین سرودها (4-5 تای آخر) برای بخش #
  const recentSongs = React.useMemo(() => {
    return sortedSongs.slice(-5); // 5 تای آخر
  }, [sortedSongs]);

  // 🎵 پخش همه سرودها با FloatingMiniPlayer
  const handlePlayAll = () => {
    const songsForPlayer: Song[] = sortedSongs
      .filter(s => s.audioUrl)
      .map(song => ({
        id: song.id,
        title: song.title[lang] || song.title.fa,
        artist: song.artist,
        audioUrl: song.audioUrl!,
        thumbnail: song.youtubeId ? `https://img.youtube.com/vi/${song.youtubeId}/default.jpg` : undefined,
        lyrics: song.lyrics?.[lang] || song.lyrics?.fa,
        youtubeId: song.youtubeId,
      }));

    if (songsForPlayer.length > 0) {
      playAllGlobal(songsForPlayer, false);
    }
  };

  // 🔀 پخش تصادفی سرودها
  const handlePlayAllShuffle = () => {
    const songsForPlayer: Song[] = sortedSongs
      .filter(s => s.audioUrl)
      .map(song => ({
        id: song.id,
        title: song.title[lang] || song.title.fa,
        artist: song.artist,
        audioUrl: song.audioUrl!,
        thumbnail: song.youtubeId ? `https://img.youtube.com/vi/${song.youtubeId}/default.jpg` : undefined,
        lyrics: song.lyrics?.[lang] || song.lyrics?.fa,
        youtubeId: song.youtubeId,
      }));

    if (songsForPlayer.length > 0) {
      playAllGlobal(songsForPlayer, true); // true = shuffle
    }
  };

  // 🔤 اسکرول به اولین سرود با حرف مشخص
  const scrollToLetter = (letter: string) => {
    if (activeLetterFilter === letter) {
      // اگر دوباره روی همان حرف کلیک شد، فیلتر را پاک کن
      setActiveLetterFilter(null);
    } else {
      // فیلتر روی حرف جدید
      setActiveLetterFilter(letter);

      // اسکرول به بخش آن حرف
      setTimeout(() => {
        const letterSection = document.getElementById(`letter-${letter}`);
        if (letterSection) {
          letterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  // Debug log
  React.useEffect(() => {
    console.log('🎵 WorshipPage Debug:', {
      isLoading,
      songsCount: songs.length,
      hasSongs: songs.length > 0,
      firstSong: songs[0]
    });
  }, [isLoading, songs]);

  // تابع فیلتر lyrics - حذف آکوردها و مارکرهای ساختاری
  const filterLyrics = (lyrics: string): string => {
    if (!lyrics) return '';

    // حذف Chord ها: [C], [Dm], [G], [C#/A], etc.
    let clean = lyrics.replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]/g, '');

    // حذف مارکرهای ساختاری مثل [column], [repeat], [instrumental]
    clean = clean.replace(/\[(column|repeat|instrumental|interlude|solo|tag|ending|coda)\]/gi, '');

    // حذف عناوین بخش‌ها: V1, V2, Chorus, Pre-Chorus, Bridge و ...
    clean = clean.replace(/^(V\d+|Chorus\d*|Pre-Chorus\d*|Bridge\d*|Intro|Outro|Verse\s*\d*|Tag|Ending|Coda|Instrumental|Interlude|Music)(\s*\(x\d+\))?$/gim, '');

    // حذف (x2), (x3), x2, x3 از انتهای خطوط
    clean = clean.replace(/\s*\(?x\d+\)?\s*$/gim, '');

    // حذف virgool‌های انتهای خط (برای سینک با timing)
    clean = clean.replace(/\s*،\s*$/gm, '');
    clean = clean.replace(/،\s+/g, ' '); // virgool وسط خط → فاصله

    // حذف خطوط خالی اضافی
    clean = clean.replace(/\n\s*\n+/g, '\n');

    return clean.trim();
  };

  // بارگذاری فایل timing برای آهنگ انتخاب شده
  useEffect(() => {
    if (selectedSongIndex !== null && songs[selectedSongIndex]) {
      const song = songs[selectedSongIndex];
      const timingPath = `/worship/data/timings/song_${song.id}_timing.json`;

      console.log('🔍 Trying to load timing for song:', song.id, song.title?.fa);
      console.log('📁 Timing path:', timingPath);

      setLoadingTiming(true);
      fetch(timingPath)
        .then(res => {
          console.log('📡 Fetch response:', res.status, res.ok);
          if (!res.ok) throw new Error('Timing file not found');
          return res.json();
        })
        .then((data: TimingData) => {
          console.log('✅ Timing loaded for song:', song.title?.fa, {
            wordCount: data.words?.length,
            lineCount: data.lines?.length,
            firstLine: data.lines?.[0],
            hasWords: data.lines?.[0]?.words?.length
          });
          setTimingData(data);
        })
        .catch(err => {
          console.log('⚠️ No timing file for song:', song.title?.fa, err.message);
          setTimingData(null);
        })
        .finally(() => {
          setLoadingTiming(false);
        });
    } else {
      setTimingData(null);
    }
  }, [selectedSongIndex, songs]);

  const [presentationMode, setPresentationMode] = useState(false);
  const [activeSong, setActiveSong] = useState<WorshipSong | null>(null);

  // تابع برای باز کردن در صفحه دوم (پروژکتور)
  const openOnSecondScreen = (song: WorshipSong) => {
    // بارگذاری timing data برای پرژکتور
    const timingPath = `/worship/data/timings/song_${song.id}_timing.json`;

    // ساخت HTML کامل برای صفحه دوم
    const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${song.title?.fa || song.title?.en} - Projector</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
            color: white;
            font-family: 'Vazirmatn', 'B Nazanin', 'Scheherazade New', 'Arial', sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.3), rgba(236,72,153,0.2));
            backdrop-filter: blur(15px);
            padding: 40px 60px;
            text-align: center;
            border-bottom: 4px solid rgba(168,85,247,0.5);
            box-shadow: 0 8px 32px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.2);
        }
        h1 { 
            font-size: 5.5rem; 
            margin-bottom: 0;
            font-weight: 900;
            letter-spacing: 8px;
            color: #ffffff;
            text-shadow: 0 0 60px rgba(255,255,255,0.8), 
                         0 0 90px rgba(255,255,255,0.5),
                         0 4px 20px rgba(0,0,0,1),
                         0 8px 40px rgba(0,0,0,0.8);
            font-family: 'Vazirmatn', 'B Nazanin', 'Scheherazade New', 'Arial', sans-serif;
        }
        .artist { 
            font-size: 2rem; 
            color: #a855f7; 
            text-shadow: 0 0 20px rgba(168,85,247,0.6);
        }
        .content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px;
            overflow: hidden;
        }
        .lyrics {
            font-size: 4.8rem;
            line-height: 2.6;
            text-align: center;
            text-shadow: 4px 4px 16px rgba(0,0,0,1);
            max-width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 450px;
            gap: 50px;
            padding: 0 80px;
        }
        
        .line {
            display: none;
            transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            opacity: 0;
            transform: scale(0.8) translateY(50px);
            width: 100%;
        }
        
        /* خط قبلی - کوچکتر و کمرنگ‌تر */
        .line.previous {
            display: block;
            opacity: 0.4;
            transform: scale(0.85) translateY(-20px);
            font-size: 0.85em;
            color: #9ca3af;
        }
        
        /* خط فعلی - بزرگ و واضح */
        .line.active {
            display: block;
            opacity: 1;
            transform: scale(1) translateY(0);
            animation: slideIn 0.8s ease-out;
        }
        
        /* خط بعدی - کوچکتر و کمرنگ‌تر */
        .line.next {
            display: block;
            opacity: 0.35;
            transform: scale(0.8) translateY(20px);
            font-size: 0.75em;
            color: #6b7280;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: scale(0.8) translateY(50px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        
        .word {
            display: inline-block;
            margin: 0 32px;
            padding: 14px 10px;
            transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
            color: #f1f5f9;
            font-weight: 700;
            letter-spacing: 4px;
        }
        .line.active .word {
            color: #ffffff;
            font-weight: 900;
            text-shadow: 0 0 20px rgba(255,255,255,0.3),
                         3px 3px 10px rgba(0,0,0,0.9);
        }
        .line.previous .word,
        .line.next .word {
            margin: 0 24px;
            letter-spacing: 2px;
        }
        .word.active {
            color: #fde047 !important;
            transform: scale(2.2) translateY(-25px);
            font-weight: 900 !important;
            text-shadow: 0 0 70px rgba(253,224,71,1), 
                         0 0 140px rgba(253,224,71,0.95),
                         0 0 210px rgba(253,224,71,0.8),
                         5px 5px 25px rgba(0,0,0,1);
            animation: glow 0.9s ease-in-out infinite;
            filter: brightness(1.5) contrast(1.3);
            letter-spacing: 4px;
        }
        @keyframes glow {
            0%, 100% { 
                text-shadow: 0 0 70px rgba(253,224,71,1), 
                            0 0 140px rgba(253,224,71,0.95),
                            0 0 210px rgba(253,224,71,0.8),
                            5px 5px 25px rgba(0,0,0,1);
                filter: brightness(1.5) contrast(1.3);
            }
            50% { 
                text-shadow: 0 0 90px rgba(253,224,71,1), 
                            0 0 170px rgba(253,224,71,1),
                            0 0 250px rgba(253,224,71,0.9),
                            5px 5px 30px rgba(0,0,0,1);
                filter: brightness(1.6) contrast(1.4);
            }
        }
        audio { display: none; }
        .timing-indicator {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(168,85,247,0.3);
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 1.2rem;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${song.title?.fa || song.title?.en}</h1>
        <p class="artist">${song.artist || ''}</p>
    </div>
    <div class="timing-indicator" id="timing-status">⏳ Loading timing...</div>
    <div class="content">
        <div class="lyrics" id="lyrics"></div>
    </div>
    ${song.audioUrl ? `<audio id="audio" src="${song.audioUrl}"></audio>` : ''}
    <script>
        const audio = document.getElementById('audio');
        const lyricsDiv = document.getElementById('lyrics');
        const timingStatus = document.getElementById('timing-status');
        
        let timingData = null;
        let currentWordIndex = -1;
        let currentLineIndex = -1;
        
        // بارگذاری timing data
        fetch('${timingPath}')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.lines) {
                    timingData = data;
                    timingStatus.innerHTML = '✅ Timing دقیق فعال';
                    setTimeout(() => timingStatus.style.display = 'none', 3000);
                    renderLyricsWithTiming();
                } else {
                    timingStatus.innerHTML = '⚠️ No timing data';
                    setTimeout(() => timingStatus.style.display = 'none', 2000);
                    renderLyricsSimple();
                }
            })
            .catch(() => {
                timingStatus.innerHTML = '❌ Timing load failed';
                setTimeout(() => timingStatus.style.display = 'none', 2000);
                renderLyricsSimple();
            });
        
        // رندر با timing دقیق
        function renderLyricsWithTiming() {
            if (!timingData || !timingData.lines) return;
            
            lyricsDiv.innerHTML = timingData.lines.map((line, lineIdx) => {
                const wordsHtml = line.words.map((wordData, wordIdx) => 
                    \`<span class="word" data-line="\${lineIdx}" data-word="\${wordIdx}" data-start="\${wordData.start}" data-end="\${wordData.end}">\${wordData.word}</span>\`
                ).join(' ');
                return \`<div class="line" data-line="\${lineIdx}">\${wordsHtml}</div>\`;
            }).join('');
            
            console.log('✅ Rendered', timingData.lines.length, 'lines with', timingData.metadata.wordCount, 'words');
        }
        
        // رندر ساده بدون timing
        function renderLyricsSimple() {
            const lyricsText = ${JSON.stringify(filterLyrics(song.lyrics?.fa || song.lyrics?.en || ''))};
            if (lyricsText) {
                const words = lyricsText.split(/\\s+/);
                lyricsDiv.innerHTML = words.map((word, i) => 
                    \`<span class="word" data-index="\${i}">\${word}</span>\`
                ).join(' ');
            }
        }
        
        // به‌روزرسانی هایلایت
        function updateHighlight() {
            if (!audio || !timingData) return;
            
            const currentTime = audio.currentTime;
            
            // پیدا کردن خط فعلی
            let activeLine = -1;
            for (let i = 0; i < timingData.lines.length; i++) {
                if (currentTime >= timingData.lines[i].start) {
                    activeLine = i;
                } else break;
            }
            
            // به‌روزرسانی نمایش 3 خط: قبلی، فعلی، بعدی
            if (activeLine !== currentLineIndex) {
                document.querySelectorAll('.line').forEach((el, idx) => {
                    el.classList.remove('previous', 'active', 'next');
                    
                    if (idx === activeLine - 1) {
                        el.classList.add('previous'); // خط قبلی
                    } else if (idx === activeLine) {
                        el.classList.add('active'); // خط فعلی
                    } else if (idx === activeLine + 1) {
                        el.classList.add('next'); // خط بعدی
                    }
                });
                currentLineIndex = activeLine;
                
                console.log(\`📍 Active line: \${activeLine}\`);
            }
            
            // پیدا کردن کلمه فعلی - فقط در خط فعلی
            // ابتدا همه کلمات را غیرفعال کن
            document.querySelectorAll('.word.active').forEach(w => w.classList.remove('active'));
            
            const activeLi = document.querySelector('.line.active');
            if (activeLi) {
                const words = activeLi.querySelectorAll('.word[data-start]');
                
                words.forEach((wordEl, idx) => {
                    const start = parseFloat(wordEl.getAttribute('data-start'));
                    const end = parseFloat(wordEl.getAttribute('data-end'));
                    const isActive = currentTime >= start && currentTime < end;
                    
                    if (isActive && idx !== currentWordIndex) {
                        console.log(\`🎯 Active word: "\${wordEl.textContent}" at \${currentTime.toFixed(2)}s\`);
                        currentWordIndex = idx;
                    }
                    
                    if (isActive) {
                        wordEl.classList.add('active');
                    }
                });
            }
        }
        
        // رویدادهای audio
        if (audio) {
            audio.addEventListener('timeupdate', updateHighlight);
            audio.addEventListener('seeked', updateHighlight);
            
            // Auto-play
            setTimeout(() => {
                audio.play().catch(err => {
                    console.log('Auto-play blocked:', err);
                    timingStatus.innerHTML = '▶️ Click to play';
                    timingStatus.style.display = 'block';
                    document.body.addEventListener('click', () => {
                        audio.play();
                        timingStatus.style.display = 'none';
                    }, { once: true });
                });
            }, 500);
        }
        
        // کلید ESC برای بستن
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.close();
            // فاصله برای play/pause
            if (e.key === ' ' && audio) {
                e.preventDefault();
                audio.paused ? audio.play() : audio.pause();
            }
        });
    </script>
</body>
</html>`;

    // باز کردن پنجره جدید
    const newWindow = window.open('', '_blank', 'fullscreen=yes,width=1920,height=1080');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();

      // اطلاع به کاربر
      alert(lang === 'fa'
        ? '✅ صفحه جدید باز شد!\n\n💡 نکات:\n- پنجره را به صفحه دوم بکشید\n- F11 برای تمام صفحه\n- ESC برای بستن'
        : '✅ New window opened!\n\n💡 Tips:\n- Drag to second screen\n- F11 for fullscreen\n- ESC to close'
      );
    } else {
      alert(lang === 'fa'
        ? '❌ لطفاً popup را در مرورگر خود مجاز کنید!'
        : '❌ Please allow popups in your browser!'
      );
    }
  };

  // Debug log for active song
  React.useEffect(() => {
    console.log('🎤 Active Song Changed:', activeSong ? {
      title: activeSong.title,
      artist: activeSong.artist,
      hasAudio: !!activeSong.audioUrl,
      hasYoutube: !!activeSong.youtubeId
    } : 'null');
  }, [activeSong]);

  // بارگذاری timing برای modal (activeSong)
  useEffect(() => {
    if (activeSong) {
      const timingPath = `/worship/data/timings/song_${activeSong.id}_timing.json`;

      console.log('🔍 Loading timing for MODAL song:', activeSong.id, activeSong.title?.fa);
      console.log('📁 Timing path:', timingPath);

      setLoadingTiming(true);
      fetch(timingPath)
        .then(res => {
          console.log('📡 Modal fetch response:', res.status, res.ok);
          if (!res.ok) throw new Error('Timing file not found');
          return res.json();
        })
        .then((data: TimingData) => {
          console.log('✅ Timing loaded for MODAL:', activeSong.title?.fa, {
            wordCount: data.words?.length,
            lineCount: data.lines?.length,
            firstLine: data.lines?.[0],
            hasWords: data.lines?.[0]?.words?.length || 0
          });
          setTimingData(data);
        })
        .catch(err => {
          console.log('⚠️ No timing file for MODAL song:', activeSong.title?.fa, err.message);
          setTimingData(null);
        })
        .finally(() => {
          setLoadingTiming(false);
        });
    } else {
      setTimingData(null);
    }
  }, [activeSong]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (activeSong) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeSong]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 sm:px-16 px-6 sm:py-12 py-4">
      {/* Test Modal Button - ADMIN/LEADER ONLY */}
      {isAdminOrLeader && !presentationMode && songs.length > 0 && (
        <button
          onClick={() => {
            console.log('🔥 Test button clicked, setting first song');
            setActiveSong(songs[0]);
          }}
          className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-600 z-50 flex items-center gap-2 font-semibold"
        >
          🧪 Test Modal
        </button>
      )}

      {/* Presentation Mode Toggle Button - ADMIN/LEADER ONLY */}
      {isAdminOrLeader && !presentationMode && (
        <button
          onClick={() => {
            setPresentationMode(true);
            setSelectedSongIndex(0);
          }}
          className="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-600 z-50 flex items-center gap-2 font-semibold"
          title={lang === 'fa' ? 'حالت پرزنتیشن' : 'Presentation Mode'}
        >
          🎥 {lang === 'fa' ? 'حالت پرزنتیشن' : 'Presentation Mode'}
        </button>
      )}

      {presentationMode ? (
        /* Presentation Mode View */
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* بالای صفحه */}
          <div className="bg-black/70 p-4 flex justify-between items-center">
            <button
              onClick={() => setPresentationMode(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              ✕ {lang === 'fa' ? 'خروج از پرزنتیشن' : 'Exit'}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSongIndex(Math.max(0, selectedSongIndex - 1))}
                disabled={selectedSongIndex === 0}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-40"
              >
                ◀ {lang === 'fa' ? 'قبلی' : 'Prev'}
              </button>

              <select
                value={selectedSongIndex}
                onChange={(e) => setSelectedSongIndex(Number(e.target.value))}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600"
                dir={lang === 'fa' ? 'rtl' : 'ltr'}
              >
                {songs.map((song, index) => (
                  <option key={song.id} value={index}>
                    {song.title[lang]} - {song.artist}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSelectedSongIndex(Math.min(songs.length - 1, selectedSongIndex + 1))}
                disabled={selectedSongIndex === songs.length - 1}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-40"
              >
                {lang === 'fa' ? 'بعدی' : 'Next'} ▶
              </button>
            </div>
          </div>

          {/* محتوا */}
          {songs[selectedSongIndex] && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-5xl font-bold mb-4">{songs[selectedSongIndex].title?.[lang]}</h1>
              <p className="text-2xl text-gray-400 mb-8">{songs[selectedSongIndex].artist}</p>

              {songs[selectedSongIndex].audioUrl ? (
                <>
                  <UniversalAudioPlayer
                    audioUrl={songs[selectedSongIndex].audioUrl}
                    lyrics={filterLyrics(songs[selectedSongIndex].lyrics?.fa || songs[selectedSongIndex].lyrics?.en || '')}
                    timingPath={`/worship/data/timings/song_${songs[selectedSongIndex].id}_timing.json`}
                    lang={lang}
                    title={songs[selectedSongIndex].title?.[lang]}
                    artist={songs[selectedSongIndex].artist}
                    autoLoadTiming={true}
                    enableManualSync={isAdminOrLeader}
                    showTimingControls={isAdminOrLeader}
                  />
                  {songs[selectedSongIndex].youtubeId && (
                    <div className="mt-4">
                      <a
                        href={`https://www.youtube.com/watch?v=${songs[selectedSongIndex].youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        🎥 {lang === 'fa' ? 'مشاهده ویدیو' : 'Watch Video'}
                      </a>
                    </div>
                  )}
                </>
              ) : songs[selectedSongIndex].youtubeId ? (
                <div className="text-center">
                  <a
                    href={`https://www.youtube.com/watch?v=${songs[selectedSongIndex].youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    🎥 {lang === 'fa' ? 'مشاهده در یوتیوب' : 'Watch on YouTube'}
                  </a>
                </div>
              ) : (
                <p className="text-gray-400 text-lg">{t('noMedia')}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Normal Mode View */
        <>
          <div className="text-center mb-8 pt-8">
            <h1 className="font-bold text-4xl md:text-5xl mb-4 text-white drop-shadow-2xl">{t('worshipTitle')}</h1>
            <p className="text-gray-300 text-lg mb-6">{t('worshipDescription')}</p>

            {/* 🎵 دکمه‌های پخش آرشیو */}
            {sortedSongs.filter(s => s.audioUrl).length > 0 && (
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handlePlayAll}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-[10px] font-semibold shadow-lg shadow-green-500/30 hover:scale-105 transition-all"
                  title={lang === 'fa' ? 'پخش همه سرودها' : 'Play All Songs'}
                >
                  <PlayCircle size={20} />
                  <span>{lang === 'fa' ? 'پخش همه' : 'Play All'}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {sortedSongs.filter(s => s.audioUrl).length}
                  </span>
                </button>

                <button
                  onClick={handlePlayAllShuffle}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-[10px] font-semibold shadow-lg shadow-purple-500/30 hover:scale-105 transition-all"
                  title={lang === 'fa' ? 'پخش تصادفی' : 'Shuffle Play'}
                >
                  <Shuffle size={20} />
                  <span>{lang === 'fa' ? 'پخش تصادفی' : 'Shuffle'}</span>
                </button>
              </div>
            )}
          </div>


          {/* Horizontal Alphabet Navigator - بالای صفحه */}
          {availableLetters.length > 0 && (
            <div className="sticky top-0 z-50 bg-gradient-to-b from-gray-900 via-purple-900/95 to-transparent backdrop-blur-lg py-4 px-4 mb-8 border-b-2 border-purple-500/30 shadow-xl">
              <div className="max-w-7xl mx-auto">
                {/* عنوان */}
                <div className="text-center text-xs font-bold text-gray-400 mb-3 tracking-widest">
                  {lang === 'fa' ? '🔤 فهرست الفبایی سرودها' : '🔤 ALPHABETICAL INDEX'}
                </div>

                {/* لیست حروف */}
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {/* دکمه # برای جدیدترین */}
                  <button
                    onClick={() => scrollToLetter('#')}
                    className={`
                      relative px-4 py-2 rounded-xl font-black text-sm transition-all duration-200
                      ${activeLetterFilter === '#'
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white scale-110 shadow-lg shadow-yellow-500/60 ring-2 ring-white/30'
                        : 'bg-gradient-to-br from-yellow-600/20 to-orange-600/20 text-yellow-400 hover:from-yellow-500/50 hover:to-orange-500/50 hover:text-white hover:scale-105 hover:shadow-md border border-yellow-500/30'
                      }
                    `}
                    title={lang === 'fa' ? 'جدیدترین سرودها' : 'Recent Songs'}
                  >
                    <span className="block"># {lang === 'fa' ? 'جدید' : 'NEW'}</span>
                    {recentSongs.length > 0 && activeLetterFilter !== '#' && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {recentSongs.length}
                      </span>
                    )}
                  </button>

                  {/* خط جداکننده */}
                  <div className="w-px h-8 bg-purple-500/30"></div>

                  {/* حروف الفبا */}
                  {availableLetters.map((letter) => {
                    const count = groupedSongs[letter]?.length || 0;
                    const isActive = activeLetterFilter === letter;

                    return (
                      <button
                        key={letter}
                        onClick={() => scrollToLetter(letter)}
                        className={`
                          relative px-3 py-2 rounded-xl font-black text-sm transition-all duration-200
                          ${isActive
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white scale-110 shadow-lg shadow-purple-500/60 ring-2 ring-white/30'
                            : 'bg-white/10 text-gray-300 hover:bg-gradient-to-br hover:from-purple-500/70 hover:to-pink-500/70 hover:text-white hover:scale-105 hover:shadow-md border border-purple-500/20'
                          }
                        `}
                        title={`${letter} (${count} ${lang === 'fa' ? 'سرود' : 'songs'})`}
                      >
                        <span className="block">{letter}</span>
                        {count > 0 && !isActive && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* دکمه نمایش همه */}
                  {activeLetterFilter && (
                    <>
                      <div className="w-px h-8 bg-purple-500/30"></div>
                      <button
                        onClick={() => setActiveLetterFilter(null)}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-br from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 transition-all shadow-md animate-pulse"
                        title={lang === 'fa' ? 'نمایش همه' : 'Show All'}
                      >
                        ✕ {lang === 'fa' ? 'همه' : 'ALL'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* نمایش فیلتر فعال */}
          {activeLetterFilter && (
            <div className="mb-8 flex items-center justify-center gap-2">
              <span className="text-gray-400">{lang === 'fa' ? 'فیلتر:' : 'Filter:'}</span>
              <span className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
                {activeLetterFilter === '#'
                  ? (lang === 'fa' ? '# جدیدترین‌ها' : '# Recent')
                  : activeLetterFilter
                }
              </span>
              <button
                onClick={() => setActiveLetterFilter(null)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                ✕ {lang === 'fa' ? 'حذف فیلتر' : 'Clear'}
              </button>
            </div>
          )}

          <div id="songs-container" className="pb-12">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} />)}
              </div>
            ) : Object.keys(groupedSongs).length === 0 && recentSongs.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎵</div>
                <h2 className="text-2xl font-bold mb-2 text-white">
                  {activeLetterFilter
                    ? (lang === 'fa' ? `سرودی با حرف "${activeLetterFilter}" یافت نشد` : `No songs starting with "${activeLetterFilter}"`)
                    : (lang === 'fa' ? 'هنوز سرودی اضافه نشده است' : 'No songs yet')
                  }
                </h2>
                <p className="text-gray-400">
                  {activeLetterFilter
                    ? (lang === 'fa' ? 'حرف دیگری را انتخاب کنید' : 'Try another letter')
                    : (lang === 'fa' ? 'لطفاً صبر کنید یا با مدیر تماس بگیرید' : 'Please wait or contact admin')
                  }
                </p>
              </div>
            ) : (
              <>
                {/* بخش جدیدترین سرودها - # */}
                {!activeLetterFilter || activeLetterFilter === '#' ? (
                  <div className="mb-12" id="letter-#">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 text-white w-20 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-2xl shadow-orange-500/50 animate-pulse">
                        #
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-1">
                          {lang === 'fa' ? '🆕 جدیدترین سرودها' : '🆕 Recent Songs'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                          {lang === 'fa' ? 'آخرین سرودهای اضافه شده' : 'Latest additions to our collection'}
                        </p>
                      </div>
                      <div className="h-1 flex-1 bg-gradient-to-r from-orange-500/50 to-transparent rounded-full"></div>
                      <span className="text-orange-400 text-sm font-semibold bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30">
                        {recentSongs.length} {lang === 'fa' ? 'سرود' : 'songs'}
                      </span>
                    </div>

                    {/* Songs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                      {recentSongs.map((song, i) => (
                        <div key={song.id || i} className="relative">
                          <WorshipSongCard song={song} onClick={() => setActiveSong(song)} onKaraoke={() => { setKaraokeSong(song); setShowKaraokeMode(true); }} />
                          {/* NEW Badge */}
                          <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">
                            🆕 {lang === 'fa' ? 'جدید' : 'NEW'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* خط جداکننده */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                      <span className="text-gray-500 text-sm font-semibold">
                        {lang === 'fa' ? '📚 تمام سرودها' : '📚 All Songs'}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                    </div>
                  </div>
                ) : null}

                {/* بقیه گروه‌ها */}
                {Object.keys(groupedSongs)
                  .sort((a, b) => a.localeCompare(b, lang === 'fa' ? 'fa' : 'en'))
                  .filter(letter => !activeLetterFilter || activeLetterFilter === letter)
                  .map(letter => (
                    <div key={letter} className="mb-12" id={`letter-${letter}`}>
                      {/* Letter Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">
                          {letter}
                        </div>
                        <div className="flex-1 h-1 bg-gradient-to-r from-purple-500/50 to-transparent rounded-full"></div>
                        <span className="text-gray-400 text-sm font-semibold">
                          {groupedSongs[letter].length} {lang === 'fa' ? 'سرود' : 'songs'}
                        </span>
                      </div>

                      {/* Songs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groupedSongs[letter].map((song, i) => (
                          <WorshipSongCard key={song.id || i} song={song} onClick={() => setActiveSong(song)} onKaraoke={() => { setKaraokeSong(song); setShowKaraokeMode(true); }} />
                        ))}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>

          {/* Popup Modal for Song Details */}
          {activeSong && (
            <ModalPortal>
              <div
                className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    console.log('🔴 Background clicked, closing modal');
                    setActiveSong(null);
                  }
                }}
              >
                <div
                  className="bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 border-2 border-purple-500/50 rounded-2xl p-8 max-w-5xl w-full relative max-h-[90vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* دکمه‌های بالای راست */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    {/* دکمه Generate Timing */}
                    <button
                      onClick={async () => {
                        try {
                          const btn = document.activeElement as HTMLButtonElement;
                          btn.disabled = true;
                          btn.innerHTML = '⏳';

                          const response = await fetch(`/api/timing/generate/${activeSong.id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              lyrics: activeSong.lyrics?.fa || activeSong.lyrics?.en || '',
                              title: activeSong.title?.fa || activeSong.title?.en || '',
                              artist: activeSong.artist || '',
                              duration: 180
                            })
                          });

                          const data = await response.json();

                          if (data.success) {
                            alert(lang === 'fa' ? '✅ Timing ساخته شد! صفحه رفرش میشه...' : '✅ Timing generated! Refreshing...');
                            window.location.reload();
                          } else {
                            alert(`❌ Error: ${data.error}`);
                            btn.disabled = false;
                            btn.innerHTML = '🎵';
                          }
                        } catch (error) {
                          console.error('Error generating timing:', error);
                          alert('❌ Failed to generate timing');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-full w-12 h-12 hover:scale-110 transition-transform flex items-center justify-center text-2xl font-bold shadow-lg"
                      title={lang === 'fa' ? 'ساخت Timing خودکار' : 'Generate Auto Timing'}
                    >
                      🎵
                    </button>

                    {/* دکمه فرستادن به صفحه دوم */}
                    <button
                      onClick={() => {
                        console.log('📺 Opening on second screen');
                        openOnSecondScreen(activeSong);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 hover:scale-110 transition-transform flex items-center justify-center text-2xl font-bold shadow-lg"
                      title={lang === 'fa' ? 'فرستادن به صفحه دوم (پروژکتور)' : 'Send to Second Screen (Projector)'}
                    >
                      📺
                    </button>

                    {/* دکمه بستن */}
                    <button
                      onClick={() => {
                        console.log('🔴 Close button clicked');
                        setActiveSong(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 hover:scale-110 transition-transform flex items-center justify-center text-2xl font-bold shadow-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <h2 className="text-4xl font-bold mb-3 text-center text-white drop-shadow-lg">{activeSong.title?.[lang]}</h2>
                  <p className="text-gray-300 text-lg text-center mb-4">{activeSong.artist}</p>
                  {/* chord/mode badges if provided */}
                  {(activeSong as any)?.chord || (activeSong as any)?.mode ? (
                    <div className="flex items-center justify-center gap-3 mb-4 text-sm">
                      {(activeSong as any)?.chord && (
                        <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full">🎸 {lang === 'fa' ? 'آکورد' : 'Chord'}: {(activeSong as any).chord}</span>
                      )}
                      {(activeSong as any)?.mode && (
                        <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full">🎼 {lang === 'fa' ? 'مد' : 'Mode'}: {(activeSong as any).mode}</span>
                      )}
                    </div>
                  ) : null}

                  {/* پخش ویدیو یا صدا */}
                  <div className="mb-6">
                    {/* اولویت با پلیر کارائوکه با هایلایت کلمه به کلمه */}
                    {activeSong.audioUrl ? (
                      <>
                        <KaraokeWorshipPlayer
                          audioUrl={activeSong.audioUrl}
                          lyrics={filterLyrics(activeSong.lyrics?.fa || activeSong.lyrics?.en || '')}
                          originalLyricsWithChords={activeSong.lyrics?.fa || activeSong.lyrics?.en || ''}
                          songId={activeSong.id}
                          lang={lang}
                          title={activeSong.title?.[lang]}
                          artist={activeSong.artist}
                          showChords={false}
                          youtubeId={activeSong.youtubeId}
                          onClose={() => setActiveSong(null)}
                        />
                        {/* نمایش آکوردها و نوت‌ها زیر پلیر */}
                        <div className="mt-6">
                          <ChordLyricsDisplay
                            lyrics={activeSong.lyrics?.[lang]}
                            chords={(activeSong as any)?.chords}
                            notation={activeSong.notation}
                            lang={lang}
                            showChords={true}
                          />
                        </div>
                      </>
                    ) : activeSong.youtubeId ? (
                      <>
                        {/* YouTube Embed Player */}
                        <div className="bg-black/40 rounded-lg p-4 border border-red-500/30 mb-6">
                          <div className="aspect-video mb-4">
                            <iframe
                              className="w-full h-full rounded-lg"
                              src={`https://www.youtube.com/embed/${activeSong.youtubeId}?autoplay=0&rel=0`}
                              title={activeSong.title?.[lang]}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="text-center">
                            <a
                              href={`https://www.youtube.com/watch?v=${activeSong.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                            >
                              <Youtube size={20} />
                              {lang === 'fa' ? 'باز کردن در یوتیوب' : 'Open in YouTube'}
                            </a>
                          </div>
                        </div>
                        {/* نمایش آکوردها و متن */}
                        <div className="mt-6">
                          <ChordLyricsDisplay
                            lyrics={activeSong.lyrics?.[lang]}
                            chords={(activeSong as any)?.chords}
                            notation={activeSong.notation}
                            lang={lang}
                            showChords={true}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-gray-500">{t('noMedia')}</p>
                    )}
                  </div>

                  {/* بخش دانلود فایل‌ها - فقط برای ADMIN/LEADER */}
                  {isAdminOrLeader && (
                    <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto mb-6">
                      {/* PPTX */}
                      {activeSong.presentationFileUrl ? (
                        <a href={activeSong.presentationFileUrl} download className="bg-green-600 py-2 rounded-lg text-center hover:bg-green-700">
                          📑 {lang === 'fa' ? 'دانلود پاورپوینت' : 'Download PPT'}
                        </a>
                      ) : (
                        <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                          📑 {lang === 'fa' ? 'پاورپوینت موجود نیست' : 'No PowerPoint'}
                        </button>
                      )}
                      {/* PDF */}
                      {activeSong.pdfFileUrl ? (
                        <a href={activeSong.pdfFileUrl} download className="bg-blue-600 py-2 rounded-lg text-center hover:bg-blue-700">
                          <FileText className="inline mr-1" /> {lang === 'fa' ? 'دانلود PDF' : 'Download PDF'}
                        </a>
                      ) : (
                        <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                          <FileText className="inline mr-1" /> {lang === 'fa' ? 'PDF موجود نیست' : 'No PDF'}
                        </button>
                      )}
                      {/* Sheet */}
                      {activeSong.sheetMusicUrl ? (
                        <a href={activeSong.sheetMusicUrl} download className="bg-purple-600 py-2 rounded-lg text-center hover:bg-purple-700">
                          <FileMusic className="inline mr-1" /> {lang === 'fa' ? 'دانلود نت' : 'Download Sheet'}
                        </a>
                      ) : (
                        <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                          <FileMusic className="inline mr-1" /> {lang === 'fa' ? 'نت موجود نیست' : 'No Sheet'}
                        </button>
                      )}
                      {/* MP3 */}
                      {activeSong.audioUrl ? (
                        <a href={activeSong.audioUrl} download className="bg-teal-600 py-2 rounded-lg text-center hover:bg-teal-700">
                          🎵 {lang === 'fa' ? 'دانلود MP3' : 'Download MP3'}
                        </a>
                      ) : (
                        <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                          🎵 {lang === 'fa' ? 'فایل صوتی موجود نیست' : 'No MP3'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* شعر - فقط اگر آکورد و نوت جدا نباشند */}
                  {!((activeSong as any)?.chords || activeSong.notation) && activeSong.lyrics?.[lang] && (
                    <div className="bg-black/40 border border-gray-700 rounded-xl p-4 mb-6">
                      <h3 className="text-xl font-semibold mb-2 text-center">{lang === 'fa' ? 'متن سرود' : 'Lyrics'}</h3>
                      <pre className="whitespace-pre-wrap text-gray-200 text-center" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                        {activeSong.lyrics[lang]}
                      </pre>
                    </div>
                  )}

                  {/* نوت موسیقی - حذف شد چون در ChordLyricsDisplay نمایش داده می‌شود */}

                  {/* توضیحات - همیشه نمایش بده */}
                  <div className="bg-black/40 border border-gray-700 rounded-xl p-4 mb-6">
                    <h3 className="text-xl font-semibold mb-2 text-center">{lang === 'fa' ? 'توضیحات' : 'Notes'}</h3>
                    {activeSong.notes ? (
                      <p className="text-gray-300 text-center" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                        {activeSong.notes}
                      </p>
                    ) : (
                      <p className="text-center text-gray-400">{lang === 'fa' ? 'توضیحی ثبت نشده است' : 'No notes'}</p>
                    )}
                  </div>

                  {/* فایل‌های ضمیمه - همیشه نمایش بده */}
                  <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
                    <h3 className="text-xl font-semibold mb-2 text-center">{lang === 'fa' ? 'فایل‌های ضمیمه' : 'Attachments'}</h3>
                    {activeSong.attachments && activeSong.attachments.length > 0 ? (
                      <ul className="list-disc pl-6 text-blue-400">
                        {activeSong.attachments.map((a, i) => (
                          <li key={i}>
                            <a href={a.url || (a as any).path} target="_blank" rel="noopener noreferrer" download className="hover:text-blue-300">
                              {a.name || a.url || (a as any).path}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-gray-400">{lang === 'fa' ? 'فایلی موجود نیست' : 'No attachments'}</p>
                    )}
                  </div>
                </div>
              </div>
            </ModalPortal>
          )}
        </>
      )}

      {/* Fullscreen Karaoke Mode Modal */}
      {showKaraokeMode && karaokeSong && (
        <div className="fixed inset-0 z-[99999] bg-black/95 overflow-auto">
          {/* Close Button */}
          <button
            onClick={() => setShowKaraokeMode(false)}
            className="fixed top-4 right-4 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            title={lang === 'fa' ? 'بستن' : 'Close'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Karaoke Player */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <KaraokeWorshipPlayer
              audioUrl={karaokeSong.audioUrl || ''}
              lyrics={karaokeSong.lyrics?.[lang] || karaokeSong.lyrics?.fa || ''}
              originalLyricsWithChords={karaokeSong.lyrics?.fa || karaokeSong.lyrics?.[lang] || ''}
              title={karaokeSong.title[lang]}
              artist={karaokeSong.artist}
              lang={lang}
              songId={karaokeSong.id}
              showChords={true}
              youtubeId={(karaokeSong as any).youtubeId}
              onClose={() => setShowKaraokeMode(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorshipPage;