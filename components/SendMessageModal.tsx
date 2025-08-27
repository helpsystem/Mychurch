import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from './Spinner';
import { X, Send } from 'lucide-react';
import { User, Language } from '../types';
import TranslationButtons from './TranslationButtons';
import { translationService } from '../services/translationService';
import { useAuth } from '../hooks/useAuth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: { subject: Record<Language, string>, body: Record<Language, string>, methods: ('inbox' | 'email')[] }) => Promise<void>;
    user: User;
}

const SendMessageModal: React.FC<Props> = ({ isOpen, onClose, onSend, user }) => {
    const { t } = useLanguage();
    const { user: currentUser } = useAuth();
    const [subject, setSubject] = useState<Record<Language, string>>({ en: '', fa: '' });
    const [body, setBody] = useState<Record<Language, string>>({ en: '', fa: '' });
    const [methods, setMethods] = useState<('inbox' | 'email')[]>(['inbox']);
    const [includeSignature, setIncludeSignature] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isTranslating, setIsTranslating] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleMethodChange = (method: 'inbox' | 'email') => {
        setMethods(prev =>
            prev.includes(method)
                ? prev.filter(m => m !== method)
                : [...prev, method]
        );
    };

    const handleTranslate = async (fieldName: 'subject' | 'body', sourceLang: 'en' | 'fa') => {
        const targetLang = sourceLang === 'en' ? 'fa' : 'en';
        const sourceText = fieldName === 'subject' ? subject[sourceLang] : body[sourceLang];
        if (!sourceText) return;

        setIsTranslating(`${fieldName}-${sourceLang}`);
        try {
            const translatedText = await translationService.singleTranslate(sourceText, targetLang);
            if (fieldName === 'subject') {
                setSubject(prev => ({ ...prev, [targetLang]: translatedText }));
            } else {
                setBody(prev => ({ ...prev, [targetLang]: translatedText }));
            }
        } catch (error) {
            console.error("Translation failed", error);
        } finally {
            setIsTranslating(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        let finalBody = { ...body };
        if (includeSignature && currentUser?.profileData.signature) {
            const signatureEn = currentUser.profileData.signature.en;
            const signatureFa = currentUser.profileData.signature.fa;
            if (signatureEn) {
                finalBody.en = `${body.en}\n\n---\n${signatureEn}`;
            }
            if (signatureFa) {
                finalBody.fa = `${body.fa}\n\n---\n${signatureFa}`;
            }
        }

        await onSend({ subject, body: finalBody, methods });
        setIsLoading(false);
    };
    
    const inputClass = "w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">{t('sendMessageTo')} {user.profileData.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-dimWhite mb-1">{t('subject')} (EN)</label>
                        <input type="text" value={subject.en} onChange={e => setSubject(p => ({...p, en: e.target.value}))} required className={inputClass} />
                    </div>
                     <TranslationButtons fieldName="subject" onTranslate={handleTranslate} isTranslating={isTranslating} />
                     <div>
                        <label className="block text-sm font-medium text-dimWhite mb-1">{t('subject')} (FA)</label>
                        <input type="text" value={subject.fa} onChange={e => setSubject(p => ({...p, fa: e.target.value}))} required className={inputClass} dir="rtl"/>
                    </div>
                    
                    <hr className="border-gray-700"/>

                     <div>
                        <label className="block text-sm font-medium text-dimWhite mb-1">{t('body')} (EN)</label>
                        <textarea rows={5} value={body.en} onChange={e => setBody(p => ({...p, en: e.target.value}))} required className={inputClass} />
                    </div>
                     <TranslationButtons fieldName="body" onTranslate={handleTranslate} isTranslating={isTranslating} />
                     <div>
                        <label className="block text-sm font-medium text-dimWhite mb-1">{t('body')} (FA)</label>
                        <textarea rows={5} value={body.fa} onChange={e => setBody(p => ({...p, fa: e.target.value}))} required className={inputClass} dir="rtl"/>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dimWhite mb-2">{t('sendVia')}</label>
                        <div className="flex gap-4">
                             <label className="flex items-center gap-2 text-dimWhite">
                                <input type="checkbox" checked={methods.includes('inbox')} onChange={() => handleMethodChange('inbox')} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary"/>
                                {t('sendViaInbox')}
                            </label>
                             <label className="flex items-center gap-2 text-dimWhite">
                                <input type="checkbox" checked={methods.includes('email')} onChange={() => handleMethodChange('email')} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary"/>
                                {t('sendViaEmail')}
                            </label>
                        </div>
                    </div>
                     {currentUser?.profileData.signature?.en && (
                         <div>
                            <label className="flex items-center gap-2 text-sm text-dimWhite cursor-pointer">
                                <input type="checkbox" checked={includeSignature} onChange={e => setIncludeSignature(e.target.checked)} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 text-secondary rounded focus:ring-secondary"/>
                                {t('includeSignature')}
                            </label>
                        </div>
                    )}
                </form>
                <footer className="p-4 border-t border-gray-700 mt-auto">
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                            {t('cancel')}
                        </button>
                        <button type="submit" onClick={handleSubmit} disabled={isLoading || methods.length === 0} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md disabled:opacity-50 w-36 flex justify-center items-center">
                            {isLoading ? <Spinner size="5" /> : <><Send size={16} /> {t('sendMessage')}</>}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SendMessageModal;