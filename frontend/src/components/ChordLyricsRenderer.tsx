/**
 * ChordLyricsRenderer Component
 * Displays lyrics with chords positioned above the corresponding words
 * Supports RTL (Persian) and LTR (English) text
 */

import React from 'react';

interface ChordLyricsRendererProps {
    lyrics: string;
    showChords?: boolean;
    lang?: 'fa' | 'en';
    fontSize?: 'sm' | 'md' | 'lg' | 'xl';
    chordColor?: string;
    textColor?: string;
}

interface ParsedWord {
    text: string;
    chord?: string;
}

interface ParsedLine {
    words: ParsedWord[];
    isEmpty: boolean;
    isMarker: boolean;
    marker?: string;
}

// Parse a line of lyrics and extract inline chords
const parseLine = (line: string): ParsedLine => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
        return { words: [], isEmpty: true, isMarker: false };
    }

    // Check if it's a verse/chorus marker
    const markerMatch = trimmed.match(/^(V\d+|Chorus\d*|Bridge|Intro|Outro|Verse\s*\d*)$/i);
    if (markerMatch) {
        return { words: [], isEmpty: false, isMarker: true, marker: markerMatch[1] };
    }

    // Check if it's a chord-only line
    const isChordOnly = /^[A-G#bm\/\s\d\[\]]+$/.test(trimmed);
    if (isChordOnly) {
        return { words: [], isEmpty: true, isMarker: false };
    }

    // Parse inline chords in format [Chord]word or [Chord] word
    const words: ParsedWord[] = [];

    // Regex to match either [Chord]word or standalone word
    // Pattern: optional chord bracket followed by word characters
    const regex = /(\[[A-G][#b]?m?\d?[\/]?[A-G]?[#b]?m?\d?\])?\s*([^\[\]\s]+)/g;

    let match;
    while ((match = regex.exec(trimmed)) !== null) {
        const chord = match[1] ? match[1].replace(/[\[\]]/g, '') : undefined;
        const text = match[2];

        if (text) {
            words.push({ text, chord });
        }
    }

    return { words, isEmpty: words.length === 0, isMarker: false };
};

// Parse entire lyrics
const parseLyrics = (lyrics: string | null | undefined): ParsedLine[] => {
    if (!lyrics) return [];
    return lyrics.split('\n').map(parseLine);
};

const ChordLyricsRenderer: React.FC<ChordLyricsRendererProps> = ({
    lyrics,
    showChords = true,
    lang = 'fa',
    fontSize = 'lg',
    chordColor = '#fbbf24', // Amber
    textColor = '#f3f4f6', // Gray-100
}) => {
    const isRtl = lang === 'fa';
    const parsedLines = React.useMemo(() => parseLyrics(lyrics || ''), [lyrics]);

    const fontSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
    };

    const chordFontSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
    };

    return (
        <div
            className={`w-full ${fontSizeClasses[fontSize]}`}
            dir={isRtl ? 'rtl' : 'ltr'}
            style={{ fontFamily: isRtl ? 'Vazir, system-ui, sans-serif' : 'inherit' }}
        >
            {parsedLines.map((line, lineIndex) => {
                // Empty line - render as spacing
                if (line.isEmpty) {
                    return <div key={lineIndex} className="h-4" />;
                }

                // Verse/Chorus marker
                if (line.isMarker) {
                    return (
                        <div
                            key={lineIndex}
                            className="text-center py-2 font-bold text-purple-400 opacity-70"
                        >
                            {line.marker}
                        </div>
                    );
                }

                // Regular line with words and optional chords
                return (
                    <div
                        key={lineIndex}
                        className="flex flex-wrap justify-center items-end gap-2 mb-3"
                    >
                        {line.words.map((word, wordIndex) => (
                            <div
                                key={wordIndex}
                                className="relative inline-block text-center"
                            >
                                {/* Chord above word */}
                                {showChords && word.chord && (
                                    <div
                                        className={`absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap font-mono font-bold ${chordFontSizeClasses[fontSize]}`}
                                        style={{ color: chordColor }}
                                    >
                                        {word.chord}
                                    </div>
                                )}

                                {/* Word text */}
                                <span style={{ color: textColor }}>
                                    {word.text}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

export default ChordLyricsRenderer;
