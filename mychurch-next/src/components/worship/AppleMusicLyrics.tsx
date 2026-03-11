"use client";

import React, { useMemo } from 'react';
import { LyricPlayer } from '@applemusic-like-lyrics/react';
import type { LyricLine, LyricWord } from '@applemusic-like-lyrics/core';
import '@applemusic-like-lyrics/core/style.css';

export interface Timepoint {
    word: string;   // The database stores it as 'word' from gemini
    text?: string;  // Fallback
    start?: number; // DB uses start_time
    start_time?: number;
    end?: number;   // DB uses end_time
    end_time?: number;
}

interface AppleMusicLyricsProps {
    timepoints: Timepoint[];
    currentTimeMs: number;
    className?: string;
}

/**
 * Converts our Timepoint[] JSON array into the specific LyricLine[] required
 * by the @applemusic-like-lyrics/core engine.
 * Groups words into lines based on pauses.
 */
function buildLyricLines(timepoints: Timepoint[]): LyricLine[] {
    if (!timepoints || timepoints.length === 0) return [];

    const lines: LyricLine[] = [];
    let currentWords: LyricWord[] = [];

    for (let i = 0; i < timepoints.length; i++) {
        const tp = timepoints[i];
        const text = tp.word || tp.text || '';
        const start = tp.start_time ?? tp.start ?? 0;
        const end = tp.end_time ?? tp.end ?? 0;

        const word: LyricWord = {
            startTime: start * 1000, // core expects ms
            endTime: end * 1000,
            word: text + ' ', // Add space for language rendering
            romanWord: '',
            obscene: false
        };
        currentWords.push(word);

        const nextTp = timepoints[i + 1];
        const nextStart = nextTp ? (nextTp.start_time ?? nextTp.start ?? 0) : 0;

        // Break line if there's a pause > 0.8s, or if we hit 7 words, or end of array
        if (!nextTp || (nextStart - end > 0.8) || currentWords.length >= 7) {
            lines.push({
                words: currentWords,
                startTime: currentWords[0].startTime,
                endTime: currentWords[currentWords.length - 1].endTime,
                translatedLyric: '',
                romanLyric: '',
                isBG: false,
                isDuet: false
            });
            currentWords = [];
        }
    }
    return lines;
}

export function AppleMusicLyrics({ timepoints, currentTimeMs, className = "" }: AppleMusicLyricsProps) {
    const lyricLines = useMemo(() => buildLyricLines(timepoints), [timepoints]);

    if (!timepoints || timepoints.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full w-full text-white/50 text-2xl font-bold italic ${className}`} dir="rtl">
                متن و تایمینگ برای این سرود ثبت نشده است.
            </div>
        );
    }

    return (
        <div className={`w-full h-full relative overflow-hidden ${className}`} dir="rtl">
            <LyricPlayer
                lyricLines={lyricLines}
                currentTime={currentTimeMs}
                alignAnchor="center"
                enableBlur={true}
                enableScale={true}
                enableSpring={true}
            />

            {/* Custom CSS to inject the Vazirmatn font to the lyric engine */}
            <style dangerouslySetInnerHTML={{
                __html: `
            .amll-lyric-line {
                font-family: var(--font-vazirmatn), sans-serif !important;
                font-weight: 800 !important;
                text-align: center !important;
                /* direction: rtl !important; removed per user request to keep player standard LTR */
            }
        `}} />
        </div>
    );
}
