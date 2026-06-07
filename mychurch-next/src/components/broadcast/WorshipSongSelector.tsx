/**
 * 🎵 Worship Song Selector Pro
 * انتخاب و تنظیمات کامل سرود پرستشی برای پخش زنده
 * 
 * ویژگی‌ها:
 * - نمایش تمام اطلاعات سرود بعد از انتخاب
 * - چک‌لیست برای انتخاب بخش‌های قابل نمایش
 * - پیش‌نمایش نهایی با پس‌زمینه زیبا
 * - پشتیبانی از متن فارسی، انگلیسی، فینگلیش و آکورد
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Music, Search, X, Check, ChevronDown, ChevronUp,
  Play, Pause, Volume2, Youtube, FileText, Clock,
  Eye, EyeOff, Image as ImageIcon, Sparkles, Upload
} from 'lucide-react';
import { WorshipSong, SlideContentLyrics, LyricsLine, LyricsDisplayOptions, AppLanguage } from '@/types/broadcast';
import { fetchWorshipSongs, searchSongs, parseLyrics, BROADCAST_TRANSLATIONS } from './dataService';

interface WorshipSongSelectorProps {
  lang: AppLanguage;
  existingSlides?: any[]; // The active presentation slides
  onSelectSong: (content: SlideContentLyrics, options: LyricsDisplayOptions) => void;
  onClose: () => void;
}

interface SuggestedSong extends WorshipSong {
  matchReason?: string;
  score: number;
}

export function getSuggestionsFromSlides(songs: WorshipSong[], slides: any[]): SuggestedSong[] {
  if (!slides || slides.length === 0) return [];

  const bookKeys = new Set<string>();
  const bookNamesFa = new Set<string>();
  const keywords = new Set<string>();

  // A list of meaningful religious/theological keywords to match in Farsi
  const faithKeywords = [
    'محبت', 'عشق', 'ایمان', 'امید', 'نجات', 'صلیب', 'عیسی', 'مسیح', 'خداوند', 'پدر', 
    'روح', 'قدوس', 'جلال', 'شکر', 'حمد', 'ستایش', 'نور', 'قوت', 'رحمت', 'فیض', 
    'پادشاه', 'داود', 'ملکوتی', 'آسمان', 'شادی', 'صلح', 'آرامش', 'شفا', 'قربانی',
    'آزادی', 'عدالت', 'بخشایش', 'وفادار', 'طهارت', 'تقدیس', 'شبان'
  ];

  slides.forEach(slide => {
    if (slide.type === 'SCRIPTURE' && slide.content?.pages) {
      slide.content.pages.forEach((page: any) => {
        if (page.book) bookKeys.add(page.book.toLowerCase());
        if (page.bookName?.fa) bookNamesFa.add(page.bookName.fa);
        if (page.bookName?.en) bookKeys.add(page.bookName.en.toLowerCase());

        // Extract words from scripture texts
        const text = [...(page.textPrimary || []), ...(page.textSecondary || [])].join(' ');
        faithKeywords.forEach(kw => {
          if (text.includes(kw)) {
            keywords.add(kw);
          }
        });
      });
    } else if (slide.content) {
      const text = [
        slide.content.title,
        slide.content.titleFa,
        slide.content.titleEn,
        slide.content.content,
        slide.content.htmlContent,
        ...(slide.content.lines?.map((l: any) => l.text) || [])
      ].filter(Boolean).join(' ');

      faithKeywords.forEach(kw => {
        if (text.includes(kw)) {
          keywords.add(kw);
        }
      });
    }
  });

  if (bookKeys.size === 0 && bookNamesFa.size === 0 && keywords.size === 0) {
    return [];
  }

  const suggestions: SuggestedSong[] = songs.map(song => {
    let score = 0;
    const matchReasons: string[] = [];

    const titleFa = (song.title?.fa || '').toLowerCase();
    const titleEn = (song.title?.en || '').toLowerCase();
    const lyricsFa = (song.lyrics?.fa || '').toLowerCase();
    const lyricsEn = (song.lyrics?.en || '').toLowerCase();

    // Check book name matches in title or lyrics (high weight)
    bookNamesFa.forEach(bookFa => {
      if (titleFa.includes(bookFa.toLowerCase())) {
        score += 30;
        matchReasons.push(`عنوان مرتبط با ${bookFa}`);
      } else if (lyricsFa.includes(bookFa.toLowerCase())) {
        score += 15;
        matchReasons.push(`متن مرتبط با کتاب ${bookFa}`);
      }
    });

    bookKeys.forEach(bookKey => {
      if (titleEn.includes(bookKey) || titleFa.includes(bookKey)) {
        score += 30;
        matchReasons.push(`مرتبط با ${bookKey}`);
      } else if (lyricsEn.includes(bookKey) || lyricsFa.includes(bookKey)) {
        score += 15;
        matchReasons.push(`متن مرتبط با ${bookKey}`);
      }
    });

    // Check keyword matches in lyrics/title
    let kwMatchCount = 0;
    keywords.forEach(kw => {
      if (titleFa.includes(kw)) {
        score += 10;
        matchReasons.push(`موضوع: ${kw}`);
        kwMatchCount++;
      } else if (lyricsFa.includes(kw)) {
        score += 4;
        kwMatchCount++;
      }
    });
    
    if (kwMatchCount > 0 && matchReasons.length === 0) {
      matchReasons.push(`دارای ${kwMatchCount} کلمه کلیدی مشترک`);
      score += kwMatchCount * 2;
    }

    return {
      ...song,
      score,
      matchReason: matchReasons.length > 0 ? matchReasons.slice(0, 2).join('، ') : undefined
    };
  });

  return suggestions
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Predefined beautiful backgrounds
const BACKGROUND_PRESETS = [
  { id: 'gradient1', name: 'آسمان شب', type: 'gradient' as const, value: 'from-indigo-900 via-purple-900 to-slate-900' },
  { id: 'gradient2', name: 'غروب طلایی', type: 'gradient' as const, value: 'from-amber-900 via-orange-800 to-red-900' },
  { id: 'gradient3', name: 'اقیانوس آبی', type: 'gradient' as const, value: 'from-blue-900 via-cyan-800 to-teal-900' },
  { id: 'gradient4', name: 'جنگل سبز', type: 'gradient' as const, value: 'from-emerald-900 via-green-800 to-teal-900' },
  { id: 'gradient5', name: 'شکوفه بهار', type: 'gradient' as const, value: 'from-pink-900 via-rose-800 to-purple-900' },
  { id: 'gradient6', name: 'کلیسا', type: 'gradient' as const, value: 'from-slate-900 via-indigo-900 to-purple-950' },
];

// Normalize any format (flat array, legacy System V2, TranscriptData) into a standard nested lines object
export function normalizeTimingData(data: any): any {
  if (!data) return null;

  // Case 1: Standard SystemTimingV2 format
  if (data.version && Array.isArray(data.lines)) {
    return data;
  }

  // Case 2: TranscriptData format
  if (Array.isArray(data.lines) && !data.version) {
    return {
      songId: data.songId || 0,
      version: "2.0",
      totalDuration: data.totalDuration || 0,
      lines: data.lines.map((l: any) => ({
        line: l.content || l.line || '',
        start: l.start !== undefined ? l.start : (l.words?.[0]?.start_time || 0),
        end: l.end !== undefined ? l.end : (l.words?.[l.words.length - 1]?.end_time || 0),
        translations: l.translations || {},
        words: (l.words || []).map((w: any) => ({
          word: w.word || '',
          start: w.start !== undefined ? w.start : (w.start_time || 0),
          end: w.end !== undefined ? w.end : (w.end_time || 0),
          finglish: w.finglish || null,
          english: w.english || null
        }))
      }))
    };
  }

  // Case 3: Flat array format (e.g. raw timing.json array)
  if (Array.isArray(data)) {
    return {
      songId: 0,
      version: "2.0",
      totalDuration: 0,
      lines: data.map((l: any) => ({
        line: l.content || l.line || '',
        start: l.start !== undefined ? l.start : (l.words?.[0]?.start_time || 0),
        end: l.end !== undefined ? l.end : (l.words?.[l.words.length - 1]?.end_time || 0),
        translations: l.translations || {
          persian: l.translations?.persian || '',
          english: l.translations?.english || '',
          finglish: l.translations?.finglish || ''
        },
        words: (l.words || []).map((w: any) => ({
          word: w.word || '',
          start: w.start !== undefined ? w.start : (w.start_time || w.start || 0),
          end: w.end !== undefined ? w.end : (w.end_time || w.end || 0),
          finglish: w.finglish || null,
          english: w.english || null
        }))
      }))
    };
  }

  return null;
}

export const WorshipSongSelector: React.FC<WorshipSongSelectorProps> = ({
  lang,
  existingSlides = [],
  onSelectSong,
  onClose
}) => {
  const t = BROADCAST_TRANSLATIONS[lang];
  const isRTL = lang === 'fa';

  // Song list state
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [songSearch, setSongSearch] = useState('');
  const [filteredSongs, setFilteredSongs] = useState<WorshipSong[]>([]);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'suggested'>('all');

  // Compute suggestions based on current slides
  const suggestedSongs = useMemo(() => {
    return getSuggestionsFromSlides(songs, existingSlides);
  }, [songs, existingSlides]);

  // Selected song state
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  const [timingData, setTimingData] = useState<any>(null);

  // Display options
  const [displayOptions, setDisplayOptions] = useState<LyricsDisplayOptions>({
    showFarsiLyrics: true,
    showFinglish: true,
    showEnglishLyrics: false,
    showChords: false,
    showTitle: true,
    showArtist: true,
    showBackground: true,
    backgroundType: 'gradient',
    backgroundUrl: BACKGROUND_PRESETS[0].value,
    backgroundOpacity: 60,
    backgroundBlur: 0,
    textShadow: true,
    objectFit: 'cover'
  });

  // UI state
  const [step, setStep] = useState<'search' | 'configure' | 'preview'>('search');
  const [expandedSections, setExpandedSections] = useState<string[]>(['display', 'background']);

  // Load songs on mount
  useEffect(() => {
    setIsLoading(true);
    fetchWorshipSongs().then(loadedSongs => {
      setSongs(loadedSongs);
      setIsLoading(false);

      // If we have matching songs based on slides/verses, default to suggested tab
      const suggestions = getSuggestionsFromSlides(loadedSongs, existingSlides);
      if (suggestions.length > 0) {
        setFilterMode('suggested');
      }
    });
  }, [existingSlides]);

  // Filter songs on search & filter mode change
  useEffect(() => {
    const baseSongs = filterMode === 'suggested' ? suggestedSongs : songs;
    const results = searchSongs(baseSongs, songSearch);
    setFilteredSongs(showAllSongs || filterMode === 'suggested' ? results : results.slice(0, 10));
  }, [songSearch, songs, suggestedSongs, filterMode, showAllSongs]);

  // Handle song selection
  const handleSongSelect = async (song: WorshipSong) => {
    setSelectedSong(song);
    setStep('configure');

    // Always try to load timing data from multiple paths first
    const timingPaths = [
      `/worship/data/timings/song_${song.id}_timing.json`,
      `/worship/timing/${song.id}_timing.json`,
      `/worship/timing/song_${song.id}_timing.json`
    ];

    let loadedTiming = null;
    for (const path of timingPaths) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          loadedTiming = await res.json();
          console.log('✅ [WorshipSongSelector] Timing loaded from:', path);
          break;
        }
      } catch (err) {
        // Try next path
      }
    }

    let finalTiming = normalizeTimingData(loadedTiming);
    
    // Fall back to database timing_data if no static files found
    if (!finalTiming && song.timing_data) {
      let dbTiming: any = song.timing_data;
      if (typeof dbTiming === 'string') {
        try {
          dbTiming = JSON.parse(dbTiming);
        } catch (e) {
          dbTiming = null;
        }
      }
      finalTiming = normalizeTimingData(dbTiming);
      if (finalTiming) {
        console.log('✅ [WorshipSongSelector] Timing loaded from database.');
      }
    }

    if (finalTiming) {
      setTimingData(finalTiming);
      console.log('📊 [WorshipSongSelector] Timing data:', {
        linesCount: finalTiming.lines?.length,
        hasWords: finalTiming.lines?.[0]?.words?.length > 0
      });
    } else if ((song as any).timepoints?.length > 0) {
      // Fallback: try to reconstruct timing from flat timepoints (legacy Apple Music format)
      console.log('📊 [WorshipSongSelector] No structured timing, using flat timepoints as fallback');
      // Still set timingData as null - timepoints are handled separately in buildSlideContent
      setTimingData(null);
    } else {
      console.log('⚠️ [WorshipSongSelector] No timing data for song', song.id);
      setTimingData(null);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Parse lyrics to remove chord markers for display
  const cleanLyrics = (lyrics: string | undefined): string => {
    if (!lyrics) return '';
    // Remove chord markers [Am], [Dm], etc.
    return lyrics.replace(/\[[\w#]+\]/g, '').trim();
  };

  // Extract chords from lyrics
  const extractChords = (lyrics: string | undefined): string[] => {
    if (!lyrics) return [];
    const matches = lyrics.match(/\[[\w#]+\]/g) || [];
    return [...new Set(matches.map(m => m.replace(/[\[\]]/g, '')))];
  };

  // Build final content
  const buildSlideContent = (): SlideContentLyrics => {
    if (!selectedSong) throw new Error('No song selected');

    const rawLyrics = selectedSong.lyrics?.fa || '';
    let lines = parseLyrics(cleanLyrics(rawLyrics));

    // If no lyrics from song, try to extract from timing data
    if (lines.length === 0 && timingData?.lines) {
      console.log('📝 [WorshipSongSelector] Extracting lyrics from timing data');
      lines = timingData.lines.map((l: any) => ({
        text: l.line || l.words?.map((w: any) => w.word).join(' ') || '',
        isChorus: l.label?.toLowerCase().includes('chorus') || false,
        isVerse: true
      }));
    }

    console.log('🎵 [WorshipSongSelector] buildSlideContent:', {
      songId: selectedSong.id,
      title: selectedSong.title.fa,
      hasLyrics: !!selectedSong.lyrics?.fa,
      linesCount: lines.length,
      hasTimingData: !!timingData,
      hasAudio: !!selectedSong.audioUrl
    });

    return {
      songId: selectedSong.id,
      title: selectedSong.title[lang] || selectedSong.title.fa,
      titleFa: selectedSong.title.fa,
      titleEn: selectedSong.title.en,
      lines,
      lyricsEnLines: selectedSong.lyrics?.en
        ? parseLyrics(selectedSong.lyrics.en).map(line => line.text)
        : undefined,
      chords: selectedSong.chord,
      audioUrl: selectedSong.audioUrl,
      youtubeId: selectedSong.youtubeId,
      hasTiming: selectedSong.hasTiming || !!timingData,
      timingData,
      glassPopupEnabled: true,
      // Use DB lyrics_finglish directly if available, otherwise extract from timing_data words
      finglishLines: (() => {
        // Priority 1: Direct lyrics_finglish from DB (line-level)
        const directFinglish = (selectedSong as any).lyrics_finglish || selectedSong.lyrics?.finglish;
        if (directFinglish && typeof directFinglish === 'string' && directFinglish.trim()) {
          return directFinglish.split('\n').filter(Boolean);
        }
        // Priority 2: Extract from timing_data line translations
        if (timingData?.lines) {
          return timingData.lines.map((l: any) =>
            l.translations?.finglish || l.words?.map((w: any) => w.finglish || w.word).join(' ')
          );
        }
        return undefined;
      })(),
      persianTranslationLines: (() => {
        if (timingData?.lines) {
          return timingData.lines.map((l: any) => l.translations?.persian);
        }
        return undefined;
      })()
    };
  };

  // Confirm selection
  const handleConfirm = () => {
    const content = buildSlideContent();
    onSelectSong(content, displayOptions);
    onClose();
  };

  // Handle Background Image Upload
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setDisplayOptions(prev => ({
      ...prev,
      backgroundType: 'image',
      backgroundUrl: objectUrl
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-700">

        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-white" />
            <div>
              <h2 className={`text-xl font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? '🎵 انتخاب سرود پرستشی' : '🎵 Select Worship Song'}
              </h2>
              <p className={`text-pink-200 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'تمام اطلاعات و تنظیمات نمایش' : 'All info and display settings'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'search' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  placeholder={isRTL ? 'جستجوی سرود...' : 'Search songs...'}
                  className={`w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn] text-right' : ''}`}
                />
              </div>

              {/* Suggestions Filter Switcher */}
              {suggestedSongs.length > 0 && (
                <div className="flex bg-slate-950/40 p-1 rounded-xl border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setFilterMode('suggested')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''} ${
                      filterMode === 'suggested'
                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>💡</span>
                    <span>{isRTL ? `پیشنهاد بر اساس اسلایدها و آیات (${suggestedSongs.length})` : `Suggestions (${suggestedSongs.length})`}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''} ${
                      filterMode === 'all'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🎵</span>
                    <span>{isRTL ? 'همه سرودها' : 'All Songs'}</span>
                  </button>
                </div>
              )}

              {/* Song List */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full mx-auto" />
                  <p className={`text-slate-400 mt-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                    {isRTL ? 'در حال بارگذاری...' : 'Loading...'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredSongs.map(song => (
                    <button
                      key={song.id}
                      onClick={() => handleSongSelect(song)}
                      className={`bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-pink-500/50 rounded-xl p-4 text-right transition group ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2">
                          {song.audioUrl && <Volume2 className="w-4 h-4 text-green-400" />}
                          {song.youtubeId && <Youtube className="w-4 h-4 text-red-400" />}
                          {song.hasTiming && <Clock className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="flex-1 text-right">
                          <h4 className="font-bold text-white group-hover:text-pink-300 transition">
                            {song.title[lang] || song.title.fa}
                          </h4>
                          <p className="text-slate-400 text-sm">
                            {song.artist ? (song.artist[lang] || song.artist.fa) : ''}
                          </p>
                          {(song as any).matchReason && (
                            <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-[Vazirmatn]">
                              <span>💡</span>
                              <span>{(song as any).matchReason}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {song.lyrics?.fa && (
                        <p className="text-slate-500 text-xs mt-2 line-clamp-2 text-right">
                          {cleanLyrics(song.lyrics.fa).substring(0, 80)}...
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Show More */}
              {!showAllSongs && songs.length > 10 && (
                <button
                  onClick={() => setShowAllSongs(true)}
                  className={`w-full py-3 text-pink-400 hover:text-pink-300 text-center transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  {isRTL ? `نمایش همه (${songs.length} سرود)` : `Show all (${songs.length} songs)`}
                </button>
              )}
            </div>
          )}

          {step === 'configure' && selectedSong && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Song Info & Settings */}
              <div className="space-y-4">
                {/* Selected Song Card */}
                <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 rounded-xl p-4 border border-pink-500/30">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => { setSelectedSong(null); setStep('search'); }}
                      className="text-pink-400 hover:text-pink-300 text-sm"
                    >
                      {isRTL ? 'تغییر سرود' : 'Change song'}
                    </button>
                    <div className={`text-right ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      <h3 className="text-xl font-bold text-white">{selectedSong.title[lang] || selectedSong.title.fa}</h3>
                      <p className="text-pink-300">
                        {selectedSong.artist ? (selectedSong.artist[lang] || selectedSong.artist.fa) : ''}
                      </p>
                      {selectedSong.chord && (
                        <span className="inline-block bg-pink-600/30 text-pink-300 px-2 py-0.5 rounded text-sm mt-2">
                          🎸 {selectedSong.chord} {selectedSong.mode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3 justify-end">
                    {selectedSong.audioUrl && (
                      <span className="bg-green-600/30 text-green-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> فایل صوتی
                      </span>
                    )}
                    {selectedSong.youtubeId && (
                      <span className="bg-red-600/30 text-red-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Youtube className="w-3 h-3" /> ویدیو
                      </span>
                    )}
                    {selectedSong.hasTiming && (
                      <span className="bg-blue-600/30 text-blue-300 px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> تایمینگ
                      </span>
                    )}
                  </div>
                </div>

                {/* Display Options */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <button
                    onClick={() => toggleSection('display')}
                    className={`w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                  >
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition ${expandedSections.includes('display') ? 'rotate-180' : ''}`} />
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Eye className="w-5 h-5 text-purple-400" />
                      {isRTL ? '📋 تنظیمات نمایش' : '📋 Display Settings'}
                    </div>
                  </button>

                  {expandedSections.includes('display') && (
                    <div className={`p-4 border-t border-slate-700 space-y-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {/* Farsi Lyrics */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-slate-300 group-hover:text-white transition">🇮🇷 متن فارسی</span>
                        <input
                          type="checkbox"
                          checked={displayOptions.showFarsiLyrics}
                          onChange={(e) => setDisplayOptions(prev => ({ ...prev, showFarsiLyrics: e.target.checked }))}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500"
                        />
                      </label>

                      {/* Finglish */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-slate-300 group-hover:text-white transition">🅰️ فینگلیش (حروف انگلیسی)</span>
                        <input
                          type="checkbox"
                          checked={displayOptions.showFinglish}
                          onChange={(e) => setDisplayOptions(prev => ({ ...prev, showFinglish: e.target.checked }))}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500"
                        />
                      </label>

                      {/* English Lyrics */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-slate-300 group-hover:text-white transition">🇺🇸 متن انگلیسی</span>
                        <input
                          type="checkbox"
                          checked={displayOptions.showEnglishLyrics}
                          onChange={(e) => setDisplayOptions(prev => ({ ...prev, showEnglishLyrics: e.target.checked }))}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500"
                        />
                      </label>

                      {/* Chords */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-slate-300 group-hover:text-white transition">🎸 آکوردها</span>
                        <input
                          type="checkbox"
                          checked={displayOptions.showChords}
                          onChange={(e) => setDisplayOptions(prev => ({ ...prev, showChords: e.target.checked }))}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500"
                        />
                      </label>

                      {/* Title & Artist */}
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-slate-300 group-hover:text-white transition">📝 عنوان سرود</span>
                        <input
                          type="checkbox"
                          checked={displayOptions.showTitle}
                          onChange={(e) => setDisplayOptions(prev => ({ ...prev, showTitle: e.target.checked }))}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-slate-300 group-hover:text-white transition">🎤 نام خواننده</span>
                        <input
                          type="checkbox"
                          checked={displayOptions.showArtist}
                          onChange={(e) => setDisplayOptions(prev => ({ ...prev, showArtist: e.target.checked }))}
                          className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Background Options */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <button
                    onClick={() => toggleSection('background')}
                    className={`w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                  >
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition ${expandedSections.includes('background') ? 'rotate-180' : ''}`} />
                    <div className="flex items-center gap-2 text-white font-bold">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      {isRTL ? '🎨 پس‌زمینه' : '🎨 Background'}
                    </div>
                  </button>

                  {expandedSections.includes('background') && (
                    <div className="p-4 border-t border-slate-700 space-y-4">
                      {/* Custom Image Upload */}
                      <div className="flex gap-4 items-center">
                        <label className="flex-1 cursor-pointer bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg p-3 flex items-center justify-center gap-2 transition group">
                          <Upload className="w-5 h-5 text-pink-400 group-hover:scale-110 transition" />
                          <span className="text-slate-300 group-hover:text-white text-sm">
                            {isRTL ? 'آپلود تصویر زمینه' : 'Upload Background Image'}
                          </span>
                          <input type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                        </label>
                      </div>

                      {/* Presets */}
                      <div className="grid grid-cols-3 gap-2">
                        {BACKGROUND_PRESETS.map(bg => (
                          <button
                            key={bg.id}
                            onClick={() => setDisplayOptions(prev => ({ ...prev, backgroundType: 'gradient', backgroundUrl: bg.value }))}
                            className={`aspect-video rounded-lg bg-gradient-to-br ${bg.value} border-2 transition ${displayOptions.backgroundUrl === bg.value
                              ? 'border-pink-500 ring-2 ring-pink-500/30'
                              : 'border-transparent hover:border-slate-500'
                              }`}
                            title={bg.name}
                          />
                        ))}
                      </div>

                      {/* Advanced Controls */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                        {/* Opacity */}
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                            <span>{isRTL ? 'شفافیت' : 'Opacity'}</span>
                            <span>{displayOptions.backgroundOpacity || 60}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={displayOptions.backgroundOpacity || 60}
                            onChange={(e) => setDisplayOptions(prev => ({ ...prev, backgroundOpacity: parseInt(e.target.value) }))}
                            className="w-full accent-pink-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Blur */}
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block flex justify-between">
                            <span>{isRTL ? 'تاری (Blur)' : 'Blur'}</span>
                            <span>{displayOptions.backgroundBlur || 0}px</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={displayOptions.backgroundBlur || 0}
                            onChange={(e) => setDisplayOptions(prev => ({ ...prev, backgroundBlur: parseInt(e.target.value) }))}
                            className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Shadow */}
                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                          <input
                            type="checkbox"
                            checked={displayOptions.textShadow}
                            onChange={(e) => setDisplayOptions(prev => ({ ...prev, textShadow: e.target.checked }))}
                            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-pink-500 focus:ring-pink-500"
                          />
                          <span className="text-xs text-slate-300">{isRTL ? 'سایه متن قوی (برای خوانایی)' : 'Strong Text Shadow'}</span>
                        </label>

                        {/* Object Fit */}
                        {displayOptions.backgroundType === 'image' && (
                          <div className="col-span-2">
                            <label className="text-xs text-slate-400 mb-1 block">{isRTL ? 'نحوه نمایش عکس' : 'Image Fit'}</label>
                            <div className="flex bg-slate-900 rounded-lg p-1">
                              {['cover', 'contain', 'fill'].map((fit) => (
                                <button
                                  key={fit}
                                  onClick={() => setDisplayOptions(prev => ({ ...prev, objectFit: fit as any }))}
                                  className={`flex-1 py-1 px-2 rounded text-xs transition capitalize ${displayOptions.objectFit === fit
                                      ? 'bg-slate-700 text-white shadow'
                                      : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                  {fit}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Preview */}
              <div className="space-y-4">
                <h4 className={`text-white font-bold flex items-center gap-2 justify-end ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  👁️ پیش‌نمایش نهایی
                </h4>


                <div className={`aspect-video rounded-xl overflow-hidden relative bg-black`}>
                  {/* Background Layer */}
                  {displayOptions.backgroundType === 'image' ? (
                    <img
                      src={displayOptions.backgroundUrl}
                      alt="Preview Background"
                      className={`absolute inset-0 w-full h-full transition-all duration-300`}
                      style={{
                        objectFit: displayOptions.objectFit || 'cover',
                        opacity: (displayOptions.backgroundOpacity || 100) / 100,
                        filter: `blur(${displayOptions.backgroundBlur || 0}px)`
                      }}
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 w-full h-full bg-gradient-to-br ${displayOptions.backgroundUrl}`}
                      style={{
                        opacity: (displayOptions.backgroundOpacity || 100) / 100,
                        filter: `blur(${displayOptions.backgroundBlur || 0}px)`
                      }}
                    />
                  )}

                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/10" />

                  {/* Content */}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${displayOptions.textShadow ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : ''}`}>
                    {displayOptions.showTitle && (
                      <h3 className={`text-2xl font-bold text-white mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {selectedSong.title[lang] || selectedSong.title.fa}
                      </h3>
                    )}
                    {displayOptions.showArtist && selectedSong.artist && (
                      <p className="text-white/70 text-sm mb-4">
                        {selectedSong.artist[lang] || selectedSong.artist.fa}
                      </p>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {displayOptions.showFarsiLyrics && (
                        <p className={`text-xl text-white leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`} dir="rtl">
                          {cleanLyrics(selectedSong.lyrics?.fa)?.split('\n').slice(0, 4).join('\n')}
                        </p>
                      )}
                      {displayOptions.showFinglish && timingData?.lines?.[0] && (
                        <p className="text-white/60 text-sm">
                          {timingData.lines[0].words?.map((w: any) => w.finglish || w.word).join(' ')}
                        </p>
                      )}
                    </div>

                    {displayOptions.showChords && selectedSong.chord && (
                      <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-amber-300 text-sm">
                        🎸 {selectedSong.chord}
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Content Info */}
                <div className={`bg-slate-800/50 rounded-xl p-4 text-right ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  <h5 className="text-slate-400 text-sm mb-2">محتوای موجود:</h5>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {selectedSong.lyrics?.fa && (
                      <span className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded text-xs">✓ متن فارسی</span>
                    )}
                    {selectedSong.lyrics?.en && (
                      <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs">✓ متن انگلیسی</span>
                    )}
                    {selectedSong.hasTiming && (
                      <span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded text-xs">✓ فینگلیش</span>
                    )}
                    {selectedSong.chord && (
                      <span className="bg-amber-900/30 text-amber-400 px-2 py-1 rounded text-xs">✓ آکورد</span>
                    )}
                    {selectedSong.audioUrl && (
                      <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs">✓ صوت</span>
                    )}
                    {selectedSong.youtubeId && (
                      <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs">✓ ویدیو</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 flex items-center justify-between bg-slate-800/50">
          <button
            onClick={onClose}
            className={`px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
          >
            {isRTL ? 'انصراف' : 'Cancel'}
          </button>

          {step === 'configure' && (
            <button
              onClick={handleConfirm}
              className={`px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-500 hover:to-purple-500 transition flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
            >
              <Check className="w-5 h-5" />
              {isRTL ? 'افزودن به اسلایدها' : 'Add to Slides'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorshipSongSelector;
