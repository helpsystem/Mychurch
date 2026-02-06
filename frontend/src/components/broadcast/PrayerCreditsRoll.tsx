/**
 * 🙏 Prayer Credits Roll Component
 * نمایش درخواست دعاها بصورت تیتراژ پایانی فیلم
 * از پایین به بالا با کنترل سرعت و دسته‌بندی
 */

import React, { useRef, useEffect, useState } from 'react';
import type { PrayerRequest, PrayerCreditsConfig } from './types';

interface PrayerCreditsRollProps {
  prayers: PrayerRequest[];
  config: PrayerCreditsConfig;
  onConfigChange?: (config: PrayerCreditsConfig) => void;
  lang: 'fa' | 'en';
  isEditing?: boolean; // حالت ویرایش در کنسول
}

// Category translations
const CATEGORY_LABELS: Record<string, { fa: string; en: string; emoji: string }> = {
  healing: { fa: 'شفا', en: 'Healing', emoji: '💚' },
  family: { fa: 'خانواده', en: 'Family', emoji: '👨‍👩‍👧‍👦' },
  work: { fa: 'کار و شغل', en: 'Work', emoji: '💼' },
  salvation: { fa: 'نجات', en: 'Salvation', emoji: '✝️' },
  guidance: { fa: 'هدایت', en: 'Guidance', emoji: '🧭' },
  peace: { fa: 'آرامش', en: 'Peace', emoji: '🕊️' },
  provision: { fa: 'تأمین نیازها', en: 'Provision', emoji: '🙌' },
  protection: { fa: 'محافظت', en: 'Protection', emoji: '🛡️' },
  thanksgiving: { fa: 'شکرگزاری', en: 'Thanksgiving', emoji: '🙏' },
  other: { fa: 'سایر', en: 'Other', emoji: '💭' }
};

// Sort prayers based on config
const sortPrayers = (prayers: PrayerRequest[], sortBy: PrayerCreditsConfig['sortBy']) => {
  const sorted = [...prayers];
  switch (sortBy) {
    case 'priority':
      return sorted.sort((a, b) => (a.priority || 5) - (b.priority || 5));
    case 'time':
      return sorted.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      });
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
};

// Group prayers by category
const groupByCategory = (prayers: PrayerRequest[]) => {
  const groups: Record<string, PrayerRequest[]> = {};
  prayers.forEach(prayer => {
    const cat = prayer.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(prayer);
  });
  return groups;
};

const PrayerCreditsRoll: React.FC<PrayerCreditsRollProps> = ({
  prayers,
  config,
  onConfigChange,
  lang,
  isEditing = false
}) => {
  const isRTL = lang === 'fa';
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Calculate animation duration based on speed (1-10)
  // Speed 1 = 60s, Speed 10 = 10s per loop
  const animationDuration = Math.max(10, 70 - (config.speed || 5) * 6);
  
  // Sort and potentially group prayers
  const sortedPrayers = sortPrayers(prayers, config.sortBy);
  const groupedPrayers = config.showCategory ? groupByCategory(sortedPrayers) : null;

  if (!config.enabled || prayers.length === 0) {
    return null;
  }

  // Render single prayer item
  const renderPrayerItem = (prayer: PrayerRequest, index: number) => {
    const category = CATEGORY_LABELS[prayer.category || 'other'] || CATEGORY_LABELS.other;
    const priorityColor = prayer.priority === 1 ? 'text-red-400' : 
                         prayer.priority === 2 ? 'text-orange-400' : 
                         prayer.priority === 3 ? 'text-yellow-400' : 'text-white';

    return (
      <div 
        key={prayer.id || index}
        className="text-center py-4 px-8"
      >
        {/* Name with priority indicator */}
        <div className={`text-2xl font-bold ${priorityColor} ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          {prayer.priority && prayer.priority <= 2 && '⭐ '}
          {prayer.name}
        </div>
        
        {/* Content */}
        <div className={`text-lg text-white/80 mt-2 max-w-2xl mx-auto ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          {prayer.content}
        </div>
        
        {/* Category badge (if not grouped) */}
        {!config.showCategory && (
          <div className="mt-2">
            <span className="text-sm px-3 py-1 bg-white/10 rounded-full text-white/60">
              {category.emoji} {isRTL ? category.fa : category.en}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render category header
  const renderCategoryHeader = (categoryKey: string) => {
    const category = CATEGORY_LABELS[categoryKey] || CATEGORY_LABELS.other;
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">{category.emoji}</div>
        <div className={`text-3xl font-bold text-amber-400 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          {isRTL ? category.fa : category.en}
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-4"></div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black/95 z-50 overflow-hidden flex flex-col"
      dir={isRTL ? 'rtl' : 'ltr'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="p-6 text-center bg-gradient-to-b from-purple-900/50 to-transparent">
        <h2 className={`text-4xl font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          🙏 {isRTL ? 'درخواست‌های دعا' : 'Prayer Requests'}
        </h2>
        <p className={`text-lg text-white/60 mt-2 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
          {isRTL ? 'با دعاهای شما همراه هستیم' : 'We are praying together with you'}
        </p>
      </div>

      {/* Scrolling Content */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-hidden relative"
      >
        <div 
          className={`absolute w-full ${isPaused ? '' : 'animate-creditsRoll'}`}
          style={{
            animationDuration: `${animationDuration}s`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {/* Top padding for initial appearance */}
          <div className="h-[50vh]"></div>

          {/* Prayers */}
          {groupedPrayers ? (
            // Grouped by category
            Object.entries(groupedPrayers).map(([cat, catPrayers]) => (
              <div key={cat}>
                {renderCategoryHeader(cat)}
                {catPrayers.map((prayer, idx) => renderPrayerItem(prayer, idx))}
                <div className="h-16"></div>
              </div>
            ))
          ) : (
            // Flat list
            sortedPrayers.map((prayer, idx) => renderPrayerItem(prayer, idx))
          )}

          {/* Bottom padding */}
          <div className="h-[100vh]"></div>
        </div>

        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none z-10"></div>
      </div>

      {/* Controls (only in editing mode) */}
      {isEditing && (
        <div className="p-4 bg-slate-900 border-t border-slate-700 flex items-center justify-center gap-6">
          {/* Speed Control */}
          <div className="flex items-center gap-3">
            <span className={`text-slate-400 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {isRTL ? 'سرعت:' : 'Speed:'}
            </span>
            <input
              type="range"
              min="1"
              max="10"
              value={config.speed}
              onChange={(e) => onConfigChange?.({ ...config, speed: parseInt(e.target.value) })}
              className="w-32 accent-purple-500"
            />
            <span className="text-white font-bold">{config.speed}</span>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-3">
            <span className={`text-slate-400 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {isRTL ? 'ترتیب:' : 'Sort:'}
            </span>
            <select
              value={config.sortBy}
              onChange={(e) => onConfigChange?.({ ...config, sortBy: e.target.value as any })}
              className="bg-slate-700 text-white px-3 py-1 rounded-lg text-sm"
            >
              <option value="priority">{isRTL ? 'اولویت' : 'Priority'}</option>
              <option value="time">{isRTL ? 'زمان' : 'Time'}</option>
              <option value="name">{isRTL ? 'نام' : 'Name'}</option>
            </select>
          </div>

          {/* Category Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showCategory}
              onChange={(e) => onConfigChange?.({ ...config, showCategory: e.target.checked })}
              className="accent-purple-500"
            />
            <span className={`text-slate-300 text-sm ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
              {isRTL ? 'دسته‌بندی' : 'Categories'}
            </span>
          </label>

          {/* Pause Indicator */}
          {isPaused && (
            <span className="text-yellow-400 text-sm animate-pulse">
              ⏸️ {isRTL ? 'متوقف شده' : 'Paused'}
            </span>
          )}
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes creditsRoll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-100%);
          }
        }
        
        .animate-creditsRoll {
          animation: creditsRoll linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PrayerCreditsRoll;
