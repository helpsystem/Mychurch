/**
 * Bible Karaoke - Verse Line Component
 * 
 * Displays a single verse with word-by-word highlighting
 * synchronized to audio playback time.
 */

import React from 'react';
import type { BibleVerse } from '@/lib/bibleKaraokeTypes';

interface VerseLineProps {
  verse: BibleVerse;
  currentTime: number;
  isActive?: boolean;
  lang?: 'en' | 'fa';
}

const VerseLine: React.FC<VerseLineProps> = ({ 
  verse, 
  currentTime, 
  isActive = false,
  lang = 'en'
}) => {
  const timings = verse.timings ?? [];
  const isRTL = lang === 'fa';

  return (
    <p 
      className={`
        karaoke-verse 
        text-lg leading-8 my-3 px-2 py-1 rounded-lg
        transition-all duration-200
        ${isActive ? 'bg-amber-50/30 scale-105' : ''}
        ${isRTL ? 'text-right' : 'text-left'}
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <sup className="opacity-60 mr-1 ml-1 text-sm font-bold text-amber-600">
        {verse.verse}
      </sup>
      
      {timings.length > 0 ? (
        // Word-by-word highlighting
        timings.map((w, i) => {
          const isHighlighted = currentTime >= w.start && currentTime < w.end;
          
          return (
            <span
              key={i}
              className={`
                karaoke-word 
                transition-all duration-150 ease-out
                inline-block px-1 rounded
                ${isHighlighted 
                  ? 'bg-amber-300 text-gray-900 font-semibold shadow-sm scale-110' 
                  : 'text-gray-800'
                }
              `}
              data-start={w.start}
              data-end={w.end}
            >
              {w.word}
              {' '}
            </span>
          );
        })
      ) : (
        // Fallback: show plain text if no timings
        <span className="text-gray-700">{verse.text}</span>
      )}
    </p>
  );
};

export default VerseLine;
