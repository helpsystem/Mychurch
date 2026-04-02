"use client";

import React, { useState, useEffect } from 'react';
import { Slide, SessionTemplate, SlideTemplate } from '@/types/broadcast';
import { saveSessionAsTemplate, getSessionTemplates, deleteSessionTemplate, toggleFavoriteTemplate, searchTemplates } from '@/actions/templates';
import { Save, Loader, Trash2, Heart, Search, X } from 'lucide-react';

interface TemplateManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadTemplate?: (slides: Slide[]) => void;
    onSaveTemplate?: (template: SessionTemplate) => void;
    currentSlides?: Slide[];
    isRTL?: boolean;
}

export function TemplateManager({
    isOpen,
    onClose,
    onLoadTemplate,
    onSaveTemplate,
    currentSlides = [],
    isRTL = true,
}: TemplateManagerProps) {
    const [mode, setMode] = useState<'save' | 'load'>('load');
    const [templates, setTemplates] = useState<SessionTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [saveName, setSaveName] = useState({ fa: '', en: '' });
    const [saveDesc, setSaveDesc] = useState({ fa: '', en: '' });
    const [saveCategory, setSaveCategory] = useState('custom');
    const [saveTags, setSaveTags] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && mode === 'load') {
            loadTemplates();
        }
    }, [isOpen, mode]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const data = await getSessionTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
        setLoading(false);
    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (!term) {
            loadTemplates();
            return;
        }

        setLoading(true);
        try {
            const result = await searchTemplates(term);
            setTemplates(result.sessions);
        } catch (error) {
            console.error('Search failed:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!saveName.fa || !saveName.en || currentSlides.length === 0) {
            alert(isRTL ? 'لطفا نام و داشتن حداقل یک اسلاید مورد نیاز است' : 'Please provide a name and at least one slide');
            return;
        }

        setSaving(true);
        try {
            const template = await saveSessionAsTemplate(
                currentSlides,
                saveName,
                saveCategory,
                { fa: saveDesc.fa, en: saveDesc.en },
                saveTags ? saveTags.split(',').map(t => t.trim()) : [],
                false
            );
            
            if (onSaveTemplate) {
                onSaveTemplate(template);
            }

            // Reset form
            setSaveName({ fa: '', en: '' });
            setSaveDesc({ fa: '', en: '' });
            setSaveCategory('custom');
            setSaveTags('');

            alert(isRTL ? 'نمونه با موفقیت ذخیره شد' : 'Template saved successfully');
            setMode('load');
            loadTemplates();
        } catch (error) {
            console.error('Save failed:', error);
            alert(isRTL ? 'خرابی در ذخیره نمونه' : 'Failed to save template');
        }
        setSaving(false);
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm(isRTL ? 'آیا مطمئن هستید؟' : 'Are you sure?')) return;

        try {
            await deleteSessionTemplate(templateId);
            setTemplates(templates.filter(t => t.id !== templateId));
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleToggleFavorite = async (templateId: string) => {
        try {
            await toggleFavoriteTemplate(templateId);
            setTemplates(templates.map(t => 
                t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
            ));
        } catch (error) {
            console.error('Toggle favorite failed:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className={`bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col ${isRTL ? 'font-[Vazirmatn]' : ''}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">
                        {mode === 'save' ? (isRTL ? '💾 ذخیره نمونه' : '💾 Save as Sample') : (isRTL ? '📂 بارگذاری نمونه' : '📂 Load Sample')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Mode Selector */}
                <div className="bg-slate-700 px-6 py-3 flex gap-3 border-b border-slate-600">
                    <button
                        onClick={() => setMode('save')}
                        className={`px-4 py-2 rounded-lg transition ${mode === 'save' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                    >
                        {isRTL ? '💾 ذخیره' : '💾 Save'}
                    </button>
                    <button
                        onClick={() => setMode('load')}
                        className={`px-4 py-2 rounded-lg transition ${mode === 'load' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                    >
                        {isRTL ? '📂 بارگذاری' : '📂 Load'}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {mode === 'save' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    {isRTL ? 'نام فارسی' : 'Name (Farsi)'}
                                </label>
                                <input
                                    type="text"
                                    value={saveName.fa}
                                    onChange={(e) => setSaveName({ ...saveName, fa: e.target.value })}
                                    placeholder={isRTL ? 'نام نمونه فارسی...' : 'Sample name in Farsi...'}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    dir="rtl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    {isRTL ? 'نام انگلیسی' : 'Name (English)'}
                                </label>
                                <input
                                    type="text"
                                    value={saveName.en}
                                    onChange={(e) => setSaveName({ ...saveName, en: e.target.value })}
                                    placeholder="english sample name..."
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    {isRTL ? 'توضیحات' : 'Description'} (Optional)
                                </label>
                                <textarea
                                    value={saveDesc.fa}
                                    onChange={(e) => setSaveDesc({ ...saveDesc, fa: e.target.value })}
                                    placeholder={isRTL ? 'توضیحات فارسی...' : 'Description in Farsi...'}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:out focus:border-indigo-500 h-20"
                                    dir="rtl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        {isRTL ? 'دسته‌بندی' : 'Category'}
                                    </label>
                                    <select
                                        value={saveCategory}
                                        onChange={(e) => setSaveCategory(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="custom">{isRTL ? 'سفارشی' : 'Custom'}</option>
                                        <option value="worship">{isRTL ? 'عبادت' : 'Worship'}</option>
                                        <option value="sermon">{isRTL ? 'موعظه' : 'Sermon'}</option>
                                        <option value="prayer">{isRTL ? 'دعا' : 'Prayer'}</option>
                                        <option value="event">{isRTL ? 'رویداد' : 'Event'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        {isRTL ? 'برچسب‌ها' : 'Tags'} (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={saveTags}
                                        onChange={(e) => setSaveTags(e.target.value)}
                                        placeholder="tag1, tag2, tag3"
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                                <p className="text-sm text-slate-300">
                                    📊 {isRTL ? `اسلاید‌های موجود: ${currentSlides.length}` : `Slides to save: ${currentSlides.length}`}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute right-3 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder={isRTL ? 'جستجو کردن...' : 'Search templates...'}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                />
                            </div>

                            {/* Templates List */}
                            <div className="space-y-2">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader className="w-8 h-8 animate-spin text-indigo-400" />
                                    </div>
                                ) : templates.length === 0 ? (
                                    <div className="text-center text-slate-400 py-8">
                                        {isRTL ? 'هیچ نمونه‌ای وجود ندارد' : 'No templates found'}
                                    </div>
                                ) : (
                                    templates.map(template => (
                                        <div
                                            key={template.id}
                                            className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-indigo-500 transition cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="flex-1"
                                                    onClick={() => onLoadTemplate?.(template.slides)}
                                                >
                                                    <h3 className="font-bold text-white mb-1">
                                                        {isRTL ? template.name.fa : template.name.en}
                                                    </h3>
                                                    <p className="text-sm text-slate-400 mb-2">
                                                        {template.category} • {template.slideCount} {isRTL ? 'اسلاید' : 'slides'}
                                                    </p>
                                                    {template.description?.fa && (
                                                        <p className="text-xs text-slate-500 line-clamp-2" dir="rtl">
                                                            {template.description.fa}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                    <button
                                                        onClick={() => handleToggleFavorite(template.id)}
                                                        className={`p-2 rounded transition ${template.isFavorite ? 'bg-rose-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                                                    >
                                                        <Heart className="w-4 h-4" fill={template.isFavorite ? 'white' : 'none'} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(template.id)}
                                                        className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-700 border-t border-slate-600 px-6 py-4 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition"
                    >
                        {isRTL ? 'بستن' : 'Close'}
                    </button>

                    {mode === 'save' && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    {isRTL ? 'ذخیره...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {isRTL ? 'ذخیره نمونه' : 'Save Sample'}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TemplateManager;
