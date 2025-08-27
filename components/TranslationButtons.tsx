import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Spinner from './Spinner';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
    fieldName: string;
    onTranslate: (fieldName: string, sourceLang: 'en' | 'fa') => void;
    isTranslating: string | null;
}

const TranslationButtons: React.FC<Props> = ({ fieldName, onTranslate, isTranslating }) => {
    const { t } = useLanguage();
    
    return (
        <div className="flex justify-center items-center gap-4 my-2">
            <button type="button"
                onClick={() => onTranslate(fieldName, 'en')}
                disabled={!!isTranslating}
                title={t('translateEnToFaTitle')}
                className="py-1 px-3 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 text-white flex items-center gap-2 text-xs">
                {isTranslating === `${fieldName}-en` ? <Spinner size="4" /> : <ArrowRightLeft size={14} />}
                <span>EN &rarr; FA</span>
            </button>
            <button type="button"
                onClick={() => onTranslate(fieldName, 'fa')}
                disabled={!!isTranslating}
                title={t('translateFaToEnTitle')}
                className="py-1 px-3 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 text-white flex items-center gap-2 text-xs">
                {isTranslating === `${fieldName}-fa` ? <Spinner size="4" /> : <ArrowRightLeft size={14} />}
                <span>FA &rarr; EN</span>
            </button>
        </div>
    );
};

export default TranslationButtons;