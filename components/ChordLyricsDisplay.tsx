import React from 'react';

interface Props {
  lyrics?: string;
  chords?: string;
  notation?: string;
  lang?: string;
  showChords?: boolean;
}

const ChordLyricsDisplay: React.FC<Props> = ({
  lyrics,
  chords,
  notation,
  lang = 'fa',
  showChords = true
}) => {
  // استخراج آکوردهای درون‌خطی از متن (مثل [Em], [G], [F])
  const extractInlineChords = (text: string): { cleanLyrics: string; extractedChords: string } => {
    if (!text) return { cleanLyrics: '', extractedChords: '' };
    
    const chordPattern = /\[([A-G][#b]?m?\d?\/?\w*)\]/g;
    const chords: string[] = [];
    let cleanText = text;
    
    // استخراج تمام آکوردها
    const matches = text.matchAll(chordPattern);
    for (const match of matches) {
      if (!chords.includes(match[1])) {
        chords.push(match[1]);
      }
    }
    
    // حذف آکوردها از متن
    cleanText = text.replace(chordPattern, '');
    
    return {
      cleanLyrics: cleanText,
      extractedChords: chords.length > 0 ? chords.join('  ') : ''
    };
  };

  // پردازش متن برای نمایش آکوردها در بالای کلمات
  const parseChordLyrics = (text: string) => {
    if (!text) return [];
    
    const lines = text.split('\n');
    const result: Array<{ type: 'chord' | 'lyric' | 'empty'; content: string }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // خط خالی
      if (!line.trim()) {
        result.push({ type: 'empty', content: '' });
        continue;
      }
      
      // تشخیص خط آکورد (شامل حروف انگلیسی، #, b, m و فاصله)
      const isChordLine = /^[A-G#bm\/\s\d]+$/.test(line.trim()) && line.length < 80;
      
      if (isChordLine && showChords) {
        result.push({ type: 'chord', content: line });
      } else {
        result.push({ type: 'lyric', content: line });
      }
    }
    
    return result;
  };

  const parsedLines = React.useMemo(() => {
    return parseChordLyrics(lyrics || '');
  }, [lyrics, showChords]);

  // استخراج آکوردهای درون‌خطی
  const { cleanLyrics, extractedChords } = React.useMemo(() => {
    return extractInlineChords(lyrics || '');
  }, [lyrics]);

  // ترکیب آکوردها (از فیلدهای جداگانه + استخراج شده از متن)
  const allChords = React.useMemo(() => {
    const chordsArray: string[] = [];
    if (chords) chordsArray.push(chords);
    if (extractedChords) chordsArray.push(extractedChords);
    return chordsArray.join('\n\n');
  }, [chords, extractedChords]);

  if (!lyrics && !chords && !notation && !extractedChords) {
    return (
      <div className="text-center text-gray-400 py-8">
        {lang === 'fa' ? 'متن یا نوت موجود نیست' : 'No lyrics or notation available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* نمایش نوت‌های موسیقی (اگر جدا باشد) */}
      {notation && notation !== lyrics && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
          <h4 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            🎼 {lang === 'fa' ? 'نوت موسیقی' : 'Musical Notation'}
          </h4>
          <pre 
            className="whitespace-pre-wrap text-sm font-mono text-amber-200/80 leading-relaxed"
            dir="ltr"
          >
            {notation}
          </pre>
        </div>
      )}

      {/* نمایش آکوردها جداگانه (از فیلدهای جداگانه + استخراج شده از متن) */}
      {allChords && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
          <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
            🎸 {lang === 'fa' ? 'آکوردها' : 'Chords'}
          </h4>
          <pre 
            className="whitespace-pre-wrap text-sm font-mono text-blue-200/80 leading-relaxed"
            dir="ltr"
          >
            {allChords}
          </pre>
        </div>
      )}

      {/* نمایش متن پاک شده (بدون آکورد) */}
      {cleanLyrics && (
        <div className="bg-black/40 border border-gray-700 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 text-center">
            {lang === 'fa' ? 'متن سرود' : 'Lyrics'}
          </h4>
          <pre
            className="whitespace-pre-wrap text-gray-200 text-base leading-relaxed text-center"
            dir={lang === 'fa' ? 'rtl' : 'ltr'}
          >
            {cleanLyrics}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ChordLyricsDisplay;
