
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { HelpCircle } from 'lucide-react';

interface Props {
    title: string;
    content: string;
    onConfirm: () => void;
    onDecline: () => void;
}

const TourPromptModal: React.FC<Props> = ({ title, content, onConfirm, onDecline }) => {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[1000]" role="dialog" aria-modal="true">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-md border border-gray-700 p-8 text-center text-white">
                <HelpCircle size={48} className="mx-auto text-secondary mb-4" />
                <h2 className="text-2xl font-bold mb-3">{title}</h2>
                <p className="text-dimWhite mb-6">{content}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onDecline} className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500">
                        {t('tourSkip')}
                    </button>
                    <button onClick={onConfirm} className="py-2 px-6 bg-blue-gradient text-primary font-bold rounded-md">
                        {t('tourStart')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TourPromptModal;
