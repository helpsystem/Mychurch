// pages/BibleAudioSync DemoPage.tsx
// Demo page for Audio-Text Synchronization System

import React from 'react';
import { BibleAudioTextSync } from '../components/BibleAudioTextSync';
import { TranscriptData } from '../hooks/useAudioTextSync';

// Sample data for Ephesians 1:15-23 (English)
const sampleTranscriptEn: TranscriptData = {
  verses: [
    {
      verse: 15,
      words: [
        { word: 'For', start: 0.00, end: 0.25, index: 0 },
        { word: 'this', start: 0.26, end: 0.45, index: 1 },
        { word: 'reason,', start: 0.46, end: 0.85, index: 2 },
        { word: 'ever', start: 0.90, end: 1.15, index: 3 },
        { word: 'since', start: 1.16, end: 1.45, index: 4 },
        { word: 'I', start: 1.50, end: 1.65, index: 5 },
        { word: 'heard', start: 1.66, end: 1.95, index: 6 },
        { word: 'about', start: 2.00, end: 2.35, index: 7 },
        { word: 'your', start: 2.40, end: 2.65, index: 8 },
        { word: 'faith', start: 2.70, end: 3.05, index: 9 },
        { word: 'in', start: 3.10, end: 3.25, index: 10 },
        { word: 'the', start: 3.26, end: 3.40, index: 11 },
        { word: 'Lord', start: 3.45, end: 3.75, index: 12 },
        { word: 'Jesus', start: 3.80, end: 4.20, index: 13 },
        { word: 'and', start: 4.25, end: 4.45, index: 14 },
        { word: 'your', start: 4.50, end: 4.75, index: 15 },
        { word: 'love', start: 4.80, end: 5.10, index: 16 },
        { word: 'for', start: 5.15, end: 5.35, index: 17 },
        { word: 'all', start: 5.40, end: 5.65, index: 18 },
        { word: "God's", start: 5.70, end: 6.05, index: 19 },
        { word: 'people,', start: 6.10, end: 6.55, index: 20 },
      ],
      totalDuration: 6.55
    },
    {
      verse: 16,
      words: [
        { word: 'I', start: 7.00, end: 7.15, index: 21 },
        { word: 'have', start: 7.20, end: 7.40, index: 22 },
        { word: 'not', start: 7.45, end: 7.65, index: 23 },
        { word: 'stopped', start: 7.70, end: 8.10, index: 24 },
        { word: 'giving', start: 8.15, end: 8.50, index: 25 },
        { word: 'thanks', start: 8.55, end: 8.95, index: 26 },
        { word: 'for', start: 9.00, end: 9.20, index: 27 },
        { word: 'you,', start: 9.25, end: 9.50, index: 28 },
        { word: 'remembering', start: 9.55, end: 10.20, index: 29 },
        { word: 'you', start: 10.25, end: 10.45, index: 30 },
        { word: 'in', start: 10.50, end: 10.65, index: 31 },
        { word: 'my', start: 10.70, end: 10.90, index: 32 },
        { word: 'prayers.', start: 10.95, end: 11.45, index: 33 },
      ],
      totalDuration: 11.45
    },
  ],
  language: 'en',
  metadata: {
    book: 'Ephesians',
    chapter: 1,
    totalVerses: 2
  }
};

// Sample data for Ephesians 1:15-16 (Persian)
const sampleTranscriptFa: TranscriptData = {
  verses: [
    {
      verse: 15,
      words: [
        { word: 'از', start: 0.00, end: 0.20, index: 0 },
        { word: 'آن', start: 0.25, end: 0.45, index: 1 },
        { word: 'جهت', start: 0.50, end: 0.80, index: 2 },
        { word: 'که', start: 0.85, end: 1.05, index: 3 },
        { word: 'چون', start: 1.10, end: 1.40, index: 4 },
        { word: 'خبر', start: 1.45, end: 1.75, index: 5 },
        { word: 'ایمان', start: 1.80, end: 2.20, index: 6 },
        { word: 'شما', start: 2.25, end: 2.50, index: 7 },
        { word: 'را', start: 2.55, end: 2.70, index: 8 },
        { word: 'به', start: 2.75, end: 2.90, index: 9 },
        { word: 'خداوند', start: 2.95, end: 3.45, index: 10 },
        { word: 'عیسی', start: 3.50, end: 3.90, index: 11 },
        { word: 'و', start: 3.95, end: 4.10, index: 12 },
        { word: 'محبت', start: 4.15, end: 4.55, index: 13 },
        { word: 'شما', start: 4.60, end: 4.85, index: 14 },
        { word: 'را', start: 4.90, end: 5.05, index: 15 },
        { word: 'به', start: 5.10, end: 5.25, index: 16 },
        { word: 'همه', start: 5.30, end: 5.60, index: 17 },
        { word: 'مقدسین', start: 5.65, end: 6.15, index: 18 },
        { word: 'شنیدم،', start: 6.20, end: 6.70, index: 19 },
      ],
      totalDuration: 6.70
    },
    {
      verse: 16,
      words: [
        { word: 'از', start: 7.20, end: 7.40, index: 20 },
        { word: 'شکرگزاری', start: 7.45, end: 8.10, index: 21 },
        { word: 'برای', start: 8.15, end: 8.45, index: 22 },
        { word: 'شما', start: 8.50, end: 8.75, index: 23 },
        { word: 'خسته', start: 8.80, end: 9.20, index: 24 },
        { word: 'نمی‌شوم', start: 9.25, end: 9.75, index: 25 },
        { word: 'و', start: 9.80, end: 9.95, index: 26 },
        { word: 'در', start: 10.00, end: 10.20, index: 27 },
        { word: 'دعاهای', start: 10.25, end: 10.75, index: 28 },
        { word: 'خود', start: 10.80, end: 11.10, index: 29 },
        { word: 'همیشه', start: 11.15, end: 11.60, index: 30 },
        { word: 'شما', start: 11.65, end: 11.90, index: 31 },
        { word: 'را', start: 11.95, end: 12.10, index: 32 },
        { word: 'یاد', start: 12.15, end: 12.40, index: 33 },
        { word: 'می‌کنم.', start: 12.45, end: 12.90, index: 34 },
      ],
      totalDuration: 12.90
    },
  ],
  language: 'fa',
  metadata: {
    book: 'افسسیان',
    chapter: 1,
    totalVerses: 2
  }
};

const BibleAudioSyncDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎧 Bible Audio-Text Sync System
          </h1>
          <p className="text-xl text-blue-200 mb-8">
            Advanced Word-Level Synchronization for English & Persian
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-left">
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">⚡ Real-Time Sync</h3>
              <p className="text-white">
                Word-level highlighting with millisecond precision using Web Audio API
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-left">
              <h3 className="text-2xl font-bold text-green-400 mb-3">🌍 Bilingual Support</h3>
              <p className="text-white">
                English (LTR) and Persian (RTL) with independent or synchronized playback
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 text-left">
              <h3 className="text-2xl font-bold text-purple-400 mb-3">🎯 Smart Alignment</h3>
              <p className="text-white">
                Whisper AI, forced alignment, or synthetic timing generation
              </p>
            </div>
          </div>
        </div>

        {/* Demo Component */}
        <BibleAudioTextSync
          audioUrl="/audio/bible/sample/ephesians_1_15-16.mp3"
          transcriptEn={sampleTranscriptEn}
          transcriptFa={sampleTranscriptFa}
          bookName="Ephesians"
          chapter={1}
          className="mb-12"
        />
        
        {/* Note about audio */}
        <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-yellow-400 mb-3">⚠️ Note / توجه</h3>
          <p className="text-white mb-2">
            <strong>English:</strong> This is a demo with sample data. The audio file uses synthetic timing estimates. 
            For production, use Whisper or forced alignment for precise word-level synchronization.
          </p>
          <p className="text-white" dir="rtl">
            <strong>فارسی:</strong> این یک نسخه نمایشی با داده‌های نمونه است. فایل صوتی از زمان‌بندی تخمینی استفاده می‌کند.
            برای محیط واقعی، از Whisper یا forced alignment برای همگام‌سازی دقیق استفاده کنید.
          </p>
        </div>

        {/* Documentation Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">📚 System Documentation</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-blue-400 mb-3">1. Audio File Requirements</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Format: MP3, WAV, or OGG</li>
                <li>Sample Rate: 16kHz or higher (44.1kHz recommended)</li>
                <li>Mono or Stereo (Mono preferred for speech)</li>
                <li>Clear speech without background music</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-green-400 mb-3">2. Generating Alignment Data</h3>
              <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <p className="text-gray-300"># Using Whisper (automatic transcription)</p>
                <p className="text-yellow-300">
                  python scripts/bible_audio_aligner.py \<br/>
                  &nbsp;&nbsp;--audio D:\BibleAudio\English\Ephesians_1_15.mp3 \<br/>
                  &nbsp;&nbsp;--text verses.json \<br/>
                  &nbsp;&nbsp;--output ephesians_1_alignment.json \<br/>
                  &nbsp;&nbsp;--language en \<br/>
                  &nbsp;&nbsp;--book Ephesians \<br/>
                  &nbsp;&nbsp;--chapter 1
                </p>
                
                <p className="text-gray-300 mt-4"># Using forced alignment (with transcript)</p>
                <p className="text-yellow-300">
                  python scripts/bible_audio_aligner.py \<br/>
                  &nbsp;&nbsp;--audio D:\BibleAudio\Farsi\Ephesians_1_15.mp3 \<br/>
                  &nbsp;&nbsp;--text transcript.txt \<br/>
                  &nbsp;&nbsp;--output ephesians_1_fa_alignment.json \<br/>
                  &nbsp;&nbsp;--language fa \<br/>
                  &nbsp;&nbsp;--method forced
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-purple-400 mb-3">3. React Hook Usage</h3>
              <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-green-300">{`import { useAudioTextSync } from '@/hooks/useAudioTextSync';

const MyComponent = () => {
  const {
    isPlaying,
    currentWordIndex,
    currentWord,
    play,
    pause,
    audioRef
  } = useAudioTextSync({
    audioUrl: '/audio/verse.mp3',
    transcript: transcriptData,
    mode: 'word',
    onWordChange: (word) => {
      console.log('Current word:', word);
    }
  });

  return (
    <div>
      {transcript.verses.map((verse) => (
        <div key={verse.verse}>
          {verse.words.map((w, i) => (
            <span
              className={i === currentWordIndex ? 'highlight' : ''}
            >
              {w.word}
            </span>
          ))}
        </div>
      ))}
      <audio ref={audioRef} />
    </div>
  );
};`}</pre>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-yellow-400 mb-3">4. JSON Format Example</h3>
              <div className="bg-gray-900/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-blue-300">{`{
  "verses": [
    {
      "verse": 15,
      "words": [
        {
          "word": "For",
          "start": 0.00,
          "end": 0.25,
          "index": 0
        },
        {
          "word": "this",
          "start": 0.26,
          "end": 0.45,
          "index": 1
        }
      ],
      "totalDuration": 6.55
    }
  ],
  "language": "en",
  "metadata": {
    "book": "Ephesians",
    "chapter": 1,
    "totalVerses": 2
  }
}`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/60">
          <p>Built with React, TypeScript, TailwindCSS, and Web Audio API</p>
          <p className="mt-2">Supports Whisper, Aeneas, and Synthetic Alignment</p>
        </div>
      </div>
    </div>
  );
};

export default BibleAudioSyncDemoPage;
