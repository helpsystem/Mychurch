
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { Language } from '../../types';
import Spinner from '../Spinner';
import { ChevronDown, Save, UploadCloud } from 'lucide-react';
import BibleImportModal from '../BibleImportModal';
import ImagePickerModal from '../ImagePickerModal';

const BibleManager: React.FC = () => {
    const { t, lang } = useLanguage();
    const { content, updateBibleVerse, importBibleChapter } = useContent();
    const { bibleBooks, bibleContent } = content;
    const [selectedBook, setSelectedBook] = useState<string>(bibleBooks[0]?.key || '');
    const [selectedChapter, setSelectedChapter] = useState<string>('1');
    const [verses, setVerses] = useState<Record<Language, string[]>>({ en: [], fa: [] });
    const [editingVerse, setEditingVerse] = useState<{ index: number; lang: Language } | null>(null);
    const [editText, setEditText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    useEffect(() => {
        if (selectedBook && selectedChapter) {
            const chapterContent = bibleContent[selectedBook]?.[selectedChapter];
            setVerses(chapterContent || { en: [], fa: [] });
        }
    }, [selectedBook, selectedChapter, bibleContent]);

    const handleSaveVerse = async () => {
        if (!editingVerse) return;
        setIsLoading(true);
        try {
            await updateBibleVerse(selectedBook, selectedChapter, editingVerse.index, editingVerse.lang, editText);
        } catch (error) {
            console.error("Failed to save verse:", error);
            alert("Failed to save verse.");
        } finally {
            setEditingVerse(null);
            setIsLoading(false);
        }
    };
    
    const handleImport = async (data: any) => {
        setIsLoading(true);
        try {
            await importBibleChapter(data);
            setIsImportModalOpen(false);
        } catch (error) {
             console.error("Failed to import chapter:", error);
            alert("Failed to import chapter.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (index: number, lang: Language) => {
        setEditingVerse({ index, lang });
        setEditText(verses[lang][index]);
    };

    const renderVerseInput = (lang: Language, verseText: string, index: number) => {
        if (editingVerse?.index === index && editingVerse?.lang === lang) {
            return (
                <div className="flex-1">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white text-sm"
                        rows={3}
                        dir={lang === 'fa' ? 'rtl' : 'ltr'}
                    />
                    <div className="flex gap-2 mt-1">
                        <button onClick={handleSaveVerse} className="text-xs py-1 px-2 bg-blue-gradient text-primary rounded">{t('save')}</button>
                        <button onClick={() => setEditingVerse(null)} className="text-xs py-1 px-2 bg-gray-600 text-white rounded">{t('cancel')}</button>
                    </div>
                </div>
            );
        }
        return <p onDoubleClick={() => handleEditClick(index, lang)} className="flex-1 text-sm text-dimWhite cursor-pointer">{verseText}</p>;
    };

    const bookChapters = selectedBook ? Object.keys(bibleContent[selectedBook] || {}) : [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">{t('manageBible')}</h1>
                <button onClick={() => setIsImportModalOpen(true)} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                    <UploadCloud size={16}/> Import CSV
                </button>
            </div>
            
            <p className="text-dimWhite">{t('selectBookAndChapter')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)} className="w-full p-3 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white appearance-none pr-10">
                        {bibleBooks.map(book => <option key={book.key} value={book.key}>{book.name[lang]}</option>)}
                    </select>
                     <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                     <select value={selectedChapter} onChange={e => setSelectedChapter(e.target.value)} className="w-full p-3 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white appearance-none pr-10">
                        {bookChapters.map(chap => <option key={chap} value={chap}>{t('chapter')} {chap}</option>)}
                    </select>
                    <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="bg-black-gradient p-4 rounded-[20px] box-shadow">
                 {isLoading && <div className="absolute inset-0 bg-black/50 flex justify-center items-center z-10"><Spinner/></div>}
                 <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {verses.en.map((_, index) => (
                        <div key={index} className="flex gap-4 p-3 border-b border-gray-700">
                            <span className="font-bold text-secondary">{index + 1}</span>
                            {renderVerseInput('en', verses.en[index], index)}
                            <div className="w-px bg-gray-700"></div>
                            {renderVerseInput('fa', verses.fa[index], index)}
                        </div>
                    ))}
                 </div>
            </div>

            {isImportModalOpen && (
                <BibleImportModal 
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onSave={handleImport}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default BibleManager;
