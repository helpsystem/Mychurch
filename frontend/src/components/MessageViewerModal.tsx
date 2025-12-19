import React from 'react';
import { AdminMessage } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import useScramble from '../hooks/useScramble';
import { X } from 'lucide-react';

interface Props {
  message: AdminMessage;
  onClose: () => void;
}

const ScrambledLine: React.FC<{ text: string, delay?: number }> = ({ text, delay = 0 }) => {
    const ref = useScramble(text, { delay });
    return <span ref={ref} className="block" />;
};

const MessageViewerModal: React.FC<Props> = ({ message, onClose }) => {
    const { t, lang } = useLanguage();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-85 flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-primary rounded-lg shadow-lg w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col p-6 text-white" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-dimWhite">{t('fromAdmin')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="font-mono text-lg space-y-4 overflow-y-auto">
                    <h3 className="text-2xl font-bold text-secondary">
                        <ScrambledLine text={message.subject[lang]} />
                    </h3>
                    <div className="whitespace-pre-wrap text-dimWhite">
                         <ScrambledLine text={message.body[lang]} delay={500} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageViewerModal;
