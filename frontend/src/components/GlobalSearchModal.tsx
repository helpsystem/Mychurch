import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Link, useNavigate } from 'react-router-dom';
import { X, Search, MicVocal, FileText, Calendar, User } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const { t, lang } = useLanguage();
    const { content } = useContent();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const searchResults = useMemo(() => {
        if (!debouncedSearchTerm) return null;

        const term = debouncedSearchTerm.toLowerCase();
        const results = {
            sermons: content.sermons.filter(s => s.title[lang].toLowerCase().includes(term) || s.speaker.toLowerCase().includes(term)),
            pages: content.pages.filter(p => p.status === 'published' && (p.title[lang].toLowerCase().includes(term) || p.content[lang].toLowerCase().includes(term))),
            events: content.events.filter(e => e.title[lang].toLowerCase().includes(term) || e.description[lang].toLowerCase().includes(term)),
            leaders: content.leaders.filter(l => l.name.toLowerCase().includes(term) || l.bio[lang].toLowerCase().includes(term)),
        };

        const total = results.sermons.length + results.pages.length + results.events.length + results.leaders.length;
        return { ...results, total };

    }, [debouncedSearchTerm, content, lang]);

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleLinkClick = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-start z-[100] pt-20" onClick={onClose}>
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-2xl border border-gray-700 flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex items-center gap-3 border-b border-gray-700">
                    <Search className="text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t('globalSearch')}
                        className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
                        autoFocus
                    />
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
                </div>
                <div className="overflow-y-auto">
                    {searchResults && searchResults.total > 0 && (
                         <div className="p-4 space-y-4">
                            {searchResults.sermons.length > 0 && <div>
                                <h3 className="font-semibold text-sm text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><MicVocal size={16}/> {t('sermonsTitle')}</h3>
                                {searchResults.sermons.map(item => <div key={`sermon-${item.id}`} onClick={() => handleLinkClick('/sermons')} className="p-2 rounded-md hover:bg-primary cursor-pointer text-white">{item.title[lang]} - <span className="text-dimWhite">{item.speaker}</span></div>)}
                            </div>}
                             {searchResults.pages.length > 0 && <div>
                                <h3 className="font-semibold text-sm text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><FileText size={16}/> {t('pages')}</h3>
                                {searchResults.pages.map(item => <div key={`page-${item.id}`} onClick={() => handleLinkClick(`/p/${item.slug}`)} className="p-2 rounded-md hover:bg-primary cursor-pointer text-white">{item.title[lang]}</div>)}
                            </div>}
                            {searchResults.events.length > 0 && <div>
                                <h3 className="font-semibold text-sm text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><Calendar size={16}/> {t('navEvents')}</h3>
                                {searchResults.events.map(item => <div key={`event-${item.id}`} onClick={() => handleLinkClick('/events')} className="p-2 rounded-md hover:bg-primary cursor-pointer text-white">{item.title[lang]}</div>)}
                            </div>}
                             {searchResults.leaders.length > 0 && <div>
                                <h3 className="font-semibold text-sm text-secondary uppercase tracking-wider mb-2 flex items-center gap-2"><User size={16}/> {t('leaders')}</h3>
                                {searchResults.leaders.map(item => <div key={`leader-${item.id}`} onClick={() => handleLinkClick('/leaders')} className="p-2 rounded-md hover:bg-primary cursor-pointer text-white">{item.name}</div>)}
                            </div>}
                         </div>
                    )}
                    {searchResults && searchResults.total === 0 && (
                        <div className="p-10 text-center text-gray-500">{t('searchNoResults')} "{debouncedSearchTerm}"</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;