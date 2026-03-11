/**
 * 🎬 Broadcast Console Pro
 * سیستم مدیریت پخش زنده کلیسا
 * 
 * قابلیت‌ها:
 * - ساخت اسلاید آیات کتاب مقدس (با جستجو)
 * - ساخت اسلاید سرود پرستشی (از کتابخانه سایت)
 * - آپلود و نمایش رسانه (تصویر، ویدیو، صوت)
 * - Lower Thirds برای معرفی افراد
 * - دیوار دعا (Prayer Wall)
 * - نمایش QR Code هدایا
 * - پشتیبانی دوزبانه (فارسی/انگلیسی)
 */

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BroadcastSession, BroadcastOverlayConfig, AppLanguage } from './types';
import { SlideBuilder } from './SlideBuilder';
import { LiveConsole } from './LiveConsole';
import { Camera, CameraOff, Mic, MicOff, AlertCircle, RefreshCw } from 'lucide-react';

// Error Boundary to catch LiveConsole crashes
class LiveConsoleErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LiveConsole ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-white p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2 text-red-400">LiveConsole Error</h2>
          <p className="text-slate-300 mb-4 text-center max-w-lg">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <pre className="bg-slate-800 p-4 rounded-lg text-xs text-red-300 max-w-2xl overflow-auto max-h-64 w-full">
            {this.state.error?.stack}
          </pre>
          <pre className="bg-slate-800 p-4 rounded-lg text-xs text-yellow-300 max-w-2xl overflow-auto max-h-32 w-full mt-2">
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold"
          >
            تلاش مجدد / Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Initial States
const INITIAL_SESSION: BroadcastSession = {
  id: crypto.randomUUID(),
  title: 'جلسه پرستشی یکشنبه',
  date: new Date(),
  slides: [],
  status: 'draft'
};

const INITIAL_OVERLAY: BroadcastOverlayConfig = {
  layout: 'SLIDES_ONLY',
  pipPosition: 'bottom-right', // موقعیت پیش‌فرض دوربین
  pipScale: 1,
  pipSize: 'medium',
  splitRatio: '50-50',
  logoUrl: null,
  showLogo: false,
  leaderVideoShape: 'rectangle',
  lowerThirds: [],
  activeLowerThirdIndex: 0,
  showLowerThird: false,
  lowerThirdSize: 'standard',
  isRotating: false,
  rotationInterval: 15,
  prayerRequests: [],
  showPrayerTicker: false,
  donations: [],
  activeDonationId: null,
  donationDisplayMode: 'OVERLAY'
};

interface BroadcastConsoleProps {
  initialLang?: AppLanguage;
}

export const BroadcastConsole: React.FC<BroadcastConsoleProps> = ({ initialLang = 'fa' }) => {
  // Core State
  const [isReady, setIsReady] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [session, setSession] = useState<BroadcastSession>(INITIAL_SESSION);
  const [broadcastConfig, setBroadcastConfig] = useState<BroadcastOverlayConfig>(INITIAL_OVERLAY);
  const [lang, setLang] = useState<AppLanguage>(initialLang);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // PreFlight State
  const [cameraStatus, setCameraStatus] = useState<'checking' | 'granted' | 'denied' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'checking' | 'granted' | 'denied' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [skipCamera, setSkipCamera] = useState(false);

  // تابع برای بارگذاری اسلایدها از LiveConsole
  const setSessionSlides = (slides: BroadcastSession['slides']) => {
    setSession(prev => ({ ...prev, slides }));
  };

  // Expose setSessionSlides to window for LiveConsole access
  useEffect(() => {
    (window as any).setSessionSlides = setSessionSlides;
    return () => {
      delete (window as any).setSessionSlides;
    };
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setCameraStatus('checking');
    setMicStatus('checking');
    setError(null);

    try {
      // Try to get media stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: !skipCamera,
        audio: true
      });

      setStream(mediaStream);
      setCameraStatus(skipCamera ? 'denied' : 'granted');
      setMicStatus('granted');
      setIsReady(true);
    } catch (err: any) {
      console.error('Media access error:', err);

      if (err.name === 'NotAllowedError') {
        setCameraStatus('denied');
        setMicStatus('denied');
        setError(lang === 'fa'
          ? 'دسترسی به دوربین یا میکروفون رد شد. لطفاً در تنظیمات مرورگر اجازه دهید.'
          : 'Camera or microphone access denied. Please allow in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraStatus('error');
        setError(lang === 'fa'
          ? 'دوربین یا میکروفون یافت نشد.'
          : 'Camera or microphone not found.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleSkipCamera = async () => {
    setSkipCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      setStream(mediaStream);
      setCameraStatus('denied');
      setMicStatus('granted');
      setIsReady(true);
    } catch (err: any) {
      setError(lang === 'fa'
        ? 'خطا در دسترسی به میکروفون'
        : 'Error accessing microphone');
    }
  };

  const handleContinueWithoutMedia = () => {
    setStream(null);
    setCameraStatus('denied');
    setMicStatus('denied');
    setIsReady(true);
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'fa' : 'en');
  };

  const isRTL = lang === 'fa';

  // PreFlight Check Screen
  if (!isReady) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 flex items-center justify-center p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <span className="text-4xl">🎬</span>
            </div>
            <h1 className={`text-2xl font-bold text-white mb-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {lang === 'fa' ? 'کنسول پخش زنده' : 'Broadcast Console'}
            </h1>
            <p className={`text-slate-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {lang === 'fa' ? 'سیستم مدیریت پخش کلیسا' : 'Church Broadcast Management'}
            </p>
          </div>

          {/* Status Checks */}
          <div className="space-y-4 mb-6">
            {/* Camera Status */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${cameraStatus === 'granted' ? 'bg-green-500/20 border border-green-500/30' :
              cameraStatus === 'denied' ? 'bg-yellow-500/20 border border-yellow-500/30' :
                cameraStatus === 'error' ? 'bg-red-500/20 border border-red-500/30' :
                  'bg-slate-700/50 border border-slate-600'
              }`}>
              {cameraStatus === 'granted' ? (
                <Camera className="w-6 h-6 text-green-400" />
              ) : cameraStatus === 'checking' ? (
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              ) : (
                <CameraOff className="w-6 h-6 text-red-400" />
              )}
              <div className="flex-1">
                <p className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {lang === 'fa' ? 'دوربین' : 'Camera'}
                </p>
                <p className={`text-sm ${cameraStatus === 'granted' ? 'text-green-400' :
                  cameraStatus === 'denied' ? 'text-yellow-400' :
                    cameraStatus === 'error' ? 'text-red-400' :
                      'text-slate-400'
                  } ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {cameraStatus === 'granted' && (lang === 'fa' ? 'متصل' : 'Connected')}
                  {cameraStatus === 'denied' && (lang === 'fa' ? 'غیرفعال' : 'Disabled')}
                  {cameraStatus === 'error' && (lang === 'fa' ? 'خطا' : 'Error')}
                  {cameraStatus === 'checking' && (lang === 'fa' ? 'در حال بررسی...' : 'Checking...')}
                </p>
              </div>
            </div>

            {/* Microphone Status */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${micStatus === 'granted' ? 'bg-green-500/20 border border-green-500/30' :
              micStatus === 'denied' ? 'bg-red-500/20 border border-red-500/30' :
                'bg-slate-700/50 border border-slate-600'
              }`}>
              {micStatus === 'granted' ? (
                <Mic className="w-6 h-6 text-green-400" />
              ) : micStatus === 'checking' ? (
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              ) : (
                <MicOff className="w-6 h-6 text-red-400" />
              )}
              <div className="flex-1">
                <p className={`text-white font-medium ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {lang === 'fa' ? 'میکروفون' : 'Microphone'}
                </p>
                <p className={`text-sm ${micStatus === 'granted' ? 'text-green-400' :
                  micStatus === 'denied' ? 'text-red-400' :
                    'text-slate-400'
                  } ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {micStatus === 'granted' && (lang === 'fa' ? 'متصل' : 'Connected')}
                  {micStatus === 'denied' && (lang === 'fa' ? 'غیرفعال' : 'Disabled')}
                  {micStatus === 'checking' && (lang === 'fa' ? 'در حال بررسی...' : 'Checking...')}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className={`text-red-300 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {cameraStatus === 'denied' || cameraStatus === 'error' ? (
              <>
                <button
                  onClick={handleSkipCamera}
                  className={`w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  {lang === 'fa' ? 'ادامه بدون دوربین' : 'Continue without Camera'}
                </button>
                <button
                  onClick={handleContinueWithoutMedia}
                  className={`w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition ${isRTL ? 'font-[Vazirmatn]' : ''}`}
                >
                  {lang === 'fa' ? 'فقط نمایش اسلاید' : 'Slides Only Mode'}
                </button>
              </>
            ) : cameraStatus === 'checking' ? (
              <div className="text-center py-4">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <p className={`text-slate-400 mt-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                  {lang === 'fa' ? 'در حال بررسی دسترسی‌ها...' : 'Checking permissions...'}
                </p>
              </div>
            ) : null}

            <button
              onClick={checkPermissions}
              className={`w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition flex items-center justify-center gap-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
              {lang === 'fa' ? 'تلاش مجدد' : 'Try Again'}
            </button>
          </div>

          {/* Language Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleLang}
              className="text-slate-400 hover:text-white text-sm transition"
            >
              {lang === 'fa' ? '🇺🇸 English' : '🇮🇷 فارسی'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Console
  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
      {/* Left Sidebar: Slide Builder */}
      <SlideBuilder
        session={session}
        setSession={setSession}
        lang={lang}
        activeSlideIndex={activeSlideIndex}
        onSlideSelect={setActiveSlideIndex}
      />

      {/* Right Area: Live Console */}
      <LiveConsoleErrorBoundary>
        <LiveConsole
          session={session}
          mediaStream={stream}
          setMediaStream={setStream}
          lang={lang}
          onLangToggle={toggleLang}
          broadcastConfig={broadcastConfig}
          setBroadcastConfig={setBroadcastConfig}
          activeSlideIndex={activeSlideIndex}
          onSlideChange={setActiveSlideIndex}
        />
      </LiveConsoleErrorBoundary>
    </div>
  );
};

export default BroadcastConsole;
