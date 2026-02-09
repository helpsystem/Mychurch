/**
 * 🎬 Broadcast Live Console
 * کنسول زنده پخش با پیش‌نمایش اسلایدها
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BroadcastSession, Slide, SlideType, BroadcastOverlayConfig,
  SlideContentScripture, SlideContentLyrics, SlideContentMedia, SlideContentAnnouncement,
  LowerThirdItem, PrayerRequest, DonationItem, AppLanguage
} from './types';
import { BROADCAST_TRANSLATIONS } from './dataService';
import { useHybridRecorder } from './hooks/useHybridRecorder';
import { useWebSocketSync } from './useWebSocketSync';
import {
  Play, Pause, ChevronLeft, ChevronRight, Settings,
  Video, VideoOff, Mic, MicOff, Camera, CameraOff, Image as ImageIcon,
  Radio, Users, Heart, Gift, Plus, Trash2, X, Calendar, Megaphone, Circle, Monitor,
  Save, FolderOpen, Download
} from 'lucide-react';
import { SmartWorshipPlayer } from '../worship/SmartWorshipPlayer';
import { HelpTooltip, HELP_TEXTS } from './HelpTooltip';
import PrayerCreditsRoll from './PrayerCreditsRoll';

interface LiveConsoleProps {
  session: BroadcastSession;
  mediaStream: MediaStream | null;
  setMediaStream?: (stream: MediaStream | null) => void;
  lang: AppLanguage;
  onLangToggle?: () => void;
  broadcastConfig: BroadcastOverlayConfig;
  setBroadcastConfig: React.Dispatch<React.SetStateAction<BroadcastOverlayConfig>>;
  activeSlideIndex: number;
  onSlideChange: (index: number) => void;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  session,
  mediaStream,
  setMediaStream,
  lang,
  onLangToggle,
  broadcastConfig,
  setBroadcastConfig,
  activeSlideIndex,
  onSlideChange
}) => {
  const t = BROADCAST_TRANSLATIONS[lang];
  const isRTL = lang === 'fa';
  const videoRef = useRef<HTMLVideoElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Camera & Microphone state
  const [isCameraOn, setIsCameraOn] = useState(!!mediaStream?.getVideoTracks().length);
  const [isMicOn, setIsMicOn] = useState(!!mediaStream?.getAudioTracks().length);
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);

  // Device Selection State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  // Hybrid Recorder Hook
  const {
    isRecording,
    recordingTime,
    uploadProgress,
    error: recorderError,
    startRecording,
    stopRecording
  } = useHybridRecorder(mediaStream);

  // WebSocket Sync Hook
  const {
    state: syncState,
    connect: connectSync,
    disconnect: disconnectSync,
    sendSlideChange,
    sendPlayControl
  } = useWebSocketSync({
    isLeader: true,
    onSlideChange: (slideIndex) => {
      // دستگاه‌های دیگر اسلاید را تغییر دادند
      onSlideChange(slideIndex);
    }
  });

  // State
  const [showSettings, setShowSettings] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('layout');
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showSyncPanel, setShowSyncPanel] = useState(false);
  const [displayWindow, setDisplayWindow] = useState<Window | null>(null);

  // Lower Third State
  const [newLowerThird, setNewLowerThird] = useState<Partial<LowerThirdItem>>({ title: '', subtitle: '', imageUrl: '' });

  // Prayer Request State
  const [newPrayerName, setNewPrayerName] = useState('');
  const [newPrayerContent, setNewPrayerContent] = useState('');
  const [newPrayerCategory, setNewPrayerCategory] = useState<string>('other');
  const [newPrayerPriority, setNewPrayerPriority] = useState<number>(3);
  const [showPrayerCredits, setShowPrayerCredits] = useState(false);

  // Donation State
  const [newDonation, setNewDonation] = useState<Partial<DonationItem>>({ title: '', description: '', url: '', duration: 30 });

  // === بخش ۱: ذخیره/بارگذاری تنظیمات (Templates) ===
  const [savedTemplates, setSavedTemplates] = useState<Array<{ id: string; name: string; date: string; config: BroadcastOverlayConfig }>>([]);
  const [showTemplateModal, setShowTemplateModal] = useState<false | 'save' | 'load'>(false);
  const [templateName, setTemplateName] = useState('');

  // === بخش ۲: ذخیره/بارگذاری پرزنتیشن (Slides Only) ===
  const [savedPresentations, setSavedPresentations] = useState<Array<{ id: string; name: string; date: string; slides: Slide[]; slideCount: number }>>([]);
  const [showPresentationModal, setShowPresentationModal] = useState<false | 'save' | 'load'>(false);
  const [presentationName, setPresentationName] = useState('');

  // Load saved templates and presentations on mount
  useEffect(() => {
    // Load Templates
    const savedT = localStorage.getItem('saved_templates');
    if (savedT) {
      try {
        setSavedTemplates(JSON.parse(savedT));
      } catch (e) { console.log('Failed to load saved templates'); }
    }
    // Load Presentations
    const savedP = localStorage.getItem('saved_presentations_v2');
    if (savedP) {
      try {
        setSavedPresentations(JSON.parse(savedP));
      } catch (e) { console.log('Failed to load saved presentations'); }
    }
  }, []);

  // === توابع تنظیمات (Templates) ===
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      date: new Date().toISOString(),
      config: broadcastConfig
    };
    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('saved_templates', JSON.stringify(updated));
    setTemplateName('');
    setShowTemplateModal(false);
  };

  const handleLoadTemplate = (id: string) => {
    const template = savedTemplates.find(t => t.id === id);
    if (template) {
      setBroadcastConfig(template.config);
      setNewLowerThird({ title: '', subtitle: '', imageUrl: '', imagePosition: undefined });
      setNewPrayerName('');
      setNewPrayerContent('');
      setNewDonation({ title: '', description: '', url: '', duration: 30 });
    }
    setShowTemplateModal(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('saved_templates', JSON.stringify(updated));
  };

  // === توابع پرزنتیشن (Slides) ===
  const handleSavePresentation = () => {
    if (!presentationName.trim()) return;
    const newPresentation = {
      id: crypto.randomUUID(),
      name: presentationName.trim(),
      date: new Date().toISOString(),
      slides: session.slides,
      slideCount: session.slides.length
    };
    const updated = [...savedPresentations, newPresentation];
    setSavedPresentations(updated);
    localStorage.setItem('saved_presentations_v2', JSON.stringify(updated));
    setPresentationName('');
    setShowPresentationModal(false);
  };

  const handleLoadPresentation = (id: string) => {
    const presentation = savedPresentations.find(p => p.id === id);
    if (presentation) {
      // بارگذاری اسلایدها
      if (typeof (window as any).setSessionSlides === 'function') {
        (window as any).setSessionSlides(presentation.slides);
      }
      onSlideChange(0); // نمایش اولین اسلاید
    }
    setShowPresentationModal(false);
  };

  const handleDeletePresentation = (id: string) => {
    const updated = savedPresentations.filter(p => p.id !== id);
    setSavedPresentations(updated);
    localStorage.setItem('saved_presentations_v2', JSON.stringify(updated));
  };

  // BroadcastChannel for same-browser communication (for Display window)
  useEffect(() => {
    const channelName = `broadcast-console-${syncState.sessionId || session.id || 'default'}`;
    const channel = new BroadcastChannel(channelName);
    broadcastChannelRef.current = channel;
    
    console.log('🎬 Console: BroadcastChannel initialized:', channelName);
    
    // Listen for viewer ready messages
    channel.onmessage = (event) => {
      if (event.data.type === 'viewer_ready') {
        console.log('📺 Viewer connected, sending current state');
        // Send current state to newly connected viewer
        const activeSlide = session.slides[activeSlideIndex];
        channel.postMessage({
          type: 'full_state',
          payload: {
            currentSlide: activeSlide,
            slideIndex: activeSlideIndex,
            internalPageIndex: internalPageIndex,
            config: broadcastConfig
          }
        });
      }
    };
    
    return () => {
      channel.close();
    };
  }, [syncState.sessionId, session.id, activeSlideIndex, internalPageIndex, broadcastConfig, session.slides]);

  // Send slide changes via BroadcastChannel (including internalPageIndex)
  useEffect(() => {
    if (broadcastChannelRef.current && session.slides[activeSlideIndex]) {
      broadcastChannelRef.current.postMessage({
        type: 'slide_change',
        payload: {
          slide: session.slides[activeSlideIndex],
          index: activeSlideIndex,
          internalPageIndex: internalPageIndex
        }
      });
    }
  }, [activeSlideIndex, session.slides, internalPageIndex]);

  // Send config changes via BroadcastChannel
  useEffect(() => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'overlay_toggle',
        payload: broadcastConfig
      });
    }
  }, [broadcastConfig]);

  // Handle scroll sync - send scroll position to viewer
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Throttle scroll events
    if (scrollThrottleRef.current) return;
    
    scrollThrottleRef.current = setTimeout(() => {
      scrollThrottleRef.current = null;
      
      const target = e.target as HTMLDivElement;
      const scrollPercentage = target.scrollTop / (target.scrollHeight - target.clientHeight) || 0;
      
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'scroll_sync',
          payload: { scrollPercentage }
        });
      }
    }, 50); // Throttle to 50ms
  }, []);

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Update camera/mic state when mediaStream changes
  useEffect(() => {
    setIsCameraOn(!!mediaStream?.getVideoTracks().filter(t => t.enabled).length);
    setIsMicOn(!!mediaStream?.getAudioTracks().filter(t => t.enabled).length);
  }, [mediaStream]);

  // Enumerate available devices
  const enumerateDevices = useCallback(async () => {
    try {
      // First request permission to see device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
      if (tempStream) {
        tempStream.getTracks().forEach(track => track.stop());
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter(d => d.kind === 'videoinput');
      const audios = devices.filter(d => d.kind === 'audioinput');
      setVideoDevices(videos);
      setAudioDevices(audios);
      
      // Set default selected if not set
      if (!selectedVideoDevice && videos.length > 0) {
        setSelectedVideoDevice(videos[0].deviceId);
      }
      if (!selectedAudioDevice && audios.length > 0) {
        setSelectedAudioDevice(audios[0].deviceId);
      }
      
      return { videos, audios };
    } catch (err) {
      console.error('Error enumerating devices:', err);
      return { videos: [], audios: [] };
    }
  }, [selectedVideoDevice, selectedAudioDevice]);

  // Load devices on mount and when showDeviceSelector opens
  useEffect(() => {
    if (showDeviceSelector) {
      enumerateDevices();
    }
  }, [showDeviceSelector, enumerateDevices]);

  // Auto-start camera/mic on first load if not already active
  useEffect(() => {
    const autoStartCamera = async () => {
      if (!mediaStream && !isRequestingMedia) {
        setIsRequestingMedia(true);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (setMediaStream) setMediaStream(stream);
          setIsCameraOn(true);
          setIsMicOn(true);
          console.log('📷 Camera auto-started successfully');
        } catch (err) {
          console.log('📷 Camera auto-start failed (user may need to grant permission):', err);
        }
        setIsRequestingMedia(false);
      }
    };
    
    // Small delay to let component mount
    const timer = setTimeout(autoStartCamera, 500);
    return () => clearTimeout(timer);
  }, []); // Run only once on mount

  // Apply selected devices
  const applySelectedDevices = async () => {
    setIsRequestingMedia(true);
    try {
      // Stop existing tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (setMediaStream) setMediaStream(stream);
      setIsCameraOn(true);
      setIsMicOn(true);
      setShowDeviceSelector(false);
    } catch (err) {
      console.error('Error applying devices:', err);
      alert('خطا در اتصال به دوربین/میکروفون انتخاب شده');
    }
    setIsRequestingMedia(false);
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (!mediaStream) {
      // Request camera access
      setIsRequestingMedia(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
        if (setMediaStream) setMediaStream(stream);
        setIsCameraOn(true);
      } catch (err) {
        console.error('Camera access error:', err);
      }
      setIsRequestingMedia(false);
    } else {
      // Toggle existing camera track
      mediaStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  // Toggle Microphone
  const toggleMic = async () => {
    if (!mediaStream) {
      // Request mic access
      setIsRequestingMedia(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: isCameraOn, audio: true });
        if (setMediaStream) setMediaStream(stream);
        setIsMicOn(true);
      } catch (err) {
        console.error('Mic access error:', err);
      }
      setIsRequestingMedia(false);
    } else {
      // Toggle existing audio track
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
    }
  };

  // Reset internal page when slide changes
  useEffect(() => {
    setInternalPageIndex(0);
  }, [activeSlideIndex]);

  // Auto rotation for lower thirds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (broadcastConfig.showLowerThird && broadcastConfig.isRotating && broadcastConfig.lowerThirds.length > 1) {
      interval = setInterval(() => {
        setBroadcastConfig(prev => ({
          ...prev,
          activeLowerThirdIndex: (prev.activeLowerThirdIndex + 1) % prev.lowerThirds.length
        }));
      }, broadcastConfig.rotationInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [broadcastConfig.showLowerThird, broadcastConfig.isRotating, broadcastConfig.lowerThirds.length, broadcastConfig.rotationInterval, setBroadcastConfig]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('broadcast_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setBroadcastConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) { console.log('Failed to load broadcast settings'); }
    }
  }, []);

  // Auto-connect to WebSocket when session loads
  useEffect(() => {
    if (session.id && !syncState.isConnected) {
      console.log('🔌 Auto-connecting to WebSocket for session:', session.id);
      connectSync(session.id);
    }
  }, [session.id, syncState.isConnected, connectSync]);

  // Send current slide when WebSocket connects or slide changes
  useEffect(() => {
    if (syncState.isConnected && session.slides[activeSlideIndex]) {
      console.log('📤 Sending slide to connected devices:', activeSlideIndex);
      sendSlideChange(activeSlideIndex, session.slides[activeSlideIndex]);
    }
  }, [syncState.isConnected, activeSlideIndex, session.slides, sendSlideChange]);

  // Save settings to localStorage when changed
  useEffect(() => {
    const toSave = {
      layout: broadcastConfig.layout,
      showLogo: broadcastConfig.showLogo,
      logoUrl: broadcastConfig.logoUrl,
      showLowerThird: broadcastConfig.showLowerThird,
      isRotating: broadcastConfig.isRotating,
      showPrayerTicker: broadcastConfig.showPrayerTicker,
      leaderVideoShape: broadcastConfig.leaderVideoShape
    };
    localStorage.setItem('broadcast_config', JSON.stringify(toSave));
  }, [broadcastConfig.layout, broadcastConfig.showLogo, broadcastConfig.logoUrl, broadcastConfig.showLowerThird, broadcastConfig.isRotating, broadcastConfig.showPrayerTicker, broadcastConfig.leaderVideoShape]);

  const activeSlide = session.slides[activeSlideIndex];
  const activeLowerThird = broadcastConfig.lowerThirds[broadcastConfig.activeLowerThirdIndex];
  const activeDonation = broadcastConfig.donations.find(d => d.id === broadcastConfig.activeDonationId);

  // Navigation
  const handlePrev = () => {
    if (activeSlide?.type === SlideType.SCRIPTURE) {
      const content = activeSlide.content as SlideContentScripture;
      if (internalPageIndex > 0) {
        setInternalPageIndex(prev => prev - 1);
        return;
      }
    }
    if (activeSlideIndex > 0) {
      const newIndex = activeSlideIndex - 1;
      onSlideChange(newIndex);
      // Sync with other devices
      if (syncState.isConnected) {
        const prevSlide = session.slides[newIndex];
        sendSlideChange(newIndex, prevSlide);
      }
    }
  };

  const handleNext = () => {
    if (activeSlide?.type === SlideType.SCRIPTURE) {
      const content = activeSlide.content as SlideContentScripture;
      if (content.pages && internalPageIndex < content.pages.length - 1) {
        setInternalPageIndex(prev => prev + 1);
        return;
      }
    }
    if (activeSlideIndex < session.slides.length - 1) {
      const newIndex = activeSlideIndex + 1;
      onSlideChange(newIndex);
      // Sync with other devices
      if (syncState.isConnected) {
        const nextSlide = session.slides[newIndex];
        sendSlideChange(newIndex, nextSlide);
      }
    }
  };

  // Format recording time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle sync connection
  const handleConnectSync = () => {
    const id = sessionId || `session-${Date.now()}`;
    setSessionId(id);
    connectSync(id);
  };

  // Lower Third Handlers
  const handleAddLowerThird = () => {
    if (!newLowerThird.title) return;
    const item: LowerThirdItem = {
      id: crypto.randomUUID(),
      title: newLowerThird.title,
      subtitle: newLowerThird.subtitle || '',
      imageUrl: newLowerThird.imageUrl,
      imagePosition: newLowerThird.imagePosition
    };
    setBroadcastConfig(prev => ({
      ...prev,
      lowerThirds: [...prev.lowerThirds, item]
    }));
    setNewLowerThird({ title: '', subtitle: '', imageUrl: '', imagePosition: undefined });
  };

  const handleDeleteLowerThird = (id: string) => {
    setBroadcastConfig(prev => ({
      ...prev,
      lowerThirds: prev.lowerThirds.filter(i => i.id !== id),
      activeLowerThirdIndex: 0
    }));
  };

  // Prayer Request Handlers
  const handleAddPrayerRequest = () => {
    if (!newPrayerName || !newPrayerContent) return;
    const request: PrayerRequest = {
      id: crypto.randomUUID(),
      name: newPrayerName,
      content: newPrayerContent,
      timestamp: new Date(),
      category: newPrayerCategory,
      priority: newPrayerPriority
    };
    setBroadcastConfig(prev => ({
      ...prev,
      prayerRequests: [...prev.prayerRequests, request]
    }));
    setNewPrayerName('');
    setNewPrayerContent('');
    setNewPrayerCategory('other');
    setNewPrayerPriority(3);
  };

  // Donation Handlers
  const handleAddDonation = () => {
    if (!newDonation.title || !newDonation.url) return;
    const item: DonationItem = {
      id: crypto.randomUUID(),
      title: newDonation.title,
      description: newDonation.description || '',
      url: newDonation.url,
      duration: newDonation.duration || 30
    };
    setBroadcastConfig(prev => ({
      ...prev,
      donations: [...prev.donations, item]
    }));
    setNewDonation({ title: '', description: '', url: '', duration: 30 });
  };

  const handleShowDonation = (id: string) => {
    setBroadcastConfig(prev => ({
      ...prev,
      activeDonationId: prev.activeDonationId === id ? null : id
    }));
  };

  // Toggle section in settings
  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  // Render slide content
  const renderSlideContent = () => {
    if (!activeSlide) {
      return (
        <div className={`text-center text-slate-500 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          <p className="text-xl">اسلایدی انتخاب نشده</p>
          <p className="text-sm mt-2">از پنل سمت چپ اسلاید اضافه کنید</p>
        </div>
      );
    }

    if (activeSlide.type === SlideType.SCRIPTURE) {
      const content = activeSlide.content as SlideContentScripture;
      const currentPage = content.pages[internalPageIndex];
      console.log('[LiveConsole] SCRIPTURE slide currentPage:', currentPage);
      console.log('[LiveConsole] textPrimary:', currentPage?.textPrimary);
      console.log('[LiveConsole] textSecondary:', currentPage?.textSecondary);
      const hasEnglish = currentPage?.textSecondary && 
        (Array.isArray(currentPage.textSecondary) ? currentPage.textSecondary.length > 0 : !!currentPage.textSecondary);
      const hasFarsi = currentPage?.textPrimary && 
        (Array.isArray(currentPage.textPrimary) ? currentPage.textPrimary.length > 0 : !!currentPage.textPrimary);
      console.log('[LiveConsole] hasEnglish:', hasEnglish, 'hasFarsi:', hasFarsi);

      // Prepare verses array for synchronized display
      const englishVerses = Array.isArray(currentPage.textSecondary) ? currentPage.textSecondary : [currentPage.textSecondary];
      const farsiVerses = Array.isArray(currentPage.textPrimary) ? currentPage.textPrimary : [currentPage.textPrimary];
      const maxVerses = Math.max(englishVerses.length, farsiVerses.length);

      // Translation display names
      const faTranslationNames: Record<string, string> = {
        mojdeh: 'مژده',
        qadim: 'قدیم',
        tafsiri: 'تفسیری'
      };
      const enTranslationNames: Record<string, string> = {
        kjv: 'KJV',
        asv: 'ASV',
        net: 'NET'
      };

      const faTransName = faTranslationNames[currentPage.translation || 'mojdeh'] || 'مژده';
      const enTransName = enTranslationNames[currentPage.enTranslation || 'asv'] || 'ASV';

      return (
        <div className="h-full w-full flex flex-col animate-in fade-in duration-500 overflow-hidden">
          {/* Header Row with Beautiful Book Info */}
          <div className="flex flex-row gap-4 px-4 pt-4" dir="ltr">
            {hasEnglish && (
              <div className="flex-1 bg-gradient-to-br from-slate-800/80 to-purple-900/30 rounded-t-xl px-4 py-3 border-b-2 border-purple-500/50">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-purple-300">
                    📖 {currentPage?.bookName?.en || 'Book'}
                  </h3>
                  <div className="flex items-center justify-center gap-3 mt-1 text-sm">
                    <span className="bg-purple-600/40 px-2 py-0.5 rounded text-purple-200">
                      {enTransName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-purple-200">
                      Chapter {currentPage?.chapter}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-purple-200">
                      Verses {currentPage?.verses}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {hasFarsi && (
              <div className="flex-1 bg-gradient-to-bl from-amber-900/50 to-slate-800/80 rounded-t-xl px-4 py-3 border-b-2 border-amber-500/50">
                <div className="text-center" dir="rtl">
                  <h3 className="text-xl font-bold text-amber-300 font-[Vazirmatn]">
                    📖 {currentPage?.bookName?.fa || 'کتاب'}
                  </h3>
                  <div className="flex items-center justify-center gap-3 mt-1 text-sm font-[Vazirmatn]">
                    <span className="bg-amber-600/40 px-2 py-0.5 rounded text-amber-200">
                      {faTransName}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-200">
                      فصل {currentPage?.chapter}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-200">
                      آیات {currentPage?.verses}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Synchronized Verse-by-Verse Display */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto px-4 pb-4"
          >
            <div className="space-y-3">
              {Array.from({ length: maxVerses }).map((_, idx) => {
                const englishVerse = englishVerses[idx] || '';
                const farsiVerse = farsiVerses[idx] || '';
                const verseNum = currentPage?.verseNumbers?.[idx] || (idx + 1);
                
                // Skip if both verses are empty
                if ((!englishVerse || englishVerse.trim() === '') && (!farsiVerse || farsiVerse.trim() === '')) {
                  return null;
                }

                return (
                  <div key={idx} className="flex flex-row gap-4" dir="ltr">
                    {/* English Verse (Left) */}
                    {hasEnglish && (
                      <div className="flex-1 bg-slate-800/50 rounded-lg p-3" dir="ltr">
                        <div className="flex gap-2 items-start">
                          <span className="text-lg font-bold text-purple-400 min-w-[32px] text-right">
                            {verseNum}
                          </span>
                          <p className="text-xl text-slate-200 leading-relaxed flex-1">
                            {englishVerse || ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Farsi Verse (Right) */}
                    {hasFarsi && (
                      <div className="flex-1 bg-amber-900/30 rounded-lg p-3" dir="rtl">
                        <div className="flex gap-2 items-start">
                          <span className="text-lg font-bold text-amber-400 min-w-[32px] text-right">
                            {verseNum}
                          </span>
                          <p className="text-xl text-white leading-relaxed flex-1 text-right font-[Vazirmatn]">
                            {farsiVerse || ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer - Reference */}
          <div className="bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-indigo-600/80 p-3 text-center">
            <p className={`text-white font-semibold text-lg ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {currentPage?.bookName?.[lang] || currentPage?.bookName?.fa} {currentPage?.chapter}:{currentPage?.verses}
            </p>
            
            {/* Page indicators */}
            {content.pages.length > 1 && (
              <div className="flex justify-center gap-2 mt-2">
                {content.pages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${i === internalPageIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeSlide.type === SlideType.LYRICS) {
      const content = activeSlide.content as SlideContentLyrics;

      // Debug log - comprehensive
      console.log('🎵 [LiveConsole] LYRICS slide detected!');
      console.log('[LiveConsole] LYRICS content FULL:', {
        title: content.title,
        songId: content.songId,
        hasTimingData: !!content.timingData,
        hasAudioUrl: !!content.audioUrl,
        audioUrl: content.audioUrl,
        hasTiming: content.hasTiming,
        linesCount: content.lines?.length || 0,
        linesPreview: content.lines?.slice(0, 3),
        timingLinesCount: content.timingData?.lines?.length || 0,
        finglishCount: content.finglishLines?.length || 0,
        allContentKeys: Object.keys(content),
        fullContent: content
      });

      // اگر timing و audio موجود است - از SmartWorshipPlayer کامل استفاده کن
      if (content.timingData && content.audioUrl) {
        return (
          <div className="h-full flex flex-col">
            <SmartWorshipPlayer
              timingData={content.timingData}
              audioSrc={content.audioUrl}
              title={content.title}
              onTimeUpdate={(time) => {
                // ارسال زمان به Display برای sync کاراوکه
                if (broadcastChannelRef.current) {
                  broadcastChannelRef.current.postMessage({
                    type: 'audio_sync',
                    payload: { currentTime: time }
                  });
                }
              }}
              translations={{
                finglish: content.finglishLines
              }}
            />
          </div>
        );
      }

      // نمایش با پلیر صوتی حرفه‌ای اگر فقط audio دارد (بدون timing کامل)
      // اگر lines خالی است ولی timingData داریم، از آن استفاده کن
      let displayLines = content.lines?.length > 0 
        ? content.lines 
        : (content.timingData?.lines || []).map((l: any) => ({ 
            text: l.line || '', 
            isChorus: l.label?.toLowerCase().includes('chorus') || false,
            isVerse: true 
          }));
      
      // استخراج finglish از timing data اگر نیست
      let finglishLines = (content.finglishLines && content.finglishLines.length > 0) 
        ? content.finglishLines 
        : (content.timingData?.lines || []).map((line: any) => {
            if (line.words && Array.isArray(line.words)) {
              return line.words.map((w: any) => w.finglish || '').join(' ').trim();
            }
            return '';
          });
      
      // 🔧 اگر هنوز خالی است، سعی کن از displayOptions.rawLyrics استفاده کن
      if (displayLines.length === 0 && (content as any).displayOptions?.rawLyrics) {
        const rawLines = (content as any).displayOptions.rawLyrics.split('\n').filter((l: string) => l.trim());
        displayLines = rawLines.map((text: string) => ({
          text,
          isChorus: /chorus|کروس|ریفرین/i.test(text),
          isVerse: true
        }));
        console.log('📝 [LiveConsole] Using rawLyrics fallback:', displayLines.length, 'lines');
      }
      
      console.log('[LiveConsole] displayLines:', {
        count: displayLines.length,
        preview: displayLines.slice(0, 3),
        finglishCount: finglishLines.length
      });
      
      // 🔧 اگر هنوز خالی است، نمایش پیام
      if (displayLines.length === 0) {
        return (
          <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-900/30 via-purple-900/30 to-slate-900 p-8">
            <div className="bg-gradient-to-r from-pink-600/80 to-purple-600/80 rounded-2xl p-6 max-w-lg text-center">
              <h2 className={`text-3xl font-bold text-white mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                🎵 {content.title}
              </h2>
              {content.chords && (
                <p className="text-pink-200 text-lg mb-4">🎸 {content.chords}</p>
              )}
              {content.audioUrl && (
                <div className="mt-4">
                  <audio
                    src={content.audioUrl}
                    controls
                    className="w-full h-12 rounded-lg"
                    style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                  />
                </div>
              )}
              <p className={`text-pink-200 mt-4 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? '⚠️ متن سرود موجود نیست - از SmartPlayer استفاده کنید' : '⚠️ No lyrics available'}
              </p>
            </div>
          </div>
        );
      }
      
      return (
        <div className="h-full flex flex-col bg-gradient-to-br from-pink-900/30 via-purple-900/30 to-slate-900">
          {/* Header with title */}
          <div className="p-4 bg-gradient-to-r from-pink-600/80 to-purple-600/80">
            <h2 className={`text-2xl font-bold text-white text-center ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              🎵 {content.title}
            </h2>
            {content.chords && (
              <p className="text-pink-200 text-center text-sm mt-1">🎸 {content.chords}</p>
            )}
          </div>

          {/* Audio Player - حرفه‌ای با کنترل‌های کامل */}
          {content.audioUrl && (
            <div className="px-4 py-4 bg-slate-800/90 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <audio
                    id="lyrics-audio-player"
                    src={content.audioUrl}
                    controls
                    className="w-full h-12 rounded-lg"
                    style={{ 
                      filter: 'invert(1) hue-rotate(180deg)',
                      backgroundColor: 'transparent'
                    }}
                    onPlay={() => {
                      // Broadcast play event
                      if (broadcastChannelRef.current) {
                        broadcastChannelRef.current.postMessage({
                          type: 'audio_play',
                          payload: { audioUrl: content.audioUrl }
                        });
                      }
                    }}
                    onTimeUpdate={(e) => {
                      // Broadcast time for sync
                      if (broadcastChannelRef.current) {
                        broadcastChannelRef.current.postMessage({
                          type: 'audio_sync',
                          payload: { currentTime: (e.target as HTMLAudioElement).currentTime }
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lyrics Display - با Finglish */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" dir="rtl">
            {displayLines.map((line: any, i: number) => (
              <div key={i} className="text-center py-2">
                {/* Farsi Lyrics */}
                <p
                  className={`text-2xl lg:text-3xl font-bold text-white leading-relaxed ${
                    line.isChorus ? 'text-pink-300 italic bg-pink-900/20 py-2 px-4 rounded-xl inline-block' : ''
                  } font-[Vazirmatn]`}
                >
                  {line.text || line}
                </p>
                {/* Finglish if available */}
                {finglishLines?.[i] && finglishLines[i].trim() && (
                  <p className="text-lg text-cyan-300 mt-2 font-mono tracking-wide" dir="ltr">
                    {finglishLines[i]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* YouTube link if available */}
          {content.youtubeId && (
            <div className="p-3 bg-red-900/30 text-center border-t border-red-600/30">
              <a
                href={`https://youtube.com/watch?v=${content.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-300 hover:text-red-200 text-sm flex items-center justify-center gap-2"
              >
                <span>▶️</span> {isRTL ? 'تماشا در یوتیوب' : 'Watch on YouTube'}
              </a>
            </div>
          )}
        </div>
      );
    }

    if (activeSlide.type === SlideType.MEDIA) {
      const content = activeSlide.content as SlideContentMedia;

      return (
        <div className="flex items-center justify-center h-full">
          {content.mediaType === 'image' && (
            <img src={content.url} alt="" className="max-h-[70vh] rounded-lg shadow-2xl" />
          )}
          {content.mediaType === 'video' && (
            <video
              src={content.url}
              autoPlay={content.isAutoPlay}
              loop={content.isLoop}
              controls
              className="max-h-[70vh] rounded-lg shadow-2xl"
            />
          )}
          {content.mediaType === 'audio' && (
            <div className="bg-slate-800/80 p-8 rounded-2xl">
              <div className="text-6xl mb-4 animate-pulse">🎵</div>
              <audio src={content.url} controls autoPlay={content.isAutoPlay} loop={content.isLoop} />
            </div>
          )}
        </div>
      );
    }

    if (activeSlide.type === SlideType.ANNOUNCEMENT) {
      const content = activeSlide.content as SlideContentAnnouncement;

      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="bg-gradient-to-br from-green-900/80 to-slate-900/80 backdrop-blur-md rounded-3xl p-8 max-w-2xl border border-green-600/30 shadow-2xl">
            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <Megaphone className="w-8 h-8 text-green-400" />
              <h2 className={`text-3xl font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {content.title}
              </h2>
            </div>

            {/* Image */}
            {content.imageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img src={content.imageUrl} alt={content.title} className="w-full max-h-64 object-cover" />
              </div>
            )}

            {/* Content */}
            {content.content && (
              <p className={`text-xl text-slate-200 leading-relaxed mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {content.content}
              </p>
            )}

            {/* Event Date */}
            {content.eventDate && (
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <Calendar className="w-5 h-5" />
                <span className={`text-lg ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {new Date(content.eventDate).toLocaleString(isRTL ? 'fa-IR' : 'en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}

            {/* Link */}
            {content.link && (
              <div className="text-center mt-4 pt-4 border-t border-green-600/30">
                <span className="text-slate-400 text-sm">
                  🔗 {content.link}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Device Selector Modal */}
      {showDeviceSelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className={`text-lg font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {isRTL ? '📷 انتخاب دوربین و میکروفون' : '📷 Select Camera & Microphone'}
              </h3>
              <button onClick={() => setShowDeviceSelector(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Camera Selection */}
              <div>
                <label className={`block text-sm text-slate-300 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  🎥 {isRTL ? 'دوربین:' : 'Camera:'}
                </label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {videoDevices.length === 0 ? (
                    <option value="">{isRTL ? 'دوربینی یافت نشد' : 'No camera found'}</option>
                  ) : (
                    videoDevices.map((device, i) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${isRTL ? 'دوربین' : 'Camera'} ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Microphone Selection */}
              <div>
                <label className={`block text-sm text-slate-300 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  🎤 {isRTL ? 'میکروفون:' : 'Microphone:'}
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {audioDevices.length === 0 ? (
                    <option value="">{isRTL ? 'میکروفونی یافت نشد' : 'No microphone found'}</option>
                  ) : (
                    audioDevices.map((device, i) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `${isRTL ? 'میکروفون' : 'Microphone'} ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Refresh Devices */}
              <button
                onClick={enumerateDevices}
                className="w-full py-2 text-sm text-slate-400 hover:text-white transition"
              >
                🔄 {isRTL ? 'بروزرسانی لیست دستگاه‌ها' : 'Refresh Device List'}
              </button>
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => setShowDeviceSelector(false)}
                className="flex-1 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition"
              >
                {isRTL ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={applySelectedDevices}
                disabled={isRequestingMedia}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50"
              >
                {isRequestingMedia ? '...' : (isRTL ? '✓ اتصال' : '✓ Connect')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera/Mic Status Indicator - Fixed Top */}
      <div className="h-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-center gap-6 text-xs">
        <button
          onClick={() => setShowDeviceSelector(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all cursor-pointer hover:scale-105 ${
            isCameraOn ? 'bg-green-600/30 text-green-400 border border-green-500/50' : 'bg-red-600/20 text-red-400 border border-red-500/30'
          }`}
          title={isRTL ? 'کلیک برای انتخاب دوربین' : 'Click to select camera'}
        >
          {isCameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isCameraOn ? (isRTL ? 'دوربین فعال' : 'Camera ON') : (isRTL ? 'دوربین غیرفعال' : 'Camera OFF')}</span>
        </button>
        <button
          onClick={() => setShowDeviceSelector(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all cursor-pointer hover:scale-105 ${
            isMicOn ? 'bg-green-600/30 text-green-400 border border-green-500/50' : 'bg-red-600/20 text-red-400 border border-red-500/30'
          }`}
          title={isRTL ? 'کلیک برای انتخاب میکروفون' : 'Click to select microphone'}
        >
          {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isMicOn ? (isRTL ? 'میکروفون فعال' : 'Mic ON') : (isRTL ? 'میکروفون غیرفعال' : 'Mic OFF')}</span>
        </button>
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/40 text-red-300 border border-red-500/50 animate-pulse">
            <Circle className="w-3 h-3 fill-red-500" />
            <span>REC {formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${showSettings
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            title={isRTL ? 'تنظیمات' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'تنظیمات' : 'Settings'}</span>
          </button>
          {/* Language Toggle */}
          {onLangToggle && (
            <button
              onClick={onLangToggle}
              className="px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 bg-slate-700 text-slate-300 hover:bg-slate-600"
              title={isRTL ? 'Switch to English' : 'تغییر به فارسی'}
            >
              <span className="font-bold">{lang === 'fa' ? 'FA' : 'EN'}</span>
            </button>
          )}
          
          {/* Open Display Window Button */}
          <button
            onClick={() => {
              const existingWindow = displayWindow && !displayWindow.closed ? displayWindow : null;
              if (existingWindow) {
                existingWindow.focus();
              } else {
                const win = window.open(
                  `/#/broadcast/view?session=${syncState.sessionId || session.id || 'default'}`,
                  'BroadcastDisplay',
                  'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
                );
                setDisplayWindow(win);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
              displayWindow && !displayWindow.closed
                ? 'bg-green-600 text-white animate-pulse'
                : 'bg-purple-600 text-white hover:bg-purple-500'
            }`}
            title={isRTL ? 'باز کردن صفحه نمایش (پروژکتور)' : 'Open Display Window (Projector)'}
          >
            <Monitor className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>
              {displayWindow && !displayWindow.closed 
                ? (isRTL ? 'نمایشگر فعال' : 'Display Active') 
                : (isRTL ? 'نمایشگر' : 'Display')}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Slide Counter */}
          <span className="text-slate-400 text-sm">
            {activeSlideIndex + 1} / {session.slides.length}
          </span>

          {/* === دکمه‌های تنظیمات (Templates) === */}
          <div className="flex items-center gap-1 border-r border-slate-700 pr-3 mr-1">
            <button
              onClick={() => setShowTemplateModal('save')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all bg-purple-600 hover:bg-purple-500 text-white"
              title={isRTL ? 'ذخیره تنظیمات' : 'Save Settings'}
            >
              <Settings className="w-3 h-3" />
              <Save className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowTemplateModal('load')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all bg-slate-700 hover:bg-slate-600 text-slate-200"
              title={isRTL ? 'بارگذاری تنظیمات' : 'Load Settings'}
            >
              <Settings className="w-3 h-3" />
              <FolderOpen className="w-3 h-3" />
            </button>
          </div>

          {/* === دکمه‌های پرزنتیشن (Slides) === */}
          <button
            onClick={() => setShowPresentationModal('save')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-500 text-white"
            title={isRTL ? 'ذخیره اسلایدها' : 'Save Slides'}
          >
            <Save className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'ذخیره' : 'Save'}</span>
          </button>
          <button
            onClick={() => setShowPresentationModal('load')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all bg-slate-700 hover:bg-slate-600 text-slate-200"
            title={isRTL ? 'بارگذاری اسلایدها' : 'Load Slides'}
          >
            <FolderOpen className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'بارگذاری' : 'Load'}</span>
          </button>

          {/* === مودال بارگذاری تنظیمات === */}
          {showTemplateModal === 'load' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl p-4 w-80 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-purple-300 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {isRTL ? '🎨 تنظیمات ذخیره‌شده' : '🎨 Saved Settings'}
                  </span>
                  <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  {savedTemplates.length === 0 && (
                    <span className="text-slate-400 text-xs">{isRTL ? 'هیچ تنظیماتی ذخیره نشده' : 'No saved settings'}</span>
                  )}
                  {savedTemplates.map(t => (
                    <div key={t.id} className="flex items-center gap-2 bg-slate-700 rounded p-2 border border-purple-500/20">
                      <div className="flex-1">
                        <div className="text-white text-xs font-bold">{t.name}</div>
                        <div className="text-slate-400 text-xs">{new Date(t.date).toLocaleString()}</div>
                      </div>
                      <button onClick={() => handleLoadTemplate(t.id)} className="text-purple-400 hover:text-purple-300" title="Load"><Download className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTemplate(t.id)} className="text-red-400 hover:text-red-300" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === مودال ذخیره تنظیمات === */}
          {showTemplateModal === 'save' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl p-6 w-80">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-purple-300 text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {isRTL ? '🎨 ذخیره تنظیمات' : '🎨 Save Settings'}
                  </span>
                  <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-slate-400 text-xs mb-3">
                  {isRTL ? 'شامل: Layout، Lower Third، Prayer Ticker، Logo...' : 'Includes: Layout, Lower Third, Prayer Ticker, Logo...'}
                </p>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder={isRTL ? 'نام تنظیمات...' : 'Settings name...'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm mb-4"
                />
                <button
                  onClick={handleSaveTemplate}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition text-sm font-bold"
                >
                  {isRTL ? 'ذخیره تنظیمات' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* === مودال بارگذاری پرزنتیشن === */}
          {showPresentationModal === 'load' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-slate-800 border border-blue-500/30 rounded-lg shadow-xl p-4 w-80 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-blue-300 text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    {isRTL ? '📑 پرزنتیشن‌ها (اسلایدها)' : '📑 Presentations (Slides)'}
                  </span>
                  <button onClick={() => setShowPresentationModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  {savedPresentations.length === 0 && (
                    <span className="text-slate-400 text-xs">{isRTL ? 'هیچ پرزنتیشنی ذخیره نشده' : 'No saved presentations'}</span>
                  )}
                  {savedPresentations.map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-slate-700 rounded p-2 border border-blue-500/20">
                      <div className="flex-1">
                        <div className="text-white text-xs font-bold">{p.name}</div>
                        <div className="text-slate-400 text-xs">
                          {new Date(p.date).toLocaleString()} • {p.slideCount || p.slides?.length || 0} {isRTL ? 'اسلاید' : 'slides'}
                        </div>
                      </div>
                      <button onClick={() => handleLoadPresentation(p.id)} className="text-blue-400 hover:text-blue-300" title="Load"><Download className="w-4 h-4" /></button>
                      <button onClick={() => handleDeletePresentation(p.id)} className="text-red-400 hover:text-red-300" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === مودال ذخیره پرزنتیشن === */}
          {showPresentationModal === 'save' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-slate-800 border border-blue-500/30 rounded-lg shadow-xl p-6 w-80">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-blue-300 text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    {isRTL ? '📑 ذخیره پرزنتیشن' : '📑 Save Presentation'}
                  </span>
                  <button onClick={() => setShowPresentationModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <p className="text-slate-400 text-xs mb-3">
                  {isRTL ? `شامل ${session.slides.length} اسلاید (آیات، سرودها، رسانه‌ها...)` : `Includes ${session.slides.length} slides (verses, songs, media...)`}
                </p>
                <input
                  type="text"
                  value={presentationName}
                  onChange={e => setPresentationName(e.target.value)}
                  placeholder={isRTL ? 'نام پرزنتیشن...' : 'Presentation name...'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm mb-4"
                />
                <button
                  onClick={handleSavePresentation}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition text-sm font-bold"
                >
                  {isRTL ? 'ذخیره پرزنتیشن' : 'Save Presentation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync Panel (Modal) */}
      {showSyncPanel && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-green-500" />
                  Multi-Device Sync
                </h3>
                <button
                  onClick={() => setShowSyncPanel(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {syncState.isConnected ? (
                  <>
                    <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="font-semibold">Connected</span>
                      </div>
                      <div className="text-sm text-slate-300 space-y-1">
                        <p>Session ID: <span className="font-mono text-xs">{syncState.sessionId}</span></p>
                        <p>Devices: {syncState.connectedDevices.length}</p>
                        <p>Session: {syncState.sessionId || 'None'}</p>
                      </div>
                    </div>
                    <button
                      onClick={disconnectSync}
                      className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-semibold transition"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-800 rounded-lg p-4">
                      <label className="block text-sm text-slate-300 mb-2">
                        Session ID (optional)
                      </label>
                      <input
                        type="text"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        placeholder="Leave empty to auto-generate"
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-green-500 outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        Other devices should use the same Session ID to join
                      </p>
                    </div>
                    <button
                      onClick={handleConnectSync}
                      className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-semibold transition"
                    >
                      Start Sync
                    </button>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400">
                  💡 Tip: Share the Session ID with other devices. Only the Leader can change slides.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Live Preview */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            {/* Slide Content - Always background/main in PIP mode */}
            <div className={`absolute inset-0 flex items-center justify-center ${
              broadcastConfig.layout === 'SPLIT' ? 'right-0 w-1/2' :
              broadcastConfig.layout === 'FULL_CAM' ? 'z-10' :
              '' // For PIP and SLIDES_ONLY - full size
            }`}>
              {renderSlideContent()}
            </div>

            {/* Camera Feed - Small overlay in PIP mode */}
            {broadcastConfig.layout !== 'SLIDES_ONLY' && (
              <>
                {mediaStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`absolute object-cover ${
                      broadcastConfig.layout === 'PIP' 
                        ? `w-48 h-36 rounded-xl border-2 border-white/20 shadow-2xl z-20 ${
                            broadcastConfig.pipPosition === 'top-left' ? 'top-4 left-4' :
                            broadcastConfig.pipPosition === 'top-right' ? 'top-4 right-4' :
                            broadcastConfig.pipPosition === 'bottom-left' ? 'bottom-24 left-4' :
                            'bottom-24 right-4' // bottom-right default
                          } ${
                            broadcastConfig.leaderVideoShape === 'circle' ? 'rounded-full w-36 h-36' :
                            broadcastConfig.leaderVideoShape === 'square' ? 'w-36 h-36' : ''
                          }`
                        : broadcastConfig.layout === 'SPLIT' ? 'inset-0 w-1/2' 
                        : 'inset-0 w-full h-full z-0' // FULL_CAM
                    }`}
                  />
                ) : (
                  /* Camera Placeholder when no stream */
                  <div
                    className={`absolute bg-slate-800/90 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 ${
                      broadcastConfig.layout === 'PIP' 
                        ? `w-48 h-36 rounded-xl shadow-2xl z-20 ${
                            broadcastConfig.pipPosition === 'top-left' ? 'top-4 left-4' :
                            broadcastConfig.pipPosition === 'top-right' ? 'top-4 right-4' :
                            broadcastConfig.pipPosition === 'bottom-left' ? 'bottom-24 left-4' :
                            'bottom-24 right-4'
                          } ${
                            broadcastConfig.leaderVideoShape === 'circle' ? 'rounded-full w-36 h-36' :
                            broadcastConfig.leaderVideoShape === 'square' ? 'w-36 h-36' : ''
                          }`
                        : broadcastConfig.layout === 'SPLIT' ? 'inset-0 w-1/2' 
                        : 'inset-0 w-full h-full z-0'
                    }`}
                  >
                    <Camera className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-400 text-center px-2">دوربین غیرفعال</span>
                    <button
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                          if (setMediaStream) setMediaStream(stream);
                          setIsCameraOn(true);
                          setIsMicOn(true);
                        } catch (err) {
                          console.error('Camera error:', err);
                          alert('خطا در دسترسی به دوربین');
                        }
                      }}
                      className="mt-2 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg"
                    >
                      فعال کردن
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Logo */}
            {broadcastConfig.showLogo && broadcastConfig.logoUrl && (
              <img
                src={broadcastConfig.logoUrl}
                alt="Logo"
                className="absolute top-4 left-4 w-16 h-16 object-contain z-20"
              />
            )}

            {/* Lower Third */}
            {broadcastConfig.showLowerThird && activeLowerThird && (
              <div className="absolute bottom-20 left-4 right-4 z-20" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="bg-gradient-to-r from-indigo-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-lg rounded-xl p-4 border border-white/20 max-w-lg shadow-2xl">
                  <div className="flex items-center gap-4">
                    {/* Leader Image */}
                    {activeLowerThird.imageUrl && (
                      <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-white/30 rounded-full blur-lg"></div>
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-xl">
                          <img 
                            src={activeLowerThird.imageUrl} 
                            alt={activeLowerThird.title} 
                            className="absolute w-full h-full object-cover"
                            style={{
                              transform: `scale(${activeLowerThird.imagePosition?.scale || 1}) translate(${(activeLowerThird.imagePosition?.x || 50) - 50}%, ${(activeLowerThird.imagePosition?.y || 50) - 50}%)`,
                              transformOrigin: 'center'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <p className={`text-white font-bold text-lg ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {activeLowerThird.title}
                      </p>
                      {activeLowerThird.subtitle && (
                        <p className={`text-white/70 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                          {activeLowerThird.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prayer Ticker */}
            {broadcastConfig.showPrayerTicker && broadcastConfig.prayerRequests.length > 0 && (
              <div className="absolute bottom-4 left-0 right-0 bg-black/70 py-2 z-20">
                <div className="animate-marquee whitespace-nowrap">
                  {broadcastConfig.prayerRequests.map(req => (
                    <span key={req.id} className={`mx-8 text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      🙏 {req.name}: {req.content}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Active Donation */}
            {activeDonation && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-center max-w-md">
                  <Gift className="w-16 h-16 text-white mx-auto mb-4" />
                  <h3 className={`text-2xl font-bold text-white mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                    {activeDonation.title}
                  </h3>
                  <p className={`text-white/80 mb-4 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                    {activeDonation.description}
                  </p>
                  {/* QR Code Display */}
                  <div className="w-48 h-48 bg-white rounded-xl mx-auto flex items-center justify-center overflow-hidden">
                    {activeDonation.url && activeDonation.url.startsWith('data:image') ? (
                      <img src={activeDonation.url} alt="QR Code" className="w-full h-full object-contain p-2" />
                    ) : activeDonation.url ? (
                      <img src={activeDonation.url} alt="QR Code" className="w-full h-full object-contain p-2" />
                    ) : (
                      <span className="text-slate-500 text-sm">{isRTL ? 'QR کد ندارد' : 'No QR Code'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Amen Badge Preview */}
            {broadcastConfig.amenBadge?.show && (
              <div 
                className="absolute z-40"
                style={{
                  left: `${broadcastConfig.amenBadge.position?.x || 50}%`,
                  top: `${broadcastConfig.amenBadge.position?.y || 90}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div 
                  className={`
                    ${broadcastConfig.amenBadge.size === 'small' ? 'text-lg' : broadcastConfig.amenBadge.size === 'medium' ? 'text-2xl' : 'text-3xl'}
                    px-3 py-1 rounded-lg
                    bg-gradient-to-br from-amber-600/30 via-yellow-500/20 to-amber-700/30
                    backdrop-blur-sm border border-yellow-400/30
                    select-none cursor-move
                  `}
                  style={{
                    animation: `heartbeat ${broadcastConfig.amenBadge.animationSpeed === 'slow' ? '2s' : broadcastConfig.amenBadge.animationSpeed === 'normal' ? '1.2s' : '0.7s'} ease-in-out infinite`
                  }}
                  title={isRTL ? 'از slider های تنظیمات برای جابجایی استفاده کنید' : 'Use sliders in settings to reposition'}
                >
                  {broadcastConfig.amenBadge.style === 'amen-only' ? (
                    <span className="font-bold font-[Vazirmatn] text-white" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}>آمین</span>
                  ) : broadcastConfig.amenBadge.style === 'cross-only' ? (
                    <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))' }}>✝️</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))' }}>✝️</span>
                      <span className="font-bold font-[Vazirmatn] text-white" style={{ textShadow: '0 0 10px rgba(255, 215, 0, 0.8)' }}>آمین</span>
                      <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.8))' }}>✝️</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls - Always LTR: Prev on left, Next on right */}
          <div dir="ltr" className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-4">
            <button
              onClick={handlePrev}
              disabled={activeSlideIndex === 0 && internalPageIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.prev}</span>
            </button>

            <div className={`px-6 py-2 bg-slate-800 rounded-xl text-white font-bold ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {activeSlideIndex + 1} / {session.slides.length}
            </div>

            <button
              onClick={handleNext}
              disabled={activeSlideIndex === session.slides.length - 1 && (
                activeSlide?.type !== SlideType.SCRIPTURE ||
                internalPageIndex === (activeSlide.content as SlideContentScripture).pages.length - 1
              )}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition"
            >
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.next}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 overflow-y-auto z-30 relative">
            {/* Layout Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('layout')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  📺 {t.layout}
                  <HelpTooltip textFa={HELP_TEXTS.layout.fa} textEn={HELP_TEXTS.layout.en} lang={lang} />
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'layout' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'layout' && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'FULL_CAM', label: t.fullCam, icon: '📷' },
                      { id: 'PIP', label: t.pip, icon: '🖼️' },
                      { id: 'SPLIT', label: t.split, icon: '✂️' },
                      { id: 'SLIDES_ONLY', label: t.slidesOnly, icon: '📑' }
                    ].map(layout => (
                      <button
                        key={layout.id}
                        onClick={() => setBroadcastConfig(prev => ({ ...prev, layout: layout.id as any }))}
                        className={`p-3 rounded-lg border text-center transition ${broadcastConfig.layout === layout.id
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                      >
                        <span className="text-2xl block mb-1">{layout.icon}</span>
                        <span className={`text-xs ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{layout.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* PIP Position Selector - Only show when PIP is selected */}
                  {broadcastConfig.layout === 'PIP' && (
                    <div className="mt-4">
                      <p className={`text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {isRTL ? '📍 موقعیت دوربین:' : '📍 Camera Position:'}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'top-left', label: isRTL ? 'بالا چپ' : 'Top Left', icon: '↖️' },
                          { id: 'top-right', label: isRTL ? 'بالا راست' : 'Top Right', icon: '↗️' },
                          { id: 'bottom-left', label: isRTL ? 'پایین چپ' : 'Bottom Left', icon: '↙️' },
                          { id: 'bottom-right', label: isRTL ? 'پایین راست' : 'Bottom Right', icon: '↘️' }
                        ].map(pos => (
                          <button
                            key={pos.id}
                            onClick={() => setBroadcastConfig(prev => ({ ...prev, pipPosition: pos.id as any }))}
                            className={`p-2 rounded-lg border text-center transition text-sm ${
                              broadcastConfig.pipPosition === pos.id
                                ? 'bg-green-600 border-green-500 text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span className="mr-1">{pos.icon}</span>
                            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{pos.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logo Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('logo')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  🖼️ {t.uploadLogo}
                  <HelpTooltip textFa={HELP_TEXTS.logo.fa} textEn={HELP_TEXTS.logo.en} lang={lang} />
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'logo' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'logo' && (
                <div className="p-4 pt-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setBroadcastConfig(prev => ({ ...prev, logoUrl: ev.target?.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white"
                  />
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastConfig.showLogo}
                      onChange={(e) => setBroadcastConfig(prev => ({ ...prev, showLogo: e.target.checked }))}
                      className="accent-indigo-500"
                    />
                    <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {t.showLogo}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Video Shape Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('videoShape')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  📹 {isRTL ? 'شکل تصویر رهبر' : 'Leader Video Shape'}
                  <HelpTooltip textFa={HELP_TEXTS.videoShape.fa} textEn={HELP_TEXTS.videoShape.en} lang={lang} />
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'videoShape' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'videoShape' && (
                <div className="p-4 pt-0 grid grid-cols-3 gap-2">
                  {[
                    { id: 'rectangle', label: isRTL ? 'مستطیل' : 'Rectangle', icon: '▬' },
                    { id: 'square', label: isRTL ? 'مربع' : 'Square', icon: '◼' },
                    { id: 'circle', label: isRTL ? 'دایره' : 'Circle', icon: '●' }
                  ].map(shape => (
                    <button
                      key={shape.id}
                      onClick={() => setBroadcastConfig(prev => ({ ...prev, leaderVideoShape: shape.id as any }))}
                      className={`p-3 rounded-lg border text-center transition ${broadcastConfig.leaderVideoShape === shape.id
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      title={shape.label}
                    >
                      <span className="text-2xl block mb-1">{shape.icon}</span>
                      <span className={`text-xs ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{shape.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Lower Thirds Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('lowerthird')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  💬 {t.infoOverlay}
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'lowerthird' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'lowerthird' && (
                <div className="p-4 pt-0">
                  {/* Add New */}
                  <div className="space-y-2 mb-4">
                    <input
                      type="text"
                      value={newLowerThird.title}
                      onChange={(e) => setNewLowerThird(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={t.title}
                      className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    />
                    <input
                      type="text"
                      value={newLowerThird.subtitle}
                      onChange={(e) => setNewLowerThird(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder={t.subtitle}
                      className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    />
                    
                    {/* Image Upload for Leader Photo */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newLowerThird.imageUrl || ''}
                        onChange={(e) => setNewLowerThird(prev => ({ ...prev, imageUrl: e.target.value }))}
                        placeholder={isRTL ? 'لینک عکس رهبر (اختیاری)' : 'Leader photo URL (optional)'}
                        className={`flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                      />
                      <label className="flex-shrink-0 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                setNewLowerThird(prev => ({ ...prev, imageUrl: evt.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition">
                          <ImageIcon className="w-4 h-4" />
                        </span>
                      </label>
                    </div>
                    
                    {/* Preview of selected image with position & zoom controls */}
                    {newLowerThird.imageUrl && (
                      <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                          {/* Image Preview with position controls */}
                          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500 bg-slate-900">
                            <img 
                              src={newLowerThird.imageUrl} 
                              alt="Preview" 
                              className="absolute w-full h-full object-cover"
                              style={{
                                transform: `scale(${newLowerThird.imagePosition?.scale || 1}) translate(${(newLowerThird.imagePosition?.x || 50) - 50}%, ${(newLowerThird.imagePosition?.y || 50) - 50}%)`,
                                transformOrigin: 'center'
                              }}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <span className={`text-xs text-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                              {isRTL ? 'تنظیم موقعیت و زوم' : 'Adjust position & zoom'}
                            </span>
                            {/* Zoom Slider */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">🔍</span>
                              <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={newLowerThird.imagePosition?.scale || 1}
                                onChange={(e) => setNewLowerThird(prev => ({
                                  ...prev,
                                  imagePosition: {
                                    x: prev.imagePosition?.x || 50,
                                    y: prev.imagePosition?.y || 50,
                                    scale: parseFloat(e.target.value)
                                  }
                                }))}
                                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                              <span className="text-xs text-slate-400 w-8">{((newLowerThird.imagePosition?.scale || 1) * 100).toFixed(0)}%</span>
                            </div>
                            {/* Position X */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">↔</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={newLowerThird.imagePosition?.x || 50}
                                onChange={(e) => setNewLowerThird(prev => ({
                                  ...prev,
                                  imagePosition: {
                                    x: parseFloat(e.target.value),
                                    y: prev.imagePosition?.y || 50,
                                    scale: prev.imagePosition?.scale || 1
                                  }
                                }))}
                                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                            {/* Position Y */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">↕</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={newLowerThird.imagePosition?.y || 50}
                                onChange={(e) => setNewLowerThird(prev => ({
                                  ...prev,
                                  imagePosition: {
                                    x: prev.imagePosition?.x || 50,
                                    y: parseFloat(e.target.value),
                                    scale: prev.imagePosition?.scale || 1
                                  }
                                }))}
                                className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setNewLowerThird(prev => ({ ...prev, imageUrl: undefined, imagePosition: undefined }))}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleAddLowerThird}
                      className={`w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      {t.addItem}
                    </button>
                  </div>

                  {/* List */}
                  <div className="space-y-2">
                    {broadcastConfig.lowerThirds.map((item, i) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-lg ${i === broadcastConfig.activeLowerThirdIndex ? 'bg-indigo-600/30 border border-indigo-500' : 'bg-slate-800'
                          }`}
                      >
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-600" />
                        )}
                        <button
                          onClick={() => setBroadcastConfig(prev => ({ ...prev, activeLowerThirdIndex: i }))}
                          className="flex-1 text-left"
                        >
                          <p className={`text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{item.title}</p>
                          <p className="text-slate-400 text-xs">{item.subtitle}</p>
                        </button>
                        <button
                          onClick={() => handleDeleteLowerThird(item.id)}
                          className="p-1 hover:bg-red-600/30 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Toggle & Rotation */}
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastConfig.showLowerThird}
                        onChange={(e) => setBroadcastConfig(prev => ({ ...prev, showLowerThird: e.target.checked }))}
                        className="accent-indigo-500"
                      />
                      <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {t.show}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastConfig.isRotating}
                        onChange={(e) => setBroadcastConfig(prev => ({ ...prev, isRotating: e.target.checked }))}
                        className="accent-indigo-500"
                      />
                      <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {t.rotation}
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Prayer Wall Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('prayer')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  🙏 {t.prayerWall}
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'prayer' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'prayer' && (
                <div className="p-4 pt-0">
                  <div className="space-y-2 mb-4">
                    <input
                      type="text"
                      value={newPrayerName}
                      onChange={(e) => setNewPrayerName(e.target.value)}
                      placeholder={t.requestNamePlaceholder}
                      className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    />
                    <textarea
                      value={newPrayerContent}
                      onChange={(e) => setNewPrayerContent(e.target.value)}
                      placeholder={t.requestContentPlaceholder}
                      rows={2}
                      className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm resize-none ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    />
                    
                    {/* Category & Priority */}
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newPrayerCategory}
                        onChange={(e) => setNewPrayerCategory(e.target.value)}
                        className={`bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                      >
                        <option value="healing">{isRTL ? '💚 شفا' : '💚 Healing'}</option>
                        <option value="family">{isRTL ? '👨‍👩‍👧‍👦 خانواده' : '👨‍👩‍👧‍👦 Family'}</option>
                        <option value="work">{isRTL ? '💼 کار و شغل' : '💼 Work'}</option>
                        <option value="salvation">{isRTL ? '✝️ نجات' : '✝️ Salvation'}</option>
                        <option value="guidance">{isRTL ? '🧭 هدایت' : '🧭 Guidance'}</option>
                        <option value="peace">{isRTL ? '🕊️ آرامش' : '🕊️ Peace'}</option>
                        <option value="provision">{isRTL ? '🙌 تأمین نیازها' : '🙌 Provision'}</option>
                        <option value="protection">{isRTL ? '🛡️ محافظت' : '🛡️ Protection'}</option>
                        <option value="thanksgiving">{isRTL ? '🙏 شکرگزاری' : '🙏 Thanksgiving'}</option>
                        <option value="other">{isRTL ? '💭 سایر' : '💭 Other'}</option>
                      </select>
                      <select
                        value={newPrayerPriority}
                        onChange={(e) => setNewPrayerPriority(parseInt(e.target.value))}
                        className={`bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                      >
                        <option value={1}>{isRTL ? '⭐ فوری' : '⭐ Urgent'}</option>
                        <option value={2}>{isRTL ? '🔴 مهم' : '🔴 Important'}</option>
                        <option value={3}>{isRTL ? '🟡 عادی' : '🟡 Normal'}</option>
                        <option value={4}>{isRTL ? '🟢 کم اولویت' : '🟢 Low'}</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={handleAddPrayerRequest}
                      className={`w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                      <Heart className="w-4 h-4 inline mr-1" />
                      {t.addRequest}
                    </button>
                  </div>

                  {/* Display Mode Controls */}
                  <div className="space-y-2 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastConfig.showPrayerTicker}
                        onChange={(e) => setBroadcastConfig(prev => ({ ...prev, showPrayerTicker: e.target.checked }))}
                        className="accent-purple-500"
                      />
                      <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        📜 {isRTL ? 'نمایش زیرنویس' : 'Show Ticker'}
                      </span>
                    </label>
                    
                    {/* Credits Roll Button */}
                    <button
                      onClick={() => setShowPrayerCredits(true)}
                      disabled={broadcastConfig.prayerRequests.length === 0}
                      className={`w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition text-sm disabled:opacity-50 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                      🎬 {isRTL ? 'تیتراژ پایانی (Credits Roll)' : 'Credits Roll'}
                    </button>
                  </div>

                  {/* Prayer List */}
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {broadcastConfig.prayerRequests.map((req) => (
                      <div key={req.id} className="flex items-start gap-2 bg-slate-800 p-2 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-white text-xs font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                              {req.priority === 1 ? '⭐' : req.priority === 2 ? '🔴' : ''} {req.name}
                            </p>
                            {req.category && (
                              <span className="text-xs text-slate-500">
                                {req.category === 'healing' ? '💚' : 
                                 req.category === 'family' ? '👨‍👩‍👧‍👦' :
                                 req.category === 'salvation' ? '✝️' :
                                 req.category === 'peace' ? '🕊️' : '💭'}
                              </span>
                            )}
                          </div>
                          <p className={`text-slate-400 text-xs ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{req.content}</p>
                        </div>
                        <button
                          onClick={() => setBroadcastConfig(prev => ({
                            ...prev,
                            prayerRequests: prev.prayerRequests.filter(r => r.id !== req.id)
                          }))}
                          className="p-1 hover:bg-red-600/30 rounded"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Donations Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('donations')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  🎁 {t.donations}
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'donations' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'donations' && (
                <div className="p-4 pt-0">
                  <div className="space-y-2 mb-4">
                    <input
                      type="text"
                      value={newDonation.title}
                      onChange={(e) => setNewDonation(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={t.donationTitle}
                      className={`w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    />
                    
                    {/* QR Code Image Upload */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newDonation.url || ''}
                        onChange={(e) => setNewDonation(prev => ({ ...prev, url: e.target.value }))}
                        placeholder={isRTL ? 'لینک یا آدرس QR Code' : 'QR Code URL or link'}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                      />
                      <label className="flex-shrink-0 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                setNewDonation(prev => ({ ...prev, url: evt.target?.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span className="flex items-center gap-1 px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white text-sm transition">
                          <ImageIcon className="w-4 h-4" />
                          <span className={`text-xs ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                            {isRTL ? 'آپلود QR' : 'Upload QR'}
                          </span>
                        </span>
                      </label>
                    </div>
                    
                    {/* QR Preview */}
                    {newDonation.url && newDonation.url.startsWith('data:image') && (
                      <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg border border-green-600/30">
                        <img src={newDonation.url} alt="QR Preview" className="w-16 h-16 object-contain bg-white rounded" />
                        <span className={`text-xs text-green-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                          {isRTL ? '✓ تصویر QR آماده است' : '✓ QR image ready'}
                        </span>
                        <button
                          onClick={() => setNewDonation(prev => ({ ...prev, url: '' }))}
                          className="ml-auto text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={handleAddDonation}
                      className={`w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                      <Gift className="w-4 h-4 inline mr-1" />
                      {t.addDonation}
                    </button>
                  </div>

                  {/* Donation List */}
                  <div className="space-y-2">
                    {broadcastConfig.donations.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded-lg ${broadcastConfig.activeDonationId === item.id ? 'bg-green-600/30 border border-green-500' : 'bg-slate-800'
                          }`}
                      >
                        <div className="flex-1">
                          <p className={`text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{item.title}</p>
                        </div>
                        <button
                          onClick={() => handleShowDonation(item.id)}
                          className={`px-2 py-1 text-xs rounded ${broadcastConfig.activeDonationId === item.id
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                          {broadcastConfig.activeDonationId === item.id ? t.showing : t.show}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amen Badge Section - آمین + صلیب */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('amen')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  ✝️ {isRTL ? 'آمین + صلیب' : 'Amen Badge'}
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'amen' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'amen' && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Toggle Show */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastConfig.amenBadge?.show || false}
                      onChange={(e) => setBroadcastConfig(prev => ({
                        ...prev,
                        amenBadge: {
                          ...prev.amenBadge || { position: { x: 50, y: 90 }, style: 'amen-cross', size: 'medium', animationSpeed: 'normal' },
                          show: e.target.checked
                        }
                      }))}
                      className="accent-yellow-500"
                    />
                    <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'نمایش آمین' : 'Show Amen Badge'}
                    </span>
                  </label>

                  {/* Style Selection */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'استایل:' : 'Style:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'amen-cross', label: '✝️ آمین ✝️' },
                        { key: 'amen-only', label: 'آمین' },
                        { key: 'cross-only', label: '✝️' }
                      ].map((style) => (
                        <button
                          key={style.key}
                          onClick={() => setBroadcastConfig(prev => ({
                            ...prev,
                            amenBadge: { ...prev.amenBadge!, style: style.key as any }
                          }))}
                          className={`py-2 px-3 rounded-lg text-sm transition ${
                            broadcastConfig.amenBadge?.style === style.key
                              ? 'bg-yellow-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          } font-[Vazirmatn]`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'اندازه:' : 'Size:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'small', label: isRTL ? 'کوچک' : 'Small' },
                        { key: 'medium', label: isRTL ? 'متوسط' : 'Medium' },
                        { key: 'large', label: isRTL ? 'بزرگ' : 'Large' }
                      ].map((size) => (
                        <button
                          key={size.key}
                          onClick={() => setBroadcastConfig(prev => ({
                            ...prev,
                            amenBadge: { ...prev.amenBadge!, size: size.key as any }
                          }))}
                          className={`py-2 px-3 rounded-lg text-sm transition ${
                            broadcastConfig.amenBadge?.size === size.key
                              ? 'bg-yellow-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          } ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                        >
                          {size.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Speed */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'سرعت ضربان:' : 'Heartbeat Speed:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'slow', label: isRTL ? 'آرام' : 'Slow' },
                        { key: 'normal', label: isRTL ? 'عادی' : 'Normal' },
                        { key: 'fast', label: isRTL ? 'تند' : 'Fast' }
                      ].map((speed) => (
                        <button
                          key={speed.key}
                          onClick={() => setBroadcastConfig(prev => ({
                            ...prev,
                            amenBadge: { ...prev.amenBadge!, animationSpeed: speed.key as any }
                          }))}
                          className={`py-2 px-3 rounded-lg text-sm transition ${
                            broadcastConfig.amenBadge?.animationSpeed === speed.key
                              ? 'bg-yellow-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          } ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                        >
                          {speed.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position Control */}
                  <div>
                    <label className={`block text-xs text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL ? 'موقعیت (در پیش‌نمایش drag کنید):' : 'Position (drag in preview):'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs text-slate-500">X:</span>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={broadcastConfig.amenBadge?.position?.x || 50}
                          onChange={(e) => setBroadcastConfig(prev => ({
                            ...prev,
                            amenBadge: {
                              ...prev.amenBadge!,
                              position: { ...prev.amenBadge!.position, x: parseInt(e.target.value) }
                            }
                          }))}
                          className="w-full accent-yellow-500"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">Y:</span>
                        <input
                          type="range"
                          min="5"
                          max="95"
                          value={broadcastConfig.amenBadge?.position?.y || 90}
                          onChange={(e) => setBroadcastConfig(prev => ({
                            ...prev,
                            amenBadge: {
                              ...prev.amenBadge!,
                              position: { ...prev.amenBadge!.position, y: parseInt(e.target.value) }
                            }
                          }))}
                          className="w-full accent-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS for marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          25% {
            transform: scale(1.08);
            opacity: 0.95;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
          75% {
            transform: scale(1.05);
            opacity: 0.97;
          }
        }
      `}</style>

      {/* Prayer Credits Roll Modal */}
      {showPrayerCredits && (
        <div className="fixed inset-0 z-[100]">
          <PrayerCreditsRoll
            prayers={broadcastConfig.prayerRequests}
            config={broadcastConfig.prayerCreditsConfig || { enabled: true, speed: 5, showCategory: true, sortBy: 'priority' }}
            onConfigChange={(newConfig) => setBroadcastConfig(prev => ({ ...prev, prayerCreditsConfig: newConfig }))}
            lang={lang}
            isEditing={true}
          />
          <button
            onClick={() => setShowPrayerCredits(false)}
            className="fixed top-4 right-4 z-[101] p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg transition"
            title={isRTL ? 'بستن' : 'Close'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveConsole;
