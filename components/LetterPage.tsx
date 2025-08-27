import React from 'react';
import { useContent } from '../hooks/useContent';
import { useLanguage } from '../hooks/useLanguage';
import { SiteSettings, User } from '../types';

interface Props {
    children: React.ReactNode;
    pageNumber: number;
    totalPages: number;
    settings: SiteSettings;
    author: User | undefined;
}

const LetterPage: React.FC<Props> = ({ children, pageNumber, totalPages, settings, author }) => {
    const { lang } = useLanguage();
    
    const signature = author?.profileData.signature?.[lang];

    return (
        <div className="w-[210mm] h-[297mm] bg-white text-black p-[20mm] flex flex-col shadow-lg font-serif letter-page">
            <header className="flex justify-between items-start pb-4 border-b border-gray-300">
                <div className="flex items-center gap-4">
                    <img src={settings.logoUrl} alt="Logo" className="w-16 h-16"/>
                    <div>
                        <h1 className="text-xl font-bold">{settings.churchName[lang]}</h1>
                        <p className="text-xs text-gray-600">{settings.address}</p>
                    </div>
                </div>
                <p className="text-xs text-gray-600">{settings.phone}</p>
            </header>

            <main className="flex-grow pt-8 text-justify leading-relaxed">
                {children}
            </main>

            <footer className="pt-4 border-t border-gray-300 text-sm text-gray-600 flex justify-between items-end">
                <div className="text-xs">
                    Page {pageNumber} of {totalPages}
                </div>
                {signature && (
                    <div className="text-right">
                        <p className="whitespace-pre-wrap italic">{signature}</p>
                    </div>
                )}
            </footer>
        </div>
    );
};

export default LetterPage;
