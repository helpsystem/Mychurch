
import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useContent } from '../../hooks/useContent';
import { ContentType, Leader, Sermon, Event, WorshipSong, ScheduleEvent, FieldConfig } from '../../types';
import Spinner from '../Spinner';
import ContentFormModal from '../ContentFormModal';
import { Plus, Edit, Trash2 } from 'lucide-react';

const ContentManager: React.FC = () => {
    const { t } = useLanguage();
    const { content, addItem, updateItem, deleteItem, loading: contentLoading } = useContent();
    const [activeTab, setActiveTab] = useState<ContentType>('leaders');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const tabs: { id: ContentType; label: string }[] = [
        { id: 'leaders', label: t('leaders') },
        { id: 'sermons', label: t('sermonsTitle') },
        { id: 'events', label: t('navEvents') },
        { id: 'worshipSongs', label: t('worshipTitle') },
        { id: 'scheduleEvents', label: t('scheduleTitle') }
    ];

    const getFieldsForType = (type: ContentType): FieldConfig[] => {
        switch (type) {
            case 'leaders':
                return [
                    { name: 'name', label: t('name'), type: 'text' },
                    { name: 'title', label: `${t('titleEn')}`, type: 'text', lang: 'en' },
                    { name: 'title', label: `${t('titleFa')}`, type: 'text', lang: 'fa' },
                    { name: 'imageUrl', label: t('imageUrl'), type: 'text' },
                    { name: 'whatsappNumber', label: t('whatsappNumber'), type: 'text' },
                    { name: 'bio', label: 'Bio (EN)', type: 'textarea', lang: 'en' },
                    { name: 'bio', label: 'Bio (FA)', type: 'textarea', lang: 'fa' },
                ];
            case 'sermons':
                return [
                    { name: 'title', label: `${t('titleEn')}`, type: 'text', lang: 'en' },
                    { name: 'title', label: `${t('titleFa')}`, type: 'text', lang: 'fa' },
                    { name: 'speaker', label: t('speaker'), type: 'text' },
                    { name: 'date', label: t('dateYYYYMMDD'), type: 'text' },
                    { name: 'audioUrl', label: t('audioUrl'), type: 'text' },
                ];
             case 'events':
                return [
                    { name: 'title', label: `${t('titleEn')}`, type: 'text', lang: 'en' },
                    { name: 'title', label: `${t('titleFa')}`, type: 'text', lang: 'fa' },
                    { name: 'date', label: t('dateYYYYMMDD'), type: 'text' },
                    { name: 'description', label: 'Description (EN)', type: 'textarea', lang: 'en' },
                    { name: 'description', label: 'Description (FA)', type: 'textarea', lang: 'fa' },
                    { name: 'imageUrl', label: t('imageUrl'), type: 'text' },
                ];
            case 'worshipSongs':
                 return [
                    { name: 'title', label: `${t('titleEn')}`, type: 'text', lang: 'en' },
                    { name: 'title', label: `${t('titleFa')}`, type: 'text', lang: 'fa' },
                    { name: 'artist', label: t('artist'), type: 'text' },
                    { name: 'youtubeId', label: 'YouTube ID', type: 'text' },
                    { name: 'videoUrl', label: t('videoUrl'), type: 'text' },
                    { name: 'audioUrl', label: t('audioUrl'), type: 'text' },
                    { name: 'lyrics', label: 'Lyrics (EN)', type: 'textarea', lang: 'en' },
                    { name: 'lyrics', label: 'Lyrics (FA)', type: 'textarea', lang: 'fa' },
                ];
            case 'scheduleEvents':
                return [
                    { name: 'title', label: `${t('titleEn')}`, type: 'text', lang: 'en' },
                    { name: 'title', label: `${t('titleFa')}`, type: 'text', lang: 'fa' },
                    { name: 'description', label: 'Description (EN)', type: 'textarea', lang: 'en' },
                    { name: 'description', label: 'Description (FA)', type: 'textarea', lang: 'fa' },
                    { name: 'leader', label: t('leaders'), type: 'text' },
                    { name: 'date', label: 'Date (YYYY-MM-DD)', type: 'text' },
                    { name: 'startTime', label: 'Start Time (HH:MM)', type: 'text' },
                    { name: 'endTime', label: 'End Time (HH:MM)', type: 'text' },
                    { name: 'type', label: 'Type', type: 'select', options: [{value: 'in-person', label: 'In-person'}, {value: 'online', label: 'Online'}, {value: 'hybrid', label: 'Hybrid'}] },
                    { name: 'location', label: 'Location/URL', type: 'text' },
                ];
            default: return [];
        }
    };

    const handleOpenModal = (item: any = null) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        setIsLoading(true);
        try {
            if (itemToEdit) {
                await updateItem(activeTab, itemToEdit.id, data);
            } else {
                await addItem(activeTab, data);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save item", error);
            alert("Failed to save item.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (itemId: number) => {
        if (window.confirm(t('confirmDelete'))) {
            setIsLoading(true);
            try {
                await deleteItem(activeTab, itemId);
            } catch (error) {
                 console.error("Failed to delete item", error);
                 alert("Failed to delete item.");
            } finally {
                setIsLoading(false);
            }
        }
    }

    const renderTable = () => {
        if (contentLoading) return <div className="flex justify-center"><Spinner /></div>;
        
        const data = content[activeTab];
        
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/20">
                        <tr>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data as any[]).map(item => (
                            <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-white">
                                    {typeof item.title === 'object' ? item.title.en : item.name}
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    {item.speaker && `${t('speaker')}: ${item.speaker}`}
                                    {item.artist && `${t('artist')}: ${item.artist}`}
                                    {item.date && ` | ${t('date')}: ${typeof item.date === 'string' ? item.date : item.date.en}`}
                                </td>
                                <td className="px-6 py-4">
                                     <button onClick={() => handleOpenModal(item)} className="p-2 text-dimWhite hover:text-secondary"><Edit size={16}/></button>
                                     <button onClick={() => handleDelete(item.id)} className="p-2 text-dimWhite hover:text-red-500"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white">{t('manageContent')}</h2>
                <button onClick={() => handleOpenModal()} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2">
                    <Plus size={16}/> {t('addNew')}
                </button>
            </div>

            <div className="border-b border-gray-700">
                <nav className="flex space-x-4" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.id
                                ? 'border-secondary text-secondary'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="mt-6">
                {renderTable()}
            </div>

            {isModalOpen && (
                <ContentFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    itemToEdit={itemToEdit}
                    fields={getFieldsForType(activeTab)}
                    title={itemToEdit ? `Edit ${activeTab}` : `Add New ${activeTab}`}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default ContentManager;
