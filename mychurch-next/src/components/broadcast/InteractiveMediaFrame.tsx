'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Youtube,
  ExternalLink
} from 'lucide-react';
import { MediaDisplayConfig } from '@/types/broadcast';
import { useLanguage } from '@/providers/LanguageProvider';

const localDict = {
  en: {
    dragToPan: 'Drag to pan',
    togglePanMode: 'Switch to frame drag mode',
    toggleClickPlayMode: 'Switch to click & play mode',
    panMode: 'Pan Mode',
    playVideo: 'Play Video',
    openInYoutube: 'Open in YouTube',
    frameControls: 'Frame Controls',
    zoomOut: 'Zoom Out',
    zoomIn: 'Zoom In',
    contain: 'Contain',
    fit: 'Fit',
    cover: 'Cover',
    fill: 'Fill',
    pause: 'Pause',
    play: 'Play',
    unmute: 'Unmute',
    mute: 'Mute',
    unmuteYoutube: 'Unmute',
    muteYoutube: 'Mute',
    audioOn: 'Sound',
    audioOff: 'Muted',
    resetZoomPan: 'Reset Zoom & Pan',
    youtubeVideoPlayer: 'YouTube video player',
    churchLogo: 'Church Logo',
  },
  fa: {
    dragToPan: 'درگ برای جابجایی کادر',
    togglePanMode: 'سوییچ به حالت درگ کادر',
    toggleClickPlayMode: 'سوییچ به حالت کلیک و پخش ویدیو',
    panMode: 'حالت درگ کادر',
    playVideo: 'تست و پخش ویدیو',
    openInYoutube: 'باز کردن در وبسایت یوتیوب',
    frameControls: 'تنظیمات کادر و زوم',
    zoomOut: 'کوچک‌نمایی',
    zoomIn: 'بزرگ‌نمایی',
    contain: 'کامل (Contain)',
    fit: 'کامل',
    cover: 'پر کردن کادر (Cover)',
    fill: 'کشیده (Fill)',
    pause: 'توقف',
    play: 'پخش',
    unmute: 'باز کردن صدا',
    mute: 'بی‌صدا',
    unmuteYoutube: 'صدا را باز کن (Unmute)',
    muteYoutube: 'بی‌صدا (Mute)',
    audioOn: 'صدا',
    audioOff: 'بی‌صدا',
    resetZoomPan: 'بازنشانی کادر و زوم',
    youtubeVideoPlayer: 'پخش‌کننده ویدیوی یوتیوب',
    churchLogo: 'لوگوی کلیسا',
  },
  es: {
    dragToPan: 'Arrastrar para mover',
    togglePanMode: 'Cambiar al modo de arrastrar el cuadro',
    toggleClickPlayMode: 'Cambiar al modo de clic y reproducir',
    panMode: 'Modo de desplazamiento',
    playVideo: 'Reproducir video',
    openInYoutube: 'Abrir en YouTube',
    frameControls: 'Controles del cuadro',
    zoomOut: 'Alejar',
    zoomIn: 'Acercar',
    contain: 'Contener',
    fit: 'Ajustar',
    cover: 'Cubrir',
    fill: 'Rellenar',
    pause: 'Pausar',
    play: 'Reproducir',
    unmute: 'Activar sonido',
    mute: 'Silenciar',
    unmuteYoutube: 'Activar sonido',
    muteYoutube: 'Silenciar',
    audioOn: 'Sonido',
    audioOff: 'Silenciado',
    resetZoomPan: 'Restablecer zoom y desplazamiento',
    youtubeVideoPlayer: 'Reproductor de video de YouTube',
    churchLogo: 'Logo de la iglesia',
  },
};

export function extractYoutubeId(urlOrId: string | undefined | null): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // URLs (watch?v=, youtu.be/, shorts/, embed/, live/)
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

export function isYoutubeUrl(urlOrId: string | undefined | null): boolean {
  return Boolean(extractYoutubeId(urlOrId));
}

export function getYoutubeEmbedUrl(
  urlOrId: string,
  options: {
    autoplay?: boolean;
    mute?: boolean;
    loop?: boolean;
    controls?: boolean;
  } = {}
): string {
  const id = extractYoutubeId(urlOrId) || urlOrId;
  const autoplay = options.autoplay ? '1' : '0';
  const mute = options.mute !== false ? '1' : '0';
  const loop = options.loop ? '1' : '0';
  const controls = options.controls !== false ? '1' : '0';
  const playlist = options.loop ? `&playlist=${id}` : '';

  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoplay}&mute=${mute}&controls=${controls}&loop=${loop}${playlist}&enablejsapi=1&rel=0&modestbranding=1`;
}

interface InteractiveMediaFrameProps {
  url: string;
  type: 'image' | 'video';
  config?: Partial<MediaDisplayConfig>;
  onChangeConfig?: (newConfig: MediaDisplayConfig) => void;
  isEditable?: boolean;
  className?: string;
  isRTL?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  alt?: string;
  showToolbarByDefault?: boolean;
  showWatermarkLogo?: boolean;
  watermarkPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  watermarkOpacity?: number;
  watermarkSize?: 'sm' | 'md' | 'lg';
}

export const defaultMediaConfig: MediaDisplayConfig = {
  width: 100,
  height: 100,
  position: 'center',
  objectFit: 'contain',
  borderRadius: 0,
  opacity: 100,
  scale: 1,
  panX: 0,
  panY: 0,
};

export default function InteractiveMediaFrame({
  url,
  type,
  config = {},
  onChangeConfig,
  isEditable = false,
  className = '',
  isRTL = true,
  autoPlay = true,
  loop = true,
  alt = 'Media content',
  showToolbarByDefault = false,
  showWatermarkLogo = false,
  watermarkPosition = 'top-right',
  watermarkOpacity = 90,
  watermarkSize = 'md',
}: InteractiveMediaFrameProps) {
  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const mergedConfig: MediaDisplayConfig = {
    ...defaultMediaConfig,
    ...config,
    scale: config.scale ?? 1,
    panX: config.panX ?? 0,
    panY: config.panY ?? 0,
    objectFit: config.objectFit ?? 'contain',
    opacity: config.opacity ?? 100,
    borderRadius: config.borderRadius ?? 0,
  };

  const [scale, setScale] = useState<number>(mergedConfig.scale || 1);
  const [panX, setPanX] = useState<number>(mergedConfig.panX || 0);
  const [panY, setPanY] = useState<number>(mergedConfig.panY || 0);
  const [objectFit, setObjectFit] = useState<MediaDisplayConfig['objectFit']>(mergedConfig.objectFit);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showToolbar, setShowToolbar] = useState(showToolbarByDefault);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);

  // YouTube detection
  const isYoutube = isYoutubeUrl(url);
  const youtubeId = isYoutube ? extractYoutubeId(url) : null;
  const [isDirectInteraction, setIsDirectInteraction] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Synchronize when external config changes
  useEffect(() => {
    if (config.scale !== undefined) setScale(config.scale);
    if (config.panX !== undefined) setPanX(config.panX);
    if (config.panY !== undefined) setPanY(config.panY);
    if (config.objectFit !== undefined) setObjectFit(config.objectFit);
  }, [config.scale, config.panX, config.panY, config.objectFit]);

  // Notify parent of config changes
  const emitChange = useCallback((newScale: number, newPanX: number, newPanY: number, newFit: MediaDisplayConfig['objectFit']) => {
    if (onChangeConfig) {
      onChangeConfig({
        ...mergedConfig,
        scale: Math.round(newScale * 100) / 100,
        panX: Math.round(newPanX * 10) / 10,
        panY: Math.round(newPanY * 10) / 10,
        objectFit: newFit,
      });
    }
  }, [mergedConfig, onChangeConfig]);

  // Zoom helpers
  const handleZoom = useCallback((delta: number) => {
    setScale((prev) => {
      const next = Math.min(3, Math.max(0.4, Number((prev + delta).toFixed(2))));
      emitChange(next, panX, panY, objectFit);
      return next;
    });
  }, [panX, panY, objectFit, emitChange]);

  const handleZoomSlider = (val: number) => {
    setScale(val);
    emitChange(val, panX, panY, objectFit);
  };

  const handleFitChange = (newFit: MediaDisplayConfig['objectFit']) => {
    setObjectFit(newFit);
    emitChange(scale, panX, panY, newFit);
  };

  const handleReset = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
    setObjectFit('contain');
    emitChange(1, 0, 0, 'contain');
  };

  // Mouse wheel zoom when hovering
  const handleWheel = (e: React.WheelEvent) => {
    if (!isEditable) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    handleZoom(delta);
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditable) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isEditable) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const percentX = (deltaX / (width || 1)) * 100;
    const percentY = (deltaY / (height || 1)) * 100;

    const nextPanX = Math.min(100, Math.max(-100, panX + percentX));
    const nextPanY = Math.min(100, Math.max(-100, panY + percentY));

    setPanX(nextPanX);
    setPanY(nextPanY);
    setDragStart({ x: e.clientX, y: e.clientY });
    emitChange(scale, nextPanX, nextPanY, objectFit);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditable || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isEditable || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;

    const container = containerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const percentX = (deltaX / (width || 1)) * 100;
    const percentY = (deltaY / (height || 1)) * 100;

    const nextPanX = Math.min(100, Math.max(-100, panX + percentX));
    const nextPanY = Math.min(100, Math.max(-100, panY + percentY));

    setPanX(nextPanX);
    setPanY(nextPanY);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    emitChange(scale, nextPanX, nextPanY, objectFit);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Video controls
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        borderRadius: `${mergedConfig.borderRadius ?? 0}px`,
        opacity: (mergedConfig.opacity ?? 100) / 100,
      }}
      className={`relative overflow-hidden select-none group ${
        isEditable ? 'cursor-grab active:cursor-grabbing border border-slate-700/60 bg-black' : 'bg-transparent'
      } ${className}`}
    >
      {/* Transformed Media Layer */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75"
        style={{
          transform: `translate3d(${panX}%, ${panY}%, 0) scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: isEditable ? 'none' : 'auto',
        }}
      >
        {type === 'image' && (
          <img
            src={url}
            alt={alt}
            crossOrigin="anonymous"
            style={{ objectFit }}
            className="w-full h-full pointer-events-none select-none"
          />
        )}

        {type === 'video' && !isYoutube && (
          <video
            ref={videoRef}
            src={url}
            crossOrigin="anonymous"
            autoPlay={autoPlay}
            loop={loop}
            muted={isMuted}
            playsInline
            style={{ objectFit }}
            className="w-full h-full pointer-events-none select-none"
          />
        )}

        {type === 'video' && isYoutube && youtubeId && (
          <div className="w-full h-full relative flex items-center justify-center">
            <iframe
              key={`${youtubeId}-${isMuted}`}
              src={getYoutubeEmbedUrl(youtubeId, {
                autoplay: autoPlay,
                mute: isMuted,
                loop: loop,
                controls: true
              })}
              title={alt || d.youtubeVideoPlayer}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                width: '100%',
                height: '100%',
                border: 0,
                pointerEvents: isEditable && !isDirectInteraction ? 'none' : 'auto',
              }}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Transparent Church Watermark Logo */}
      {showWatermarkLogo && (
        <div
          className={`absolute pointer-events-none z-20 transition-all duration-300 ${
            watermarkPosition === 'top-left'
              ? 'top-3 left-3 md:top-4 md:left-4'
              : watermarkPosition === 'bottom-right'
              ? 'bottom-3 right-3 md:bottom-4 md:right-4'
              : watermarkPosition === 'bottom-left'
              ? 'bottom-3 left-3 md:bottom-4 md:left-4'
              : watermarkPosition === 'center'
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              : 'top-3 right-3 md:top-4 md:right-4'
          }`}
          style={{ opacity: (watermarkOpacity ?? 90) / 100 }}
        >
          <img
            src="/logo-transparent.png"
            alt={d.churchLogo}
            className={`object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] filter select-none pointer-events-none ${
              watermarkSize === 'sm'
                ? 'w-12 h-12 md:w-16 md:h-16'
                : watermarkSize === 'lg'
                ? 'w-24 h-24 md:w-36 md:h-36'
                : 'w-16 h-16 md:w-24 md:h-24'
            }`}
          />
        </div>
      )}

      {/* Interactive Controls Overlay for Editable Mode */}
      {isEditable && (
        <>
          {/* Header Action / Quick Toggle */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto z-30">
            <div className="flex items-center gap-1.5">
              {isYoutube ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow-lg">
                  <Youtube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-white text-[11px] shadow-lg">
                  <Move className="w-3 h-3 text-indigo-400 animate-pulse" />
                  <span className="font-[Vazirmatn]">
                    {d.dragToPan}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono px-1 bg-white/10 rounded">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
              )}

              {isYoutube && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDirectInteraction(!isDirectInteraction);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-[Vazirmatn] font-bold shadow-lg border transition ${
                    isDirectInteraction
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-black/75 text-slate-200 border-white/10 hover:bg-black/90'
                  }`}
                  title={isDirectInteraction ? d.togglePanMode : d.toggleClickPlayMode}
                >
                  {isDirectInteraction ? (
                    <>
                      <Move className="w-3 h-3" />
                      <span>{d.panMode}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-400" />
                      <span>{d.playVideo}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {isYoutube && (
                <a
                  href={`https://www.youtube.com/watch?v=${youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={d.openInYoutube}
                  className="p-1.5 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/10 text-slate-200 hover:text-white shadow-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowToolbar(!showToolbar);
                }}
                title={d.frameControls}
                className="p-1.5 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/10 text-slate-200 hover:text-white shadow-lg transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Floating Controls Bar (Bottom) */}
          {(showToolbar || showToolbarByDefault) && (
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/90 backdrop-blur-xl border border-indigo-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white text-xs max-w-[95%] overflow-x-auto"
              dir="ltr"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => handleZoom(-0.1)}
                title={d.zoomOut}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Slider */}
              <input
                type="range"
                min={0.4}
                max={3}
                step={0.05}
                value={scale}
                onChange={(e) => handleZoomSlider(parseFloat(e.target.value))}
                title={`Zoom: ${Math.round(scale * 100)}%`}
                className="w-16 sm:w-20 accent-indigo-500 cursor-pointer"
              />

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => handleZoom(0.1)}
                title={d.zoomIn}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-white/20" />

              {/* Fit Modes */}
              <div className="flex items-center gap-1 font-[Vazirmatn]">
                <button
                  type="button"
                  onClick={() => handleFitChange('contain')}
                  title={d.contain}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    objectFit === 'contain'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {d.fit}
                </button>
                <button
                  type="button"
                  onClick={() => handleFitChange('cover')}
                  title={d.cover}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    objectFit === 'cover'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {d.cover}
                </button>
                <button
                  type="button"
                  onClick={() => handleFitChange('fill')}
                  title={d.fill}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    objectFit === 'fill'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {d.fill}
                </button>
              </div>

              <div className="w-[1px] h-4 bg-white/20" />

              {/* Video specific controls if standard video */}
              {type === 'video' && !isYoutube && (
                <>
                  <button
                    type="button"
                    onClick={togglePlay}
                    title={isPlaying ? d.pause : d.play}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    title={isMuted ? d.unmute : d.mute}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <div className="w-[1px] h-4 bg-white/20" />
                </>
              )}

              {/* YouTube specific toolbar controls */}
              {type === 'video' && isYoutube && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? d.unmuteYoutube : d.muteYoutube}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span className="text-[10px] font-[Vazirmatn]">{isMuted ? d.audioOff : d.audioOn}</span>
                  </button>
                  <div className="w-[1px] h-4 bg-white/20" />
                </>
              )}

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                title={d.resetZoomPan}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
