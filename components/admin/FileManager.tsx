

import React, { useState, useRef, useMemo } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { ManagedFile } from '../../types';
import { UploadCloud, Trash2, Copy, Edit, RefreshCw, Search, Folder, Home, ChevronRight } from 'lucide-react';
import Spinner from '../Spinner';

const EditFileModal: React.FC<{ file: ManagedFile, onClose: () => void, onSave: (fileId: string, newName: string) => void }> = ({ file, onClose, onSave }) => {
    const { t } = useLanguage();
    const [name, setName] = useState(file.name);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(file.id, name);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[70] p-4">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-md border border-gray-700">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">{t('edit')} {t('file')}</h3>
                        <label className="block text-sm text-dimWhite mb-1">{t('name')}</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white" />
                    </div>
                    <div className="px-6 py-4 bg-primary/30 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">{t('cancel')}</button>
                        <button type="submit" className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FileManager: React.FC = () => {
    const { t } = useLanguage();
    const { content, uploadFile, deleteFile, updateFile, replaceFile, loading: contentLoading } = useContent();
    const [isUploading, setIsUploading] = useState(false);
    const [editingFile, setEditingFile] = useState<ManagedFile | null>(null);
    const replaceFileInputRef = useRef<HTMLInputElement>(null);
    const [replacingFile, setReplacingFile] = useState<ManagedFile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPath, setCurrentPath] = useState<string[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 25 * 1024 * 1024) { // 25MB limit
                alert("File size cannot exceed 25MB.");
                return;
            }
            setIsUploading(true);
            try {
                await uploadFile(file, currentPath.join('/'));
            } catch (error) {
                console.error("Upload failed", error);
                alert("Upload failed.");
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    const handleReplaceClick = (file: ManagedFile) => {
        setReplacingFile(file);
        replaceFileInputRef.current?.click();
    };

    const handleFileReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && replacingFile) {
            try {
                await replaceFile(replacingFile.id, file);
            } catch (error) {
                console.error("File replacement failed.", error);
                alert("File replacement failed.");
            }
        }
        setReplacingFile(null);
        if(replaceFileInputRef.current) {
            replaceFileInputRef.current.value = "";
        }
    };
    
    const handleSaveFileName = async (fileId: string, newName: string) => {
        await updateFile(fileId, { name: newName });
        setEditingFile(null);
    };

    const handleDelete = async (file: ManagedFile) => {
        if(window.confirm(t('confirmDeleteFile'))) {
            await deleteFile(file);
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
    };
    
    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    const displayedContent = useMemo(() => {
        const currentPathStr = currentPath.join('/');
        const filesSource = searchTerm 
            ? content.files.filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
            : content.files;

        const folders = new Set<string>();
        const files: ManagedFile[] = [];

        filesSource.forEach(file => {
            const filePath = file.path || file.name;
            let isDirectChild = false;

            if (currentPath.length === 0) {
                 isDirectChild = !filePath.includes('/');
            } else {
                if (filePath.startsWith(currentPathStr + '/')) {
                    const relativePath = filePath.substring(currentPathStr.length + 1);
                    isDirectChild = !relativePath.includes('/');
                }
            }

            if (isDirectChild) {
                files.push(file);
            } else if (currentPath.length === 0 && filePath.includes('/')) {
                folders.add(filePath.split('/')[0]);
            } else if (filePath.startsWith(currentPathStr + '/')) {
                const relativePath = filePath.substring(currentPathStr.length + 1);
                folders.add(relativePath.split('/')[0]);
            }
        });
        
        return { folders: Array.from(folders).sort(), files };
    }, [content.files, searchTerm, currentPath]);

    const handleFolderClick = (folder: string) => setCurrentPath(prev => [...prev, folder]);
    const handleBreadcrumbClick = (index: number) => setCurrentPath(prev => prev.slice(0, index + 1));


    if (contentLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="12" /></div>;
    }

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold text-white">{t('adminMenuFileManager')}</h2>
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text"
                        placeholder={t('searchFiles')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                    />
                    <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>

            <div className="bg-primary/50 p-2 rounded-md mb-4 flex items-center text-sm text-dimWhite">
                <button onClick={() => setCurrentPath([])} className="hover:text-white flex items-center gap-1"><Home size={16}/> Root</button>
                {currentPath.map((part, i) => (
                    <React.Fragment key={i}>
                        <ChevronRight size={16} className="mx-1" />
                        <button onClick={() => handleBreadcrumbClick(i)} className="hover:text-white">{part}</button>
                    </React.Fragment>
                ))}
            </div>
            
             <div>
                <label htmlFor="file-upload" className="relative cursor-pointer">
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 px-6 py-10 hover:border-secondary transition-colors">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                        <span className="mt-2 block text-sm font-semibold text-gray-400">
                            {isUploading ? "Uploading..." : `Upload to: /${currentPath.join('/')}`}
                        </span>
                        {isUploading && <div className="mt-2"><Spinner/></div>}
                    </div>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} disabled={isUploading} accept="image/*,audio/*,video/*" />
                </label>
            </div>

            <div className="mt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {displayedContent.folders.map(folder => (
                         <button key={folder} onClick={() => handleFolderClick(folder)} className="bg-primary p-3 rounded-lg border border-gray-700 flex flex-col items-center justify-center aspect-square text-center group hover:border-secondary hover:bg-gray-800">
                             <Folder size={48} className="text-secondary mb-2 transition-transform group-hover:scale-110" />
                             <p className="text-sm font-medium text-white truncate w-full">{folder}</p>
                         </button>
                    ))}
                    {displayedContent.files.map(file => (
                        <div key={file.id} className="bg-primary p-3 rounded-lg border border-gray-700 flex flex-col group">
                             <div className="relative aspect-video w-full bg-gray-800 rounded-md flex items-center justify-center overflow-hidden mb-2">
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-medium text-white truncate" title={file.name}>{file.name}</p>
                                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end gap-2">
                                 <button onClick={() => handleCopyUrl(file.url)} title="Copy URL" className="p-1 text-dimWhite hover:text-secondary"><Copy size={16}/></button>
                                 <button onClick={() => setEditingFile(file)} title={t('edit')} className="p-1 text-dimWhite hover:text-secondary"><Edit size={16}/></button>
                                 <button onClick={() => handleReplaceClick(file)} title={t('replace')} className="p-1 text-dimWhite hover:text-secondary"><RefreshCw size={16}/></button>
                                 <button onClick={() => handleDelete(file)} title="Delete" className="p-1 text-dimWhite hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <input type="file" ref={replaceFileInputRef} onChange={handleFileReplace} className="hidden" accept="image/*,audio/*,video/*" />
            {editingFile && <EditFileModal file={editingFile} onClose={() => setEditingFile(null)} onSave={handleSaveFileName} />}
        </div>
    );
};

export default FileManager;