import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { X, Wand2, Folder, UploadCloud } from 'lucide-react';
import Spinner from './Spinner';
import { secureGeminiService } from '../services/secureGeminiService';

interface Props {
    onClose: () => void;
    onSelect: (imageUrl: string) => void;
    fileTypeFilter?: 'image' | 'audio' | 'video';
}

const FilePickerModal: React.FC<Props> = ({ onClose, onSelect, fileTypeFilter = 'image' }) => {
    const { t } = useLanguage();
    const { content, uploadFile } = useContent();
    const [activeTab, setActiveTab] = useState('fileManager');

    // AI Generation State
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError('');
        setGeneratedImage(null);
        try {
            const imageUrl = await secureGeminiService.generateImage(prompt);
            setGeneratedImage(imageUrl);
        } catch (err) {
            console.error("Image generation failed:", err);
            setError("Failed to generate image. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelect = (url: string) => {
        if(url) {
            onSelect(url);
        }
    }

    const getAcceptString = () => {
        switch (fileTypeFilter) {
            case 'image': return 'image/*';
            case 'audio': return 'audio/*';
            case 'video': return 'video/*';
            default: return 'image/*,audio/*,video/*';
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            setError('');
             if (file.size > 25 * 1024 * 1024) { // 25MB limit for all files
                setError("File size cannot exceed 25MB.");
                setIsUploading(false);
                return;
            }
            try {
                const newFile = await uploadFile(file);
                if (newFile) {
                    onSelect(newFile.url);
                } else {
                    setError("Upload failed. Please try again.");
                }
            } catch(e: any) {
                setError(e.message || "Upload failed. Please try again.");
            }
            setIsUploading(false);
        }
    };
    
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const tabs = [
        { id: 'fileManager', name: t('adminMenuFileManager'), icon: <Folder size={18} /> },
        { id: 'upload', name: t('upload'), icon: <UploadCloud size={18} /> },
    ];

    if (fileTypeFilter === 'image') {
        tabs.push({ id: 'generate', name: t('generateWithAi'), icon: <Wand2 size={18} /> });
    }

    const filteredFiles = useMemo(() => {
        return content.files.filter(f => {
            if (fileTypeFilter === 'image') return f.type.startsWith('image/');
            if (fileTypeFilter === 'audio') return f.type.startsWith('audio/');
            if (fileTypeFilter === 'video') return f.type.startsWith('video/');
            return true;
        });
    }, [content.files, fileTypeFilter]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4" role="dialog" aria-modal="true">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-4xl border border-gray-700 flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">{t('selectFile')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </header>
                
                <div className="border-b border-gray-700">
                    <nav className="flex space-x-4 px-6" aria-label="Tabs">
                         {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                    ? 'border-secondary text-secondary'
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                                }`}
                            >
                                {tab.icon}
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    {activeTab === 'fileManager' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                             {filteredFiles.map(file => (
                                <button key={file.id} onClick={() => handleSelect(file.url)} className="group relative bg-primary p-2 rounded-lg border border-gray-700 hover:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary">
                                    <div className="aspect-square w-full bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
                                        {file.type.startsWith('image/') ? (
                                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                        ) : (
                                             <div className="text-gray-500 text-center p-2">
                                                <p className="font-bold text-xs">{file.type}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-xs text-white truncate">{file.name}</div>
                                    <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
                                </button>
                            ))}
                        </div>
                    )}
                    {activeTab === 'upload' && (
                        <div>
                             <label htmlFor="file-picker-upload" className="relative cursor-pointer">
                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 px-6 py-10 hover:border-secondary transition-colors">
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                                    <span className="mt-2 block text-sm font-semibold text-gray-400">
                                        {isUploading ? "Uploading..." : `Click to upload ${fileTypeFilter}s`}
                                    </span>
                                    {isUploading && <div className="mt-2"><Spinner/></div>}
                                </div>
                                <input id="file-picker-upload" name="file-picker-upload" type="file" className="sr-only" onChange={handleUpload} disabled={isUploading} accept={getAcceptString()} />
                            </label>
                            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                        </div>
                    )}
                    {activeTab === 'generate' && fileTypeFilter === 'image' && (
                         <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={t('imagePromptPlaceholder')}
                                    className="flex-grow p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                                />
                                <button onClick={handleGenerate} disabled={isLoading || !prompt} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2 disabled:opacity-50">
                                     {isLoading ? <Spinner size="5" /> : <Wand2 size={18} />}
                                </button>
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            
                            <div className="w-full aspect-video bg-primary rounded-md flex justify-center items-center border border-gray-700">
                                {isLoading ? (
                                    <div className="text-center">
                                        <Spinner size="8"/>
                                        <p className="mt-2 text-dimWhite">{t('generatingImage')}</p>
                                    </div>
                                ) : generatedImage ? (
                                    <img src={generatedImage} alt="Generated" className="w-full h-full object-contain rounded-md" />
                                ) : (
                                    <p className="text-gray-500">Preview will appear here</p>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-gray-700 mt-auto">
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                            {t('cancel')}
                        </button>
                         {activeTab === 'generate' && (
                            <button onClick={() => handleSelect(generatedImage!)} disabled={!generatedImage} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md disabled:opacity-50">
                                {t('selectImage')}
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default FilePickerModal;