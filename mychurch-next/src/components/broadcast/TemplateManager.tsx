"use client";

import React, { useState, useEffect } from 'react';
import { Slide, SessionTemplate, SlideTemplate } from '@/types/broadcast';
import { saveSessionAsTemplate, getSessionTemplates, deleteSessionTemplate, toggleFavoriteTemplate, searchTemplates } from '@/actions/templates';
import { Save, Loader, Trash2, Heart, Search, X } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

const localDict = {
    en: {
        nameAndSlideRequired: 'Please provide a name and at least one slide',
        templateSaved: 'Template saved successfully',
        saveFailed: 'Failed to save template',
        confirmDelete: 'Are you sure?',
        saveTitle: '💾 Save as Sample',
        loadTitle: '📂 Load Sample',
        save: '💾 Save',
        load: '📂 Load',
        nameFarsi: 'Name (Farsi)',
        namePlaceholderFa: 'Sample name in Farsi...',
        nameEnglish: 'Name (English)',
        namePlaceholderEn: 'English sample name...',
        description: 'Description',
        optional: '(Optional)',
        descPlaceholderFa: 'Description in Farsi...',
        category: 'Category',
        catCustom: 'Custom',
        catWorship: 'Worship',
        catSermon: 'Sermon',
        catPrayer: 'Prayer',
        catEvent: 'Event',
        tags: 'Tags',
        commaSeparated: '(comma-separated)',
        slidesToSave: (n: number) => `Slides to save: ${n}`,
        searchTemplates: 'Search templates...',
        noTemplatesFound: 'No templates found',
        slides: 'slides',
        close: 'Close',
        saving: 'Saving...',
        saveSample: 'Save Sample',
    },
    fa: {
        nameAndSlideRequired: 'لطفا نام و داشتن حداقل یک اسلاید مورد نیاز است',
        templateSaved: 'نمونه با موفقیت ذخیره شد',
        saveFailed: 'خرابی در ذخیره نمونه',
        confirmDelete: 'آیا مطمئن هستید؟',
        saveTitle: '💾 ذخیره نمونه',
        loadTitle: '📂 بارگذاری نمونه',
        save: '💾 ذخیره',
        load: '📂 بارگذاری',
        nameFarsi: 'نام فارسی',
        namePlaceholderFa: 'نام نمونه فارسی...',
        nameEnglish: 'نام انگلیسی',
        namePlaceholderEn: 'english sample name...',
        description: 'توضیحات',
        optional: '(اختیاری)',
        descPlaceholderFa: 'توضیحات فارسی...',
        category: 'دسته‌بندی',
        catCustom: 'سفارشی',
        catWorship: 'عبادت',
        catSermon: 'موعظه',
        catPrayer: 'دعا',
        catEvent: 'رویداد',
        tags: 'برچسب‌ها',
        commaSeparated: '(با کاما جدا کنید)',
        slidesToSave: (n: number) => `اسلاید‌های موجود: ${n}`,
        searchTemplates: 'جستجو کردن...',
        noTemplatesFound: 'هیچ نمونه‌ای وجود ندارد',
        slides: 'اسلاید',
        close: 'بستن',
        saving: 'ذخیره...',
        saveSample: 'ذخیره نمونه',
    },
    es: {
        nameAndSlideRequired: 'Por favor, proporcione un nombre y al menos una diapositiva',
        templateSaved: 'Plantilla guardada con éxito',
        saveFailed: 'Error al guardar la plantilla',
        confirmDelete: '¿Está seguro?',
        saveTitle: '💾 Guardar como muestra',
        loadTitle: '📂 Cargar muestra',
        save: '💾 Guardar',
        load: '📂 Cargar',
        nameFarsi: 'Nombre (persa)',
        namePlaceholderFa: 'Nombre de la muestra en persa...',
        nameEnglish: 'Nombre (inglés)',
        namePlaceholderEn: 'Nombre de la muestra en inglés...',
        description: 'Descripción',
        optional: '(Opcional)',
        descPlaceholderFa: 'Descripción en persa...',
        category: 'Categoría',
        catCustom: 'Personalizada',
        catWorship: 'Adoración',
        catSermon: 'Sermón',
        catPrayer: 'Oración',
        catEvent: 'Evento',
        tags: 'Etiquetas',
        commaSeparated: '(separadas por comas)',
        slidesToSave: (n: number) => `Diapositivas a guardar: ${n}`,
        searchTemplates: 'Buscar plantillas...',
        noTemplatesFound: 'No se encontraron plantillas',
        slides: 'diapositivas',
        close: 'Cerrar',
        saving: 'Guardando...',
        saveSample: 'Guardar muestra',
    },
};

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
    const { language } = useLanguage();
    const d = localDict[language] || localDict.fa;
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
            alert(d.nameAndSlideRequired);
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

            alert(d.templateSaved);
            setMode('load');
            loadTemplates();
        } catch (error) {
            console.error('Save failed:', error);
            alert(d.saveFailed);
        }
        setSaving(false);
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm(d.confirmDelete)) return;

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
                        {mode === 'save' ? d.saveTitle : d.loadTitle}
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
                        {d.save}
                    </button>
                    <button
                        onClick={() => setMode('load')}
                        className={`px-4 py-2 rounded-lg transition ${mode === 'load' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
                    >
                        {d.load}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {mode === 'save' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    {d.nameFarsi}
                                </label>
                                <input
                                    type="text"
                                    value={saveName.fa}
                                    onChange={(e) => setSaveName({ ...saveName, fa: e.target.value })}
                                    placeholder={d.namePlaceholderFa}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    dir="rtl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    {d.nameEnglish}
                                </label>
                                <input
                                    type="text"
                                    value={saveName.en}
                                    onChange={(e) => setSaveName({ ...saveName, en: e.target.value })}
                                    placeholder={d.namePlaceholderEn}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">
                                    {d.description} {d.optional}
                                </label>
                                <textarea
                                    value={saveDesc.fa}
                                    onChange={(e) => setSaveDesc({ ...saveDesc, fa: e.target.value })}
                                    placeholder={d.descPlaceholderFa}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:out focus:border-indigo-500 h-20"
                                    dir="rtl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        {d.category}
                                    </label>
                                    <select
                                        value={saveCategory}
                                        onChange={(e) => setSaveCategory(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="custom">{d.catCustom}</option>
                                        <option value="worship">{d.catWorship}</option>
                                        <option value="sermon">{d.catSermon}</option>
                                        <option value="prayer">{d.catPrayer}</option>
                                        <option value="event">{d.catEvent}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">
                                        {d.tags} {d.commaSeparated}
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
                                    📊 {d.slidesToSave(currentSlides.length)}
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
                                    placeholder={d.searchTemplates}
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
                                        {d.noTemplatesFound}
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
                                                        {template.category} • {template.slideCount} {d.slides}
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
                        {d.close}
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
                                    {d.saving}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {d.saveSample}
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
