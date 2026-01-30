/**
 * 🎬 Broadcast Viewer Page
 * صفحه نمایش پخش زنده - برای نمایش روی پروژکتور
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWebSocketSync } from '../components/broadcast';
import type { Slide, BroadcastOverlayConfig, SlideType } from '../components/broadcast/types';

interface ViewerState {
  currentSlide: Slide | null;
  slideIndex: number;
  config: BroadcastOverlayConfig | null;
  connected: boolean;
}

const BroadcastViewerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session') || 'default';
  
  const [state, setState] = useState<ViewerState>({
    currentSlide: null,
    slideIndex: 0,
    config: null,
    connected: false
  });

  const { state: syncState } = useWebSocketSync({
    sessionId,
    deviceName: 'Projector Display',
    role: 'viewer',
    autoConnect: true
  });

  useEffect(() => {
    if (syncState.lastMessage) {
      const msg = syncState.lastMessage;
      
      if (msg.type === 'slide_change' && msg.payload) {
        setState(prev => ({
          ...prev,
          currentSlide: msg.payload.slide,
          slideIndex: msg.payload.index
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
    setState(prev => ({
      ...prev,
      connected: syncState.isConnected
    }));
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
      const firstPage = scriptureContent.pages?.[0];
      
      console.log('📖 Scripture Slide:', { scriptureContent, firstPage, slideContent: slide.content });
      
      if (!firstPage) {
        console.warn('⚠️ No firstPage found in scripture content');
        return null;
      }
      
      // Check if we have array verses
      const hasArrayVerses = Array.isArray(firstPage.textPrimary);
      
      return (
        <div className="relative h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-purple-700/20 via-transparent to-transparent"></div>
          </div>
          
          <div className="absolute top-10 right-10 text-white/5 text-9xl">✝</div>
          <div className="absolute bottom-10 left-10 text-white/5 text-9xl">✝</div>
          
          <div className="relative flex items-start justify-center h-full p-8 overflow-y-auto animate-fadeIn">
            <div className="w-full max-w-[95vw]">
              {/* Header with Book name and chapter */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* English Header */}
                <div className="text-center" dir="ltr">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-500/30 rounded-xl backdrop-blur-sm border-2 border-purple-400/50 shadow-lg">
                    <span className="text-3xl font-bold text-purple-300">{firstPage.bookName.en}</span>
                    <span className="text-5xl font-extrabold text-purple-200">{firstPage.chapter}</span>
                  </div>
                </div>
                {/* Persian Header */}
                <div className="text-center" dir="rtl">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-500/30 rounded-xl backdrop-blur-sm border-2 border-blue-400/50 shadow-lg">
                    <span className="text-3xl font-bold text-blue-300" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
                      {firstPage.bookName.fa}
                    </span>
                    <span className="text-5xl font-extrabold text-blue-200">{firstPage.chapter}</span>
                  </div>
                </div>
              </div>

              {hasArrayVerses ? (
                /* Side by side verses with verse numbers - like BiblePage */
                <div className="grid grid-cols-2 gap-6">
                  {/* English Column - LEFT */}
                  <div className="space-y-4" dir="ltr">
                    {firstPage.textSecondary && Array.isArray(firstPage.textSecondary) && firstPage.textSecondary.map((verse, index) => (
                      <div 
                        key={index} 
                        className="flex gap-3 items-start p-3 rounded-lg bg-purple-500/10 backdrop-blur-sm border border-purple-400/20 hover:bg-purple-500/20 transition-all animate-slideInUp"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <span className="text-3xl font-extrabold text-purple-300 min-w-[50px] text-center drop-shadow-lg"
                              style={{ textShadow: '0 0 15px rgba(216, 180, 254, 0.6)' }}>
                          {firstPage.verseNumbers?.[index] || (index + 1)}
                        </span>
                        <p className="text-2xl leading-relaxed font-medium text-white drop-shadow-lg flex-1"
                           style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                          {verse}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Persian Column - RIGHT */}
                  <div className="space-y-4" dir="rtl">
                    {firstPage.textPrimary.map((verse, index) => (
                      <div 
                        key={index} 
                        className="flex gap-3 items-start p-3 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-400/20 hover:bg-blue-500/20 transition-all animate-slideInUp"
                        style={{ 
                          animationDelay: `${index * 0.05}s`,
                          fontFamily: 'Vazirmatn, sans-serif'
                        }}
                      >
                        <span className="text-3xl font-extrabold text-blue-300 min-w-[50px] text-center drop-shadow-lg"
                              style={{ textShadow: '0 0 15px rgba(147, 197, 253, 0.6)' }}>
                          {firstPage.verseNumbers?.[index] || (index + 1)}
                        </span>
                        <p className="text-2xl leading-[1.8] font-semibold text-white drop-shadow-lg flex-1"
                           style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                          {verse}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Fallback for old string format - centered */
                <div className="text-center max-w-6xl mx-auto">
                  <div className="mb-12" dir="rtl">
                    <p className="text-5xl leading-[1.8] font-bold text-white drop-shadow-2xl mb-8 animate-slideInUp" 
                       style={{ 
                         textShadow: '0 0 30px rgba(147, 197, 253, 0.5)',
                         fontFamily: 'Vazirmatn, sans-serif'
                       }}>
                      {firstPage.textPrimary}
                    </p>
                  </div>
                  
                  {firstPage.textSecondary && (
                    <div className="mt-12 pt-8 border-t border-white/10" dir="ltr">
                      <p className="text-4xl leading-relaxed text-gray-100 animate-slideInUp" 
                         style={{ 
                           animationDelay: '0.3s',
                           textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)' 
                         }}>
                        {firstPage.textSecondary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (slide.type === 'LYRICS') {
      const lyricsContent = slide.content as import('../components/broadcast/types').SlideContentLyrics;
      
      return (
        <div className="relative h-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-fuchsia-900 to-pink-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-600/20 via-transparent to-transparent animate-pulse"></div>
          </div>
          
          <div className="absolute top-20 left-20 text-white/5 text-8xl animate-bounce" style={{ animationDuration: '3s' }}>🎵</div>
          <div className="absolute bottom-20 right-20 text-white/5 text-8xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>🎶</div>
          
          <div className="relative flex items-center justify-center h-full p-16">
            <div className="text-center max-w-5xl animate-fadeIn">
              <h2 className="text-6xl font-bold text-white mb-16 drop-shadow-2xl"
                  style={{ textShadow: '0 0 40px rgba(236, 72, 153, 0.6)' }}>
                {lyricsContent.title}
              </h2>
              
              <div className="space-y-6">
                {lyricsContent.lines.map((line, idx) => (
                  <p 
                    key={idx} 
                    className={`text-6xl leading-[1.6] font-bold transition-all duration-300 animate-slideInUp ${
                      line.isChorus ? 'text-yellow-200 scale-110' : 'text-white'
                    }`}
                    style={{ 
                      animationDelay: `${idx * 0.1}s`,
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

    return (
      <div className="absolute bottom-0 left-0 right-0 animate-slideInUp">
        <div className="bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95 backdrop-blur-lg p-8 shadow-2xl border-t-2 border-white/20">
          <div className="container mx-auto flex items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-4xl font-bold text-white drop-shadow-lg mb-2"
                  style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)' }}>
                {lowerThird.title}
              </h3>
              {lowerThird.subtitle && (
                <p className="text-2xl text-blue-100 font-medium">
                  {lowerThird.subtitle}
                </p>
              )}
            </div>
            {lowerThird.imageUrl && (
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
                <img 
                  src={lowerThird.imageUrl} 
                  alt={lowerThird.title} 
                  className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl"
                />
              </div>
            )}
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
      <div className="absolute top-8 right-8 animate-fadeIn">
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
          <img 
            src={state.config.logoUrl} 
            alt="Church Logo" 
            className="relative w-40 h-40 object-contain drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {!state.connected && (
        <div className="absolute top-6 left-6 bg-red-600/90 backdrop-blur-md text-white px-6 py-3 rounded-xl z-50 shadow-2xl animate-pulse border-2 border-red-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span className="font-bold">⚠️ اتصال قطع شده</span>
          </div>
        </div>
      )}

      <div className="w-full h-full">
        {renderSlideContent()}
      </div>

      {renderLogo()}
      {renderLowerThird()}

      <div className="absolute top-6 right-6 bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md text-white px-5 py-2 rounded-xl text-lg font-bold shadow-lg border border-white/20">
        <span className="text-yellow-300">📄</span> اسلاید {state.slideIndex + 1}
      </div>
      
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
        
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default BroadcastViewerPage;