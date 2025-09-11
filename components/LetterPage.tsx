import React from 'react';
import { useContent } from '../hooks/useContent';
import { useLanguage } from '../hooks/useLanguage';
import { SiteSettings, User, ChurchLetter } from '../types';

interface Props {
    letter: ChurchLetter;
    pageNumber?: number;
    totalPages?: number;
    settings: SiteSettings;
    author?: User;
    children?: React.ReactNode;
}

const LetterPage: React.FC<Props> = ({ letter, pageNumber = 1, totalPages = 1, settings, author, children }) => {
    const { lang } = useLanguage();
    
    const signature = author?.profileData?.signature?.[lang];
    const currentDate = new Date(letter.createdAt).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US');

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white text-black p-[20mm] flex flex-col shadow-lg font-serif letter-page print:shadow-none">
            {/* Church Letterhead */}
            <header className="flex justify-between items-start pb-6 border-b-2 border-gray-400 mb-8">
                <div className="flex items-center gap-6">
                    <img src={settings.logoUrl} alt="Church Logo" className="w-20 h-20 object-contain"/>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">{settings.churchName[lang]}</h1>
                        <p className="text-sm text-gray-600 mb-1">{settings.address}</p>
                        <div className="flex gap-4 text-sm text-gray-600">
                            <span>{settings.phone}</span>
                            {settings.whatsappNumber && <span>WhatsApp: {settings.whatsappNumber}</span>}
                        </div>
                    </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                    <div className="mb-2 font-semibold">{currentDate}</div>
                    {letter.authorEmail && (
                        <div className="text-xs">Ref: {letter.id.toString().padStart(4, '0')}</div>
                    )}
                </div>
            </header>

            {/* Letter Content */}
            <div className="flex-grow">
                {/* From/To Section */}
                <div className="mb-6 space-y-2 text-sm">
                    <div><strong>{lang === 'fa' ? 'از طرف:' : 'From:'}</strong> {letter.from[lang]}</div>
                    <div><strong>{lang === 'fa' ? 'به:' : 'To:'}</strong> {letter.to[lang]}</div>
                    {letter.requestedBy[lang] && (
                        <div><strong>{lang === 'fa' ? 'به درخواست:' : 'Requested by:'}</strong> {letter.requestedBy[lang]}</div>
                    )}
                </div>

                {/* Letter Body */}
                <main className="text-justify leading-relaxed text-base mb-8">
                    {children || (
                        <div className="whitespace-pre-wrap">
                            {letter.body[lang]}
                        </div>
                    )}
                </main>
            </div>

            {/* Footer with Signature */}
            <footer className="pt-6 border-t border-gray-300 flex justify-between items-end">
                <div className="text-xs text-gray-500">
                    {totalPages > 1 && `Page ${pageNumber} of ${totalPages}`}
                </div>
                
                {signature && (
                    <div className="text-right">
                        <div className="mb-4">
                            <p className="whitespace-pre-wrap text-sm italic text-gray-700">{signature}</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold">{author?.profileData?.name || letter.authorEmail}</p>
                            <p className="text-xs text-gray-600">{letter.authorEmail}</p>
                        </div>
                    </div>
                )}
            </footer>

            {/* Print Styles */}
            <style jsx>{`
                @media print {
                    .letter-page {
                        page-break-after: always;
                        margin: 0;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default LetterPage;
