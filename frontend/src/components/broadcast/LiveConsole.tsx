/**
 * 🎬 Broadcast Live Console
 * کنسول زنده پخش با پیش‌نمایش اسلایدها
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BroadcastSession, Slide, SlideType, BroadcastOverlayConfig,
  SlideContentScripture, SlideContentLyrics, SlideContentMedia,
  LowerThirdItem, PrayerRequest, DonationItem, AppLanguage
} from './types';
import { BROADCAST_TRANSLATIONS } from './dataService';
import {
  Play, Pause, ChevronLeft, ChevronRight, Settings, 
  Video, Mic, MicOff, Camera, CameraOff, Image as ImageIcon,
  Radio, Users, Heart, Gift, Plus, Trash2, X
} from 'lucide-react';

interface LiveConsoleProps {
  session: BroadcastSession;
  mediaStream: MediaStream | null;
  lang: AppLanguage;
  broadcastConfig: BroadcastOverlayConfig;
  setBroadcastConfig: React.Dispatch<React.SetStateAction<BroadcastOverlayConfig>>;
  activeSlideIndex: number;
  onSlideChange: (index: number) => void;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  session,
  mediaStream,
  lang,
  broadcastConfig,
  setBroadcastConfig,
  activeSlideIndex,
  onSlideChange
}) => {
  const t = BROADCAST_TRANSLATIONS[lang];
  const isRTL = lang === 'fa';
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State
  const [showSettings, setShowSettings] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('layout');
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);
  
  // Lower Third State
  const [newLowerThird, setNewLowerThird] = useState<Partial<LowerThirdItem>>({ title: '', subtitle: '' });
  
  // Prayer Request State
  const [newPrayerName, setNewPrayerName] = useState('');
  const [newPrayerContent, setNewPrayerContent] = useState('');
  
  // Donation State
  const [newDonation, setNewDonation] = useState<Partial<DonationItem>>({ title: '', description: '', url: '', duration: 30 });

  // Set up video stream
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

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
      onSlideChange(activeSlideIndex - 1);
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
      onSlideChange(activeSlideIndex + 1);
    }
  };

  // Lower Third Handlers
  const handleAddLowerThird = () => {
    if (!newLowerThird.title) return;
    const item: LowerThirdItem = {
      id: crypto.randomUUID(),
      title: newLowerThird.title,
      subtitle: newLowerThird.subtitle || '',
      imageUrl: newLowerThird.imageUrl
    };
    setBroadcastConfig(prev => ({
      ...prev,
      lowerThirds: [...prev.lowerThirds, item]
    }));
    setNewLowerThird({ title: '', subtitle: '' });
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
      timestamp: new Date()
    };
    setBroadcastConfig(prev => ({
      ...prev,
      prayerRequests: [...prev.prayerRequests, request]
    }));
    setNewPrayerName('');
    setNewPrayerContent('');
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
      
      return (
        <div className="text-center p-8 animate-in fade-in duration-500">
          <p className={`text-4xl font-bold text-white leading-relaxed mb-6 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {currentPage?.textPrimary}
          </p>
          {currentPage?.textSecondary && (
            <p className="text-xl text-slate-300 italic mb-4">
              {currentPage.textSecondary}
            </p>
          )}
          <p className={`text-amber-400 font-semibold ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {currentPage?.bookName[lang]} {currentPage?.chapter}:{currentPage?.verses}
          </p>
          
          {/* Page indicators */}
          {content.pages.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {content.pages.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === internalPageIndex ? 'bg-amber-500 w-4' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeSlide.type === SlideType.LYRICS) {
      const content = activeSlide.content as SlideContentLyrics;
      
      return (
        <div className="text-center p-8 space-y-4">
          <h2 className={`text-2xl font-bold text-pink-400 mb-6 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {content.title}
          </h2>
          {content.lines.map((line, i) => (
            <p
              key={i}
              className={`text-3xl font-bold text-white leading-relaxed ${
                line.isChorus ? 'text-pink-300 italic' : ''
              } ${isRTL ? 'font-[Vazirmatn]' : ''}`}
            >
              {line.text}
            </p>
          ))}
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

    return null;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Live Indicator */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
              isLive 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              {t.live}
            </span>
          </button>
          
          <h1 className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
            {session.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Slide Counter */}
          <span className="text-slate-400 text-sm">
            {activeSlideIndex + 1} / {session.slides.length}
          </span>
          
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
              showSettings 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{t.settings}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Live Preview */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Camera Feed (Background) */}
            {mediaStream && broadcastConfig.layout !== 'SLIDES_ONLY' && (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`absolute inset-0 w-full h-full object-cover ${
                  broadcastConfig.layout === 'PIP' ? 'z-0' : 
                  broadcastConfig.layout === 'SPLIT' ? 'w-1/2' : ''
                }`}
              />
            )}
            
            {/* Slide Content */}
            <div className={`absolute inset-0 flex items-center justify-center ${
              broadcastConfig.layout === 'PIP' ? 'bottom-20 right-4 left-auto top-auto w-80 h-48 rounded-xl bg-black/80 z-10' :
              broadcastConfig.layout === 'SPLIT' ? 'right-0 w-1/2' :
              'bg-black/60'
            }`}>
              {renderSlideContent()}
            </div>
            
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
              <div className="absolute bottom-20 left-4 right-4 z-20">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 backdrop-blur-sm border border-white/10 max-w-lg">
                  <p className={`text-white font-bold text-lg ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                    {activeLowerThird.title}
                  </p>
                  {activeLowerThird.subtitle && (
                    <p className="text-white/70 text-sm">
                      {activeLowerThird.subtitle}
                    </p>
                  )}
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
                  {/* QR Code would go here */}
                  <div className="w-40 h-40 bg-white rounded-xl mx-auto flex items-center justify-center">
                    <span className="text-slate-500 text-sm">QR Code</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 px-4">
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
          <div className="w-80 bg-slate-900 border-l border-slate-800 overflow-y-auto">
            {/* Layout Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('layout')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  📺 {t.layout}
                </span>
                <span className={`text-slate-500 transition-transform ${openSection === 'layout' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === 'layout' && (
                <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                  {[
                    { id: 'FULL_CAM', label: t.fullCam, icon: '📷' },
                    { id: 'PIP', label: t.pip, icon: '🖼️' },
                    { id: 'SPLIT', label: t.split, icon: '✂️' },
                    { id: 'SLIDES_ONLY', label: t.slidesOnly, icon: '📑' }
                  ].map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setBroadcastConfig(prev => ({ ...prev, layout: layout.id as any }))}
                      className={`p-3 rounded-lg border text-center transition ${
                        broadcastConfig.layout === layout.id
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{layout.icon}</span>
                      <span className={`text-xs ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{layout.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logo Section */}
            <div className="border-b border-slate-800">
              <button
                onClick={() => toggleSection('logo')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50"
              >
                <span className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  🖼️ {t.uploadLogo}
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
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          i === broadcastConfig.activeLowerThirdIndex ? 'bg-indigo-600/30 border border-indigo-500' : 'bg-slate-800'
                        }`}
                      >
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
                    <button
                      onClick={handleAddPrayerRequest}
                      className={`w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                    >
                      <Heart className="w-4 h-4 inline mr-1" />
                      {t.addRequest}
                    </button>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastConfig.showPrayerTicker}
                      onChange={(e) => setBroadcastConfig(prev => ({ ...prev, showPrayerTicker: e.target.checked }))}
                      className="accent-purple-500"
                    />
                    <span className={`text-sm text-slate-300 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                      {t.showPrayerWall}
                    </span>
                  </label>
                  
                  {/* Prayer List */}
                  <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                    {broadcastConfig.prayerRequests.map((req) => (
                      <div key={req.id} className="flex items-start gap-2 bg-slate-800 p-2 rounded-lg">
                        <div className="flex-1">
                          <p className={`text-white text-xs font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{req.name}</p>
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
                    <input
                      type="text"
                      value={newDonation.url}
                      onChange={(e) => setNewDonation(prev => ({ ...prev, url: e.target.value }))}
                      placeholder={t.donationUrl}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    />
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
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          broadcastConfig.activeDonationId === item.id ? 'bg-green-600/30 border border-green-500' : 'bg-slate-800'
                        }`}
                      >
                        <div className="flex-1">
                          <p className={`text-white text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>{item.title}</p>
                        </div>
                        <button
                          onClick={() => handleShowDonation(item.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            broadcastConfig.activeDonationId === item.id
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
      `}</style>
    </div>
  );
};

export default LiveConsole;
