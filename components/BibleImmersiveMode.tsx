import React, { useState, useEffect } from 'react';
import BibleFlipbook3D from './BibleFlipbook3D';
import { api } from '../lib/api';
import { useLanguage } from '../hooks/useLanguage';

interface BibleImmersiveModeProps {
    initialBook?: string;
    initialChapter?: number;
}

const BibleImmersiveMode: React.FC<BibleImmersiveModeProps> = ({
    initialBook = 'GEN',
    initialChapter = 1
}) => {
    const { lang } = useLanguage();
    const [currentBook, setCurrentBook] = useState(initialBook);
    const [currentChapter, setCurrentChapter] = useState(initialChapter);
    const [verses, setVerses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadChapterContent();
    }, [currentBook, currentChapter]);

    const loadChapterContent = async () => {
        setLoading(true);
        try {
            const data = await api.get<{ verses: { fa: string[], en: string[] } }>(`/api/bible/content/${currentBook}/${currentChapter}`);
            if (data && data.verses) {
                // Transform to format expected by BibleFlipbook3D
                const formattedVerses = data.verses.fa.map((textFa, idx) => ({
                    id: idx,
                    verseNumber: idx + 1,
                    textFa: textFa,
                    textEn: data.verses.en[idx] || ''
                }));
                setVerses(formattedVerses);
            }
        } catch (err) {
            console.error('Error loading chapter:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-150px)] w-full overflow-hidden rounded-2xl shadow-2xl">
            <BibleFlipbook3D
                bookCode={currentBook}
                bookNameEn="Genesis" // TODO: Fetch dynamic names
                bookNameFa="پیدایش"
                chapterNumber={currentChapter}
                verses={verses}
                onChapterChange={setCurrentChapter}
            />
        </div>
    );
};

export default BibleImmersiveMode;
