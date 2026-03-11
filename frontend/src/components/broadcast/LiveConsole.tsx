/**
 * 🎬 Broadcast Live Console
 * کنسول زنده پخش با پیش‌نمایش اسلایدها
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  BroadcastSession, Slide, SlideType, BroadcastOverlayConfig,
  SlideContentScripture, SlideContentLyrics, SlideContentMedia, SlideContentAnnouncement,
  SlideContentGeneric, SlideContentLiveData, SlideContentMeeting,
  LowerThirdItem, PrayerRequest, DonationItem, AppLanguage
} from './types';
import { BROADCAST_TRANSLATIONS } from './dataService';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useHybridRecorder } from './hooks/useHybridRecorder';
import { useWebSocketSync } from './useWebSocketSync';
import { useAudioCapture } from './hooks/useAudioCapture';
import {
  Play, Pause, ChevronLeft, ChevronRight, Settings,
  Video, VideoOff, Mic, MicOff, Camera, CameraOff, Image as ImageIcon,
  Radio, Users, Heart, Gift, Plus, Trash2, X, Calendar, Megaphone, Circle, Monitor,
  Save, FolderOpen, Download
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Rename ChartJS to Chart to match usage
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);
const Chart = ChartJS;
import { SmartWorshipPlayer } from '../worship/SmartWorshipPlayer';
import { HelpTooltip, HELP_TEXTS } from './HelpTooltip';
import PrayerCreditsRoll from './PrayerCreditsRoll';
import { BookOpen } from 'lucide-react';
import DeviceSettingsModal from './DeviceSettingsModal';
import BroadcastStatusBadge from './BroadcastStatusBadge';
import SaveLoadModal, { SavedItem } from './SaveLoadModal';

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

  const { user } = useAuth();
  const isAdmin = ['SUPER_ADMIN', 'MANAGER'].includes(user?.role || '');

  // AI Transcription State
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  // Camera & Microphone state
  const [isCameraOn, setIsCameraOn] = useState(!!mediaStream?.getVideoTracks().length);
  const [isMicOn, setIsMicOn] = useState(!!mediaStream?.getAudioTracks().length);
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);

  // Device Selection State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');

  // Advanced Camera Settings
  const [videoResolution, setVideoResolution] = useState<'default' | 'hd' | 'fhd'>('default');
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [isBlur, setIsBlur] = useState<boolean>(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  // Save/Load Modal State
  const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
  const [saveLoadType, setSaveLoadType] = useState<'template' | 'presentation'>('presentation');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  // Mock functions for Save/Load (Replace with API calls later)
  const handleSaveItem = (name: string) => {
    const newItem: SavedItem = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString()
    };
    setSavedItems([newItem, ...savedItems]);
    // In a real app, you would save 'broadcastConfig' or 'session.slides' to DB here
    console.log(`Saving ${saveLoadType}:`, name, saveLoadType === 'template' ? broadcastConfig : session.slides);
  };

  const handleLoadItem = (id: string) => {
    const item = savedItems.find(i => i.id === id);
    if (item) {
      console.log(`Loading ${saveLoadType}:`, item.name);
      // In a real app, you would fetch from DB and set state
    }
  };

  const handleDeleteItem = (id: string) => {
    setSavedItems(savedItems.filter(i => i.id !== id));
  };

  const openSaveLoad = (type: 'template' | 'presentation') => {
    setSaveLoadType(type);
    setShowSaveLoadModal(true);
    // Fetch items from DB based on type
  };

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
    sendPlayControl,
    sendAudioChunk,
    sendOverlayToggle
  } = useWebSocketSync({
    isLeader: true,
    onSlideChange: (slideIndex) => {
      // دستگاه‌های دیگر اسلاید را تغییر دادند
      onSlideChange(slideIndex);
    }
  });

  // Audio Capture Hook (AI Transcription)
  const {
    startRecording: startLiveTranscribe,
    stopRecording: stopLiveTranscribe,
    isRecording: isTranscribingLive,
    audioLevel: transcribeLevel
  } = useAudioCapture(
    selectedAudioDevice,
    useCallback((blob) => {
      if (syncState.isConnected) {
        // Only send if we are "Live" or if we want to test
        // sending as 'audio_chunk'
        // We use the helper from useWebSocketSync
        // But useWebSocketSync.sendAudioChunk expects a Blob, which fits.
        // Wait, useWebSocketSync return object has sendAudioChunk.
        sendAudioChunk(blob);
      }
    }, [syncState.isConnected, sendAudioChunk])
  );

  // Handle incoming transcripts
  useEffect(() => {
    if (syncState.lastMessage?.type === 'transcript') {
      const text = syncState.lastMessage.payload.text;
      setLiveTranscript(text);

      // Auto-clear after 5 seconds
      if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
      transcriptTimeoutRef.current = setTimeout(() => {
        setLiveTranscript('');
      }, 5000);
    }
  }, [syncState.lastMessage]);

  const toggleTranscription = useCallback(() => {
    if (isTranscribingLive || isTranscribing) {
      stopLiveTranscribe();
      setIsTranscribing(false);
      setLiveTranscript('AI Translation Stopped');
    } else {
      startLiveTranscribe();
      setIsTranscribing(true);
      setLiveTranscript('AI Translation Active...');
    }

    // Clear the notification after 2 seconds
    if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
    transcriptTimeoutRef.current = setTimeout(() => {
      setLiveTranscript('');
    }, 3000);
  }, [isTranscribing, isTranscribingLive, startLiveTranscribe, stopLiveTranscribe]);

  // State
  const [showSettings, setShowSettings] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
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
  // Apply selected devices with resolution constraints
  const applySelectedDevices = async () => {
    setIsRequestingMedia(true);
    try {
      // Stop existing tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      let videoConstraints: boolean | MediaTrackConstraints = selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true;

      // Apply Resolution
      if (videoResolution === 'hd') {
        videoConstraints = { ...((videoConstraints as object) || {}), width: { ideal: 1280 }, height: { ideal: 720 }, deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined };
      } else if (videoResolution === 'fhd') {
        videoConstraints = { ...((videoConstraints as object) || {}), width: { ideal: 1920 }, height: { ideal: 1080 }, deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined };
      }

      const constraints: MediaStreamConstraints = {
        video: videoConstraints,
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
      };

      console.log('📷 Applying constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (setMediaStream) setMediaStream(stream);
      setIsCameraOn(true);
      setIsMicOn(true);
      // setShowDeviceSelector(false); // Do not close automatically, let user close
    } catch (err) {
      console.error('Error applying devices:', err);
      alert('خطا در اتصال به دوربین/میکروفون انتخاب شده (یا رزولوشن پشتیبانی نمی‌شود)');
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

  // Auto-apply devices/resolution when changed
  useEffect(() => {
    if (showDeviceSelector && (selectedVideoDevice || selectedAudioDevice)) {
      const timer = setTimeout(() => {
        applySelectedDevices();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedVideoDevice, selectedAudioDevice, videoResolution]);

  const liveSlide = session.slides[activeSlideIndex];
  const activeLowerThird = broadcastConfig.lowerThirds[broadcastConfig.activeLowerThirdIndex];
  const activeDonation = broadcastConfig.donations.find(d => d.id === broadcastConfig.activeDonationId);

  // Navigation
  const handlePrev = () => {
    if (liveSlide?.type === SlideType.SCRIPTURE) {
      const content = liveSlide.content as SlideContentScripture;
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
    if (liveSlide?.type === SlideType.SCRIPTURE) {
      const content = liveSlide.content as SlideContentScripture;
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

  // Render Slide Preview for Sidebars
  const renderSlidePreview = (slide: Slide | undefined, label: string) => {
    if (!slide) return (
      <div className="w-full aspect-video bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-slate-700 text-xs">
        {label === 'PREV' ? 'No Previous' : 'No Next'}
      </div>
    );

    return (
      <div className="w-full aspect-video bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative group cursor-pointer hover:border-indigo-500 transition-colors">
        <div className="absolute inset-0 flex items-center justify-center transform scale-[0.4] origin-top-left w-[250%] h-[250%] pointer-events-none">
          {renderSlideContent(slide, true)} {/* Pass true for preview mode if supported, or logic to handle simple render */}
        </div>
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>
    );
  };

  // Helper to render content for preview (simplified version of renderSlideContent)
  // We can actually reuse renderSlideContent but we need to make sure it handles "preview" correctly if it relies on internal state.
  // For now, let's use renderSlideContent but we might need to modify renderSlideContent to accept a 'slide' argument instead of using 'activeSlide'.


  const renderSlideContent = (overrideSlide?: Slide, isPreview?: boolean) => {
    const activeSlide = overrideSlide || liveSlide;
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

      // --- BUBBLE MODE ---
      if (currentPage.displayMode === 'bubble') {
        return (
          <div className="h-full w-full flex flex-col animate-in fade-in duration-500 overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 z-0" />

            {/* Header */}
            <div className="relative z-10 flex flex-row gap-4 px-8 pt-6 pb-4 items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white flex flex-wrap items-center gap-3">
                    {currentPage?.bookName?.en && (
                      <span className="font-sans tracking-tight text-white" dir="ltr">{currentPage.bookName.en}</span>
                    )}
                    {currentPage?.bookName?.en && currentPage?.bookName?.fa && (
                      <span className="text-white/40 hidden md:inline">|</span>
                    )}
                    <span className={`${isRTL ? 'font-[Vazirmatn]' : ''} text-white`} dir="rtl">{currentPage?.bookName?.fa || currentPage?.book}</span>
                    <span className="mx-2 bg-indigo-500/30 px-3 py-0.5 rounded-lg text-2xl font-mono text-indigo-200">
                      {currentPage?.chapter}:{currentPage?.verses}
                    </span>
                  </h2>
                  <div className="flex gap-2 text-sm text-indigo-300 mt-1">
                    <span className="bg-white/10 px-2 py-0.5 rounded">{faTransName}</span>
                    {hasEnglish && <span className="bg-white/10 px-2 py-0.5 rounded">{enTransName}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Bubble Content */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="relative z-10 flex-1 overflow-auto p-8 space-y-6"
            >
              {Array.from({ length: maxVerses }).map((_, idx) => {
                const englishVerse = englishVerses[idx] || '';
                const farsiVerse = farsiVerses[idx] || '';
                const verseNum = currentPage?.verseNumbers?.[idx] || (idx + 1);

                if ((!englishVerse || !englishVerse.trim()) && (!farsiVerse || !farsiVerse.trim())) return null;

                return (
                  <div key={idx} className="flex gap-4 group">
                    {/* Verse Number Bubble */}
                    <div className="shrink-0 w-12 h-12 rounded-full bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mt-2">
                      <span className="text-xl font-bold text-white font-mono">{verseNum}</span>
                    </div>

                    {/* Content Bubbles */}
                    <div className="flex-1 flex flex-col gap-3">
                      {hasFarsi && (
                        <div className={`p-6 rounded-2xl rounded-tr-none bg-gradient-to-l from-indigo-900/60 to-slate-800/60 border border-indigo-500/20 shadow-xl backdrop-blur-md transition-all hover:bg-indigo-900/80 ${isRTL ? 'font-[Vazirmatn]' : ''}`} dir="rtl">
                          <p className="text-2xl lg:text-3xl text-white leading-relaxed font-medium drop-shadow-md">
                            {farsiVerse}
                          </p>
                        </div>
                      )}

                      {hasEnglish && (
                        <div className="self-end max-w-[90%] p-5 rounded-2xl rounded-tl-none bg-gradient-to-r from-slate-800/60 to-purple-900/40 border border-purple-500/10 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-800/80" dir="ltr">
                          <p className="text-xl lg:text-2xl text-slate-200 leading-relaxed font-serif italic tracking-wide">
                            {englishVerse}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Page Indicators */}
            {content.pages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                {content.pages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === internalPageIndex ? 'bg-indigo-400 w-6 shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      }

      // --- LIST MODE (Default) ---
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

      // Debug log
      console.log('🎵 [LiveConsole] LYRICS slide active:', content.title);

      // Construct Timing Data for SmartPlayer if missing
      // This ensures we ALWAYS use the modern SmartWorshipPlayer
      let timingData = content.timingData;

      if (!timingData) {
        // Create fallback TranscriptData from lines
        const linesToUse = content.lines?.length > 0
          ? content.lines
          : (content as any).displayOptions?.rawLyrics?.split('\n').filter((l: string) => l.trim()) || [];

        timingData = {
          lines: linesToUse.map((line: string) => ({
            type: 'lyric',
            content: line,
            words: line.split(' ').map(w => ({
              word: w,
              start_time: 0,
              end_time: 0
            }))
          }))
        };
      }

      return (
        <div className="h-full flex flex-col">
          <SmartWorshipPlayer
            timingData={timingData}
            audioSrc={content.audioUrl || ''}
            title={content.title}
            backgroundImage={content.displayOptions?.backgroundUrl}
            viewOnly={true} // Console view should be view-only or maybe interactive? Let's keep it interactive for skip/play
            onTimeUpdate={(time) => {
              // Sync with display
              if (broadcastChannelRef.current) {
                broadcastChannelRef.current.postMessage({
                  type: 'audio_sync',
                  payload: { currentTime: time }
                });
              }
            }}
            translations={{
              finglish: content.finglishLines,
              persian: content.lines?.map(l => l.text) // Optional: pass raw persian lines if needed
            }}
            // New Styling Props
            backgroundOpacity={content.displayOptions?.backgroundOpacity}
            backgroundBlur={content.displayOptions?.backgroundBlur}
            textShadow={content.displayOptions?.textShadow}
            objectFit={content.displayOptions?.objectFit}
          />
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


    /**
     * 🎵 Render Lyrics Slide
     */
    const renderLyrics = (content: SlideContentLyrics) => {
      // Construct Timing Data for SmartPlayer if missing
      let timingData = content.timingData;

      if (!timingData) {
        const linesToUse = content.lines?.length > 0
          ? content.lines
          : (content as any).displayOptions?.rawLyrics?.split('\n').filter((l: string) => l.trim()) || [];

        timingData = {
          lines: linesToUse.map((line: any) => ({
            type: 'lyric',
            content: typeof line === 'string' ? line : line.text,
            words: (typeof line === 'string' ? line : line.text).split(' ').map((w: string) => ({
              word: w,
              start_time: 0,
              end_time: 0
            }))
          }))
        };
      }

      return (
        <div className="h-full flex flex-col">
          <SmartWorshipPlayer
            timingData={timingData}
            audioSrc={content.audioUrl || ''}
            title={content.title}
            backgroundImage={content.displayOptions?.backgroundUrl}
            viewOnly={true}
            onTimeUpdate={(time) => {
              if (broadcastChannelRef.current) {
                broadcastChannelRef.current.postMessage({
                  type: 'audio_sync',
                  payload: { currentTime: time }
                });
              }
            }}
            translations={{
              finglish: content.finglishLines,
              persian: content.lines?.map(l => l.text)
            }}
            backgroundOpacity={content.displayOptions?.backgroundOpacity}
            backgroundBlur={content.displayOptions?.backgroundBlur}
            textShadow={content.displayOptions?.textShadow}
            objectFit={content.displayOptions?.objectFit}
          />
        </div>
      );
    };

    /**
     * 📖 Render Scripture Slide
     */
    const renderScripture = (content: SlideContentScripture) => {
      const pageIndex = internalPageIndex < content.pages.length ? internalPageIndex : 0;
      const currentPage = content.pages[pageIndex];
      if (!currentPage) return null;

      const englishVerses = currentPage.textSecondary || [];
      const farsiVerses = currentPage.textPrimary || [];
      const maxVerses = Math.max(englishVerses.length, farsiVerses.length);

      // Determine visibility based on settings or content
      const hasEnglish = englishVerses.length > 0;
      const hasFarsi = farsiVerses.length > 0;

      return (
        <div className="flex flex-col h-full bg-slate-900/95">
          {/* Header - Book & Chapter */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shadow-md z-20">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className={`text-2xl font-bold text-white tracking-wide ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {currentPage.bookName?.[lang] || currentPage.bookName?.fa} {currentPage.chapter}
                </h2>
                <span className="text-slate-400 text-sm font-medium">
                  {isRTL ? 'آیات' : 'Verses'} {currentPage.verses}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content - Synchronized Verse-by-Verse Display */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-auto px-6 py-4 space-y-4"
          >
            {Array.from({ length: maxVerses }).map((_, idx) => {
              const englishVerse = englishVerses[idx] || '';
              const farsiVerse = farsiVerses[idx] || '';
              const verseNum = currentPage.verseNumbers?.[idx] || (idx + 1);

              if ((!englishVerse || !englishVerse.trim()) && (!farsiVerse || !farsiVerse.trim())) return null;

              return (
                <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition duration-300 border border-slate-700/30" dir="ltr">
                  {/* English Verse */}
                  {hasEnglish && (
                    <div className="flex-1 flex gap-3" dir="ltr">
                      <span className="text-indigo-400 font-bold font-mono text-lg pt-1 min-w-[24px]">
                        {verseNum}
                      </span>
                      <p className="text-xl text-slate-200 leading-relaxed font-serif tracking-wide">
                        {englishVerse}
                      </p>
                    </div>
                  )}

                  {/* Divider (only if both exist) */}
                  {hasEnglish && hasFarsi && (
                    <div className="hidden md:block w-px bg-slate-700 mx-2 self-stretch" />
                  )}

                  {/* Farsi Verse */}
                  {hasFarsi && (
                    <div className="flex-1 flex gap-3 justify-end" dir="rtl">
                      <span className="text-amber-400 font-bold font-[Vazirmatn] text-lg pt-1 min-w-[24px] text-left">
                        {verseNum}
                      </span>
                      <p className="text-2xl text-white leading-relaxed font-[Vazirmatn] font-medium text-right shadow-black drop-shadow-sm">
                        {farsiVerse}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer / Progress */}
          {content.pages.length > 1 && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-center gap-2">
              {content.pages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === internalPageIndex ? 'bg-indigo-500 w-8' : 'bg-slate-700 w-2'}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    };

    const renderLiveData = (content: SlideContentLiveData) => {
      const data = {
        labels: content.data.map(d => d.label),
        datasets: [
          {
            label: content.title || 'Data',
            data: content.data.map(d => d.value),
            backgroundColor: content.data.map(d => d.color || '#3b82f6'),
            borderColor: content.data.map(d => d.color || '#3b82f6'),
            borderWidth: 1,
          },
        ],
      };

      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: content.showLegend,
            position: 'bottom' as const,
            labels: { color: 'white', font: { family: isRTL ? 'Vazirmatn' : 'inherit' } }
          },
          title: {
            display: !!content.title,
            text: content.title,
            color: 'white',
            font: { size: 24, family: isRTL ? 'Vazirmatn' : 'inherit' }
          },
        },
        scales: {
          y: {
            ticks: { color: 'white' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          x: {
            ticks: { color: 'white', font: { family: isRTL ? 'Vazirmatn' : 'inherit' } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      };

      // Hide scales for Pie/Doughnut
      if (content.chartType === 'pie' || content.chartType === 'doughnut') {
        (options as any).scales = undefined;
      }

      return (
        <div className="w-full h-full p-8 flex flex-col items-center justify-center">
          <div style={{ width: '80%', height: '80%' }}>
            {content.chartType === 'bar' && <Bar data={data} options={options} />}
            {content.chartType === 'line' && <Line data={data} options={options} />}
            {content.chartType === 'pie' && <Pie data={data} options={options} />}
            {content.chartType === 'doughnut' && <Doughnut data={data} options={options} />}
          </div>
        </div>
      );
    };

    /**
     * 🖼️ Render Slide Content
     * Handles all slide types including the new Live Data
     */
    // Handle remaining slide types
    const content = activeSlide.content;

    if (activeSlide.type === SlideType.LIVEDATA) {
      return renderLiveData(content as SlideContentLiveData);
    }

    if (activeSlide.type === SlideType.MEETING) {
      const meetingContent = content as SlideContentMeeting;
      return (
        <div className="w-full h-full flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Top Indicator */}
          <div className="absolute top-6 left-6 z-40 bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl pointer-events-none">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse border border-red-400"></span>
            <span className={`text-white font-medium tracking-wide ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {meetingContent.subject || (isRTL ? 'ارتباط ویدیویی زنده' : 'Live Video Meeting')}
            </span>
          </div>

          <div className="flex-1 w-full bg-black relative">
            <JitsiMeeting
              roomName={meetingContent.roomName || 'Mychurch-Studio'}
              configOverwrite={{
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                disableDeepLinking: true,
                requireDisplayName: false,
                prejoinPageEnabled: false,
                disableModeratorIndicator: true
              }}
              interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                SHOW_CHROME_EXTENSION_BANNER: false,
                TOOLBAR_BUTTONS: [
                  'microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'chat', 'settings'
                ]
              }}
              userInfo={{
                displayName: isRTL ? 'اتاق فرمان' : 'Control Room',
                email: 'admin@mychurch.local'
              }}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.height = '100%';
                iframeRef.style.width = '100%';
                iframeRef.style.border = 'none';
              }}
            />
          </div>
        </div>
      );
    }

    if (activeSlide.type === SlideType.GENERIC) {
      const genericContent = content as SlideContentGeneric;
      return (
        <div
          className="w-full h-full flex flex-col p-12 overflow-hidden relative"
          style={{
            justifyContent: genericContent.layout === 'centered' ? 'center' : 'flex-start',
            textAlign: genericContent.layout === 'centered' ? 'center' : 'left',
          }}
        >
          <div
            className="prose prose-invert max-w-none prose-2xl"
            dangerouslySetInnerHTML={{ __html: genericContent.htmlContent }}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
      );
    }

    if (activeSlide.type === SlideType.LYRICS) {
      return renderLyrics(content as SlideContentLyrics);
    }

    return null;
  };



  return (
    <div className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Device Selector Modal */}
      <DeviceSettingsModal
        isOpen={showDeviceSelector}
        onClose={() => setShowDeviceSelector(false)}
        videoDevices={videoDevices}
        audioDevices={audioDevices}
        selectedVideoDevice={selectedVideoDevice}
        selectedAudioDevice={selectedAudioDevice}
        onVideoDeviceChange={setSelectedVideoDevice}
        onAudioDeviceChange={setSelectedAudioDevice}
        onRefreshDevices={enumerateDevices}
        videoResolution={videoResolution}
        onResolutionChange={setVideoResolution}
        isMirrored={isMirrored}
        onMirrorChange={setIsMirrored}
        isBlur={isBlur}
        onBlurChange={setIsBlur}
        isRTL={isRTL}
      />


      {/* Camera/Mic Status Indicator - Fixed Top */}
      <div className="h-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 flex items-center justify-center gap-6 text-xs">
        <button
          onClick={() => setShowDeviceSelector(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all cursor-pointer hover:scale-105 ${isCameraOn ? 'bg-green-600/30 text-green-400 border border-green-500/50' : 'bg-red-600/20 text-red-400 border border-red-500/30'
            }`}
          title={isRTL ? 'کلیک برای انتخاب دوربین' : 'Click to select camera'}
        >
          {isCameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5" />}
          <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isCameraOn ? (isRTL ? 'دوربین فعال' : 'Camera ON') : (isRTL ? 'دوربین غیرفعال' : 'Camera OFF')}</span>
        </button>
        <button
          onClick={() => setShowDeviceSelector(true)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all cursor-pointer hover:scale-105 ${isMicOn ? 'bg-green-600/30 text-green-400 border border-green-500/50' : 'bg-red-600/20 text-red-400 border border-red-500/30'
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
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-40 relative">
        <div className="flex items-center gap-3">
          <BroadcastStatusBadge isLive={isRecording} viewerCount={isRecording ? 124 : 0} />
          <div className="h-6 w-px bg-slate-700 mx-1"></div>

          {/* Settings Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSystemMenu(!showSystemMenu)}
              className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 font-medium border border-transparent ${showSystemMenu ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'}`}
              title={isRTL ? 'تنظیمات سیستم' : 'System Settings'}
            >
              <Settings className="w-4 h-4" />
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'تنظیمات سیستم' : 'System Settings'}</span>
            </button>

            {showSystemMenu && (
              <div className={`absolute top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden ${isRTL ? 'right-0' : 'left-0'}`}>
                {/* Hardware */}
                <div className="p-2 border-b border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className={`px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'سخت‌افزار' : 'Hardware'}</div>
                  <button onClick={() => { setShowDeviceSelector(true); setShowSystemMenu(false); }} className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm text-slate-200 hover:bg-slate-700 rounded-lg transition-colors group">
                    <div className="p-1.5 bg-slate-900 rounded-md group-hover:bg-slate-800 transition-colors border border-slate-700">
                      {isCameraOn || isMicOn ? <Camera className="w-4 h-4 text-green-400" /> : <CameraOff className="w-4 h-4 text-slate-400" />}
                    </div>
                    <span className={`font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'تنظیمات دوربین و میکروفون' : 'Camera & Mic Settings'}</span>
                  </button>
                </div>

                {/* Slides / Presentation */}
                <div className="p-2 border-b border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div className={`px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'اسلایدها (Presentation)' : 'Slides'}</div>
                  <button onClick={() => { setShowPresentationModal('save'); setShowSystemMenu(false); }} className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm text-slate-200 hover:bg-slate-700 rounded-lg transition-colors group">
                    <div className="p-1.5 bg-blue-900/30 rounded-md group-hover:bg-blue-900/50 transition-colors border border-blue-800/30">
                      <Save className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className={`font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'ذخیره اسلایدها' : 'Save Slides'}</span>
                  </button>
                  <button onClick={() => { setShowPresentationModal('load'); setShowSystemMenu(false); }} className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm text-slate-200 hover:bg-slate-700 rounded-lg transition-colors group mt-1">
                    <div className="p-1.5 bg-blue-900/30 rounded-md group-hover:bg-blue-900/50 transition-colors border border-blue-800/30">
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className={`font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'بازیابی اسلایدها' : 'Load Slides'}</span>
                  </button>
                </div>

                {/* Templates / Config */}
                {isAdmin && (
                  <div className="p-2 border-b border-slate-700/50 hover:bg-slate-800 transition-colors">
                    <div className={`px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'قالب‌ها (Templates)' : 'Templates'}</div>
                    <button onClick={() => { setShowTemplateModal('save'); setShowSystemMenu(false); }} className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm text-slate-200 hover:bg-slate-700 rounded-lg transition-colors group">
                      <div className="p-1.5 bg-purple-900/30 rounded-md group-hover:bg-purple-900/50 transition-colors border border-purple-800/30">
                        <Save className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className={`font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'ذخیره تنظیمات قالب' : 'Save Config Template'}</span>
                    </button>
                    <button onClick={() => { setShowTemplateModal('load'); setShowSystemMenu(false); }} className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm text-slate-200 hover:bg-slate-700 rounded-lg transition-colors group mt-1">
                      <div className="p-1.5 bg-purple-900/30 rounded-md group-hover:bg-purple-900/50 transition-colors border border-purple-800/30">
                        <FolderOpen className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className={`font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'بازیابی تنظیمات قالب' : 'Load Config Template'}</span>
                    </button>
                  </div>
                )}

                {/* Advanced UI Settings */}
                {isAdmin && (
                  <div className="p-2 bg-slate-800">
                    <button onClick={() => { setShowSettings(!showSettings); setShowSystemMenu(false); }} className="w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition-colors group">
                      <div className="p-1.5 bg-slate-900 rounded-md group-hover:bg-slate-800 transition-colors border border-slate-700">
                        <Settings className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className={`font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{isRTL ? 'تنظیمات پیشرفته نمایش' : 'Advanced Display Settings'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Transcription - Admin Only */}
          {isAdmin && (
            <button
              onClick={toggleTranscription}
              className={`hidden md:flex px-3 py-1.5 rounded-lg text-sm transition items-center gap-2 ${isTranscribing
                ? 'bg-red-600/20 text-red-400 animate-pulse border border-red-500/50'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              title={isTranscribing ? "فعال (توقف)" : "ترجمه زنده (فعال‌سازی)"}
            >
              {isTranscribing ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span className={isRTL ? 'font-[Vazirmatn]' : ''}>
                {isTranscribing ? 'AI Active' : 'AI Translation'}
              </span>
            </button>
          )}

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
        </div>

        <div className="flex items-center gap-3 h-full">
          {/* Slide Counter */}
          <span className="text-slate-400 text-sm font-medium mr-2">
            {activeSlideIndex + 1} <span className="text-slate-600">/</span> {session.slides.length}
          </span>

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
            className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 font-medium shadow-sm ${displayWindow && !displayWindow.closed
              ? 'bg-green-600 text-white animate-pulse shadow-green-600/20'
              : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/20'
              }`}
            title={isRTL ? 'باز کردن صفحه نمایش (پروژکتور)' : 'Open Display Window (Projector)'}
          >
            <Monitor className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>
              {displayWindow && !displayWindow.closed
                ? (isRTL ? 'نمایشگر فعال' : 'Display')
                : (isRTL ? 'نمایشگر' : 'Display')}
            </span>
          </button>
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
        {/* Preview Area with Sidebars */}
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div className="hidden xl:flex w-64 flex-col bg-slate-950 border-r border-slate-900 z-30 shrink-0 transition-all duration-300">
            <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-900 flex justify-between items-center">
              <span>Previous</span>
              <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{Math.max(1, activeSlideIndex)}</span>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center relative">
              {renderSlidePreview(session.slides[activeSlideIndex - 1], 'PREV')}
            </div>
          </div>

          {/* CENTER CONTENT */}
          <div className="flex-1 flex flex-col relative min-w-0 bg-slate-950">
            {/* Live Preview */}
            <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
              {/* Slide Content - Always background/main in PIP mode */}
              <div className={`absolute inset-0 flex items-center justify-center ${broadcastConfig.layout === 'SPLIT'
                ? `right-0 ${broadcastConfig.splitRatio === '70-30' ? 'w-[70%]' : broadcastConfig.splitRatio === '30-70' ? 'w-[30%]' : 'w-1/2'}` :
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
                      className={`absolute object-cover transition-all duration-500 ease-in-out ${broadcastConfig.layout === 'PIP'
                        ? `${broadcastConfig.pipSize === 'small' ? 'w-32 h-24' : broadcastConfig.pipSize === 'large' ? 'w-72 h-56' : 'w-48 h-36'} rounded-xl border-2 border-white/20 shadow-2xl z-20 ${broadcastConfig.pipPosition === 'top-left' ? 'top-4 left-4' :
                          broadcastConfig.pipPosition === 'top-right' ? 'top-4 right-4' :
                            broadcastConfig.pipPosition === 'bottom-left' ? 'bottom-24 left-4' :
                              'bottom-24 right-4' // bottom-right default
                        } ${broadcastConfig.leaderVideoShape === 'circle' ? (broadcastConfig.pipSize === 'small' ? 'rounded-full w-24 h-24' : broadcastConfig.pipSize === 'large' ? 'rounded-full w-56 h-56' : 'rounded-full w-36 h-36') :
                          broadcastConfig.leaderVideoShape === 'square' ? (broadcastConfig.pipSize === 'small' ? 'w-24 h-24' : broadcastConfig.pipSize === 'large' ? 'w-56 h-56' : 'w-36 h-36') : ''
                        }`
                        : broadcastConfig.layout === 'SPLIT' ? `inset-0 ${broadcastConfig.splitRatio === '70-30' ? 'w-[30%]' : broadcastConfig.splitRatio === '30-70' ? 'w-[70%]' : 'w-1/2'}`
                          : 'inset-0 w-full h-full z-0' // FULL_CAM
                        }`}
                      style={{
                        transform: isMirrored ? 'scaleX(-1)' : undefined,
                        filter: isBlur ? 'blur(8px)' : undefined
                      }}
                    />


                  ) : (
                    /* Camera Placeholder when no stream */
                    <div
                      className={`absolute bg-slate-800/90 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 transition-all duration-500 ease-in-out ${broadcastConfig.layout === 'PIP'
                        ? `${broadcastConfig.pipSize === 'small' ? 'w-32 h-24' : broadcastConfig.pipSize === 'large' ? 'w-72 h-56' : 'w-48 h-36'} rounded-xl shadow-2xl z-20 ${broadcastConfig.pipPosition === 'top-left' ? 'top-4 left-4' :
                          broadcastConfig.pipPosition === 'top-right' ? 'top-4 right-4' :
                            broadcastConfig.pipPosition === 'bottom-left' ? 'bottom-24 left-4' :
                              'bottom-24 right-4'
                        } ${broadcastConfig.leaderVideoShape === 'circle' ? (broadcastConfig.pipSize === 'small' ? 'rounded-full w-24 h-24' : broadcastConfig.pipSize === 'large' ? 'rounded-full w-56 h-56' : 'rounded-full w-36 h-36') :
                          broadcastConfig.leaderVideoShape === 'square' ? (broadcastConfig.pipSize === 'small' ? 'w-24 h-24' : broadcastConfig.pipSize === 'large' ? 'w-56 h-56' : 'w-36 h-36') : ''
                        }`
                        : broadcastConfig.layout === 'SPLIT' ? `inset-0 ${broadcastConfig.splitRatio === '70-30' ? 'w-[30%]' : broadcastConfig.splitRatio === '30-70' ? 'w-[70%]' : 'w-1/2'}`
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

              {/* Live Transcript Overlay */}
              {liveTranscript && (
                <div className="absolute bottom-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
                  <div className="bg-black/60 px-6 py-3 rounded-xl backdrop-blur-sm shadow-lg max-w-4xl mx-auto">
                    <p className={`text-white text-xl font-medium text-center ${isRTL ? 'font-[Vazirmatn]' : ''} drop-shadow-md`}>
                      {liveTranscript}
                    </p>
                  </div>
                </div>
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
                disabled={activeSlideIndex >= session.slides.length - 1 && (
                  liveSlide?.type !== SlideType.SCRIPTURE ||
                  internalPageIndex === (liveSlide.content as SlideContentScripture).pages.length - 1
                )}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition"
              >
                <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.next}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="hidden xl:flex w-64 flex-col bg-slate-950 border-l border-slate-900 z-30 shrink-0 transition-all duration-300">
            <div className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-900 flex justify-between items-center">
              <span>Next</span>
              <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{Math.min(session.slides.length, activeSlideIndex + 2)}</span>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center relative">
              {renderSlidePreview(session.slides[activeSlideIndex + 1], 'NEXT')}
            </div>
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

                  {/* PIP Size Selector - Only show when PIP is selected */}
                  {broadcastConfig.layout === 'PIP' && (
                    <div className="mt-4 border-t border-slate-800 pt-4">
                      <p className={`text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {isRTL ? '📐 اندازه دوربین:' : '📐 Camera Size:'}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'small', label: isRTL ? 'کوچک' : 'Small' },
                          { id: 'medium', label: isRTL ? 'متوسط' : 'Medium' },
                          { id: 'large', label: isRTL ? 'بزرگ' : 'Large' }
                        ].map(size => (
                          <button
                            key={size.id}
                            onClick={() => setBroadcastConfig(prev => ({ ...prev, pipSize: size.id as any }))}
                            className={`p-2 rounded-lg border text-center transition text-xs ${broadcastConfig.pipSize === size.id || (!broadcastConfig.pipSize && size.id === 'medium')
                              ? 'bg-green-600 border-green-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              }`}
                          >
                            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{size.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PIP Position Selector - Only show when PIP is selected */}
                  {broadcastConfig.layout === 'PIP' && (
                    <div className="mt-4 border-t border-slate-800 pt-4">
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
                            className={`p-2 rounded-lg border text-center transition text-sm ${broadcastConfig.pipPosition === pos.id || (!broadcastConfig.pipPosition && pos.id === 'bottom-right')
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

                  {/* Split Ratio Selector - Only show when SPLIT is selected */}
                  {broadcastConfig.layout === 'SPLIT' && (
                    <div className="mt-4 border-t border-slate-800 pt-4">
                      <p className={`text-sm text-slate-400 mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {isRTL ? '⚖️ نسبت تصویر (دوربین/اسلاید):' : '⚖️ Split Ratio (Cam/Slides):'}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: '70-30', label: '30 / 70' },
                          { id: '50-50', label: '50 / 50' },
                          { id: '30-70', label: '70 / 30' }
                        ].map(ratio => (
                          <button
                            key={ratio.id}
                            onClick={() => setBroadcastConfig(prev => ({ ...prev, splitRatio: ratio.id as any }))}
                            className={`p-2 rounded-lg border text-center transition text-xs font-mono font-bold ${broadcastConfig.splitRatio === ratio.id || (!broadcastConfig.splitRatio && ratio.id === '50-50')
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              }`}
                          >
                            <span>{ratio.label}</span>
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
                          onClick={() => {
                            const isActive = broadcastConfig.activeDonationId === item.id;
                            setBroadcastConfig(prev => ({
                              ...prev,
                              activeDonationId: isActive ? null : item.id,
                              // If activating, show overlay
                              showDonation: !isActive
                            }));
                            if (!isActive) {
                              // Send overlay toggle
                              sendOverlayToggle('donation', true, item);
                            } else {
                              sendOverlayToggle('donation', false);
                            }
                          }}
                          className={`px-2 py-1 text-xs rounded ${broadcastConfig.activeDonationId === item.id
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                          {broadcastConfig.activeDonationId === item.id ? (isRTL ? 'مخفی کردن' : 'Hide') : (isRTL ? 'نمایش' : 'Show')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Transcription Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('ai')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium flex items-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  ✨ {isRTL ? 'زیرنویس هوشمند (AI)' : 'AI Live Captions'}
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'ai' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'ai' && (
                <div className="p-4 pt-0">
                  <div className="flex flex-col gap-3">
                    <p className={`text-xs text-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {isRTL
                        ? 'تبدیل گفتار به متن به صورت زنده با استفاده از هوش مصنوعی Gemini 2.0 Flash.'
                        : 'Real-time speech-to-text using Gemini 2.0 Flash.'}
                    </p>

                    {/* Audio Level Visualizer */}
                    {isTranscribingLive && (
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-100"
                          style={{ width: `${Math.min(transcribeLevel, 100)}%` }}
                        />
                      </div>
                    )}

                    <button
                      onClick={async () => {
                        if (isTranscribingLive) {
                          stopLiveTranscribe();
                        } else {
                          try {
                            await startLiveTranscribe();
                          } catch (e) {
                            console.error('Failed to start transcription:', e);
                          }
                        }
                      }}
                      className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition ${isTranscribingLive
                        ? 'bg-red-600/20 text-red-400 border border-red-600/50 hover:bg-red-600/30'
                        : 'bg-purple-600 text-white hover:bg-purple-500'
                        }`}
                    >
                      {isTranscribingLive ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'توقف زیرنویس' : 'Stop Captions'}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'شروع زیرنویس زنده' : 'Start Live Captions'}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Status: {syncState.isConnected ? '✅ Sync Connected' : '❌ Sync Offline'}</span>
                      <span>Model: Gemini 2.0 Flash</span>
                    </div>
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
                          className={`py-2 px-3 rounded-lg text-sm transition ${broadcastConfig.amenBadge?.style === style.key
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
                          className={`py-2 px-3 rounded-lg text-sm transition ${broadcastConfig.amenBadge?.size === size.key
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
                          className={`py-2 px-3 rounded-lg text-sm transition ${broadcastConfig.amenBadge?.animationSpeed === speed.key
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
      {
        showPrayerCredits && (
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
        )
      }

      {/* Save/Load Template Modal */}
      {
        showTemplateModal && (
          <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {showTemplateModal === 'save' ? '💾 ذخیره تنظیمات' : '📂 بارگذاری تنظیمات'}
                </h2>
                <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-white" aria-label="Close Modal">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {showTemplateModal === 'save' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">نام تنظیمات (Template Name)</label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      placeholder="مثال: صبح یکشنبه"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!templateName.trim()}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    ذخیره تنظیمات
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {savedTemplates.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">هیچ تنظیماتی ذخیره نشده است.</p>
                  ) : (
                    savedTemplates.map(t => (
                      <div key={t.id} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg flex items-center justify-between transition group">
                        <div>
                          <div className="text-white font-medium">{t.name}</div>
                          <div className="text-xs text-slate-400">{new Date(t.date).toLocaleString('fa-IR')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadTemplate(t.id)}
                            className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-sm transition"
                          >
                            بارگذاری
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Save/Load Presentation Modal */}
      {
        showPresentationModal && (
          <div className="absolute inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  {showPresentationModal === 'save' ? '💾 ذخیره اسلایدها' : '📂 بارگذاری اسلایدها'}
                </h2>
                <button onClick={() => setShowPresentationModal(false)} className="text-slate-400 hover:text-white" aria-label="Close Modal">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {showPresentationModal === 'save' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">نام پرزنتیشن</label>
                    <input
                      type="text"
                      value={presentationName}
                      onChange={(e) => setPresentationName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      placeholder="مثال: مراسم کریسمس"
                      autoFocus
                    />
                  </div>
                  <div className="text-sm text-slate-400">
                    تعداد اسلاید: {session.slides.length}
                  </div>
                  <button
                    onClick={handleSavePresentation}
                    disabled={!presentationName.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    ذخیره فایل
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {savedPresentations.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">هیچ فایلی ذخیره نشده است.</p>
                  ) : (
                    savedPresentations.map(p => (
                      <div key={p.id} className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg flex items-center justify-between transition group">
                        <div>
                          <div className="text-white font-medium">{p.name}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(p.date).toLocaleString('fa-IR')} • {p.slideCount} اسلاید
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadPresentation(p.id)}
                            className="px-3 py-1.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded text-sm transition"
                          >
                            بارگذاری
                          </button>
                          <button
                            onClick={() => handleDeletePresentation(p.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition"
                            title="Delete"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )
      }
      {/* Save/Load Modal */}
      <SaveLoadModal
        isOpen={showSaveLoadModal}
        onClose={() => setShowSaveLoadModal(false)}
        title={saveLoadType === 'template'
          ? (isRTL ? 'مدیریت قالب‌های پخش' : 'Manage Broadcast Templates')
          : (isRTL ? 'مدیریت ارائه‌ها' : 'Manage Presentations')}
        type={saveLoadType}
        items={savedItems}
        onSave={handleSaveItem}
        onLoad={handleLoadItem}
        onDelete={handleDeleteItem}
        isRTL={isRTL}
      />
    </div>
  );
}


export default LiveConsole;
