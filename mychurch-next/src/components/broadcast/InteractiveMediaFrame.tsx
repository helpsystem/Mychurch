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
  Pause
} from 'lucide-react';
import { MediaDisplayConfig } from '@/types/broadcast';

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
  showToolbarByDefault = false
}: InteractiveMediaFrameProps) {
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

        {type === 'video' && (
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
      </div>

      {/* Interactive Controls Overlay for Editable Mode */}
      {isEditable && (
        <>
          {/* Header Action / Quick Toggle */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto z-30">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-white text-[11px] shadow-lg">
              <Move className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span className="font-[Vazirmatn]">
                {isRTL ? 'درگ برای جابجایی کادر' : 'Drag to pan'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono px-1 bg-white/10 rounded">
                {Math.round(scale * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowToolbar(!showToolbar);
              }}
              title={isRTL ? 'تنظیمات کادر و زوم' : 'Frame Controls'}
              className="p-1.5 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/10 text-slate-200 hover:text-white shadow-lg transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
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
                title={isRTL ? 'کوچک‌نمایی' : 'Zoom Out'}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Slider */}
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={scale}
                onChange={(e) => handleZoomSlider(parseFloat(e.target.value))}
                className="w-16 sm:w-20 accent-indigo-500 cursor-pointer"
                title={`Zoom: ${Math.round(scale * 100)}%`}
              />

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => handleZoom(0.1)}
                title={isRTL ? 'بزرگ‌نمایی' : 'Zoom In'}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-white/20" />

              {/* Fit Modes */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleFitChange('contain')}
                  title={isRTL ? 'کامل (Contain)' : 'Contain'}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    objectFit === 'contain'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {isRTL ? 'کامل' : 'Contain'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFitChange('cover')}
                  title={isRTL ? 'پر کردن کادر (Cover)' : 'Cover'}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    objectFit === 'cover'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {isRTL ? 'کاور' : 'Cover'}
                </button>
                <button
                  type="button"
                  onClick={() => handleFitChange('fill')}
                  title={isRTL ? 'کشیده (Fill)' : 'Fill'}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    objectFit === 'fill'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'hover:bg-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {isRTL ? 'کشیده' : 'Fill'}
                </button>
              </div>

              <div className="w-[1px] h-4 bg-white/20" />

              {/* Video specific controls if video */}
              {type === 'video' && (
                <>
                  <button
                    type="button"
                    onClick={togglePlay}
                    title={isPlaying ? 'Pause' : 'Play'}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <div className="w-[1px] h-4 bg-white/20" />
                </>
              )}

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                title={isRTL ? 'بازنشانی کادر و زوم' : 'Reset Zoom & Pan'}
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
