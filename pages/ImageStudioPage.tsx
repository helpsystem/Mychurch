import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Wand2, Download, BookOpen } from 'lucide-react';
import Spinner from '../components/Spinner';
import { geminiService } from '../services/geminiService';
import { Language } from '../types';

const ImageStudioPage: React.FC = () => {
    const { t, lang } = useLanguage();
    const { content } = useContent();
    const [prompt, setPrompt] = useState('');
    const [verseRef, setVerseRef] = useState('');
    const [artStyle, setArtStyle] = useState('Photorealistic');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [error, setError] = useState('');

    const artStyles = [
        { key: 'Photorealistic', name: t('stylePhotorealistic') },
        { key: 'Digital Painting', name: t('styleDigitalPainting') },
        { key: 'Stained Glass', name: t('styleStainedGlass') },
        { key: 'Cinematic', name: t('styleCinematic') },
        { key: 'Byzantine Icon', name: t('styleByzantineIcon') },
    ];
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        let finalPrompt = '';

        if (verseRef) {
            const [bookKey, chapterVerse] = verseRef.split(' ');
            const [chapter, verseNum] = chapterVerse.split(':');
            
            const verseText = content.bibleContent[bookKey]?.[chapter]?.[lang as Language][Number(verseNum) - 1];

            if (verseText) {
                finalPrompt = `An image representing the biblical verse: "${verseText}" (${verseRef}). Style: ${artStyle}.`;
            } else {
                setError(`Could not find verse: ${verseRef}`);
                setIsLoading(false);
                return;
            }
        } else if (prompt) {
            finalPrompt = `${prompt}. Style: ${artStyle}.`;
        } else {
            setError('Please provide a verse or a prompt.');
            setIsLoading(false);
            return;
        }

        try {
            const imageUrl = await geminiService.generateImage(finalPrompt);
            setGeneratedImages(prev => [imageUrl, ...prev]);
        } catch (err) {
            console.error(err);
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (imageUrl: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated_image_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                    <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2"><BookOpen/> {t('generateImageFromVerse')}</h3>
                    <input 
                        type="text" 
                        value={verseRef}
                        onChange={(e) => setVerseRef(e.target.value)}
                        placeholder={t('verseReferencePlaceholder')}
                        className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                    />
                </div>
                <div className="text-center text-gray-500 font-bold">{t('orCustomPrompt')}</div>
                 <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                    <h3 className="text-xl font-semibold mb-4 text-white">{t('prompt')}</h3>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        placeholder={t('imagePromptPlaceholder')}
                        className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                    />
                </div>
                 <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                    <h3 className="text-xl font-semibold mb-4 text-white">{t('artStyle')}</h3>
                    <select value={artStyle} onChange={e => setArtStyle(e.target.value)} className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white">
                        {artStyles.map(style => <option key={style.key} value={style.key}>{style.name}</option>)}
                    </select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="w-full py-3 px-6 bg-blue-gradient text-primary font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <Spinner /> : <><Wand2/> {t('generate')}</>}
                </button>
                 {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
            <div className="lg:col-span-2 bg-black-gradient p-6 rounded-[20px] box-shadow">
                 <h3 className="text-xl font-semibold mb-4 text-white">{t('generatedImages')}</h3>
                 {generatedImages.length === 0 && !isLoading && (
                    <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-700 rounded-lg">
                        <p className="text-gray-500">Your generated images will appear here.</p>
                    </div>
                 )}
                 {isLoading && generatedImages.length === 0 && (
                    <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-700 rounded-lg">
                        <div className="text-center">
                            <Spinner size="8"/>
                            <p className="mt-2 text-dimWhite">{t('generatingImage')}</p>
                        </div>
                    </div>
                 )}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
                    {isLoading && generatedImages.length > 0 && (
                        <div className="relative aspect-square bg-primary rounded-lg flex justify-center items-center border border-gray-700">
                             <div className="text-center">
                                <Spinner size="8"/>
                                <p className="mt-2 text-dimWhite">{t('generatingImage')}</p>
                            </div>
                        </div>
                    )}
                    {generatedImages.map((img, index) => (
                        <div key={index} className="relative group aspect-square bg-primary rounded-lg">
                            <img src={img} alt={`Generated art ${index + 1}`} className="w-full h-full object-cover rounded-lg"/>
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
                                <button onClick={() => handleDownload(img)} className="p-2 bg-white/80 text-black rounded-full hover:bg-white">
                                    <Download size={24}/>
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default ImageStudioPage;