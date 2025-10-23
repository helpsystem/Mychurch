/**
 * Bible Flipbook 3D Page
 * 
 * Main page for displaying the 3D Bible Flipbook Reader
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BibleFlipbook3D from '../components/BibleFlipbook3D';
import { Loader, AlertCircle, BookOpen } from 'lucide-react';

interface Verse {
  id: number;
  verseNumber: number;
  textEn: string;
  textFa: string;
}

interface Book {
  code: string;
  name_en: string;
  name_fa: string;
  total_chapters: number;
}

const BibleFlipbook3DPage: React.FC = () => {
  const { bookCode = 'GEN', chapter = '1' } = useParams<{ bookCode: string; chapter: string }>();
  const navigate = useNavigate();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch book information
   */
  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/bible/book/${bookCode}`);
        const data = await response.json();

        if (data.success) {
          setBook(data.book);
        }
      } catch (err) {
        console.error('Error fetching book info:', err);
      }
    };

    fetchBookInfo();
  }, [bookCode]);

  /**
   * Fetch chapter verses
   */
  useEffect(() => {
    const fetchVerses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `http://localhost:3001/api/bible/content/${bookCode}/${chapter}`
        );
        const data = await response.json();

        if (data.success && data.versesData) {
          // Transform data to match component interface
          const transformedVerses: Verse[] = data.versesData.map((v: any) => ({
            id: v.id || v.verse_number,
            verseNumber: v.verse_number,
            textEn: v.en || v.text_en || '',
            textFa: v.fa || v.text_fa || ''
          }));

          setVerses(transformedVerses);
        } else {
          setError('Failed to load chapter');
          loadMockData();
        }
      } catch (err: any) {
        console.error('Error fetching verses:', err);
        setError(err.message);
        loadMockData();
      } finally {
        setLoading(false);
      }
    };

    fetchVerses();
  }, [bookCode, chapter]);

  /**
   * Load mock data for demo
   */
  const loadMockData = () => {
    setBook({
      code: 'GEN',
      name_en: 'Genesis',
      name_fa: 'پیدایش',
      total_chapters: 50
    });

    setVerses([
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
      }
    ]);
  };

  /**
   * Handle chapter change
   */
  const handleChapterChange = (newChapter: number) => {
    navigate(`/bible-flipbook/${bookCode}/${newChapter}`);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        gap: '20px'
      }}>
        <Loader size={48} className="animate-spin" />
        <p style={{ fontSize: '1.2em' }}>در حال بارگذاری...</p>
      </div>
    );
  }

  if (error && verses.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: 'white',
        gap: '20px',
        padding: '40px'
      }}>
        <AlertCircle size={48} color="#f59e0b" />
        <h2>خطا در بارگذاری</h2>
        <p style={{ textAlign: 'center', maxWidth: '500px' }}>
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none',
            color: 'white',
            padding: '12px 30px',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '1.1em',
            fontWeight: 'bold'
          }}
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <BibleFlipbook3D
      bookCode={bookCode}
      bookNameEn={book.name_en}
      bookNameFa={book.name_fa}
      chapterNumber={parseInt(chapter)}
      verses={verses}
      onChapterChange={handleChapterChange}
    />
  );
};

export default BibleFlipbook3DPage;
