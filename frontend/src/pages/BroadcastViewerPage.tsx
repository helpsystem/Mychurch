/**
 * 🎬 Broadcast Viewer Page
 * صفحه نمایش پخش زنده - برای نمایش روی پروژکتور
 * 
 * این صفحه از دو روش برای دریافت داده استفاده می‌کند:
 * 1. BroadcastChannel API - برای ارتباط بین تب‌های همان مرورگر (بدون نیاز به سرور)
 * 2. WebSocket - برای ارتباط بین دستگاه‌های مختلف
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebSocketSync } from '../components/broadcast';
import { SmartWorshipPlayer } from '../components/worship/SmartWorshipPlayer';
import type { Slide, BroadcastOverlayConfig, SlideType } from '../components/broadcast/types';

interface ViewerState {
  currentSlide: Slide | null;
  slideIndex: number;
  internalPageIndex: number;
  config: BroadcastOverlayConfig | null;
  connected: boolean;
  connectionType: 'none' | 'broadcast-channel' | 'websocket';
  audioCurrentTime: number; // زمان جاری صوت برای sync کاراوکه
}

const BroadcastViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || 'default';
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<ViewerState>({
    currentSlide: null,
    slideIndex: 0,
    internalPageIndex: 0,
    config: null,
    connected: false,
    connectionType: 'none',
    audioCurrentTime: 0
  });

  // WebSocket sync (for cross-device communication)
  const { state: syncState } = useWebSocketSync({
    sessionId,
    deviceName: 'Projector Display',
    role: 'viewer',
    autoConnect: true
  });

  // BroadcastChannel for same-browser communication (more reliable for local use)
  useEffect(() => {
    // Create BroadcastChannel for same-browser tab communication
    const channelName = `broadcast-console-${sessionId}`;
    const channel = new BroadcastChannel(channelName);
    broadcastChannelRef.current = channel;
    
    console.log('📺 Viewer: BroadcastChannel connected to:', channelName);
    
    channel.onmessage = (event) => {
      const msg = event.data;
      console.log('📺 Viewer received via BroadcastChannel:', msg.type);
      
      if (msg.type === 'slide_change' && msg.payload) {
        setState(prev => ({
          ...prev,
          currentSlide: msg.payload.slide,
          slideIndex: msg.payload.index,
          internalPageIndex: msg.payload.internalPageIndex || 0,
          connected: true,
          connectionType: 'broadcast-channel'
        }));
      }
      
      if (msg.type === 'overlay_toggle' && msg.payload) {
        setState(prev => ({
          ...prev,
          config: msg.payload,
          connected: true,
          connectionType: 'broadcast-channel'
        }));
      }
      
      if (msg.type === 'full_state' && msg.payload) {
        setState(prev => ({
          ...prev,
          currentSlide: msg.payload.currentSlide,
          slideIndex: msg.payload.slideIndex,
          internalPageIndex: msg.payload.internalPageIndex || 0,
          config: msg.payload.config,
          connected: true,
          connectionType: 'broadcast-channel'
        }));
      }
      
      // Handle scroll sync from console
      if (msg.type === 'scroll_sync' && msg.payload && scrollContainerRef.current) {
        const { scrollPercentage } = msg.payload;
        const container = scrollContainerRef.current;
        const targetScroll = scrollPercentage * (container.scrollHeight - container.clientHeight);
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
      
      // Handle audio sync for karaoke
      if (msg.type === 'audio_sync' && msg.payload) {
        setState(prev => ({
          ...prev,
          audioCurrentTime: msg.payload.currentTime
        }));
      }
    };
    
    // Request initial state from console
    channel.postMessage({ type: 'viewer_ready', payload: { sessionId } });
    
    return () => {
      channel.close();
    };
  }, [sessionId]);

  // WebSocket messages (fallback for cross-device)
  useEffect(() => {
    if (syncState.lastMessage) {
      const msg = syncState.lastMessage;
      
      if (msg.type === 'slide_change' && msg.payload) {
        setState(prev => ({
          ...prev,
          currentSlide: msg.payload.slide,
          slideIndex: msg.payload.index,
          internalPageIndex: msg.payload.internalPageIndex || 0,
          connected: true,
          connectionType: 'websocket'
        }));
      }
      
      if (msg.type === 'overlay_toggle' && msg.payload) {
        setState(prev => ({
          ...prev,
          config: msg.payload
        }));
      }
    }
  }, [syncState.lastMessage]);

  useEffect(() => {
    if (syncState.isConnected) {
      setState(prev => ({
        ...prev,
        connected: true,
        connectionType: prev.connectionType === 'none' ? 'websocket' : prev.connectionType
      }));
    }
  }, [syncState.isConnected]);

  const renderSlideContent = () => {
    if (!state.currentSlide) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <div className="text-center animate-pulse">
            <div className="text-8xl mb-8 animate-bounce">🎬</div>
            <h2 className="text-5xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              منتظر شروع پخش...
            </h2>
            <p className="text-3xl text-gray-300 mb-6">
              Waiting for broadcast to start...
            </p>
            {!state.connected && (
              <div className="mt-8 text-yellow-300 text-2xl flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
                در حال اتصال به console...
              </div>
            )}
          </div>
        </div>
      );
    }

    const slide = state.currentSlide;

    if (slide.type === 'SCRIPTURE') {
      const scriptureContent = slide.content as import('../components/broadcast/types').SlideContentScripture;
      const currentPage = scriptureContent.pages?.[state.internalPageIndex] || scriptureContent.pages?.[0];
      
      if (!currentPage) return null;
      
      // Check if we have arrays
      const hasFarsiArray = Array.isArray(currentPage.textPrimary) && currentPage.textPrimary.length > 0;
      const hasEnglishArray = Array.isArray(currentPage.textSecondary) && currentPage.textSecondary.length > 0;
      
      // Prepare verses for synchronized display (same as console)
      const englishVerses = hasEnglishArray ? currentPage.textSecondary as string[] : [];
      const farsiVerses = hasFarsiArray ? currentPage.textPrimary as string[] : [];
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
        <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-950 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent pointer-events-none"></div>
          
          {/* Header Row with Beautiful Book Info - Same as Console */}
          <div className="flex-shrink-0 flex flex-row gap-4 px-6 pt-4" dir="ltr">
            {hasEnglishArray && (
              <div className="flex-1 bg-gradient-to-br from-slate-800/80 to-purple-900/30 rounded-t-xl px-6 py-4 border-b-2 border-purple-500/50">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-purple-300">
                    📖 {currentPage?.bookName?.en || 'Book'}
                  </h3>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xl">
                    <span className="bg-purple-600/40 px-3 py-1 rounded text-purple-200">
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
            {hasFarsiArray && (
              <div className="flex-1 bg-gradient-to-bl from-amber-900/50 to-slate-800/80 rounded-t-xl px-6 py-4 border-b-2 border-amber-500/50">
                <div className="text-center" dir="rtl">
                  <h3 className="text-3xl font-bold text-amber-300 font-[Vazirmatn]">
                    📖 {currentPage?.bookName?.fa || 'کتاب'}
                  </h3>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xl font-[Vazirmatn]">
                    <span className="bg-amber-600/40 px-3 py-1 rounded text-amber-200">
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

          {/* Main Content - Synchronized Verse-by-Verse Display (Same as Console) */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto px-6 pb-4">
            <div className="space-y-4">
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
                    {hasEnglishArray && (
                      <div className="flex-1 bg-slate-800/50 rounded-lg p-4" dir="ltr">
                        <div className="flex gap-3 items-start">
                          <span className="text-2xl font-bold text-purple-400 min-w-[40px] text-right"
                                style={{ textShadow: '0 0 15px rgba(216, 180, 254, 0.6)' }}>
                            {verseNum}
                          </span>
                          <p className="text-2xl text-slate-200 leading-relaxed flex-1"
                             style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                            {englishVerse || ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Farsi Verse (Right) */}
                    {hasFarsiArray && (
                      <div className="flex-1 bg-amber-900/30 rounded-lg p-4" dir="rtl">
                        <div className="flex gap-3 items-start">
                          <span className="text-2xl font-bold text-amber-400 min-w-[40px] text-right"
                                style={{ textShadow: '0 0 15px rgba(251, 191, 36, 0.6)' }}>
                            {verseNum}
                          </span>
                          <p className="text-2xl text-white leading-[1.8] flex-1 text-right font-[Vazirmatn]"
                             style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
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
          <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-indigo-600/80 p-4 text-center">
            <p className="text-white font-semibold text-2xl font-[Vazirmatn]">
              {currentPage?.bookName?.fa} {currentPage?.chapter}:{currentPage?.verses}
            </p>
          </div>
        </div>
      );
    }

    if (slide.type === 'LYRICS') {
      const lyricsContent = slide.content as import('../components/broadcast/types').SlideContentLyrics;
      
      // اگر timing data و audio موجود است از SmartWorshipPlayer استفاده کن
      if (lyricsContent.hasTiming && lyricsContent.timingData && lyricsContent.audioUrl) {
        return (
          <div className="fixed inset-0 bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950">
            <SmartWorshipPlayer
              timingData={lyricsContent.timingData}
              audioSrc={lyricsContent.audioUrl}
              viewOnly={true}
              externalCurrentTime={state.audioCurrentTime}
              translations={{
                finglish: lyricsContent.finglishLines
              }}
            />
          </div>
        );
      }

      // نمایش ساده اگر timing ندارد
      return (
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-600/20 via-transparent to-transparent animate-pulse"></div>
          </div>
          
          <div className="absolute top-20 left-20 text-white/5 text-8xl animate-bounce pointer-events-none" style={{ animationDuration: '3s' }}>🎵</div>
          <div className="absolute bottom-20 right-20 text-white/5 text-8xl animate-bounce pointer-events-none" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>🎶</div>
          
          <div className="relative flex items-center justify-center h-full p-8 overflow-y-auto">
            <div className="text-center max-w-5xl">
              <h2 className="text-5xl font-bold text-white mb-12 drop-shadow-2xl font-[Vazirmatn]"
                  style={{ textShadow: '0 0 40px rgba(236, 72, 153, 0.6)' }}>
                {lyricsContent.title}
              </h2>
              
              <div className="space-y-4">
                {lyricsContent.lines.map((line, idx) => (
                  <p 
                    key={idx} 
                    className={`text-4xl leading-[1.6] font-bold transition-all duration-300 font-[Vazirmatn] ${
                      line.isChorus ? 'text-yellow-200 scale-105' : 'text-white'
                    }`}
                    style={{ 
                      textShadow: line.isChorus 
                        ? '0 0 30px rgba(253, 224, 71, 0.6), 0 0 60px rgba(253, 224, 71, 0.4)' 
                        : '0 4px 12px rgba(0, 0, 0, 0.6)'
                    }}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (slide.type === 'MEDIA') {
      const mediaContent = slide.content as import('../components/broadcast/types').SlideContentMedia;
      
      return (
        <div className="relative h-full bg-gradient-to-br from-gray-950 via-gray-900 to-black">
          <div className="flex items-center justify-center h-full p-8">
            {mediaContent.mediaType === 'image' && (
              <div className="relative animate-fadeIn">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
                <img 
                  src={mediaContent.url} 
                  alt={mediaContent.title || 'Media'} 
                  className="relative max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10"
                />
              </div>
            )}
            {mediaContent.mediaType === 'video' && (
              <video 
                src={mediaContent.url} 
                controls 
                autoPlay={mediaContent.isAutoPlay}
                loop={mediaContent.isLoop}
                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl border-2 border-white/20"
              />
            )}
          </div>
          {mediaContent.title && (
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="text-3xl font-bold text-white drop-shadow-lg bg-black/30 backdrop-blur-md py-4 mx-auto max-w-4xl rounded-xl">
                {mediaContent.title}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (slide.type === 'ANNOUNCEMENT') {
      const announcementContent = slide.content as import('../components/broadcast/types').SlideContentAnnouncement;
      
      return (
        <div className="relative h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent"></div>
          </div>
          
          <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative flex items-center justify-center h-full p-16">
            <div className="text-center max-w-5xl animate-fadeIn">
              <div className="mb-8 inline-block px-6 py-3 bg-emerald-500/20 rounded-full border border-emerald-400/30 backdrop-blur-sm">
                <span className="text-2xl text-emerald-300 font-semibold">📢 اعلان مهم</span>
              </div>
              
              <h2 className="text-7xl font-bold text-white mb-12 drop-shadow-2xl leading-tight animate-slideInUp"
                  style={{ textShadow: '0 0 40px rgba(16, 185, 129, 0.5)' }}>
                {announcementContent.title}
              </h2>
              
              {announcementContent.content && (
                <p className="text-5xl leading-relaxed text-gray-100 mb-12 animate-slideInUp"
                   style={{ 
                     animationDelay: '0.2s',
                     textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)' 
                   }}>
                  {announcementContent.content}
                </p>
              )}
              
              {announcementContent.imageUrl && (
                <div className="relative inline-block animate-slideInUp" style={{ animationDelay: '0.4s' }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-3xl blur-2xl"></div>
                  <img 
                    src={announcementContent.imageUrl} 
                    alt={announcementContent.title} 
                    className="relative max-w-2xl rounded-2xl shadow-2xl border-4 border-white/20"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderLowerThird = () => {
    if (!state.config?.showLowerThird || !state.config.lowerThirds?.length) {
      return null;
    }

    const lowerThird = state.config.lowerThirds[state.config.activeLowerThirdIndex || 0];
    if (!lowerThird) return null;

    // Position above prayer ticker if it's visible
    const bottomOffset = state.config?.showPrayerTicker && state.config.prayerRequests?.length ? 'bottom-16' : 'bottom-4';

    return (
      <div className={`absolute ${bottomOffset} right-4 animate-slideInUp z-30`} dir="rtl">
        <div className="bg-gradient-to-l from-indigo-600/95 via-purple-600/95 to-indigo-600/95 backdrop-blur-lg px-6 py-4 shadow-2xl rounded-xl border border-white/20 max-w-md">
          <div className="flex items-center gap-4">
            {lowerThird.imageUrl && (
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-lg"></div>
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-xl">
                  <img 
                    src={lowerThird.imageUrl} 
                    alt={lowerThird.title} 
                    className="absolute w-full h-full object-cover"
                    style={{
                      transform: `scale(${lowerThird.imagePosition?.scale || 1}) translate(${(lowerThird.imagePosition?.x || 50) - 50}%, ${(lowerThird.imagePosition?.y || 50) - 50}%)`,
                      transformOrigin: 'center'
                    }}
                  />
                </div>
              </div>
            )}
            <div className="flex-1 text-right">
              <h3 className="text-2xl font-bold text-white drop-shadow-lg font-[Vazirmatn]"
                  style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)' }}>
                {lowerThird.title}
              </h3>
              {lowerThird.subtitle && (
                <p className="text-lg text-blue-100 font-medium font-[Vazirmatn]">
                  {lowerThird.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogo = () => {
    if (!state.config?.showLogo || !state.config.logoUrl) {
      return null;
    }

    return (
      <div className="absolute top-8 left-8 animate-fadeIn z-30">
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
          <img 
            src={state.config.logoUrl} 
            alt="Church Logo" 
            className="relative w-24 h-24 object-contain drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))' }}
          />
        </div>
      </div>
    );
  };

  const renderPrayerTicker = () => {
    if (!state.config?.showPrayerTicker || !state.config.prayerRequests?.length) {
      return null;
    }

    const prayers = state.config.prayerRequests;
    // برای seamless loop، اگر فقط یک دعا وجود دارد، از duplicate استفاده نکن
    const needsDuplicate = prayers.length > 1;

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 py-3 z-40 backdrop-blur-sm border-t border-white/10">
        <div className={`whitespace-nowrap flex ${needsDuplicate ? 'animate-marquee' : 'justify-center'}`}>
          {prayers.map(req => (
            <span key={req.id} className="mx-12 text-xl text-white font-[Vazirmatn]">
              🙏 <span className="text-yellow-300 font-bold">{req.name}</span>: {req.content}
            </span>
          ))}
          {/* Duplicate for seamless loop - فقط اگر بیش از یک دعا وجود دارد */}
          {needsDuplicate && prayers.map(req => (
            <span key={`dup-${req.id}`} className="mx-12 text-xl text-white font-[Vazirmatn]">
              🙏 <span className="text-yellow-300 font-bold">{req.name}</span>: {req.content}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Only show disconnected warning briefly, then hide */}
      {!state.connected && !state.currentSlide && (
        <div className="absolute top-6 left-6 bg-red-600/90 backdrop-blur-md text-white px-6 py-3 rounded-xl z-50 shadow-2xl animate-pulse border-2 border-red-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="font-bold font-[Vazirmatn]">⚠️ در انتظار اتصال...</span>
          </div>
        </div>
      )}

      <div className="w-full h-full">
        {renderSlideContent()}
      </div>

      {renderLogo()}
      {renderLowerThird()}
      {renderPrayerTicker()}

      {/* Removed slide number indicator - not needed in output */}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BroadcastViewerPage;