import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '../hooks/useLanguage';
import { WorshipSong } from '../types';
import { useContent } from '../hooks/useContent';
import { Youtube, FileText, FileMusic } from 'lucide-react';
import AudioPlayerWithLyrics from '../components/AudioPlayerWithLyrics';
import YouTubePlayerWithLyrics from '../components/YouTubePlayerWithLyrics';
import LocalAudioPlayerWithSyncedLyrics from '../components/LocalAudioPlayerWithSyncedLyrics';
import ChordLyricsDisplay from '../components/ChordLyricsDisplay';
import { getRandomImage } from '../lib/theme';

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

// 🔹 Modal Portal Component
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modalRoot = document.getElementById('root') || document.body;
  return ReactDOM.createPortal(children, modalRoot);
};

// 🔹 کارت نمایش سرود
const WorshipSongCard: React.FC<{ song: WorshipSong; onClick?: () => void }> = ({ song, onClick }) => {
  const { lang } = useLanguage();
  const hasYoutube = !!song.youtubeId;
  const thumbnailUrl = hasYoutube ? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg` : getRandomImage();

  const handleClick = () => {
    console.log('🎵 Card Clicked:', song.title?.[lang]);
    onClick?.();
  };

  return (
    <div
      className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/30 rounded-[20px] overflow-hidden cursor-pointer hover:scale-105 hover:shadow-2xl hover:border-purple-500/60 transition-all duration-300"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      <div className="relative">
        <img src={thumbnailUrl} alt={song.title?.[lang] || 'Song'} className="w-full h-48 object-cover" />
        {hasYoutube && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
            <Youtube size={64} className="text-white drop-shadow-lg" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col bg-black/30 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-white text-center drop-shadow-md">{song.title?.[lang]}</h3>
        <p className="text-gray-300 text-sm text-center mt-1">{song.artist}</p>
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
  const { content, loading: isLoading } = useContent();
  const songs = content.worshipSongs || [];
  const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timingData, setTimingData] = useState<TimingData | null>(null);
  const [loadingTiming, setLoadingTiming] = useState(false);

  // Debug log
  React.useEffect(() => {
    console.log('🎵 WorshipPage Debug:', {
      isLoading,
      songsCount: songs.length,
      hasSongs: songs.length > 0,
      firstSong: songs[0]
    });
  }, [isLoading, songs]);

  // تابع فیلتر lyrics مثل timing-recorder
  const filterLyrics = (lyrics: string): string => {
    if (!lyrics) return '';
    
    // حذف Chord ها: [C], [Dm], [G], etc.
    let clean = lyrics.replace(/\[([A-G][#b]?m?\d?[\/]?[A-G]?[#b]?)\]/g, '');
    
    // حذف عناوین: V1, V2, Chorus, etc.
    clean = clean.replace(/^(V\d+|Chorus\d*|Bridge|Intro|Outro|Verse\s*\d*)$/gm, '');
    
    // حذف virgool‌های انتهای خط (برای سینک با timing)
    clean = clean.replace(/\s*،\s*$/gm, '');
    clean = clean.replace(/،\s+/g, ' '); // virgool وسط خط → فاصله
    
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
    // ساخت HTML کامل برای صفحه دوم
    const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${song.title?.fa || song.title?.en} - Projector</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .header {
            background: rgba(0,0,0,0.5);
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #ffd700;
        }
        h1 { font-size: 3rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
        .artist { font-size: 1.8rem; color: #ffd700; }
        .content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            overflow-y: auto;
        }
        .lyrics {
            font-size: 2.5rem;
            line-height: 2;
            text-align: center;
            white-space: pre-wrap;
            text-shadow: 2px 2px 6px rgba(0,0,0,0.9);
            max-width: 90%;
        }
        .word {
            display: inline-block;
            margin: 0 8px;
            transition: all 0.3s ease;
        }
        .word.active {
            color: #ffd700;
            transform: scale(1.3);
            font-weight: bold;
            text-shadow: 0 0 20px rgba(255,215,0,0.8);
        }
        audio { display: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${song.title?.fa || song.title?.en}</h1>
        <p class="artist">${song.artist || ''}</p>
    </div>
    <div class="content">
        <div class="lyrics" id="lyrics"></div>
    </div>
    ${song.audioUrl ? `<audio id="audio" src="${song.audioUrl}" controls></audio>` : ''}
    <script>
        const lyricsText = ${JSON.stringify(filterLyrics(song.lyrics?.fa || song.lyrics?.en || ''))};
        const lyricsDiv = document.getElementById('lyrics');
        const audio = document.getElementById('audio');
        
        // نمایش متن
        if (lyricsText) {
            const words = lyricsText.split(/\\s+/);
            lyricsDiv.innerHTML = words.map((word, i) => 
                \`<span class="word" data-index="\${i}">\${word}</span>\`
            ).join(' ');
        }
        
        // Auto-play صدا اگر موجود بود
        if (audio) {
            setTimeout(() => audio.play(), 1000);
        }
        
        // کلید ESC برای بستن
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.close();
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
      {/* Test Modal Button */}
      {!presentationMode && songs.length > 0 && (
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
      
      {/* Presentation Mode Toggle Button */}
      {!presentationMode && (
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
                  <LocalAudioPlayerWithSyncedLyrics
                    audioUrl={songs[selectedSongIndex].audioUrl}
                    lyrics={filterLyrics(songs[selectedSongIndex].lyrics?.fa || songs[selectedSongIndex].lyrics?.en || '')}
                    lyricLines={timingData?.lines.map(line => ({
                      time: line.start,
                      text: line.line,
                      words: line.words
                    }))}
                    lang={lang}
                    title={songs[selectedSongIndex].title?.[lang]}
                    artist={songs[selectedSongIndex].artist}
                  />
                  {loadingTiming && (
                    <div className="mt-2 text-sm text-yellow-400">
                      ⏳ {lang === 'fa' ? 'در حال بارگذاری timing...' : 'Loading timing...'}
                    </div>
                  )}
                  {timingData && (
                    <div className="mt-2 text-sm text-green-400">
                      ✅ {lang === 'fa' ? 'Timing دقیق فعال است' : 'Precise timing enabled'}
                    </div>
                  )}
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
          <div className="text-center mb-12 pt-8">
            <h1 className="font-bold text-4xl md:text-5xl mb-4 text-white drop-shadow-2xl">{t('worshipTitle')}</h1>
            <p className="text-gray-300 text-lg">{t('worshipDescription')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} />)
              : songs.length === 0
              ? (
                  <div className="col-span-full text-center py-20">
                    <div className="text-6xl mb-4">🎵</div>
                    <h2 className="text-2xl font-bold mb-2 text-white">{lang === 'fa' ? 'هنوز سرودی اضافه نشده است' : 'No songs yet'}</h2>
                    <p className="text-gray-400">{lang === 'fa' ? 'لطفاً صبر کنید یا با مدیر تماس بگیرید' : 'Please wait or contact admin'}</p>
                  </div>
                )
              : songs.map((song, i) => (
                  <WorshipSongCard key={song.id || i} song={song} onClick={() => setActiveSong(song)} />
                ))}
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
                  {/* اولویت با پلیر صوتی + متن هایلایت شده */}
                  {activeSong.audioUrl ? (
                    <>
                      <LocalAudioPlayerWithSyncedLyrics
                        audioUrl={activeSong.audioUrl}
                        lyrics={filterLyrics(activeSong.lyrics?.fa || activeSong.lyrics?.en || '')}
                        lyricLines={timingData?.lines.map(line => ({
                          time: line.start,
                          text: line.line,
                          words: line.words
                        }))}
                        chords={(activeSong as any)?.chords}
                        notation={activeSong.notation}
                        lang={lang}
                        title={activeSong.title?.[lang]}
                        artist={activeSong.artist}
                        showChords={false}
                      />
                      {timingData && (
                        <div className="mt-2 text-sm text-green-400 text-center">
                          ✅ {lang === 'fa' ? 'Timing دقیق فعال است' : 'Precise timing enabled'}
                        </div>
                      )}
                      {/* لینک یوتیوب اگر موجود باشد */}
                      {activeSong.youtubeId && (
                        <div className="mt-4 text-center">
                          <a
                            href={`https://www.youtube.com/watch?v=${activeSong.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                          >
                            🎥 {lang === 'fa' ? 'مشاهده ویدیو در یوتیوب' : 'Watch on YouTube'}
                          </a>
                        </div>
                      )}
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

                {/* بخش دانلود فایل‌ها - همیشه نمایش بده */}
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
    </div>
  );
};

export default WorshipPage;