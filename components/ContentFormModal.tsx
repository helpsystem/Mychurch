import React, { useState, useEffect, useMemo } from 'react';
import { X, Folder, Users } from 'lucide-react';
import Spinner from './Spinner';
import { useLanguage } from '../hooks/useLanguage';
import ImagePickerModal from './ImagePickerModal';
import ReactQuill from 'react-quill';
import TranslationButtons from './TranslationButtons';
import { translationService } from '../services/translationService';
import { Language, FieldConfig, User } from '../types';
import { useAuth } from '../hooks/useAuth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    itemToEdit: any | null;
    fields: FieldConfig[];
    title: string;
    isLoading: boolean;
}

const UserSelectField: React.FC<{ value: string[], onChange: (selected: string[]) => void }> = ({ value, onChange }) => {
    const { getUsers } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getUsers().then(users => {
            setAllUsers(users);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to fetch users for select field", err);
            setIsLoading(false);
        });
    }, [getUsers]);

    const handleSelect = (email: string) => {
        const isSelected = value.includes(email);
        if (isSelected) {
            onChange(value.filter(e => e !== email));
        } else {
            onChange([...value, email]);
        }
    };
    
    if (isLoading) return <Spinner />;

    return (
        <div className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white max-h-48 overflow-y-auto">
            {allUsers.map(user => (
                <label key={user.email} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-800 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={value.includes(user.email)}
                        onChange={() => handleSelect(user.email)}
                        className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary"
                    />
                    <span>{user.profileData.name} ({user.email})</span>
                </label>
            ))}
        </div>
    );
};


const ContentFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, itemToEdit, fields, title, isLoading }) => {
    const [formData, setFormData] = useState<any>({});
    const { t } = useLanguage();
    const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
    const [fileFieldTarget, setFileFieldTarget] = useState<{ name: string; type: 'image' | 'audio' | 'video' } | null>(null);
    const [isTranslating, setIsTranslating] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        if (itemToEdit) {
            setFormData(itemToEdit);
        } else {
            const initialData: any = {};
            fields.forEach(field => {
                if (field.lang) {
                    if (!initialData[field.name]) {
                        initialData[field.name] = {};
                    }
                    initialData[field.name][field.lang] = '';
                } else if (field.type === 'user-select') {
                    initialData[field.name] = [];
                }
                else {
                    initialData[field.name] = field.type === 'select' ? (field.options?.[0]?.value || '') : '';
                }
            });
            setFormData(initialData);
        }
    }, [itemToEdit, fields, isOpen]);

    if (!isOpen) return null;

    const handleTranslate = async (fieldName: string, sourceLang: 'en' | 'fa') => {
        const targetLang = sourceLang === 'en' ? 'fa' : 'en';
        const sourceText = formData[fieldName]?.[sourceLang];
        if (!sourceText) return;

        setIsTranslating(`${fieldName}-${sourceLang}`);
        try {
            const isQuill = fields.find(f => f.name === fieldName && f.type === 'textarea');
            let textToTranslate = sourceText;

            if (isQuill) {
                const div = document.createElement('div');
                div.innerHTML = sourceText;
                textToTranslate = div.textContent || div.innerText || '';
            }
            
            const translatedText = await translationService.singleTranslate(textToTranslate, targetLang);
            let finalText = translatedText;

            if (isQuill) {
                // Wrap lines in <p> tags for Quill to maintain paragraphs
                finalText = translatedText.split('\n').filter(line => line.trim() !== '').map(line => `<p>${line.trim()}</p>`).join('');
            }
            
            setFormData((prev: any) => ({
                ...prev,
                [fieldName]: {
                    ...prev[fieldName],
                    [targetLang]: finalText,
                },
            }));
        } catch (error) {
            console.error("Translation failed", error);
        } finally {
            setIsTranslating(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, fieldConfig: FieldConfig) => {
        const { value } = e.target;
        if (fieldConfig.lang) {
            setFormData((prev: any) => ({
                ...prev,
                [fieldConfig.name]: {
                    ...prev[fieldConfig.name],
                    [fieldConfig.lang!]: value,
                },
            }));
        } else {
            setFormData((prev: any) => ({ ...prev, [fieldConfig.name]: value }));
        }
    };
    
    const handleQuillChange = (html: string, fieldConfig: FieldConfig) => {
        if (fieldConfig.lang) {
            setFormData((prev: any) => ({
                ...prev,
                [fieldConfig.name]: {
                    ...prev[fieldConfig.name],
                    [fieldConfig.lang!]: html,
                },
            }));
        } else {
            setFormData((prev: any) => ({ ...prev, [fieldConfig.name]: html }));
        }
    };

    const handleUserSelectChange = (selected: string[], fieldConfig: FieldConfig) => {
        setFormData((prev: any) => ({ ...prev, [fieldConfig.name]: selected }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleFileSelect = (fileUrl: string) => {
        if (fileFieldTarget) {
            setFormData((prev: any) => ({ ...prev, [fileFieldTarget.name]: fileUrl }));
        }
        setIsFilePickerOpen(false);
        setFileFieldTarget(null);
    };
    
    const openFilePicker = (fieldName: string) => {
        let type: 'image' | 'audio' | 'video' = 'image';
        if (fieldName.toLowerCase().includes('audio')) type = 'audio';
        if (fieldName.toLowerCase().includes('video')) type = 'video';
        setFileFieldTarget({ name: fieldName, type });
        setIsFilePickerOpen(true);
    };
    
    const quillModules = {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link'],
        ['clean']
      ],
    };

    const renderField = (field: FieldConfig) => {
        const id = field.lang ? `${field.name}.${field.lang}` : field.name;
        const value = field.lang ? formData[field.name]?.[field.lang] ?? '' : formData[field.name] ?? '';

        const commonProps = {
            id: id,
            name: field.name,
            value: value,
            onChange: (e: any) => handleChange(e, field),
            className: "w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white",
            required: true,
        };

        const isFileUrlField = ['imageurl', 'audiourl', 'videourl'].some(substr => field.name.toLowerCase().includes(substr));

        if (field.type === 'textarea') {
          return (
            <div key={id}>
                <label className="block text-sm font-medium text-dimWhite mb-1">
                    {field.label}
                </label>
                <div className="bg-white text-gray-900 rounded-md overflow-hidden">
                    <ReactQuill
                        theme="snow"
                        value={value}
                        onChange={(html) => handleQuillChange(html, field)}
                        modules={quillModules}
                    />
                </div>
                 {field.name === 'content' && (
                     <div className="text-xs text-gray-400 mt-2 p-2 bg-primary rounded-md border border-gray-700">
                        <p className="font-bold">{t('shortcodeHelp')}</p>
                        <ul className="list-disc list-inside">
                            <li><code className="text-secondary">[PRAYER_FORM]</code> - {t('prayerRequestForm')}</li>
                            <li><code className="text-secondary">[WEEKLY_SCHEDULE]</code> - {t('weeklySchedule')}</li>
                        </ul>
                    </div>
                )}
            </div>
          );
        }

        if (field.type === 'user-select') {
            return (
                 <div key={id}>
                    <label className="block text-sm font-medium text-dimWhite mb-1">
                        {field.label}
                    </label>
                    <UserSelectField value={formData[field.name] || []} onChange={(selected) => handleUserSelectChange(selected, field)} />
                </div>
            )
        }

        return (
            <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium text-dimWhite mb-1">
                    {field.label}
                </label>
                <div className="flex items-center gap-2">
                    {field.type === 'select' ? (
                        <select {...commonProps}>
                           {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                        <input type={field.type} {...commonProps} />
                    )}
                    {isFileUrlField && (
                        <button type="button" onClick={() => openFilePicker(field.name)} className="py-2 px-3 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm whitespace-nowrap flex items-center gap-2">
                            <Folder size={16} /> {t('selectFile')}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const processedFields = useMemo(() => {
        const result: (FieldConfig | { type: 'translator', name: string })[] = [];
        const processedNames: string[] = [];

        fields.forEach(field => {
            if (processedNames.includes(field.name)) return;

            if (field.lang) {
                const pair = fields.find(f => f.name === field.name && f.lang !== field.lang);
                if (pair) {
                    const enField = field.lang === 'en' ? field : pair;
                    const faField = field.lang === 'fa' ? field : pair;
                    result.push(enField);
                    result.push({ type: 'translator', name: field.name });
                    result.push(faField);
                    processedNames.push(field.name);
                } else {
                    result.push(field);
                    processedNames.push(field.name);
                }
            } else {
                result.push(field);
                processedNames.push(field.name);
            }
        });
        return result;
    }, [fields]);

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
                <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-4xl border border-gray-700 max-h-[90vh] flex flex-col">
                    <header className="flex justify-between items-center p-4 border-b border-gray-700">
                        <h2 className="text-xl font-semibold text-white">{title}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </header>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                        {processedFields.map((item, index) => {
                            if ('type' in item && item.type === 'translator') {
                                return <TranslationButtons key={`${item.name}-translator`} fieldName={item.name} onTranslate={handleTranslate} isTranslating={isTranslating} />;
                            }
                            const field = item as FieldConfig;
                            return renderField(field);
                        })}
                    </form>
                    <footer className="p-4 border-t border-gray-700 mt-auto">
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                                {t('cancel')}
                            </button>
                            <button type="submit" onClick={handleSubmit} disabled={isLoading} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md disabled:opacity-50 w-36 flex justify-center items-center">
                                {isLoading ? <Spinner size="5" /> : t('saveChanges')}
                            </button>
                        </div>
                    </footer>
                </div>
            </div>
            {isFilePickerOpen && (
                <ImagePickerModal
                    onClose={() => setIsFilePickerOpen(false)}
                    onSelect={handleFileSelect}
                    fileTypeFilter={fileFieldTarget?.type}
                />
            )}
        </>
    );
};

export default ContentFormModal;
