import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from './Spinner';
import { X, UploadCloud } from 'lucide-react';
import { BibleImportData } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: BibleImportData) => Promise<void>;
    isLoading: boolean;
}

const BibleImportModal: React.FC<Props> = ({ isOpen, onClose, onSave, isLoading }) => {
    const { t } = useLanguage();
    const [bookKey, setBookKey] = useState('');
    const [bookNameEn, setBookNameEn] = useState('');
    const [bookNameFa, setBookNameFa] = useState('');
    const [chapter, setChapter] = useState('');
    const [verses, setVerses] = useState<{ en: string[], fa: string[] } | null>(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const parseCsv = (csvText: string): { en: string[], fa: string[] } => {
        const lines = csvText.trim().replace(/\r\n/g, '\n').split('\n');
        const data: { en: string[], fa: string[] } = { en: [], fa: [] };
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            // Regex to handle quoted fields with commas inside
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const cleanedValues = values.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            
            if (cleanedValues.length >= 3) {
                const verseIndex = parseInt(cleanedValues[0], 10) - 1;
                if (!isNaN(verseIndex) && verseIndex >= 0) {
                    data.en[verseIndex] = cleanedValues[1] || '';
                    data.fa[verseIndex] = cleanedValues[2] || '';
                }
            }
        }
        
        // Fill any gaps with empty strings if verses are skipped in CSV
        const maxLen = Math.max(data.en.length, data.fa.length);
        for (let i = 0; i < maxLen; i++) {
            data.en[i] = data.en[i] || '';
            data.fa[i] = data.fa[i] || '';
        }
        return data;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setError('');
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string;
                    const parsedData = parseCsv(text);
                    if (parsedData.en.length === 0) {
                        setError('CSV file is empty or in the wrong format. Expected columns: verse,en,fa');
                        setVerses(null);
                    } else {
                        setVerses(parsedData);
                    }
                } catch (err) {
                    setError('Failed to parse CSV file.');
                    setVerses(null);
                }
            };
            reader.readAsText(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verses || !bookKey || !bookNameEn || !bookNameFa || !chapter) {
            setError('Please fill all fields and upload a valid CSV file.');
            return;
        }
        onSave({
            bookKey,
            bookName: { en: bookNameEn, fa: bookNameFa },
            chapter,
            verses
        });
    };

    const inputClass = "w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Import Bible Chapter from CSV</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dimWhite mb-1">Book Key (e.g., "Genesis")</label>
                            <input type="text" value={bookKey} onChange={e => setBookKey(e.target.value)} required className={inputClass}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dimWhite mb-1">Chapter Number</label>
                            <input type="number" value={chapter} onChange={e => setChapter(e.target.value)} required className={inputClass}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dimWhite mb-1">Book Name (EN)</label>
                            <input type="text" value={bookNameEn} onChange={e => setBookNameEn(e.target.value)} required className={inputClass}/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-dimWhite mb-1">Book Name (FA)</label>
                            <input type="text" value={bookNameFa} onChange={e => setBookNameFa(e.target.value)} required className={inputClass} dir="rtl"/>
                        </div>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-dimWhite mb-1">CSV File</label>
                         <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-10">
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-white">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-500">CSV up to 1MB. Format: verse,en,fa</p>
                                {fileName && <p className="text-sm text-green-400 mt-2">{fileName}</p>}
                            </div>
                        </div>
                    </div>

                    {verses && (
                         <div>
                            <h3 className="text-sm font-medium text-dimWhite mb-1">CSV Data Preview</h3>
                            <div className="bg-primary border border-gray-700 rounded-md p-2 max-h-32 overflow-y-auto text-xs text-gray-400">
                                <p>Found {verses.en.length} verses.</p>
                                <p><strong>Verse 1 (EN):</strong> {verses.en[0]}</p>
                                <p><strong>Verse 1 (FA):</strong> {verses.fa[0]}</p>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                </form>
                <footer className="p-4 border-t border-gray-700 mt-auto">
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                            {t('cancel')}
                        </button>
                        <button type="submit" onClick={handleSubmit} disabled={isLoading || !verses} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md disabled:opacity-50 w-36 flex justify-center items-center">
                            {isLoading ? <Spinner size="5" /> : 'Import'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default BibleImportModal;