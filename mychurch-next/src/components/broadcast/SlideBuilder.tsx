"use client";

/**
 * 🎬 Broadcast Slide Builder
 * ساخت و مدیریت اسلایدهای پخش زنده
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Slide, SlideType, BroadcastSession,
  SlideContentScripture, SlideContentLyrics, SlideContentMedia, SlideContentAnnouncement, SlideContentGeneric, SlideContentLiveData, SlideContentMeeting, SlideContentPrayer, ChartDataPoint,
  ScripturePage, WorshipSong, BibleBook, AppLanguage, MediaDisplayConfig, BroadcastOverlayConfig
} from '@/types/broadcast';
import { getPrayers, PrayerRequest } from '@/actions/prayers';
import {
  fetchWorshipSongs, searchSongs, parseLyrics,
  getBibleBooks, searchScripture, fetchBibleVerse,
  BROADCAST_TRANSLATIONS, normalizeFarsi
} from './dataService';
import {
  BookOpen, Music, FileImage, Video, Plus, GripVertical, Upload,
  PieChart, BarChart, LineChart, Activity,
  Trash2, ChevronDown, ChevronUp, Search, Mic, Megaphone, Calendar, Edit3, PhoneCall, Eye, Heart
} from 'lucide-react';
import VerseGridPicker from './VerseGridPicker';
import ScriptureSelector from './ScriptureSelector';
import WorshipSongSelector from './WorshipSongSelector';
import SlidePreviewModal from './SlidePreviewModal';
import { MediaPickerModal } from './MediaPickerModal';

interface SlideBuilderProps {
  session: BroadcastSession;
  setSession: React.Dispatch<React.SetStateAction<BroadcastSession>>;
  lang: AppLanguage;
  activeSlideIndex: number;
  onSlideSelect: (index: number) => void;
}

type ModalType = 'NONE' | 'SCRIPTURE' | 'LYRICS' | 'MEDIA' | 'ANNOUNCEMENT' | 'GENERIC' | 'LIVEDATA' | 'MEETING' | 'PRAYER';

type LibraryAsset = {
  name: string;
  path: string;
  url: string;
  source: 'uploads' | 'media' | 'images';
  type: 'image' | 'video' | 'audio' | 'other';
  size: number;
  modifiedAt: number;
};

// Normalize any format (flat array, legacy System V2, TranscriptData) into a standard nested lines object
function normalizeTimingData(data: any): any {
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

export const SlideBuilder: React.FC<SlideBuilderProps> = ({
  session,
  setSession,
  lang,
  activeSlideIndex,
  onSlideSelect
}) => {
  if (!session) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-white p-8">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold font-[Vazirmatn]">در حال بارگذاری جلسه...</p>
          <p className="text-slate-400 mt-2">Initializing session...</p>
        </div>
      </div>
    );
  }

  const t = BROADCAST_TRANSLATIONS[lang];
  const isRTL = lang === 'fa';

  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  
  // Asset Library State
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [libraryAssets, setLibraryAssets] = useState<LibraryAsset[]>([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  
  // Preview Modal State
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Live Data State
  const [liveDataTitle, setLiveDataTitle] = useState('');
  const [liveDataChartType, setLiveDataChartType] = useState<'bar' | 'line' | 'pie' | 'doughnut'>('bar');
  const [liveDataPoints, setLiveDataPoints] = useState<ChartDataPoint[]>([{ label: 'Item 1', value: 10, color: '#3b82f6' }]);
  const [liveDataShowLegend, setLiveDataShowLegend] = useState(true);
  const [liveDataShowValues, setLiveDataShowValues] = useState(true);
  const [liveDataBackgroundType, setLiveDataBackgroundType] = useState<'color' | 'image' | 'video' | 'gradient' | 'wavyPaper'>('color');
  const [liveDataBackgroundValue, setLiveDataBackgroundValue] = useState('#000000');

  // Prayer Form State
  const [availablePrayers, setAvailablePrayers] = useState<PrayerRequest[]>([]);
  const [selectedPrayerId, setSelectedPrayerId] = useState('');
  const [prayerTitle, setPrayerTitle] = useState('');
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerUserName, setPrayerUserName] = useState('');
  const [prayerIsAnswered, setPrayerIsAnswered] = useState(false);
  const [prayerAnswerText, setPrayerAnswerText] = useState('');

  // Data State
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [songSearch, setSongSearch] = useState('');
  const [selectedSong, setSelectedSong] = useState<WorshipSong | null>(null);
  const [showAllSongs, setShowAllSongs] = useState(false);

  // Scripture State
  const [scriptureSearch, setScriptureSearch] = useState('');
  const [scripturePages, setScripturePages] = useState<ScripturePage[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Scripture Dropdown State (Enhanced)
  const [selectedBook, setSelectedBook] = useState('John');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerseStart, setSelectedVerseStart] = useState(1);
  const [selectedVerseEnd, setSelectedVerseEnd] = useState(1);
  const [showEnglish, setShowEnglish] = useState(true);
  const [bookSearch, setBookSearch] = useState('');

  // Use new verse grid picker (calendar-like UI)
  const [useNewVersePicker] = useState(true);

  // Lyrics Form State
  const [lyricsTitle, setLyricsTitle] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const [lyricsChords, setLyricsChords] = useState('');

  // Media Form State
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  const [mediaLoop, setMediaLoop] = useState(false);
  const [mediaAutoplay, setMediaAutoplay] = useState(true);
  const [mediaDisplayConfig, setMediaDisplayConfig] = useState<MediaDisplayConfig>({
    width: 100,
    height: 100,
    position: 'center',
    customX: 50,
    customY: 50,
    objectFit: 'contain',
    borderRadius: 0,
    opacity: 100
  });

  // Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementImageUrl, setAnnouncementImageUrl] = useState('');
  const [announcementLink, setAnnouncementLink] = useState('');
  const [announcementEventDate, setAnnouncementEventDate] = useState('');

  // Generic Slide State
  const [genericTitle, setGenericTitle] = useState('');
  const [genericHtmlContent, setGenericHtmlContent] = useState('');
  const [genericBackgroundType, setGenericBackgroundType] = useState<'color' | 'image' | 'video' | 'gradient' | 'wavyPaper'>('color');
  const [genericBackgroundValue, setGenericBackgroundValue] = useState('#000000');
  const [genericLayout, setGenericLayout] = useState<'title-only' | 'text-only' | 'split-left' | 'split-right' | 'centered'>('centered');
  const [genericFontFamily, setGenericFontFamily] = useState<string>('var(--font-vazirmatn)');

  // Meeting Form State
  const [meetingRoomName, setMeetingRoomName] = useState(`Mychurch-${Math.floor(Math.random() * 10000)}`);
  const [meetingSubject, setMeetingSubject] = useState('');

  // Drag State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Edit State
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);

  // Slide Templates (persisted to localStorage)
  type SlideTemplate = { id: string; name: string; slide: Slide };
  const [templates, setTemplates] = useState<SlideTemplate[]>(() => {
    try { return JSON.parse(localStorage.getItem('slideTemplates') || '[]'); } catch { return []; }
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplateName, setSavingTemplateName] = useState('');
  const [showSaveTemplateInput, setShowSaveTemplateInput] = useState(false);

  // Media Picker Popup State
  const [mediaPickerContext, setMediaPickerContext] = useState<'MEDIA' | 'GENERIC' | 'LIVEDATA' | null>(null);
  const [mediaPickerAllowedTypes, setMediaPickerAllowedTypes] = useState<('image' | 'video' | 'audio' | 'all')[]>(['all']);

  const handleMediaSelected = (url: string, type: 'image' | 'video' | 'audio' | 'other') => {
    if (mediaPickerContext === 'MEDIA') {
        setMediaUrl(url);
        if (type === 'image' || type === 'video' || type === 'audio') setMediaType(type);
    } else if (mediaPickerContext === 'GENERIC') {
        setGenericBackgroundValue(url);
    } else if (mediaPickerContext === 'LIVEDATA') {
        setLiveDataBackgroundValue(url);
    }
  };

  // Load songs on mount
  useEffect(() => {
    fetchWorshipSongs().then(setSongs);
  }, []);

  const loadLibraryAssets = useCallback(async (type: 'all' | 'image' | 'video' | 'audio' = 'all') => {
    try {
      setIsLoadingLibrary(true);
      setLibraryError('');
      const response = await fetch(`/api/broadcast/assets?type=${type}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to load assets');
      }
      setLibraryAssets(Array.isArray(data.assets) ? data.assets : []);
    } catch (error: any) {
      setLibraryError(error?.message || 'Failed to load assets');
      setLibraryAssets([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (activeModal === 'MEDIA') {
      loadLibraryAssets(mediaType);
      return;
    }
    if (activeModal === 'GENERIC') {
      if (genericBackgroundType === 'image' || genericBackgroundType === 'video') {
        loadLibraryAssets(genericBackgroundType);
      }
      return;
    }
    if (activeModal === 'LIVEDATA') {
      if (liveDataBackgroundType === 'image' || liveDataBackgroundType === 'video') {
        loadLibraryAssets(liveDataBackgroundType);
      }
    }
    if (activeModal === 'PRAYER') {
      getPrayers('all').then(setAvailablePrayers);
    }
  }, [activeModal, mediaType, genericBackgroundType, liveDataBackgroundType, loadLibraryAssets]);

  // Filter songs based on search - show all if button clicked, otherwise limit
  const filteredSongs = showAllSongs
    ? searchSongs(songs, songSearch)
    : searchSongs(songs, songSearch).slice(0, 10);

  // Reset forms
  const resetForms = () => {
    setScriptureSearch('');
    setScripturePages([]);
    setSongSearch('');
    setSelectedSong(null);
    setShowAllSongs(false);
    setLyricsTitle('');
    setLyricsText('');
    setLyricsChords('');
    setMediaUrl('');
    setMediaType('image');
    setMediaLoop(false);
    setMediaAutoplay(true);
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setAnnouncementImageUrl('');
    setAnnouncementLink('');
    setAnnouncementEventDate('');
    setGenericTitle('');
    setGenericHtmlContent('');
    setGenericBackgroundType('color');
    setGenericBackgroundValue('#000000');
    setGenericLayout('centered');
    setGenericFontFamily('var(--font-vazirmatn)');
    setLiveDataTitle('');
    setLiveDataChartType('bar');
    setLiveDataPoints([{ label: 'Item 1', value: 10, color: '#3b82f6' }]);
    setLiveDataShowLegend(true);
    setLiveDataShowValues(true);
    setLiveDataBackgroundType('color');
    setLiveDataBackgroundValue('#000000');
    setMeetingRoomName(`Mychurch-${Math.floor(Math.random() * 10000)}`);
    setMeetingSubject('');
    setEditingSlideIndex(null);
    setLibraryError('');
    setAssetSearchQuery('');
    setSelectedPrayerId('');
    setPrayerTitle('');
    setPrayerContent('');
    setPrayerUserName('');
    setPrayerIsAnswered(false);
    setPrayerAnswerText('');
  };

  // Add slide to session
  const addSlide = useCallback((type: SlideType, content: any) => {
    const newSlide: Slide = {
      id: crypto.randomUUID(),
      order: session.slides.length,
      type,
      content,
      notes: '',
      zoom: type === SlideType.SCRIPTURE ? 1.15 : 1
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

  // Edit slide - open modal with existing data
  const startEditSlide = useCallback((index: number) => {
    const slide = session.slides[index];
    setEditingSlideIndex(index);

    if (slide.type === SlideType.SCRIPTURE) {
      const content = slide.content as SlideContentScripture;
      setScripturePages(content.pages || []);
      setActiveModal('SCRIPTURE');
    } else if (slide.type === SlideType.LYRICS) {
      const content = slide.content as SlideContentLyrics;
      setLyricsTitle(content.title);
      setLyricsText(content.lines?.map(l => l.text).join('\n') || '');
      setLyricsChords(content.chords || '');
      setActiveModal('LYRICS');
    } else if (slide.type === SlideType.ANNOUNCEMENT) {
      const content = slide.content as SlideContentAnnouncement;
      setAnnouncementTitle(content.title);
      setAnnouncementContent(content.content || '');
      setAnnouncementImageUrl(content.imageUrl || '');
      setAnnouncementLink(content.link || '');
      setAnnouncementEventDate(content.eventDate || '');
      setActiveModal('ANNOUNCEMENT');
    } else if (slide.type === SlideType.MEDIA) {
      const content = slide.content as SlideContentMedia;
      setMediaUrl(content.url);
      setMediaType(content.mediaType);
      setMediaLoop(content.isLoop || false);
      setMediaAutoplay(content.isAutoPlay || false);
      // Load display config if exists
      if (content.displayConfig) {
        setMediaDisplayConfig(content.displayConfig);
      } else {
        setMediaDisplayConfig({
          width: 100,
          height: 100,
          position: 'center',
          objectFit: 'contain',
          borderRadius: 0,
          opacity: 100
        });
      }
      setActiveModal('MEDIA');
    } else if (slide.type === SlideType.GENERIC) {
      const content = slide.content as SlideContentGeneric;
      setGenericTitle(content.title || '');
      setGenericHtmlContent(content.htmlContent);
      if (content.background) {
        setGenericBackgroundType(content.background.type);
        setGenericBackgroundValue(content.background.value);
      }
      setGenericLayout(content.layout || 'centered');
      setGenericFontFamily(content.fontFamily || 'var(--font-vazirmatn)');
      setActiveModal('GENERIC');
    } else if (slide.type === SlideType.LIVEDATA) {
      const content = slide.content as SlideContentLiveData;
      setLiveDataTitle(content.title || '');
      setLiveDataChartType(content.chartType);
      setLiveDataPoints(content.data);
      setLiveDataShowLegend(content.showLegend);
      setLiveDataShowValues(content.showValues);
      if (content.background) {
        setLiveDataBackgroundType(content.background.type);
        setLiveDataBackgroundValue(content.background.value);
      }
      setActiveModal('LIVEDATA');
    } else if (slide.type === SlideType.MEETING) {
      const content = slide.content as SlideContentMeeting;
      setMeetingRoomName(content.roomName || '');
      setMeetingSubject(content.subject || '');
      setActiveModal('MEETING');
    } else if (slide.type === SlideType.PRAYER) {
      const content = slide.content as SlideContentPrayer;
      setSelectedPrayerId(content.prayerId || '');
      setPrayerTitle(content.title || '');
      setPrayerContent(content.content || '');
      setPrayerUserName(content.userName || '');
      setPrayerIsAnswered(content.isAnswered || false);
      setPrayerAnswerText(content.answerText || '');
      setActiveModal('PRAYER');
    }
  }, [session.slides]);

  // Update existing slide
  const updateSlide = useCallback((index: number, newContent: any) => {
    setSession(prev => ({
      ...prev,
      slides: prev.slides.map((s, i) => i === index ? { ...s, content: newContent } : s)
    }));
    setEditingSlideIndex(null);
    setActiveModal('NONE');
    resetForms();
  }, [setSession]);

  const updateSlideZoom = useCallback((index: number, zoom: number) => {
    setSession(prev => ({
      ...prev,
      slides: prev.slides.map((slide, i) => (i === index ? { ...slide, zoom } : slide))
    }));
  }, [setSession]);

  const clampZoom = (value: number) => Math.min(2, Math.max(0.5, Number(value.toFixed(2))));

  // Save active slide as a template
  const saveTemplate = useCallback((name: string) => {
    const slide = session.slides[activeSlideIndex];
    if (!slide) return;
    const newTemplate: SlideTemplate = {
      id: crypto.randomUUID(),
      name: name.trim() || `نمونه ${templates.length + 1}`,
      slide: { ...slide, id: crypto.randomUUID() }
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('slideTemplates', JSON.stringify(updated));
    setShowSaveTemplateInput(false);
    setSavingTemplateName('');
  }, [session.slides, activeSlideIndex, templates]);

  // Load a template (adds a copy as a new slide)
  const loadTemplate = useCallback((template: SlideTemplate) => {
    const newSlide: Slide = { ...template.slide, id: crypto.randomUUID(), order: session.slides.length };
    setSession(prev => ({ ...prev, slides: [...prev.slides, newSlide] }));
    onSlideSelect(session.slides.length);
  }, [session.slides.length, setSession, onSlideSelect]);

  // Delete a template
  const deleteTemplate = useCallback((id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('slideTemplates', JSON.stringify(updated));
  }, [templates]);

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

    const hasMissingVerses = scripturePages.some((page) => {
      const missingPrimary = page.missingPrimaryVerses?.length ?? 0;
      const missingSecondary = page.missingSecondaryVerses?.length ?? 0;
      return missingPrimary > 0 || missingSecondary > 0;
    });

    if (hasMissingVerses) {
      const confirmed = window.confirm(
        isRTL
          ? 'در این محدوده، بعضی آیه‌ها در یکی از ترجمه‌ها موجود نیستند. برای جلوگیری از حذف بی‌صدا، ادامه می‌دهید؟'
          : 'Some verses in this range are missing in one of the translations. Continue anyway?'
      );
      if (!confirmed) return;
    }

    const content: SlideContentScripture = {
      pages: scripturePages.map(page => ({
        ...page,
        glassPopupEnabled: true,
        popupLabelFa: `${page.bookName.fa} ${page.chapter}:${page.verses}`,
        popupLabelEn: `${page.bookName.en} ${page.chapter}:${page.verses}`
      }))
    };
    addSlide(SlideType.SCRIPTURE, content);
  };

  // Handle Song Selection - with timing data loading
  const handleSongSelect = async (song: WorshipSong) => {
    setSelectedSong(song);
    setLyricsTitle(song.title[lang] || song.title.fa);
    setLyricsChords(song.chord || '');

    console.log('🎵 [SlideBuilder] Song selected:', {
      id: song.id,
      title: song.title.fa,
      hasTiming: song.hasTiming,
      audioUrl: song.audioUrl
    });

    // Load timing data if available
    let timingData = song.timing_data || null;

    if (!timingData) {
      // Always try to load timing data regardless of hasTiming flag
      const timingPaths = [
        `/worship/data/timings/song_${song.id}_timing.json`,
        `/worship/timing/${song.id}_timing.json`,
        `/worship/timing/song_${song.id}_timing.json`
      ];

      for (const path of timingPaths) {
        try {
          const timingRes = await fetch(path);
          if (timingRes.ok) {
            timingData = await timingRes.json();
            console.log('✅ Loaded timing from:', path);
            break;
          }
        } catch (err) {
          // Try next path
        }
      }
    } else {
        console.log('✅ Loaded timing directly from database');
    }

    // Normalize timing data
    timingData = normalizeTimingData(timingData);

    if (timingData) {
      // Store timing in song object temporarily
      (song as any)._timingData = timingData;
      console.log('📊 [SlideBuilder] Timing data loaded:', {
        linesCount: timingData.lines?.length,
        hasWords: timingData.lines?.[0]?.words?.length > 0
      });
    } else {
      console.log('⚠️ No timing data found for song', song.id);
    }

    // Use song.lyrics if available, otherwise extract from timing data
    let lyricsFromTiming = '';
    if (timingData?.lines && Array.isArray(timingData.lines)) {
      lyricsFromTiming = timingData.lines.map((l: any) => l.line || '').join('\n');
    }

    const finalLyrics = song.lyrics?.fa || lyricsFromTiming || '';
    setLyricsText(finalLyrics);

    console.log('📝 Song selected:', {
      id: song.id,
      title: song.title.fa,
      hasLyrics: !!song.lyrics?.fa,
      hasTimingData: !!timingData,
      lyricsLength: finalLyrics.length
    });
  };

  // Handle Lyrics Submit - with timing data
  const handleLyricsSubmit = () => {
    if (!lyricsTitle || !lyricsText) return;

    const lines = parseLyrics(lyricsText);
    
    // Retrieve existing slide content if editing to preserve metadata
    const existingContent = editingSlideIndex !== null ? (session.slides[editingSlideIndex]?.content as SlideContentLyrics) : null;

    let timingData = (selectedSong as any)?._timingData || existingContent?.timingData;
    
    // Normalize existing timing data just in case
    timingData = normalizeTimingData(timingData);

    const songId = selectedSong?.id || existingContent?.songId;
    const audioUrl = selectedSong?.audioUrl || existingContent?.audioUrl;
    const youtubeId = selectedSong?.youtubeId || existingContent?.youtubeId;
    const hasTiming = selectedSong?.hasTiming || !!timingData || existingContent?.hasTiming;

    // Extract finglish and persian translation lines from timing data if available
    let finglishLines = existingContent?.finglishLines;
    let persianTranslationLines = existingContent?.persianTranslationLines;
    if (timingData?.lines) {
      finglishLines = timingData.lines.map((line: any) => {
        if (line.translations?.finglish) return line.translations.finglish;
        // Get finglish from word array
        if (line.words && Array.isArray(line.words)) {
          return line.words.map((w: any) => w.finglish || '').join(' ').trim();
        }
        return '';
      });
      persianTranslationLines = timingData.lines.map((line: any) => {
        return line.translations?.persian || '';
      });
    }

    const content: SlideContentLyrics = {
      songId,
      title: lyricsTitle,
      lines,
      chords: lyricsChords,
      audioUrl,
      youtubeId,
      hasTiming,
      timingData,
      finglishLines,
      persianTranslationLines
    };

    // If editing, update existing slide
    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.LYRICS, content);
    }
  };

  // Handle Media Submit
  const handleMediaSubmit = () => {
    if (!mediaUrl) return;

    const content: SlideContentMedia = {
      url: mediaUrl,
      mediaType,
      isLoop: mediaLoop,
      isAutoPlay: mediaAutoplay,
      displayConfig: mediaDisplayConfig
    };

    // If editing, update existing slide
    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.MEDIA, content);
    }
  };

  // Handle Announcement Submit
  const handleAnnouncementSubmit = () => {
    if (!announcementTitle) return;

    const content: SlideContentAnnouncement = {
      title: announcementTitle,
      content: announcementContent,
      imageUrl: announcementImageUrl || undefined,
      link: announcementLink || undefined,
      eventDate: announcementEventDate || undefined
    };

    // If editing, update existing slide
    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.ANNOUNCEMENT, content);
    }
  };

  // Handle Generic Submit
  const handleGenericSubmit = () => {
    // Retrieve content or default to title if empty
    let finalHtmlContent = genericHtmlContent;
    if (!finalHtmlContent && genericTitle) {
      finalHtmlContent = `<h1 class="text-6xl font-bold text-center">${genericTitle}</h1>`;
    }

    if (!finalHtmlContent) return;

    const content: SlideContentGeneric = {
      title: genericTitle || undefined,
      htmlContent: finalHtmlContent,
      fontFamily: genericFontFamily,
      background: {
        type: genericBackgroundType,
        value: genericBackgroundValue,
        opacity: 100
      },
      layout: genericLayout
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      // Add slide logic
      const newSlide: Slide = {
        id: crypto.randomUUID(),
        type: SlideType.GENERIC,
        content: content,
        order: session.slides.length // Add order
      };

      setSession(prev => ({
        ...prev,
        slides: [...prev.slides, newSlide]
      }));
    }

    // Close and reset
    setActiveModal('NONE');
    resetForms();
  };

  // Handle Live Data Submit
  const handleLiveDataSubmit = () => {
    if (!liveDataTitle || liveDataPoints.length === 0) return;

    const content: SlideContentLiveData = {
      title: liveDataTitle,
      chartType: liveDataChartType,
      data: liveDataPoints,
      showLegend: liveDataShowLegend,
      showValues: liveDataShowValues,
      background: {
        type: liveDataBackgroundType,
        value: liveDataBackgroundValue,
        opacity: 100
      }
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.LIVEDATA, content);
    }
  };

  // Handle Meeting Submit
  const handleMeetingSubmit = () => {
    if (!meetingRoomName) return;

    const content: SlideContentMeeting = {
      roomName: meetingRoomName,
      subject: meetingSubject
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.MEETING, content);
    }
  };

  // Handle Prayer Submit
  const handlePrayerSubmit = () => {
    if (!prayerTitle || !prayerContent) return;

    const content: SlideContentPrayer = {
      prayerId: selectedPrayerId || undefined,
      title: prayerTitle,
      content: prayerContent,
      userName: prayerUserName || undefined,
      isAnswered: prayerIsAnswered,
      answerText: prayerAnswerText || undefined
    };

    if (editingSlideIndex !== null) {
      updateSlide(editingSlideIndex, content);
    } else {
      addSlide(SlideType.PRAYER, content);
    }
  };

  const uploadAssetFile = useCallback(async (
    file: File,
    options?: { target?: 'uploads' | 'media'; folder?: string }
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', options?.target || 'uploads');
    if (options?.folder) {
      formData.append('folder', options.folder);
    }

    setUploadingAsset(true);
    setLibraryError('');
    try {
      const response = await fetch('/api/broadcast/assets/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || 'Upload failed');
      }
      return data.url as string;
    } catch (error: any) {
      setLibraryError(error?.message || 'Upload failed');
      return null;
    } finally {
      setUploadingAsset(false);
    }
  }, []);

  // Handle Announcement Image Upload
  const handleAnnouncementImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await uploadAssetFile(file, { target: 'uploads', folder: 'broadcast/announcements' });
    if (uploadedUrl) {
      setAnnouncementImageUrl(uploadedUrl);
      loadLibraryAssets('image');
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadedUrl = await uploadAssetFile(file, {
      target: file.type.startsWith('audio/') ? 'media' : 'uploads',
      folder: file.type.startsWith('audio/') ? undefined : 'broadcast/slides',
    });

    if (uploadedUrl) {
      setMediaUrl(uploadedUrl);
    }

    // Auto-detect type
    if (file.type.startsWith('image/')) setMediaType('image');
    else if (file.type.startsWith('video/')) setMediaType('video');
    else if (file.type.startsWith('audio/')) setMediaType('audio');

    loadLibraryAssets(file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio');
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

  const applyScripturePages = useCallback((pages: ScripturePage[]) => {
    if (!pages.length) return;

    if (editingSlideIndex !== null) {
      setSession((prev) => {
        const updatedSlides = [...prev.slides];
        const replacement: Slide = {
          ...updatedSlides[editingSlideIndex],
          type: SlideType.SCRIPTURE,
          content: { pages: [pages[0]] }
        };

        const extraSlides: Slide[] = pages.slice(1).map((page, idx) => ({
          id: crypto.randomUUID(),
          order: editingSlideIndex + idx + 1,
          type: SlideType.SCRIPTURE,
          content: { pages: [page] },
          notes: '',
          zoom: 1.15,
        }));

        updatedSlides.splice(editingSlideIndex, 1, replacement, ...extraSlides);
        return {
          ...prev,
          slides: updatedSlides.map((slide, idx) => ({ ...slide, order: idx })),
        };
      });

      onSlideSelect(editingSlideIndex);
      setEditingSlideIndex(null);
      setActiveModal('NONE');
      resetForms();
      return;
    }

    setSession((prev) => {
      const baseOrder = prev.slides.length;
      const newSlides: Slide[] = pages.map((page, idx) => ({
        id: crypto.randomUUID(),
        order: baseOrder + idx,
        type: SlideType.SCRIPTURE,
        content: { pages: [page] },
        notes: '',
        zoom: 1.15,
      }));

      return {
        ...prev,
        slides: [...prev.slides, ...newSlides],
      };
    });

    onSlideSelect(session.slides.length);
    setActiveModal('NONE');
    resetForms();
  }, [editingSlideIndex, onSlideSelect, resetForms, session.slides.length, setSession]);

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
            <div className="w-full text-center px-1">
              <BookOpen className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentScripture).pages[0]?.bookName[lang]}
              </p>
              <p className="text-[9px] text-slate-400 truncate" dir="ltr">
                {(slide.content as SlideContentScripture).pages[0]?.bookName.en} {(slide.content as SlideContentScripture).pages[0]?.chapter}:{(slide.content as SlideContentScripture).pages[0]?.verses}
              </p>
              {((slide.content as SlideContentScripture).pages[0]?.textPrimary?.length || 0) > 1 && (
                <div className="mt-1.5 space-y-0.5 text-left">
                  {(slide.content as SlideContentScripture).pages[0]?.textPrimary?.slice(0, 2).map((line, lineIdx) => (
                    <p key={lineIdx} className="text-[8px] text-slate-300/90 truncate">
                      {line}
                    </p>
                  ))}
                  {((slide.content as SlideContentScripture).pages[0]?.textPrimary?.length || 0) > 2 && (
                    <p className="text-[8px] text-amber-300/90">+{((slide.content as SlideContentScripture).pages[0]?.textPrimary?.length || 0) - 2} more</p>
                  )}
                </div>
              )}
            </div>
          )}
          {slide.type === SlideType.LYRICS && (
            <div className="text-center">
              <Music className="w-6 h-6 text-pink-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentLyrics).titleFa || (slide.content as SlideContentLyrics).title}
              </p>
              <p className="text-[9px] text-slate-400 truncate" dir="ltr">
                {(slide.content as SlideContentLyrics).titleEn || (slide.content as SlideContentLyrics).title}
              </p>
            </div>
          )}
          {slide.type === SlideType.MEDIA && (
            <div className="text-center">
              {(slide.content as SlideContentMedia).mediaType === 'image' && <FileImage className="w-6 h-6 text-blue-400 mx-auto" />}
              {(slide.content as SlideContentMedia).mediaType === 'video' && <Video className="w-6 h-6 text-purple-400 mx-auto" />}
              {(slide.content as SlideContentMedia).mediaType === 'audio' && <Mic className="w-6 h-6 text-green-400 mx-auto" />}
            </div>
          )}
          {slide.type === SlideType.ANNOUNCEMENT && (
            <div className="text-center">
              <Megaphone className="w-6 h-6 text-green-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentAnnouncement).title}
              </p>
            </div>
          )}
          {slide.type === SlideType.GENERIC && (
            <div className="text-center">
              <Edit3 className="w-6 h-6 text-purple-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentGeneric).title || 'Design'}
              </p>
            </div>
          )}
          {slide.type === SlideType.LIVEDATA && (
            <div className="text-center">
              <PieChart className="w-6 h-6 text-rose-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentLiveData).title || 'Live Data'}
              </p>
            </div>
          )}
          {slide.type === SlideType.MEETING && (
            <div className="text-center">
              <PhoneCall className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">
                {(slide.content as SlideContentMeeting).subject || 'Meeting'}
              </p>
            </div>
          )}
          {slide.type === SlideType.MEDIA && (slide.content as SlideContentMedia).mediaType === 'image' && (
            <div className="text-center">
              <FileImage className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <p className="text-[10px] text-white truncate">Image</p>
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
            onClick={(e) => { e.stopPropagation(); setPreviewSlideIndex(index); setIsPreviewOpen(true); }}
            className="p-1 bg-purple-600/80 rounded hover:bg-purple-500"
            title={isRTL ? 'پیش‌نمایش' : 'Preview'}
          >
            <Eye className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); startEditSlide(index); }}
            className="p-1 bg-blue-600/80 rounded hover:bg-blue-500"
            title={isRTL ? 'ویرایش' : 'Edit'}
          >
            <Edit3 className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'up'); }}
            className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            disabled={index === 0}
            title={isRTL ? 'بالا' : 'Move Up'}
            aria-label={isRTL ? 'انتقال به بالا' : 'Move Slide Up'}
          >
            <ChevronUp className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); moveSlide(index, 'down'); }}
            className="p-1 bg-slate-700 rounded hover:bg-slate-600"
            disabled={index === session.slides.length - 1}
            title={isRTL ? 'پایین' : 'Move Down'}
            aria-label={isRTL ? 'انتقال به پایین' : 'Move Slide Down'}
          >
            <ChevronDown className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
            className="p-1 bg-red-600/80 rounded hover:bg-red-500"
            title={isRTL ? 'حذف' : 'Delete'}
            aria-label={isRTL ? 'حذف اسلاید' : 'Delete Slide'}
          >
            <Trash2 className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="w-full md:w-72 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col h-[40vh] md:h-full overflow-hidden select-none shrink-0"
      dir={isRTL ? 'rtl' : 'ltr'}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: "none", MozUserSelect: "none", msUserSelect: "none", userSelect: "none" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h2 className={`text-lg font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          {t.smartBuilder}
        </h2>

        {session.slides[activeSlideIndex] && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'زوم اسلاید فعال' : 'Active slide zoom'}</span>
              <span className="font-mono text-indigo-300">
                {Math.round((session.slides[activeSlideIndex].zoom || 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={session.slides[activeSlideIndex].zoom || 1}
              onChange={(e) => updateSlideZoom(activeSlideIndex, clampZoom(parseFloat(e.target.value)))}
              className="w-full accent-indigo-500"
              aria-label={isRTL ? 'زوم اسلاید فعال' : 'Active slide zoom'}
            />
            <div className="flex gap-2 text-[10px] text-slate-500">
              <button type="button" onClick={() => updateSlideZoom(activeSlideIndex, 0.85)} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">85%</button>
              <button type="button" onClick={() => updateSlideZoom(activeSlideIndex, 1)} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">100%</button>
              <button type="button" onClick={() => updateSlideZoom(activeSlideIndex, 1.15)} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">115%</button>
              <button type="button" onClick={() => updateSlideZoom(activeSlideIndex, 1.3)} className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">130%</button>
            </div>

          {/* Save as Template */}
          {showSaveTemplateInput ? (
            <div className="flex gap-2 mt-2">
              <input
                autoFocus
                type="text"
                placeholder={isRTL ? 'نام نمونه...' : 'Template name...'}
                value={savingTemplateName}
                onChange={e => setSavingTemplateName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveTemplate(savingTemplateName); if (e.key === 'Escape') setShowSaveTemplateInput(false); }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
              />
              <button type="button" onClick={() => saveTemplate(savingTemplateName)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-xs font-bold" title="ذخیره">✓</button>
              <button type="button" onClick={() => setShowSaveTemplateInput(false)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs" title="لغو">✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSaveTemplateInput(true)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 rounded-lg text-emerald-400 text-xs font-bold transition"
              title={isRTL ? 'ذخیره این اسلاید به عنوان نمونه' : 'Save slide as template'}
            >
              <span>💾</span>
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'ذخیره به‌عنوان نمونه' : 'Save as Template'}</span>
            </button>
          )}
        </div>
        )}

        {/* Saved Templates */}
        {templates.length > 0 && (
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <button
              type="button"
              onClick={() => setShowTemplates(v => !v)}
              className="w-full flex items-center justify-between text-xs text-slate-300 font-bold"
            >
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>📁 {isRTL ? `نمونه‌های ذخیره‌شده (${templates.length})` : `Saved Templates (${templates.length})`}</span>
              <span>{showTemplates ? '▲' : '▼'}</span>
            </button>
            {showTemplates && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadTemplate(t)}
                      className="flex-1 text-left px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-700/30 hover:border-indigo-500/40 border border-transparent text-xs text-slate-200 transition truncate"
                      title={isRTL ? 'اضافه کردن این نمونه' : 'Add this template'}
                    >
                      {t.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(t.id)}
                      className="p-1 text-slate-600 hover:text-red-400 transition rounded"
                      title={isRTL ? 'حذف نمونه' : 'Delete template'}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveModal('SCRIPTURE')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-600/20 border border-amber-600/40 rounded-lg text-amber-400 hover:bg-amber-600/30 transition text-xs justify-center md:justify-start"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addScripture}</span>
          </button>
          <button
            onClick={() => setActiveModal('LYRICS')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-pink-600/20 border border-pink-600/40 rounded-lg text-pink-400 hover:bg-pink-600/30 transition text-xs justify-center md:justify-start"
          >
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addLyrics}</span>
          </button>

          <button
            onClick={() => setActiveModal('MEDIA')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-600/20 border border-blue-600/40 rounded-lg text-blue-400 hover:bg-blue-600/30 transition text-xs justify-center md:justify-start"
          >
            <FileImage className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addMedia}</span>
          </button>
          <button
            onClick={() => setActiveModal('PRAYER')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-600/20 border border-rose-600/40 rounded-lg text-rose-400 hover:bg-rose-600/30 transition text-xs justify-center md:justify-start"
          >
            <Heart className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{isRTL ? 'درخواست دعا' : 'Prayer Request'}</span>
          </button>
          <button
            onClick={() => setActiveModal('ANNOUNCEMENT')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-green-600/20 border border-green-600/40 rounded-lg text-green-400 hover:bg-green-600/30 transition text-xs justify-center md:justify-start"
          >
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{t.addAnnouncement}</span>
          </button>

          {/* Generic/Rich Text Slide Button */}
          <button
            onClick={() => setActiveModal('GENERIC')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-purple-600/20 border border-purple-600/40 rounded-lg text-purple-400 hover:bg-purple-600/30 transition text-xs justify-center"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{isRTL ? 'اسلاید آزاد' : 'Design'}</span>
          </button>

          {/* Meeting Slide Button */}
          <button
            onClick={() => setActiveModal('MEETING')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-emerald-600/20 border border-emerald-600/40 rounded-lg text-emerald-400 hover:bg-emerald-600/30 transition text-xs justify-center"
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{isRTL ? 'ارتباط ویدیویی' : 'Video Call'}</span>
          </button>

          {/* Live Data Slide Button */}
          <button
            onClick={() => setActiveModal('LIVEDATA')}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-rose-600/20 border border-rose-600/40 rounded-lg text-rose-400 hover:bg-rose-600/30 transition text-xs col-span-2 justify-center"
          >
            <PieChart className="w-3.5 h-3.5 shrink-0" />
            <span className={isRTL ? 'font-[Vazirmatn] truncate' : 'truncate'}>{isRTL ? 'نمودار زنده / آمار' : 'Live Charts / Stats'}</span>
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

      {/* Scripture Modal - Pro Version with full features */}
      {activeModal === 'SCRIPTURE' && useNewVersePicker && (
        <ScriptureSelector
          lang={lang}
          onAddSlides={applyScripturePages}
          onClose={() => { setActiveModal('NONE'); resetForms(); }}
        />
      )}

      {/* Legacy Scripture Modal - Fallback */}
      {activeModal === 'SCRIPTURE' && !useNewVersePicker && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              📖 {t.addScripture}
            </h3>

            {/* Book Selection */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {t.book}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder={isRTL ? 'جستجوی کتاب...' : 'Search book...'}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                  aria-label={t.book}
                />
                <div className="absolute top-full left-0 right-0 bg-slate-900 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 border border-slate-700">
                  {getBibleBooks()
                    .filter(b =>
                      bookSearch === '' ||
                      normalizeFarsi(b.name.fa).includes(normalizeFarsi(bookSearch)) ||
                      b.name.en.toLowerCase().includes(bookSearch.toLowerCase()) ||
                      b.key.toLowerCase().includes(bookSearch.toLowerCase())
                    )
                    .slice(0, 15)
                    .map(book => (
                      <button
                        key={book.key}
                        onClick={() => {
                          setSelectedBook(book.key);
                          setBookSearch(book.name[lang]);
                          setSelectedChapter(1);
                          setSelectedVerseStart(1);
                          setSelectedVerseEnd(1);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-700 transition ${selectedBook === book.key ? 'bg-amber-600/30 text-amber-400' : 'text-white'
                          } ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                      >
                        {book.name[lang]} ({book.chapters} {isRTL ? 'باب' : 'ch.'})
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Chapter & Verse Selection */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {t.chapter}
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(Number(e.target.value));
                    setSelectedVerseStart(1);
                    setSelectedVerseEnd(1);
                  }}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  aria-label={t.chapter}
                >
                  {Array.from({ length: getBibleBooks().find(b => b.key === selectedBook)?.chapters || 1 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'از آیه' : 'From'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={176}
                  value={selectedVerseStart}
                  onChange={(e) => setSelectedVerseStart(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  aria-label={isRTL ? 'شماره آیه شروع' : 'Start Verse Number'}
                />
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'تا آیه' : 'To'}
                </label>
                <input
                  type="number"
                  min={selectedVerseStart}
                  max={176}
                  value={selectedVerseEnd}
                  onChange={(e) => setSelectedVerseEnd(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                  aria-label={isRTL ? 'شماره آیه پایان' : 'End Verse Number'}
                />
              </div>
            </div>

            {/* Show English Toggle */}
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={showEnglish}
                onChange={(e) => setShowEnglish(e.target.checked)}
                className="accent-amber-500 w-5 h-5"
              />
              <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? '☑ نمایش متن انگلیسی' : '☑ Show English text'}
              </span>
            </label>

            {/* Fetch Button */}
            <button
              onClick={async () => {
                setIsFetching(true);
                const verses = selectedVerseStart === selectedVerseEnd
                  ? String(selectedVerseStart)
                  : `${selectedVerseStart}-${selectedVerseEnd}`;
                const result = await fetchBibleVerse(selectedBook, selectedChapter, verses);
                if (result) {
                  // اگر showEnglish فعال نیست، textSecondary را خالی کن
                  if (!showEnglish) {
                    result.textSecondary = [];
                  }
                  result.glassPopupEnabled = true;
                  result.popupLabelFa = `${result.bookName.fa} ${result.chapter}:${result.verses}`;
                  result.popupLabelEn = `${result.bookName.en} ${result.chapter}:${result.verses}`;
                  setScripturePages([result]);
                }
                setIsFetching(false);
              }}
              disabled={isFetching}
              className={`w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition disabled:opacity-50 mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
            >
              {isFetching ? '...' : (isRTL ? '📥 دریافت آیه' : '📥 Fetch Verse')}
            </button>

            {/* Preview */}
            {scripturePages.length > 0 && (
              <div className="bg-slate-900 rounded-lg p-4 mb-4">
                {scripturePages.map((page, i) => (
                  <div key={i} className="mb-4 last:mb-0">
                    <p className={`text-amber-400 text-sm mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {page.bookName[lang]} {page.chapter}:{page.verses}
                    </p>
                    {/* Display verses as array if available */}
                    {Array.isArray(page.textPrimary) ? (
                      <div className="space-y-2">
                        {page.textPrimary.map((verse, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="text-amber-400 font-bold min-w-[30px]">
                              {page.verseNumbers?.[idx] || (idx + 1)}
                            </span>
                            <div className="flex-1">
                              {String(verse || '').trim() ? (
                                <p className={`text-white text-base leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                  {verse}
                                </p>
                              ) : (
                                <p className="text-rose-400 text-xs font-bold uppercase tracking-wider">
                                  {isRTL ? 'آیه در این ترجمه موجود نیست' : 'Verse missing in this translation'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-white text-lg leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {page.textPrimary}
                      </p>
                    )}
                    {page.textSecondary && (
                      Array.isArray(page.textSecondary) ? (
                        <div className="space-y-2 mt-3 border-t border-slate-700 pt-3">
                          {page.textSecondary.map((verse, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                              <span className="text-slate-500 font-bold min-w-[30px] text-sm">
                                {page.verseNumbers?.[idx] || (idx + 1)}
                              </span>
                              <div className="flex-1">
                                {String(verse || '').trim() ? (
                                  <p className="text-slate-400 text-sm leading-relaxed">
                                    {verse}
                                  </p>
                                ) : (
                                  <p className="text-rose-400 text-xs font-bold uppercase tracking-wider">
                                    {isRTL ? 'آیه در این ترجمه موجود نیست' : 'Verse missing in this translation'}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm mt-2 italic">
                          {page.textSecondary}
                        </p>
                      )
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

      {/* Lyrics Modal - NEW Enhanced Worship Song Selector */}
      {activeModal === 'LYRICS' && (
        <WorshipSongSelector
          lang={lang}
          existingSlides={session.slides}
          onSelectSong={(content, options) => {
            // Add the slide with the configured content
            addSlide(SlideType.LYRICS, {
              ...content,
              // Store display options in the content for later use
              displayOptions: options
            } as any);
          }}
          onClose={() => { setActiveModal('NONE'); resetForms(); }}
        />
      )}

      {/* Media Modal */}
      {activeModal === 'MEDIA' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
                  { type: 'image', icon: <FileImage className="w-4 h-4" />, label: t.image },
                  { type: 'video', icon: <Video className="w-4 h-4" />, label: t.video },
                  { type: 'audio', icon: <Mic className="w-4 h-4" />, label: t.audio }
                ].map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setMediaType(type as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition ${mediaType === type
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
                aria-label={t.uploadFile}
              />
              {uploadingAsset && (
                <p className={`mt-2 text-xs text-amber-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'در حال آپلود فایل...' : 'Uploading file...'}
                </p>
              )}
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
                aria-label={t.fileUrl}
              />
            </div>

            {/* Asset Library Trigger */}
            <div className="mb-4 bg-slate-900/70 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className={`text-sm font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'آیا فایلی قبلاً آپلود کرده‌اید؟' : 'Already have a file?'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMediaPickerAllowedTypes(['image', 'video', 'audio']);
                  setMediaPickerContext('MEDIA');
                }}
                className={`w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                <Search className="w-5 h-5" />
                {isRTL ? 'جستجو در گالری مدیا' : 'Browse Media Gallery'}
              </button>
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

            {/* === Display Settings (ابعاد و موقعیت تصویر) === */}
            {mediaType === 'image' && (
              <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <h4 className={`text-sm font-bold text-white mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  📐 {isRTL ? 'تنظیمات نمایش' : 'Display Settings'}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Width */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'عرض:' : 'Width:'} {mediaDisplayConfig.width}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mediaDisplayConfig.width}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={isRTL ? 'عرض' : 'Width'}
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'ارتفاع:' : 'Height:'} {mediaDisplayConfig.height}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mediaDisplayConfig.height}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={isRTL ? 'ارتفاع' : 'Height'}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'موقعیت:' : 'Position:'}
                    </label>
                    <select
                      value={mediaDisplayConfig.position}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, position: e.target.value as any }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm"
                      aria-label={isRTL ? 'موقعیت' : 'Position'}
                    >
                      <option value="center">{isRTL ? 'مرکز' : 'Center'}</option>
                      <option value="top-left">{isRTL ? 'بالا چپ' : 'Top Left'}</option>
                      <option value="top-right">{isRTL ? 'بالا راست' : 'Top Right'}</option>
                      <option value="bottom-left">{isRTL ? 'پایین چپ' : 'Bottom Left'}</option>
                      <option value="bottom-right">{isRTL ? 'پایین راست' : 'Bottom Right'}</option>
                      <option value="custom">{isRTL ? 'سفارشی' : 'Custom'}</option>
                    </select>
                  </div>

                  {/* Object Fit */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'برش تصویر:' : 'Fit Mode:'}
                    </label>
                    <select
                      value={mediaDisplayConfig.objectFit}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, objectFit: e.target.value as any }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm"
                      aria-label={isRTL ? 'برش تصویر' : 'Fit Mode'}
                    >
                      <option value="cover">{isRTL ? 'پر کردن (Cover)' : 'Cover'}</option>
                      <option value="contain">{isRTL ? 'کامل (Contain)' : 'Contain'}</option>
                      <option value="fill">{isRTL ? 'کشیدن (Fill)' : 'Fill'}</option>
                      <option value="none">{isRTL ? 'بدون تغییر' : 'None'}</option>
                    </select>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'گوشه گرد:' : 'Border Radius:'} {mediaDisplayConfig.borderRadius}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={mediaDisplayConfig.borderRadius}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, borderRadius: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={isRTL ? 'گوشه گرد' : 'Border Radius'}
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'شفافیت:' : 'Opacity:'} {mediaDisplayConfig.opacity}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mediaDisplayConfig.opacity}
                      onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
                      className="w-full accent-blue-500"
                      aria-label={isRTL ? 'شفافیت' : 'Opacity'}
                    />
                  </div>
                </div>

                {/* Custom Position Controls */}
                {mediaDisplayConfig.position === 'custom' && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-700">
                    <div>
                      <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        X: {mediaDisplayConfig.customX}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mediaDisplayConfig.customX}
                        onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, customX: parseInt(e.target.value) }))}
                        className="w-full accent-purple-500"
                        aria-label="Custom X Position"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        Y: {mediaDisplayConfig.customY}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={mediaDisplayConfig.customY}
                        onChange={(e) => setMediaDisplayConfig(prev => ({ ...prev, customY: parseInt(e.target.value) }))}
                        className="w-full accent-purple-500"
                        aria-label="Custom Y Position"
                      />
                    </div>
                  </div>
                )}
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

      {/* Announcement Modal */}
      {activeModal === 'ANNOUNCEMENT' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              📢 {t.addAnnouncement}
            </h3>

            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'عنوان اعلان' : 'Title'}
              </label>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder={isRTL ? 'عنوان اعلان...' : 'Announcement title...'}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'متن اعلان' : 'Content'}
              </label>
              <textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                rows={4}
                placeholder={isRTL ? 'متن اعلان را وارد کنید...' : 'Enter announcement content...'}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 resize-none ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'تصویر (اختیاری)' : 'Image (optional)'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAnnouncementImageUpload}
                className="w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
              />
              {announcementImageUrl && (
                <div className="mt-2 relative">
                  <img src={announcementImageUrl} alt="Preview" className="max-h-32 rounded-lg" />
                  <button
                    onClick={() => setAnnouncementImageUrl('')}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Event Date */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                <Calendar className="w-4 h-4 inline mr-1" />
                {isRTL ? 'تاریخ رویداد (اختیاری)' : 'Event Date (optional)'}
              </label>
              <input
                type="datetime-local"
                value={announcementEventDate}
                onChange={(e) => setAnnouncementEventDate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Link */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'لینک (اختیاری)' : 'Link (optional)'}
              </label>
              <input
                type="url"
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
              />
            </div>

            {/* Preview */}
            {(announcementTitle || announcementContent) && (
              <div className="mb-4 bg-slate-900 rounded-lg p-4 border border-green-600/30">
                <p className={`text-sm text-green-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'پیش‌نمایش:' : 'Preview:'}
                </p>
                <h4 className={`text-white font-bold text-lg mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {announcementTitle || (isRTL ? 'بدون عنوان' : 'No title')}
                </h4>
                <p className={`text-slate-300 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {announcementContent || (isRTL ? 'بدون محتوا' : 'No content')}
                </p>
                {announcementEventDate && (
                  <p className="text-green-400 text-xs mt-2">
                    📅 {new Date(announcementEventDate).toLocaleString(isRTL ? 'fa-IR' : 'en-US')}
                  </p>
                )}
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
                onClick={handleAnnouncementSubmit}
                disabled={!announcementTitle}
                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generic/Design Modal */}
      {activeModal === 'GENERIC' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              🎨 {isRTL ? 'اسلاید آزاد' : 'Design Slide'}
            </h3>

            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'عنوان (اختیاری)' : 'Title (Optional)'}
              </label>
              <input
                type="text"
                value={genericTitle}
                onChange={(e) => setGenericTitle(e.target.value)}
                placeholder={isRTL ? 'عنوان اسلاید...' : 'Slide title...'}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Background Config */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'نوع پس‌زمینه' : 'Background Type'}
                </label>
                <select
                  value={genericBackgroundType}
                  onChange={(e) => setGenericBackgroundType(e.target.value as any)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="color">Solid Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image URL</option>
                  <option value="video">Video URL</option>
                  <option value="wavyPaper">Wavy Paper (blockquote)</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'مقدار پس‌زمینه' : 'Background Value'}
                </label>
                <input
                  type="text"
                  value={genericBackgroundValue}
                  onChange={(e) => setGenericBackgroundValue(e.target.value)}
                  placeholder={genericBackgroundType === 'color' ? '#000000' : genericBackgroundType === 'wavyPaper' ? 'متن الگوی کاغذی...' : 'URL or Gradient CSS'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            {(genericBackgroundType === 'image' || genericBackgroundType === 'video') && (
              <div className="mb-4 bg-slate-900/70 border border-slate-700 rounded-lg p-4">
                <p className={`text-sm font-bold text-white mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'انتخاب پس‌زمینه از گالری' : 'Choose background from gallery'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerAllowedTypes([genericBackgroundType]);
                    setMediaPickerContext('GENERIC');
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  <Search className="w-5 h-5" />
                  {isRTL ? 'جستجو در گالری مدیا' : 'Browse Media Gallery'}
                </button>
              </div>
            )}

            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'فونت اسلاید' : 'Slide Font'}
              </label>
              <select
                value={genericFontFamily}
                onChange={(e) => setGenericFontFamily(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="var(--font-homa)">Homa</option>
                <option value="var(--font-roboto)">Roboto</option>
                <option value="var(--font-vazirmatn)">Vazirmatn</option>
                <option value="var(--font-nastaliq)">Nastaliq</option>
                <option value="var(--font-lalezar)">Lalezar</option>
                <option value="var(--font-playfair)">Playfair Display</option>
                <option value="var(--font-merriweather)">Merriweather</option>
              </select>
            </div>

            {/* HTML Content */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'محتوای HTML' : 'HTML Content'}
              </label>
              <textarea
                value={genericHtmlContent}
                onChange={(e) => setGenericHtmlContent(e.target.value)}
                rows={6}
                placeholder={isRTL ? '<p>متن خود را اینجا بنویسید...</p>' : '<p>Enter your HTML content here...</p>'}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Supports: &lt;h1&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;img&gt;, style="..."
              </p>
            </div>

            {/* Layout */}
            <div className="mb-6">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'چیدمان' : 'Layout'}
              </label>
              <div className="flex gap-2">
                {['centered', 'title-only', 'text-only', 'split-left', 'split-right'].map(l => (
                  <button
                    key={l}
                    onClick={() => setGenericLayout(l as any)}
                    className={`px-3 py-1 rounded text-xs ${genericLayout === l ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
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
                onClick={handleGenericSubmit}
                disabled={!genericHtmlContent && !genericTitle}
                className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Data Modal */}
      {activeModal === 'LIVEDATA' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              📊 {isRTL ? 'نمودار زنده' : 'Live Chart'}
            </h3>

            {/* Title */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'عنوان نمودار' : 'Chart Title'}
              </label>
              <input
                type="text"
                value={liveDataTitle}
                onChange={(e) => setLiveDataTitle(e.target.value)}
                placeholder={isRTL ? 'عنوان...' : 'Title...'}
                className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              />
            </div>

            {/* Chart Config */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'نوع نمودار' : 'Chart Type'}
                </label>
                <div className="flex gap-2 bg-slate-700 p-1 rounded-lg">
                  {[
                    { type: 'bar', icon: BarChart },
                    { type: 'line', icon: LineChart },
                    { type: 'pie', icon: PieChart },
                    { type: 'doughnut', icon: Activity }
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => setLiveDataChartType(item.type as any)}
                      className={`flex-1 p-2 rounded flex justify-center ${liveDataChartType === item.type ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                      title={item.type}
                      aria-label={`${item.type} chart`}
                    >
                      <item.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'تنظیمات' : 'Options'}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveDataShowLegend}
                      onChange={(e) => setLiveDataShowLegend(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-700 text-rose-600"
                    />
                    <span className="text-sm text-slate-300">{isRTL ? 'نمایش راهنما (Legend)' : 'Show Legend'}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={liveDataShowValues}
                      onChange={(e) => setLiveDataShowValues(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-700 text-rose-600"
                    />
                    <span className="text-sm text-slate-300">{isRTL ? 'نمایش مقادیر' : 'Show Values'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Data Points */}
            <div className="mb-4">
              <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? 'داده‌ها' : 'Data Points'}
              </label>
              <div className="space-y-2 mb-2">
                {liveDataPoints.map((point, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={point.color}
                      onChange={(e) => {
                        const newPoints = [...liveDataPoints];
                        newPoints[index].color = e.target.value;
                        setLiveDataPoints(newPoints);
                      }}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                      aria-label="Color"
                    />
                    <input
                      type="text"
                      value={point.label}
                      onChange={(e) => {
                        const newPoints = [...liveDataPoints];
                        newPoints[index].label = e.target.value;
                        setLiveDataPoints(newPoints);
                      }}
                      placeholder="Label"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      aria-label="Data Label"
                    />
                    <input
                      type="number"
                      value={point.value}
                      onChange={(e) => {
                        const newPoints = [...liveDataPoints];
                        newPoints[index].value = Number(e.target.value);
                        setLiveDataPoints(newPoints);
                      }}
                      placeholder="Value"
                      className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                      aria-label="Data Value"
                    />
                    <button
                      onClick={() => {
                        const newPoints = [...liveDataPoints];
                        newPoints.splice(index, 1);
                        setLiveDataPoints(newPoints);
                      }}
                      className="p-1 text-slate-400 hover:text-red-400"
                      aria-label="Delete Data Point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setLiveDataPoints([...liveDataPoints, { label: 'New Item', value: 0, color: '#10b981' }])}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                {isRTL ? 'افزودن داده جدید' : 'Add Data Point'}
              </button>
            </div>

            {/* Background Config */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'نوع پس‌زمینه' : 'Background Type'}
                </label>
                <select
                  value={liveDataBackgroundType}
                  onChange={(e) => setLiveDataBackgroundType(e.target.value as any)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="color">Solid Color</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Image URL</option>
                  <option value="video">Video URL</option>
                  <option value="wavyPaper">Wavy Paper (blockquote)</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'مقدار پس‌زمینه' : 'Background Value'}
                </label>
                <input
                  type="text"
                  value={liveDataBackgroundValue}
                  onChange={(e) => setLiveDataBackgroundValue(e.target.value)}
                  placeholder={liveDataBackgroundType === 'color' ? '#000000' : 'URL or Gradient CSS'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            {(liveDataBackgroundType === 'image' || liveDataBackgroundType === 'video') && (
              <div className="mb-4 bg-slate-900/70 border border-slate-700 rounded-lg p-4">
                <p className={`text-sm font-bold text-white mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'انتخاب پس‌زمینه از گالری' : 'Choose background from gallery'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerAllowedTypes([liveDataBackgroundType]);
                    setMediaPickerContext('LIVEDATA');
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  <Search className="w-5 h-5" />
                  {isRTL ? 'جستجو در گالری مدیا' : 'Browse Media Gallery'}
                </button>
              </div>
            )}

            {libraryError && (
              <p className={`text-xs text-red-300 mb-3 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {libraryError}
              </p>
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
                onClick={handleLiveDataSubmit}
                disabled={!liveDataTitle || liveDataPoints.length === 0}
                className={`px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {activeModal === 'MEETING' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6">
            <h3 className={`text-xl font-bold text-white mb-6 flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              <PhoneCall className="w-6 h-6 text-emerald-400" />
              {isRTL ? 'ارتباط ویدیویی زنده (یکپارچه)' : 'Live Video Meeting'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'شناسه / نام اتاق جلسه' : 'Room ID'}
                </label>
                <input
                  type="text"
                  value={meetingRoomName}
                  onChange={(e) => setMeetingRoomName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="e.g. Mychurch-Sunday-Service"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono"
                />
                <p className={`text-xs text-slate-500 mt-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'فقط حروف انگلیسی، اعداد و خط تیره' : 'Alphanumeric and dashes only.'}
                </p>
              </div>

              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'موضوع / عنوان نمایش داده شده' : 'Meeting Subject'}
                </label>
                <input
                  type="text"
                  value={meetingSubject}
                  onChange={(e) => setMeetingSubject(e.target.value)}
                  placeholder={isRTL ? 'مثال: پرسش و پاسخ' : 'e.g. Q&A Session'}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                />
              </div>

              <div className="bg-emerald-900/20 border border-emerald-800/50 p-3 rounded-lg flex gap-3 mt-4">
                <Video className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className={`text-sm text-emerald-200/80 leading-relaxed ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL
                    ? 'این اسلاید پلتفرم تماس ویدیویی فوق امن (بر پایه ابری) را مستقیماً داخل کنسول باز می‌کند. مهمانان می‌توانند بدون نیاز به نصب هیچ برنامه‌ای با لینک مخصوص به استودیو متصل شوند و تصاویرشان در پخش زنده نمایش داده خواهد شد.'
                    : 'This slide launches a secure video meeting directly in the console.'}
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handleMeetingSubmit}
                disabled={!meetingRoomName}
                className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.add}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Prayer Modal */}
      {activeModal === 'PRAYER' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className={`text-xl font-bold text-white mb-6 flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              <Heart className="w-6 h-6 text-rose-400" />
              {isRTL ? 'افزودن اسلاید درخواست دعا' : 'Add Prayer Request Slide'}
            </h3>

            <div className="space-y-4 mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'انتخاب از لیست (اختیاری)' : 'Select from list (Optional)'}
                </label>
                <select
                  value={selectedPrayerId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedPrayerId(id);
                    const prayer = availablePrayers.find(p => p.id === id);
                    if (prayer) {
                      setPrayerTitle(prayer.title);
                      setPrayerContent(prayer.content);
                      setPrayerUserName(prayer.user_name);
                      setPrayerIsAnswered(prayer.status === 'answered');
                      setPrayerAnswerText(prayer.answer_text || '');
                    }
                  }}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  <option value="">{isRTL ? 'انتخاب درخواست...' : 'Select a request...'}</option>
                  {availablePrayers.map(p => (
                    <option key={p.id} value={p.id}>{p.title} - {p.user_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'عنوان / موضوع' : 'Title / Subject'}
                </label>
                <input
                  type="text"
                  value={prayerTitle}
                  onChange={(e) => setPrayerTitle(e.target.value)}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                />
              </div>

              <div>
                <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {isRTL ? 'شرح درخواست' : 'Content'}
                </label>
                <textarea
                  value={prayerContent}
                  onChange={(e) => setPrayerContent(e.target.value)}
                  rows={4}
                  className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white resize-none ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                    {isRTL ? 'نام شخص (اختیاری)' : 'Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={prayerUserName}
                    onChange={(e) => setPrayerUserName(e.target.value)}
                    className={`w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={prayerIsAnswered}
                      onChange={(e) => setPrayerIsAnswered(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500" 
                    />
                    <span className={`text-sm text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'مستجاب شده' : 'Answered'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => { setActiveModal('NONE'); resetForms(); }}
                className={`px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {t.cancel}
              </button>
              <button
                onClick={handlePrayerSubmit}
                disabled={!prayerTitle || !prayerContent}
                className={`px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
              >
                {editingSlideIndex !== null ? (isRTL ? 'به‌روزرسانی' : 'Update') : t.add}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide Preview Modal */}
      {previewSlideIndex !== null && session.slides[previewSlideIndex] && (
        <SlidePreviewModal
          slide={session.slides[previewSlideIndex]}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewSlideIndex(null);
          }}
          lang={lang}
        />
      )}
    </div>
  );
};
export default SlideBuilder;
