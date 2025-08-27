import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import LanguageSwitcher from './LanguageSwitcher';

const StandaloneHeader: React.FC = () => {
    const { t } = useLanguage();
    const { content } = useContent();
    const { settings } = content;

    return (
        <header className="absolute top-0 left-0 w-full z-10 p-4 sm:px-16 px-6">
            <div className="flex justify-between items-center max-w-[1280px] mx-auto">
                <Link to="/" className="flex items-center gap-3">
                    <img src={settings.logoUrl} alt="Church Logo" className="w-10 h-10" />
                    <span className="text-white text-lg font-semibold hidden md:block">{t('churchTitle')}</span>
                </Link>
                <LanguageSwitcher />
            </div>
        </header>
    );
};

export default StandaloneHeader;
