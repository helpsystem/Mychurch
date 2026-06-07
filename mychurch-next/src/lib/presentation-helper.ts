import { query } from "@/lib/db";

const isValidUUID = (val: any): boolean => {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export function normalizeTimingData(data: any): any {
  if (!data) return null;

  // Case 1: Standard SystemTimingV2 format
  if (data.version && Array.isArray(data.lines)) {
    return data;
  }

  // Case 2: TranscriptData format
  if (Array.isArray(data.lines) && !data.version) {
    return {
      songId: data.songId || 0,
      version: "2.0",
      totalDuration: data.totalDuration || 0,
      lines: data.lines.map((l: any) => ({
        line: l.content || l.line || '',
        start: l.start !== undefined ? l.start : (l.words?.[0]?.start_time || 0),
        end: l.end !== undefined ? l.end : (l.words?.[l.words.length - 1]?.end_time || 0),
        translations: l.translations || {},
        words: (l.words || []).map((w: any) => ({
          word: w.word || '',
          start: w.start !== undefined ? w.start : (w.start_time || 0),
          end: w.end !== undefined ? w.end : (w.end_time || 0),
          finglish: w.finglish || null,
          english: w.english || null
        }))
      }))
    };
  }

  // Case 3: Flat array format
  if (Array.isArray(data)) {
    return {
      songId: 0,
      version: "2.0",
      totalDuration: 0,
      lines: data.map((l: any) => ({
        line: l.content || l.line || '',
        start: l.start !== undefined ? l.start : (l.words?.[0]?.start_time || 0),
        end: l.end !== undefined ? l.end : (l.words?.[l.words.length - 1]?.end_time || 0),
        translations: l.translations || {},
        words: (l.words || []).map((w: any) => ({
          word: w.word || '',
          start: w.start !== undefined ? w.start : (w.start_time || w.start || 0),
          end: w.end !== undefined ? w.end : (w.end_time || w.end || 0),
          finglish: w.finglish || null,
          english: w.english || null
        }))
      }))
    };
  }

  return null;
}

export function cleanLyrics(lyrics: string | undefined): string {
  if (!lyrics) return '';
  return lyrics.replace(/\[[\w#]+\]/g, '').trim();
}

export function parseLyrics(lyricsText: string): { text: string; isChorus: boolean; isVerse: boolean }[] {
  const lines = lyricsText.split('\n');
  const result: { text: string; isChorus: boolean; isVerse: boolean }[] = [];
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(V\d+|Verse|بند)/i.test(trimmed)) {
      currentSection = 'verse';
      continue;
    }
    if (/^(Chorus|Bridge|ریفرین|کروس|پل)/i.test(trimmed)) {
      currentSection = 'chorus';
      continue;
    }
    if (/^\[column\]$/i.test(trimmed)) {
      continue;
    }

    result.push({
      text: trimmed,
      isChorus: currentSection === 'chorus',
      isVerse: currentSection === 'verse' || currentSection === ''
    });
  }

  return result;
}

export async function mergeSlidesWithLatestSongData(slides: any[]): Promise<any[]> {
  if (!Array.isArray(slides)) return [];

  // Find all lyric slides with a valid UUID songId
  const lyricSlides = slides.filter(s => s?.type === 'LYRICS' && s?.content?.songId);
  const songIds = Array.from(new Set(
    lyricSlides
      .map(s => s.content.songId)
      .filter(isValidUUID)
  ));

  if (songIds.length === 0) {
    return slides;
  }

  try {
    const { rows } = await query(
      `SELECT id, title_fa, title_en, lyrics_fa, lyrics_en, lyrics_finglish, chords, timing_data, timepoints, audio_url 
       FROM church_worship_songs 
       WHERE id = ANY($1)`,
      [songIds]
    );

    const songMap = new Map<string, any>();
    for (const row of rows) {
      songMap.set(row.id, row);
    }

    return slides.map(slide => {
      if (slide?.type !== 'LYRICS' || !slide?.content?.songId) {
        return slide;
      }

      const songId = slide.content.songId;
      if (!isValidUUID(songId)) {
        return slide;
      }

      const song = songMap.get(songId);
      if (!song) {
        return slide;
      }

      const dbTiming = typeof song.timing_data === 'string'
        ? JSON.parse(song.timing_data)
        : song.timing_data;
      const timingData = normalizeTimingData(dbTiming);

      const rawLyrics = song.lyrics_fa || '';
      const lines = parseLyrics(cleanLyrics(rawLyrics));

      const lyricsEnLines = song.lyrics_en
        ? parseLyrics(song.lyrics_en).map((l: any) => l.text)
        : undefined;

      let finglishLines: string[] | undefined = undefined;
      if (song.lyrics_finglish && typeof song.lyrics_finglish === 'string' && song.lyrics_finglish.trim()) {
        finglishLines = song.lyrics_finglish.split('\n').filter(Boolean);
      } else if (timingData?.lines) {
        finglishLines = timingData.lines.map((l: any) =>
          l.translations?.finglish || l.words?.map((w: any) => w.finglish || w.word).join(' ')
        );
      }

      let persianTranslationLines: string[] | undefined = undefined;
      if (timingData?.lines) {
        persianTranslationLines = timingData.lines.map((l: any) => l.translations?.persian);
      }

      return {
        ...slide,
        content: {
          ...slide.content,
          titleFa: song.title_fa,
          titleEn: song.title_en || undefined,
          lines: lines.length > 0 ? lines : slide.content.lines,
          lyricsEnLines: lyricsEnLines || slide.content.lyricsEnLines,
          chords: song.chords || slide.content.chords,
          audioUrl: song.audio_url || slide.content.audioUrl,
          hasTiming: !!(song.timing_data || (song.timepoints && Array.isArray(song.timepoints) && song.timepoints.length > 0)),
          timingData: timingData || slide.content.timingData,
          finglishLines: finglishLines || slide.content.finglishLines,
          persianTranslationLines: persianTranslationLines || slide.content.persianTranslationLines,
        }
      };
    });
  } catch (error) {
    console.error('[Presentation Helper] Error merging song data:', error);
    return slides;
  }
}
