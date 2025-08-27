
import React, { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import Spinner from '../Spinner';
import { Send, Wand2 } from 'lucide-react';
import { geminiService } from '../../services/geminiService';

const PushNotificationsManager: React.FC = () => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [titleFa, setTitleFa] = useState('');
    const [bodyFa, setBodyFa] = useState('');
    const [isBilingual, setIsBilingual] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });

    const handleSend = async () => {
        setIsLoading(true);
        setStatus({ message: '', type: '' });
        try {
            const payload = isBilingual ? { title: `${title}\n${titleFa}`, body: `${body}\n${bodyFa}` } : { title, body };
            // In a real app, this would be an API call to the backend
            // await api.post('/api/notifications/send', payload); 
            console.log("Sending notification:", payload);
            setTimeout(() => { // Simulating API call
                setStatus({ message: t('notificationSuccess'), type: 'success' });
                setIsLoading(false);
            }, 1500);
        } catch (err) {
            console.error(err);
            setStatus({ message: t('notificationError'), type: 'error' });
            setIsLoading(false);
        }
    };
    
    const handleImprove = async (field: 'title' | 'body', lang: 'en' | 'fa') => {
        let textToImprove = '';
        if(field === 'title') textToImprove = lang === 'en' ? title : titleFa;
        else textToImprove = lang === 'en' ? body : bodyFa;

        if(!textToImprove) return;
        
        try {
            const response = await geminiService.improveNotificationText(textToImprove);
            const improvedText = response.text;
            if (field === 'title') {
                lang === 'en' ? setTitle(improvedText) : setTitleFa(improvedText);
            } else {
                 lang === 'en' ? setBody(improvedText) : setBodyFa(improvedText);
            }
        } catch (error) {
            console.error("AI improvement failed", error);
        }
    }

    const inputClass = "w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white";

    return (
        <div className="bg-black-gradient p-6 rounded-[20px] box-shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-4">{t('pushNotificationManager')}</h2>
            
            <div className="space-y-4">
                <div className="flex justify-end">
                     <label className="flex items-center gap-2 text-sm text-dimWhite cursor-pointer">
                        <input type="checkbox" checked={isBilingual} onChange={e => setIsBilingual(e.target.checked)} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary focus:ring-offset-primary"/>
                        {t('sendBilingual')}
                    </label>
                </div>
                {/* English Form */}
                <div className="p-4 border border-gray-700 rounded-lg">
                    <h3 className="font-semibold mb-2 text-white">English</h3>
                    <div>
                        <label className="block text-sm text-dimWhite mb-1">{t('messageTitle')}</label>
                         <div className="flex gap-2">
                             <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass}/>
                             <button onClick={() => handleImprove('title', 'en')} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><Wand2 size={16}/></button>
                         </div>
                    </div>
                     <div className="mt-2">
                        <label className="block text-sm text-dimWhite mb-1">{t('messageBody')}</label>
                         <div className="flex gap-2">
                            <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} className={inputClass}/>
                             <button onClick={() => handleImprove('body', 'en')} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><Wand2 size={16}/></button>
                         </div>
                    </div>
                </div>

                {/* Farsi Form */}
                {isBilingual && (
                     <div className="p-4 border border-gray-700 rounded-lg">
                        <h3 className="font-semibold mb-2 text-white">Farsi</h3>
                        <div>
                            <label className="block text-sm text-dimWhite mb-1">{t('messageTitle')}</label>
                            <div className="flex gap-2">
                                <input type="text" value={titleFa} onChange={e => setTitleFa(e.target.value)} className={inputClass} dir="rtl"/>
                                <button onClick={() => handleImprove('title', 'fa')} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><Wand2 size={16}/></button>
                            </div>
                        </div>
                         <div className="mt-2">
                            <label className="block text-sm text-dimWhite mb-1">{t('messageBody')}</label>
                             <div className="flex gap-2">
                                <textarea value={bodyFa} onChange={e => setBodyFa(e.target.value)} rows={3} className={inputClass} dir="rtl"/>
                                <button onClick={() => handleImprove('body', 'fa')} className="p-2 bg-gray-700 rounded-md hover:bg-gray-600"><Wand2 size={16}/></button>
                            </div>
                        </div>
                    </div>
                )}
                
                 {status.message && (
                    <div className={`p-3 text-center rounded-lg border ${status.type === 'success' ? 'text-green-300 bg-green-900/50 border-green-500/50' : 'text-red-300 bg-red-900/50 border-red-500/50'}`}>
                        {status.message}
                    </div>
                )}

                <div className="pt-4">
                    <button onClick={handleSend} disabled={isLoading} className="w-full py-3 px-4 bg-blue-gradient text-primary font-bold rounded-md flex items-center justify-center gap-2 disabled:opacity-50">
                        {isLoading ? <Spinner /> : <><Send/> {t('sendNotification')}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PushNotificationsManager;
