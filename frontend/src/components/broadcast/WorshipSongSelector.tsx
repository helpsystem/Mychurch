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

import React, { useState, useEffect } from 'react';
import { 
  Music, Search, X, Check, ChevronDown, ChevronUp,
  Play, Pause, Volume2, Youtube, FileText, Clock,
  Eye, EyeOff, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { WorshipSong, SlideContentLyrics, LyricsLine, LyricsDisplayOptions, AppLanguage } from './types';
import { fetchWorshipSongs, searchSongs, parseLyrics, BROADCAST_TRANSLATIONS } from './dataService';

interface WorshipSongSelectorProps {
  lang: AppLanguage;
  onSelectSong: (content: SlideContentLyrics, options: LyricsDisplayOptions) => void;
  onClose: () => void;
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

export const WorshipSongSelector: React.FC<WorshipSongSelectorProps> = ({
  lang,
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
    backgroundUrl: BACKGROUND_PRESETS[0].value
  });

  // UI state
  const [step, setStep] = useState<'search' | 'configure' | 'preview'>('search');
  const [expandedSections, setExpandedSections] = useState<string[]>(['display', 'background']);

  // Load songs on mount
  useEffect(() => {
    setIsLoading(true);
    fetchWorshipSongs().then(loadedSongs => {
      setSongs(loadedSongs);
      setFilteredSongs(loadedSongs.slice(0, 10));
      setIsLoading(false);
    });
  }, []);

  // Filter songs on search
  useEffect(() => {
    const results = searchSongs(songs, songSearch);
    setFilteredSongs(showAllSongs ? results : results.slice(0, 10));
  }, [songSearch, songs, showAllSongs]);

  // Handle song selection
  const handleSongSelect = async (song: WorshipSong) => {
    setSelectedSong(song);
    setStep('configure');

    // Load timing data if available
    if (song.hasTiming) {
      try {
        const res = await fetch(`/worship/timing/${song.id}_timing.json`);
        if (res.ok) {
          const data = await res.json();
          setTimingData(data);
        }
      } catch (err) {
        console.log('No timing data for song', song.id);
      }
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
    const lines = parseLyrics(cleanLyrics(rawLyrics));

    return {
      songId: selectedSong.id,
      title: selectedSong.title[lang] || selectedSong.title.fa,
      lines,
      chords: selectedSong.chord,
      audioUrl: selectedSong.audioUrl,
      youtubeId: selectedSong.youtubeId,
      hasTiming: selectedSong.hasTiming,
      timingData,
      finglishLines: timingData?.lines?.map((l: any) => 
        l.words?.map((w: any) => w.finglish || w.word).join(' ')
      )
    };
  };

  // Confirm selection
  const handleConfirm = () => {
    const content = buildSlideContent();
    onSelectSong(content, displayOptions);
    onClose();
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
                          <p className="text-slate-400 text-sm">{song.artist}</p>
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
                      <p className="text-pink-300">{selectedSong.artist}</p>
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
                      <div className="grid grid-cols-3 gap-2">
                        {BACKGROUND_PRESETS.map(bg => (
                          <button
                            key={bg.id}
                            onClick={() => setDisplayOptions(prev => ({ ...prev, backgroundType: 'gradient', backgroundUrl: bg.value }))}
                            className={`aspect-video rounded-lg bg-gradient-to-br ${bg.value} border-2 transition ${
                              displayOptions.backgroundUrl === bg.value 
                                ? 'border-pink-500 ring-2 ring-pink-500/30' 
                                : 'border-transparent hover:border-slate-500'
                            }`}
                            title={bg.name}
                          />
                        ))}
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
                
                <div className={`aspect-video rounded-xl overflow-hidden bg-gradient-to-br ${displayOptions.backgroundUrl || BACKGROUND_PRESETS[0].value} relative`}>
                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/30" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    {displayOptions.showTitle && (
                      <h3 className={`text-2xl font-bold text-white mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {selectedSong.title[lang] || selectedSong.title.fa}
                      </h3>
                    )}
                    {displayOptions.showArtist && (
                      <p className="text-white/70 text-sm mb-4">{selectedSong.artist}</p>
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
