'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, FileVideo, ImageIcon, Music, CheckCircle2, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

const localDict = {
  en: {
    previewLabel: 'Spotlight Accordion Preview',
    previous: 'Previous',
    next: 'Next',
    image: 'Image',
    video: 'Video',
    select: 'Select',
  },
  fa: {
    previewLabel: 'پیش‌نمایش آکاردئونی فریم‌ها (Spotlight Frames)',
    previous: 'قبلی',
    next: 'بعدی',
    image: 'عکس',
    video: 'ویدیو',
    select: 'انتخاب',
  },
  es: {
    previewLabel: 'Vista previa en acordeón (Spotlight Frames)',
    previous: 'Anterior',
    next: 'Siguiente',
    image: 'Imagen',
    video: 'Video',
    select: 'Seleccionar',
  },
};

export interface AccordionMediaItem {
  url: string;
  name: string;
  type: 'image' | 'video' | 'audio' | string;
  size?: number;
  isExternalLink?: boolean;
}

interface AccordionMediaPreviewProps {
  items: AccordionMediaItem[];
  selectedUrl?: string;
  onSelect?: (item: AccordionMediaItem) => void;
  height?: number;
  isRTL?: boolean;
  className?: string;
  maxVisiblePanels?: number;
}

const PANEL_WIDTH_COLLAPSED = 36;
const PANEL_WIDTH_EXPANDED_DEFAULT = 420;
const PANEL_WIDTH_EXPANDED_MOBILE = 220;
const PANEL_GAP = 6;
const BREAKPOINT_MOBILE = 768;

export default function AccordionMediaPreview({
  items,
  selectedUrl,
  onSelect,
  height = 360,
  isRTL = true,
  className = '',
  maxVisiblePanels = 18,
}: AccordionMediaPreviewProps) {
  const { language } = useLanguage();
  const d = localDict[language] || localDict.fa;
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Filter items to maxVisiblePanels or display slice
  const displayItems = items.slice(0, maxVisiblePanels);
  const totalCount = displayItems.length;

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setTrackWidth(entry.contentRect.width);
        setIsMobile(window.innerWidth < BREAKPOINT_MOBILE);
      }
    });
    if (trackRef.current) observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync focused index if selectedUrl matches an item
  useEffect(() => {
    if (!selectedUrl) return;
    const foundIdx = displayItems.findIndex((it) => it.url === selectedUrl);
    if (foundIdx !== -1) {
      setFocusedIndex(foundIdx);
    }
  }, [selectedUrl, displayItems]);

  const expandedWidth = isMobile
    ? Math.min(trackWidth * 0.7, PANEL_WIDTH_EXPANDED_MOBILE)
    : Math.min(trackWidth * 0.55, PANEL_WIDTH_EXPANDED_DEFAULT);

  // Calculate panel position like the original spotlight component
  const getPanelPosition = useCallback(
    (panelIndex: number) => {
      if (totalCount === 0) return { left: 0, width: 0 };

      const totalTrackWidth =
        (totalCount - 1) * (PANEL_WIDTH_COLLAPSED + PANEL_GAP) + expandedWidth;
      const offsetToCenter = Math.max(0, (trackWidth - totalTrackWidth) / 2);

      let left = offsetToCenter;
      for (let i = 0; i < panelIndex; i++) {
        const w = i === focusedIndex ? expandedWidth : PANEL_WIDTH_COLLAPSED;
        left += w + PANEL_GAP;
      }

      const width = panelIndex === focusedIndex ? expandedWidth : PANEL_WIDTH_COLLAPSED;
      return { left, width };
    },
    [focusedIndex, totalCount, expandedWidth, trackWidth]
  );

  const getFocusIndicatorPosition = useCallback(() => {
    return getPanelPosition(focusedIndex);
  }, [focusedIndex, getPanelPosition]);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div
      className={`relative w-full rounded-2xl bg-slate-950/90 border border-indigo-500/20 shadow-2xl p-4 overflow-hidden ${className}`}
      dir="ltr"
    >
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <span className="text-xs font-bold text-indigo-300 font-[Vazirmatn]">
            {d.previewLabel}
          </span>
          <span className="text-[11px] text-slate-400 font-mono bg-white/5 px-2 py-0.5 rounded-md">
            {focusedIndex + 1} / {totalCount}
          </span>
        </div>

        {/* Quick Prev / Next Buttons */}
        <div className="flex items-center gap-1.5" dir="ltr">
          <button
            type="button"
            onClick={() => setFocusedIndex((prev) => Math.max(0, prev - 1))}
            disabled={focusedIndex === 0}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors"
            title={d.previous}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setFocusedIndex((prev) => Math.min(totalCount - 1, prev + 1))}
            disabled={focusedIndex === totalCount - 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors"
            title={d.next}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Accordion Stage Track */}
      <div
        ref={trackRef}
        style={{ height: `${height}px` }}
        className="relative w-full overflow-x-auto overflow-y-hidden select-none py-1"
      >
        <div
          className="relative h-full"
          style={{
            minWidth: `${(totalCount - 1) * (PANEL_WIDTH_COLLAPSED + PANEL_GAP) + expandedWidth + 40}px`,
          }}
        >
          {/* Spotlight Focus Indicator Frame */}
          <div
            className="absolute top-0 h-full border-2 border-indigo-400 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.45)] pointer-events-none z-30 transition-all duration-700 ease-[cubic-bezier(0.075,0.82,0.165,1)]"
            style={getFocusIndicatorPosition()}
          />

          {/* Panels */}
          {displayItems.map((item, idx) => {
            const isFocused = idx === focusedIndex;
            const pos = getPanelPosition(idx);

            return (
              <div
                key={item.url + idx}
                style={{
                  left: `${pos.left}px`,
                  width: `${pos.width}px`,
                  transition: 'all 0.7s cubic-bezier(0.075, 0.82, 0.165, 1)',
                }}
                className={`absolute top-0 h-full rounded-xl overflow-hidden cursor-pointer bg-slate-900 border ${
                  isFocused ? 'border-transparent z-20 shadow-2xl' : 'border-white/10 hover:border-indigo-400/50 z-10'
                }`}
                onMouseEnter={!isMobile ? () => setFocusedIndex(idx) : undefined}
                onClick={() => {
                  setFocusedIndex(idx);
                  if (onSelect) onSelect(item);
                }}
              >
                {/* Media Content */}
                <div className="relative w-full h-full bg-black/90 flex items-center justify-center overflow-hidden">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      crossOrigin="anonymous"
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 hover:scale-105"
                    />
                  ) : item.type === 'video' ? (
                    <>
                      <video
                        src={item.url}
                        autoPlay={isFocused}
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      />
                      {!isFocused && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                          <Play className="w-5 h-5 text-white/80" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-purple-400 p-2">
                      <Music className="w-8 h-8 animate-pulse" />
                    </div>
                  )}

                  {/* Glass Label when Expanded */}
                  {isFocused && (
                    <div
                      className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6 z-30 flex items-center justify-between text-white"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold truncate text-white" dir="ltr">
                          {item.name}
                        </p>
                        <span className="text-[10px] text-slate-300 capitalize font-mono">
                          {item.type === 'image' ? d.image : item.type === 'video' ? d.video : item.type}
                        </span>
                      </div>

                      {onSelect && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(item);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-colors font-[Vazirmatn]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{d.select}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Collapsed Tag */}
                  {!isFocused && (
                    <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
                      {item.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-slate-400" />}
                      {item.type === 'video' && <FileVideo className="w-3.5 h-3.5 text-blue-400" />}
                      {item.type === 'audio' && <Music className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
