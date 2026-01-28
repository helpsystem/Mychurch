/**
 * 🎬 Broadcast Slide Builder
 * ساخت و مدیریت اسلایدهای پخش زنده
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Slide, SlideType, BroadcastSession, 
  SlideContentScripture, SlideContentLyrics, SlideContentMedia,
  ScripturePage, WorshipSong, BibleBook, AppLanguage
} from './types';
import { 
  fetchWorshipSongs, searchSongs, parseLyrics,
  getBibleBooks, searchScripture, fetchBibleVerse,
  BROADCAST_TRANSLATIONS 
} from './dataService';
import { 
  BookOpen, Music, Image, Video, Plus, GripVertical, 
  Trash2, ChevronDown, ChevronUp, Search, Mic, Megaphone
} from 'lucide-react';

interface SlideBuilderProps {
  session: BroadcastSession;
  setSession: React.Dispatch<React.SetStateAction<BroadcastSession>>;
  lang: AppLanguage;
  activeSlideIndex: number;
  onSlideSelect: (index: number) => void;
}

type ModalType = 'NONE' | 'SCRIPTURE' | 'LYRICS' | 'MEDIA' | 'ANNOUNCEMENT';

export const SlideBuilder: React.FC<SlideBuilderProps> = ({
  session,
  setSession,
  lang,
  activeSlideIndex,
  onSlideSelect
}) => {
  const t = BROADCAST_TRANSLATIONS[lang];
  const isRTL = lang === 'fa';
  
  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  
  // Data State
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [songSearch, setSongSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  
  // Scripture State
  const [scriptureSearch, setScriptureSearch] = useState('');
  const [scripturePages, setScripturePages] = useState<ScripturePage[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  
  // Lyrics Form State
  const [lyricsTitle, setLyricsTitle] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const [lyricsChords, setLyricsChords] = useState('');
  
  // Media Form State
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [mediaLoop, setMediaLoop] = useState(false);
  const [mediaAutoplay, setMediaAutoplay] = useState(true);
  
  // Drag State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load songs on mount
  useEffect(() => {
    fetchWorshipSongs().then(setSongs);
  }, []);

  // Filter songs based on search
  const filteredSongs = searchSongs(songs, songSearch);

  // Reset forms
  const resetForms = () => {
    setScriptureSearch('');
    setScripturePages([]);
    setSongSearch('');
    setSelectedSong(null);
    setLyricsTitle('');
    setLyricsText('');
    setLyricsChords('');
    setMediaUrl('');
    setMediaType('image');
    setMediaLoop(false);
    setMediaAutoplay(true);
  };

  // Add slide to session
  const addSlide = useCallback((type: SlideType, content: any) => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      order: session.slides.length,
      type,
      content,
      notes: ''
    };
    setSession(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));
    setActiveModal('NONE');
    resetForms();
    
    // Select the new slide
    onSlideSelect(session.slides.length);
  }, [session.slides.length, setSession, onSlideSelect]);

  // Delete slide
  const deleteSlide = useCallback((index: number) => {
    setSession(prev => ({
      ...prev,
      slides: prev.slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
    }));
    if (activeSlideIndex >= index && activeSlideIndex > 0) {
      onSlideSelect(activeSlideIndex - 1);
    }
  }, [setSession, activeSlideIndex, onSlideSelect]);

  // Move slide
  const moveSlide = useCallback((index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === session.slides.length - 1)) return;
    
    const newSlides = [...session.slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    newSlides.forEach((s, i) => s.order = i);
    
    setSession(prev => ({ ...prev, slides: newSlides }));
    onSlideSelect(targetIndex);
  }, [session.slides, setSession, onSlideSelect]);

  // Handle Scripture Search
  const handleScriptureSearch = async () => {
    if (!scriptureSearch.trim()) return;
    
    setIsFetching(true);
    const result = await searchScripture(scriptureSearch);
    if (result) {
      setScripturePages([result]);
    }
    setIsFetching(false);
  };

  // Handle Scripture Submit
  const handleScriptureSubmit = () => {
    if (scripturePages.length === 0) return;
    
    const content: SlideContentScripture = { pages: scripturePages };
    addSlide(SlideType.SCRIPTURE, content);
  };

  // Handle Song Selection
  const handleSongSelect = (song: WorshipSong) => {
    setSelectedSong(song);
    setLyricsTitle(song.title[lang] || song.title.fa);
    setLyricsText(song.lyrics?.fa || '');
    setLyricsChords(song.chord || '');
  };

  // Handle Lyrics Submit
  const handleLyricsSubmit = () => {
    if (!lyricsTitle || !lyricsText) return;
    
    const lines = parseLyrics(lyricsText);
    const content: SlideContentLyrics = {
      songId: selectedSong?.id,
      title: lyricsTitle,
      lines,
      chords: lyricsChords,
      audioUrl: selectedSong?.audioUrl,
      youtubeId: selectedSong?.youtubeId
    };
    addSlide(SlideType.LYRICS, content);
  };

  // Handle Media Submit
  const handleMediaSubmit = () => {
    if (!mediaUrl) return;
    
    const content: SlideContentMedia = {
      url: mediaUrl,
      mediaType,
      isLoop: mediaLoop,
      isAutoPlay: mediaAutoplay
    };
    addSlide(SlideType.MEDIA, content);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
    
    // Auto-detect type
    if (file.type.startsWith('image/')) setMediaType('image');
    else if (file.type.startsWith('video/')) setMediaType('video');
    else if (file.type.startsWith('audio/')) setMediaType('audio');
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newSlides = [...session.slides];
    const [draggedItem] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, draggedItem);
    newSlides.forEach((s, i) => s.order = i);
    
    setSession(prev => ({ ...prev, slides: newSlides }));
    setDraggedIndex(null);
  };

  // Render slide thumbnail
  const renderThumbnail = (slide: Slide, index: number) => {
    const isActive = index === activeSlideIndex;
    
    return (
      <div
        key={slide.id}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => onSlideSelect(index)}
        className={`
          relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200
          ${isActive 
            ? 'border-teal-500 shadow-lg shadow-teal-500/20 scale-105' 
            : 'border-slate-700 hover:border-slate-500'}
        `}
      >
        {/* Thumbnail Preview */}
        <div className="aspect-video bg-slate-800 p-2 flex items-center justify-center">
          {slide.type === SlideType.SCRIPTURE && (
            <div className="text-center">
              <BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentScripture).pages[0]?.bookName[lang]}
              </p>
            </div>
          )}
          {slide.type === SlideType.LYRICS && (
            <div className="text-center">
              <Music className="w-6 h-6 text-pink-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentLyrics).title}
              </p>
            </div>
          )}
          {slide.type === SlideType.MEDIA && (
            <div className="text-center">
              {(slide.content as SlideContentMedia).mediaType === 'image' && <Image className="w-6 h-6 text-blue-400 mx-auto" />}
              {(slide.content as SlideContentMedia).mediaType === 'video' && <Video className="w-6 h-6 text-purple-400 mx-auto" />}
              {(slide.content as SlideContentMedia).mediaType === 'audio' && <Mic className="w-6 h-6 text-green-400 mx-auto" />}
            </div>
          )}
        </div>
        
        {/* Slide Number */}
        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
          {index + 1}
        </div>
        
        {/* Drag Handle */}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        
        {/* Actions */}
        <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'up'); }}
            className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            disabled={index === 0}
          >
            <ChevronUp className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'down'); }}
            className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            disabled={index === session.slides.length - 1}
          >
            <ChevronDown className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
            className="p-1 bg-red-600/80 rounded hover:bg-red-500"
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className={`text-lg font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          {t.smartBuilder}
        </h2>
        
        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveModal('SCRIPTURE')}
            className="flex items-center gap-2 px-3 py-2 bg-amber-600/20 border border-amber-600/40 rounded-lg text-amber-400 hover:bg-amber-600/30 transition text-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.addScripture}</span>
          </button>
          <button
            onClick={() => setActiveModal('LYRICS')}
            className="flex items-center gap-2 px-3 py-2 bg-pink-600/20 border border-pink-600/40 rounded-lg text-pink-400 hover:bg-pink-600/30 transition text-sm"
          >
            <Music className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.addLyrics}</span>
          </button>
          <button
            onClick={() => setActiveModal('MEDIA')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-600/40 rounded-lg text-blue-400 hover:bg-blue-600/30 transition text-sm"
          >
            <Image className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.addMedia}</span>
          </button>
          <button
            onClick={() => setActiveModal('ANNOUNCEMENT')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600/20 border border-green-600/40 rounded-lg text-green-400 hover:bg-green-600/30 transition text-sm"
          >
            <Megaphone className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.addAnnouncement}</span>
          </button>
        </div>
      </div>
      
      {/* Slides List */}
      <div className="flex-1 overflow-y-auto p-4">
        {session.slides.length === 0 ? (
          <div className={`text-center text-slate-500 text-sm py-8 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {t.noSlides}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {session.slides.map((slide, index) => renderThumbnail(slide, index))}
          </div>
        )}
      </div>

      {/* ============ MODALS ============ */}
      
      {/* Scripture Modal */}
      {activeModal === 'SCRIPTURE' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              📖 {t.addScripture}
            </h3>
            
            {/* Search */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={scriptureSearch}
                onChange={(e) => setScriptureSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScriptureSearch()}
                placeholder={t.searchScripture}
                className={`flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
              <button
                onClick={handleScriptureSearch}
                disabled={isFetching}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition disabled:opacity-50"
              >
                {isFetching ? '...' : <Search className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Preview */}
            {scripturePages.length > 0 && (
              <div className="bg-slate-900 rounded-lg p-4 mb-4">
                {scripturePages.map((page, i) => (
                  <div key={i} className="mb-4 last:mb-0">
                    <p className={`text-amber-400 text-sm mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {page.bookName[lang]} {page.chapter}:{page.verses}
                    </p>
                    <p className={`text-white text-lg leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {page.textPrimary}
                    </p>
                    {page.textSecondary && (
                      <p className="text-slate-400 text-sm mt-2 italic">
                        {page.textSecondary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleScriptureSubmit}
                disabled={scripturePages.length === 0}
                className={`px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Modal */}
      {activeModal === 'LYRICS' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              🎵 {t.addLyrics}
            </h3>
            
            {/* Song Search */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.selectSong}
              </label>
              <input
                type="text"
                value={songSearch}
                onChange={(e) => setSongSearch(e.target.value)}
                placeholder={t.searchSongs}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
              
              {/* Song List */}
              {filteredSongs.length > 0 && !selectedSong && (
                <div className="mt-2 bg-slate-900 rounded-lg max-h-40 overflow-y-auto">
                  {filteredSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => handleSongSelect(song)}
                      className={`w-full px-3 py-2 text-left hover:bg-slate-700 transition text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                      <span className="font-medium">{song.title[lang] || song.title.fa}</span>
                      <span className="text-slate-400 text-sm ml-2">- {song.artist}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Selected Song */}
              {selectedSong && (
                <div className="mt-2 flex items-center justify-between bg-pink-600/20 border border-pink-600/40 rounded-lg px-3 py-2">
                  <span className={`text-pink-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                    {selectedSong.title[lang]} - {selectedSong.artist}
                  </span>
                  <button onClick={() => setSelectedSong(null)} className="text-pink-400 hover:text-pink-300">
                    ✕
                  </button>
                </div>
              )}
            </div>
            
            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.songTitle}
              </label>
              <input
                type="text"
                value={lyricsTitle}
                onChange={(e) => setLyricsTitle(e.target.value)}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>
            
            {/* Lyrics */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.lyricsLabel}
              </label>
              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                rows={8}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>
            
            {/* Chords */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.chordsLabel}
              </label>
              <input
                type="text"
                value={lyricsChords}
                onChange={(e) => setLyricsChords(e.target.value)}
                placeholder="e.g., Am - G - C - F"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleLyricsSubmit}
                disabled={!lyricsTitle || !lyricsText}
                className={`px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {activeModal === 'MEDIA' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              🖼️ {t.addMedia}
            </h3>
            
            {/* Media Type */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.mediaType}
              </label>
              <div className="flex gap-2">
                {[
                  { type: 'image', icon: <Image className="w-4 h-4" />, label: t.image },
                  { type: 'video', icon: <Video className="w-4 h-4" />, label: t.video },
                  { type: 'audio', icon: <Mic className="w-4 h-4" />, label: t.audio }
                ].map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setMediaType(type as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition ${
                      mediaType === type
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {icon}
                    <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* File Upload */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.uploadFile}
              </label>
              <input
                type="file"
                accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'audio/*'}
                onChange={handleFileUpload}
                className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
              />
            </div>
            
            {/* Or URL */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.fileUrl}
              </label>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            
            {/* Preview */}
            {mediaUrl && (
              <div className="mb-4 bg-slate-900 rounded-lg p-4">
                {mediaType === 'image' && <img src={mediaUrl} alt="Preview" className="max-h-40 mx-auto rounded" />}
                {mediaType === 'video' && <video src={mediaUrl} className="max-h-40 mx-auto rounded" controls />}
                {mediaType === 'audio' && <audio src={mediaUrl} className="w-full" controls />}
              </div>
            )}
            
            {/* Options */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mediaLoop}
                  onChange={(e) => setMediaLoop(e.target.checked)}
                  className="accent-blue-500"
                />
                <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{t.loop}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mediaAutoplay}
                  onChange={(e) => setMediaAutoplay(e.target.checked)}
                  className="accent-blue-500"
                />
                <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{t.autoplay}</span>
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleMediaSubmit}
                disabled={!mediaUrl}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideBuilder;
