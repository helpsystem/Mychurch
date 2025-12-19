
import React, { useState } from 'react';
import { useContent } from '../../hooks/useContent';
import { useLanguage } from '../../hooks/useLanguage';
import { SiteSettings } from '../../types';
import Spinner from '../Spinner';
import ImagePickerModal from '../ImagePickerModal';
import { Save } from 'lucide-react';

const SettingsView: React.FC = () => {
    const { t } = useLanguage();
    const { content, updateSettings } = useContent();
    const [settings, setSettings] = useState<SiteSettings>(content.settings);
    const [isLoading, setIsLoading] = useState(false);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, lang?: 'en' | 'fa') => {
        const { name, value } = e.target;
        if (lang) {
            setSettings(prev => {
                const settingKey = name as keyof SiteSettings;
                const currentVal = prev[settingKey] as any;

                if (typeof currentVal === 'object' && currentVal !== null) {
                    return {
                        ...prev,
                        [settingKey]: {
                            ...currentVal,
                            [lang]: value
                        }
                    };
                }
                return prev;
            });
        } else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleImageSelect = (imageUrl: string) => {
        setSettings(prev => ({ ...prev, logoUrl: imageUrl }));
        setIsImagePickerOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateSettings(settings);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("Failed to save settings.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white";

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white">{t('siteSettings')}</h1>
                
                {/* General Settings */}
                <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                    <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">{t('generalSettings')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('churchNameEn')}</label>
                            <input name="churchName" value={settings.churchName.en} onChange={e => handleChange(e, 'en')} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('churchNameFa')}</label>
                            <input name="churchName" value={settings.churchName.fa} onChange={e => handleChange(e, 'fa')} className={inputClass} dir="rtl"/>
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('footerDescEn')}</label>
                            <input name="footerDescription" value={settings.footerDescription.en} onChange={e => handleChange(e, 'en')} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('footerDescFa')}</label>
                            <input name="footerDescription" value={settings.footerDescription.fa} onChange={e => handleChange(e, 'fa')} className={inputClass} dir="rtl" />
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('logoUrl')}</label>
                            <div className="flex gap-2">
                                <input name="logoUrl" value={settings.logoUrl} onChange={handleChange} className={inputClass} />
                                <button type="button" onClick={() => setIsImagePickerOpen(true)} className="py-2 px-3 bg-gray-600 text-white rounded-md hover:bg-gray-500 text-sm whitespace-nowrap">
                                    {t('findOrGenerateImage')}
                                </button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-dimWhite mb-1">Verse of the Day Attribution (EN)</label>
                            <textarea name="verseOfTheDayAttribution" value={settings.verseOfTheDayAttribution?.en || ''} onChange={e => handleChange(e, 'en')} className={inputClass} rows={3} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm text-dimWhite mb-1">Verse of the Day Attribution (FA)</label>
                            <textarea name="verseOfTheDayAttribution" value={settings.verseOfTheDayAttribution?.fa || ''} onChange={e => handleChange(e, 'fa')} className={inputClass} dir="rtl" rows={3} />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                    <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">{t('contactInfo')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('meetingTimeEn')}</label>
                            <input name="meetingTime" value={settings.meetingTime.en} onChange={e => handleChange(e, 'en')} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('meetingTimeFa')}</label>
                            <input name="meetingTime" value={settings.meetingTime.fa} onChange={e => handleChange(e, 'fa')} className={inputClass} dir="rtl" />
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('phone')}</label>
                            <input name="phone" value={settings.phone} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('whatsAppNumber')}</label>
                            <input name="whatsappNumber" value={settings.whatsappNumber} onChange={handleChange} className={inputClass} placeholder="+1..." />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm text-dimWhite mb-1">{t('address')}</label>
                             <input name="address" value={settings.address} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Social & Community Links */}
                <div className="bg-black-gradient p-6 rounded-[20px] box-shadow">
                    <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">{t('socialMediaLinks')} & {t('communityLinks')}</h2>
                     <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('facebookUrl')}</label>
                            <input name="facebookUrl" value={settings.facebookUrl} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('youtubeUrl')}</label>
                            <input name="youtubeUrl" value={settings.youtubeUrl} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('instagramUrl')}</label>
                            <input name="instagramUrl" value={settings.instagramUrl} onChange={handleChange} className={inputClass} />
                        </div>
                        <hr className="border-gray-700" />
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('newsletterUrl')}</label>
                            <input name="newsletterUrl" value={settings.newsletterUrl} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('telegramUrl')}</label>
                            <input name="telegramUrl" value={settings.telegramUrl} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('whatsappGroupUrl')}</label>
                            <input name="whatsappGroupUrl" value={settings.whatsappGroupUrl} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={isLoading} className="py-2 px-6 bg-blue-gradient text-primary font-bold rounded-md flex items-center gap-2 disabled:opacity-50">
                        {isLoading ? <Spinner size="5" /> : <Save size={16}/>}
                        {t('saveSettings')}
                    </button>
                </div>
            </form>

            {isImagePickerOpen && (
                <ImagePickerModal
                    onClose={() => setIsImagePickerOpen(false)}
                    onSelect={handleImageSelect}
                />
            )}
        </>
    );
};

export default SettingsView;
