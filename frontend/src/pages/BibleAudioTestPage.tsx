// pages/BibleAudioTestPage.tsx
// Test page for real Bible audio files with automatic alignment

import React, { useState, useEffect } from 'react';
import { BibleAudioTextSync } from '../components/BibleAudioTextSync';
import { TranscriptData } from '../hooks/useAudioTextSync';

const BibleAudioTestPage: React.FC = () => {
  const [alignmentEn, setAlignmentEn] = useState<TranscriptData | null>(null);
  const [alignmentFa, setAlignmentFa] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load alignment data for Genesis 1
    const loadAlignments = async () => {
      try {
        setLoading(true);
        
        // Load English alignment (Vite serves from public/ automatically)
        const responseEn = await fetch('data/alignments/GEN_1_en_alignment.json');
        if (responseEn.ok) {
          const dataEn = await responseEn.json();
          setAlignmentEn(dataEn);
        } else {
          throw new Error('English alignment not found');
        }
        
        // Load Persian alignment
        const responseFa = await fetch('data/alignments/GEN_1_fa_alignment.json');
        if (responseFa.ok) {
          const dataFa = await responseFa.json();
          setAlignmentFa(dataFa);
        } else {
          throw new Error('Persian alignment not found');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading alignments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load alignment data');
        setLoading(false);
      }
    };

    loadAlignments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading alignment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-8 max-w-2xl">
          <h2 className="text-3xl font-bold text-red-400 mb-4">❌ Error Loading Data</h2>
          <p className="text-white text-lg mb-4">{error}</p>
          <p className="text-gray-300">
            Make sure the background audio generator has created the alignment files for Genesis Chapter 1.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!alignmentEn || !alignmentFa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">No alignment data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎧 Real Bible Audio Test
          </h1>
          <p className="text-xl text-blue-200 mb-4">
            Genesis Chapter 1 - Automatically Generated with Edge TTS
          </p>
          
          <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-6 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-green-400 mb-3">✅ Using Real Generated Files</h3>
            <p className="text-white mb-2">
              <strong>Audio Source:</strong> Background Audio Generator (Microsoft Edge TTS)
            </p>
            <p className="text-white mb-2">
              <strong>Alignment Method:</strong> {alignmentEn.metadata?.method || 'Synthetic'}
            </p>
            <p className="text-white">
              <strong>Quality:</strong> High-quality natural-sounding speech with word-level timing
            </p>
          </div>
        </div>

        {/* Audio Player Component */}
        <BibleAudioTextSync
          audioUrl="audio/bible/auto-generated/GEN_1_en.mp3"
          transcriptEn={alignmentEn}
          transcriptFa={alignmentFa}
          bookName="Genesis"
          chapter={1}
          className="mb-12"
        />

        {/* Info Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">📊 Generation Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-2xl font-semibold text-blue-400 mb-3">English Audio</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Voice: en-US-GuyNeural</li>
                <li>Words: {alignmentEn.verses.reduce((sum, v) => sum + v.words.length, 0)}</li>
                <li>Duration: {alignmentEn.verses.reduce((sum, v) => sum + (v.totalDuration || 0), 0).toFixed(1)}s</li>
                <li>Method: {alignmentEn.metadata?.method || 'Unknown'}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-purple-400 mb-3">Persian Audio (فارسی)</h3>
              <ul className="list-disc list-inside space-y-2 ml-4" dir="rtl">
                <li>صدا: fa-IR-FaridNeural (آقا - روحانی)</li>
                <li>کلمات: {alignmentFa.verses.reduce((sum, v) => sum + v.words.length, 0)}</li>
                <li>مدت زمان: {alignmentFa.verses.reduce((sum, v) => sum + (v.totalDuration || 0), 0).toFixed(1)} ثانیه</li>
                <li>روش: {alignmentFa.metadata?.method === 'synthetic' ? 'مصنوعی' : alignmentFa.metadata?.method || 'نامشخص'}</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-500/10 border-2 border-blue-500 rounded-xl">
            <h3 className="text-2xl font-bold text-blue-400 mb-3">🔍 Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Generated At:</strong> {alignmentEn.metadata?.generatedAt || 'Unknown'}
              </div>
              <div>
                <strong>Book:</strong> {alignmentEn.metadata?.book || 'Genesis'}
              </div>
              <div>
                <strong>Chapter:</strong> {alignmentEn.metadata?.chapter || 1}
              </div>
              <div>
                <strong>Total Verses:</strong> {alignmentEn.metadata?.totalVerses || alignmentEn.verses.length}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-12">
          <a
            href="/#/bible/audio-sync-demo"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold inline-block"
          >
            ← Back to Demo
          </a>
        </div>
      </div>
    </div>
  );
};

export default BibleAudioTestPage;
