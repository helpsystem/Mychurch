/**
 * Bible TTS Demo Page
 * 
 * Demonstration page showing how to use the TTSBibleReader component
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TTSBibleReader from '../components/TTSBibleReader';
import { api } from '../lib/api';
import { Loader, AlertCircle } from 'lucide-react';

interface Verse {
  id: number;
  verseNumber: number;
  textEn: string;
  textFa: string;
}

export const BibleTTSPage: React.FC = () => {
  const { bookCode, chapter } = useParams<{ bookCode: string; chapter: string }>();
  
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'fa'>('en');
  const [showBilingual, setShowBilingual] = useState(true);

  // Fetch verses from API
  useEffect(() => {
    const fetchVerses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: any = await api.get(`/api/bible/content/${bookCode}/${chapter}`);
        
        if (response.data.success) {
          // Transform API response to match TTSBibleReader interface
          const transformedVerses: Verse[] = response.data.verses.map((v: any) => ({
            id: v.id,
            verseNumber: v.verse_number || v.verseNumber,
            textEn: v.text_en || v.textEn || '',
            textFa: v.text_fa || v.textFa || ''
          }));
          
          setVerses(transformedVerses);
        } else {
          setError(response.data.message || 'Failed to load verses');
        }
      } catch (err: any) {
        console.error('Error fetching verses:', err);
        setError(err.message || 'Failed to load Bible chapter');
        
        // Load mock data for demo purposes
        loadMockData();
      } finally {
        setLoading(false);
      }
    };

    if (bookCode && chapter) {
      fetchVerses();
    }
  }, [bookCode, chapter]);

  /**
   * Load mock data for demonstration when API fails
   */
  const loadMockData = () => {
    const mockVerses: Verse[] = [
      {
        id: 1,
        verseNumber: 1,
        textEn: "In the beginning God created the heaven and the earth.",
        textFa: "در ابتدا خدا آسمان و زمین را آفرید."
      },
      {
        id: 2,
        verseNumber: 2,
        textEn: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
        textFa: "و زمین بی‌شکل و خالی بود و تاریکی بر روی عمق ها بود و روح خدا بر روی آب ها حرکت می‌کرد."
      },
      {
        id: 3,
        verseNumber: 3,
        textEn: "And God said, Let there be light: and there was light.",
        textFa: "و خدا گفت: نور باشد و نور شد."
      },
      {
        id: 4,
        verseNumber: 4,
        textEn: "And God saw the light, that it was good: and God divided the light from the darkness.",
        textFa: "و خدا نور را دید که نیکو است و خدا نور را از تاریکی جدا کرد."
      },
      {
        id: 5,
        verseNumber: 5,
        textEn: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.",
        textFa: "و خدا نور را روز نامید و تاریکی را شب نامید و شام و صبح، روز اول بود."
      },
      {
        id: 6,
        verseNumber: 6,
        textEn: "And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.",
        textFa: "و خدا گفت: فلکی در میان آب ها باشد تا آب ها را از آب ها جدا کند."
      },
      {
        id: 7,
        verseNumber: 7,
        textEn: "And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.",
        textFa: "پس خدا فلک را ساخت و آب های زیر فلک را از آب های بالای فلک جدا کرد و چنین شد."
      },
      {
        id: 8,
        verseNumber: 8,
        textEn: "And God called the firmament Heaven. And the evening and the morning were the second day.",
        textFa: "و خدا فلک را آسمان نامید و شام و صبح، روز دوم بود."
      },
      {
        id: 9,
        verseNumber: 9,
        textEn: "And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.",
        textFa: "و خدا گفت: آب های زیر آسمان به یک مکان جمع شوند و خشکی ظاهر گردد و چنین شد."
      },
      {
        id: 10,
        verseNumber: 10,
        textEn: "And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.",
        textFa: "و خدا خشکی را زمین نامید و اجتماع آب ها را دریاها خواند و خدا دید که نیکوست."
      }
    ];

    setVerses(mockVerses);
    setError('Using demo data (API not available)');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading Bible chapter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bible Text-to-Speech Reader
          </h1>
          <p className="text-gray-600">
            Listen to the Bible with synchronized word-by-word highlighting
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold text-yellow-800">Notice</p>
              <p className="text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Primary Language:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'fa')}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="en">English</option>
                <option value="fa">فارسی (Persian)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bilingual"
                checked={showBilingual}
                onChange={(e) => setShowBilingual(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="bilingual" className="text-sm font-medium text-gray-700">
                Show bilingual (English & Persian)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* TTS Reader */}
      <div className="py-8">
        {verses.length > 0 ? (
          <TTSBibleReader
            bookCode={bookCode || 'GEN'}
            chapterNumber={parseInt(chapter || '1')}
            verses={verses}
            language={language}
            showBilingual={showBilingual}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <AlertCircle className="mx-auto mb-4 text-gray-400" size={48} />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No Verses Available
              </h2>
              <p className="text-gray-600">
                Unable to load verses for this chapter.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to Use</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Click the <strong>Play</strong> button to start reading</li>
            <li>• Words will be highlighted in <span className="bg-yellow-300 px-1">yellow</span> as they are spoken</li>
            <li>• Use <strong>Previous/Next</strong> buttons to navigate between verses</li>
            <li>• Adjust <strong>volume</strong> and <strong>speed</strong> in the controls</li>
            <li>• Click the <strong>settings icon</strong> to choose a different voice</li>
            <li>• Click on any verse to jump to it</li>
            <li>• Toggle between English, Persian, or bilingual display</li>
          </ul>
        </div>
      </div>

      {/* Browser Compatibility Notice */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            <strong>Best experienced in:</strong> Chrome, Edge, or Safari
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Firefox has limited Text-to-Speech support
          </p>
        </div>
      </div>
    </div>
  );
};

export default BibleTTSPage;
