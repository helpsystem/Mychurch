/**
 * Persian Bible TTS Page
 * 
 * Dedicated page for reading Persian Bible with TTS
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PersianTTSReader from '../components/PersianTTSReader';
import { api } from '../lib/api';
import { Loader, AlertCircle, BookOpen } from 'lucide-react';

interface Verse {
  id: number;
  verseNumber: number;
  textFa: string;
}

export const PersianBibleTTSPage: React.FC = () => {
  const { bookCode, chapter } = useParams<{ bookCode: string; chapter: string }>();
  const navigate = useNavigate();
  
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookName, setBookName] = useState('');

  // Book names in Persian
  const persianBookNames: Record<string, string> = {
    'GEN': 'پیدایش',
    'EXO': 'خروج',
    'LEV': 'لاویان',
    'NUM': 'اعداد',
    'DEU': 'تثنیه',
    'JOS': 'یوشع',
    'JDG': 'داوران',
    'RUT': 'روت',
    '1SA': 'اول سموئیل',
    '2SA': 'دوم سموئیل',
    '1KI': 'اول پادشاهان',
    '2KI': 'دوم پادشاهان',
    'PSA': 'مزامیر',
    'PRO': 'امثال',
    'ISA': 'اشعیا',
    'JER': 'ارمیا',
    'MAT': 'متی',
    'MRK': 'مرقس',
    'LUK': 'لوقا',
    'JHN': 'یوحنا',
    'ACT': 'اعمال رسولان',
    'ROM': 'رومیان',
    '1CO': 'اول قرنتیان',
    '2CO': 'دوم قرنتیان',
    'GAL': 'غلاطیان',
    'EPH': 'افسسیان',
    'PHP': 'فیلیپیان',
    'COL': 'کولسیان',
    '1TH': 'اول تسالونیکیان',
    '2TH': 'دوم تسالونیکیان',
    '1TI': 'اول تیموتاؤس',
    '2TI': 'دوم تیموتاؤس',
    'HEB': 'عبرانیان',
    'JAS': 'یعقوب',
    '1PE': 'اول پطرس',
    '2PE': 'دوم پطرس',
    '1JN': 'اول یوحنا',
    'REV': 'مکاشفه'
  };

  // Fetch verses from API
  useEffect(() => {
    const fetchVerses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: any = await api.get(`/api/bible/content/${bookCode}/${chapter}`);
        
        if (response.data.success) {
          // Transform and filter for Persian text
          const transformedVerses: Verse[] = response.data.verses
            .filter((v: any) => v.text_fa || v.textFa) // Only verses with Persian text
            .map((v: any) => ({
              id: v.id,
              verseNumber: v.verse_number || v.verseNumber,
              textFa: v.text_fa || v.textFa || ''
            }));
          
          setVerses(transformedVerses);
          setBookName(persianBookNames[bookCode || ''] || bookCode || '');
        } else {
          setError(response.data.message || 'خطا در دریافت آیات');
          loadMockData();
        }
      } catch (err: any) {
        console.error('Error fetching verses:', err);
        setError('خطا در ارتباط با سرور - استفاده از داده‌های نمونه');
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
   * Load mock Persian data
   */
  const loadMockData = () => {
    const mockVerses: Verse[] = [
      {
        id: 1,
        verseNumber: 1,
        textFa: "در ابتدا خدا آسمان و زمین را آفرید."
      },
      {
        id: 2,
        verseNumber: 2,
        textFa: "و زمین بی‌شکل و خالی بود و تاریکی بر روی عمق ها بود و روح خدا بر روی آب ها حرکت می‌کرد."
      },
      {
        id: 3,
        verseNumber: 3,
        textFa: "و خدا گفت: نور باشد و نور شد."
      },
      {
        id: 4,
        verseNumber: 4,
        textFa: "و خدا نور را دید که نیکو است و خدا نور را از تاریکی جدا کرد."
      },
      {
        id: 5,
        verseNumber: 5,
        textFa: "و خدا نور را روز نامید و تاریکی را شب نامید و شام و صبح، روز اول بود."
      },
      {
        id: 6,
        verseNumber: 6,
        textFa: "و خدا گفت: فلکی در میان آب ها باشد تا آب ها را از آب ها جدا کند."
      },
      {
        id: 7,
        verseNumber: 7,
        textFa: "پس خدا فلک را ساخت و آب های زیر فلک را از آب های بالای فلک جدا کرد و چنین شد."
      },
      {
        id: 8,
        verseNumber: 8,
        textFa: "و خدا فلک را آسمان نامید و شام و صبح، روز دوم بود."
      },
      {
        id: 9,
        verseNumber: 9,
        textFa: "و خدا گفت: آب های زیر آسمان به یک مکان جمع شوند و خشکی ظاهر گردد و چنین شد."
      },
      {
        id: 10,
        verseNumber: 10,
        textFa: "و خدا خشکی را زمین نامید و اجتماع آب ها را دریاها خواند و خدا دید که نیکوست."
      }
    ];

    setVerses(mockVerses);
    setBookName('پیدایش');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center" dir="rtl">
          <Loader className="animate-spin mx-auto mb-4 text-purple-500" size={48} />
          <p className="text-gray-600 font-vazir text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center" dir="rtl">
            <h1 className="text-5xl font-bold mb-3 font-vazir">
              📖 کتاب مقدس با روخوانی فارسی
            </h1>
            <p className="text-xl text-purple-100 font-vazir">
              تجربه خواندن کتاب مقدس با هایلایت کلمه به کلمه
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-6" dir="rtl">
          <h3 className="font-bold text-lg mb-4 font-vazir text-purple-700">🔖 دسترسی سریع</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/bible-fa/tts/GEN/1')}
              className="p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all font-vazir text-sm"
            >
              پیدایش 1
            </button>
            <button
              onClick={() => navigate('/bible-fa/tts/PSA/23')}
              className="p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all font-vazir text-sm"
            >
              مزمور 23
            </button>
            <button
              onClick={() => navigate('/bible-fa/tts/JHN/3')}
              className="p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all font-vazir text-sm"
            >
              یوحنا 3
            </button>
            <button
              onClick={() => navigate('/bible-fa/tts/MAT/5')}
              className="p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all font-vazir text-sm"
            >
              متی 5
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex items-start gap-3" dir="rtl">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold text-yellow-800 font-vazir">توجه</p>
              <p className="text-yellow-700 font-vazir">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* TTS Reader */}
      <div className="py-8">
        {verses.length > 0 ? (
          <PersianTTSReader
            bookName={bookName}
            chapterNumber={parseInt(chapter || '1')}
            verses={verses}
            onVerseChange={(index) => console.log('Current verse:', index + 1)}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center" dir="rtl">
              <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
              <h2 className="text-xl font-semibold text-gray-700 mb-2 font-vazir">
                آیه‌ای موجود نیست
              </h2>
              <p className="text-gray-600 font-vazir">
                متأسفانه نمی‌توان آیات این فصل را بارگذاری کرد.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg" dir="rtl">
          <h3 className="font-semibold text-blue-900 mb-4 text-xl font-vazir">📚 راهنمای استفاده</h3>
          <ul className="space-y-3 text-blue-800 font-vazir">
            <li className="flex items-start gap-2">
              <span className="text-2xl">▶️</span>
              <span>روی دکمه <strong>پخش</strong> کلیک کنید تا خواندن شروع شود</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-2xl">✨</span>
              <span>کلمات با <span className="bg-yellow-300 px-2 py-1 rounded font-bold">رنگ زرد</span> هایلایت می‌شوند</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-2xl">⏮️⏭️</span>
              <span>از دکمه‌های <strong>قبلی/بعدی</strong> برای جابجایی بین آیات استفاده کنید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-2xl">⚙️</span>
              <span><strong>سرعت</strong> و <strong>صدا</strong> را در تنظیمات تغییر دهید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-2xl">👆</span>
              <span>روی هر آیه کلیک کنید تا مستقیماً به آن بروید</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-2xl">🎯</span>
              <span>زمان هایلایت هر کلمه را می‌توانید در تنظیمات تنظیم کنید</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Browser Compatibility */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 text-center" dir="rtl">
          <p className="text-sm text-gray-600 font-vazir">
            <strong>بهترین تجربه در:</strong> Chrome یا Edge
          </p>
          <p className="text-xs text-gray-500 mt-1 font-vazir">
            توجه: برخی مرورگرها ممکن است صدای فارسی نداشته باشند
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersianBibleTTSPage;
