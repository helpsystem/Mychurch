import React, { useState, useEffect } from 'react';
import { X, Save, FolderOpen, Trash2, Check, Download, Upload } from 'lucide-react';
import { AppLanguage } from './types';

interface SaveLoadModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'template' | 'presentation';
    items: SavedItem[];
    onSave: (name: string) => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    isRTL: boolean;
}

export interface SavedItem {
    id: string;
    name: string;
    date: string;
    preview?: string; // Optional preview image/text
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
    isOpen,
    onClose,
    title,
    type,
    items,
    onSave,
    onLoad,
    onDelete,
    isRTL
}) => {
    const [mode, setMode] = useState<'save' | 'load'>('load');
    const [newItemName, setNewItemName] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMode('load');
            setNewItemName('');
            setSelectedId(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (newItemName.trim()) {
            onSave(newItemName);
            setNewItemName('');
            onClose(); // Close after save or maybe switch to load view?
        }
    };

    const handleLoad = () => {
        if (selectedId) {
            onLoad(selectedId);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h3 className={`text-xl font-bold text-white ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition"
                        title={isRTL ? 'بستن' : 'Close'}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 border-b border-slate-800 bg-slate-950/50">
                    <button
                        onClick={() => setMode('load')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition text-sm font-medium ${mode === 'load' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        <FolderOpen className="w-4 h-4" />
                        <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'بازکردن' : 'Load'}</span>
                    </button>
                    <button
                        onClick={() => setMode('save')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition text-sm font-medium ${mode === 'save' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        <Save className="w-4 h-4" />
                        <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'ذخیره' : 'Save'}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">

                    {mode === 'load' && (
                        <div className="space-y-2">
                            {items.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 italic">
                                    {isRTL ? 'موردی یافت نشد' : 'No saved items found'}
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedId(item.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${selectedId === item.id
                                            ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                                            : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-white font-medium">{item.name}</span>
                                            <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(isRTL ? 'آیا مطمئن هستید؟' : 'Are you sure?')) {
                                                    onDelete(item.id);
                                                }
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                                            title={isRTL ? 'حذف' : 'Delete'}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {mode === 'save' && (
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className={`block text-sm font-medium text-slate-400 mb-1 ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                                    {isRTL ? 'نام' : 'Name'}
                                </label>
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder={isRTL ? 'نام را وارد کنید...' : 'Enter name...'}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="text-xs text-slate-500 bg-slate-800/50 p-3 rounded-lg">
                                {type === 'template'
                                    ? (isRTL ? 'تنظیمات فعلی شامل چیدمان، زیرنویس‌ها و تنظیمات متن ذخیره خواهد شد.' : 'Current settings including layout, lower thirds, and text settings will be saved.')
                                    : (isRTL ? 'لیست اسلایدهای فعلی به عنوان یک فایل ارائه ذخیره خواهد شد.' : 'Current list of slides will be saved as a presentation.')
                                }
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    {mode === 'load' ? (
                        <button
                            onClick={handleLoad}
                            disabled={!selectedId}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${selectedId
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <Upload className="w-5 h-5" />
                            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'بارگذاری' : 'Load Selected'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={!newItemName.trim()}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${newItemName.trim()
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            <Save className="w-5 h-5" />
                            <span className={isRTL ? 'font-[Vazirmatn]' : ''}>{isRTL ? 'ذخیره کردن' : 'Save Item'}</span>
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SaveLoadModal;
