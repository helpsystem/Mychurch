import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from './Spinner';
import { X, Send } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSend: (email: string) => Promise<void>;
}

const InviteUserModal: React.FC<Props> = ({ isOpen, onClose, onSend }) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onSend(email);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-black-gradient rounded-xl shadow-lg w-full max-w-md border border-gray-700 flex flex-col">
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">{t('inviteUser')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-dimWhite">{t('inviteUserDescription')}</p>
                    <div>
                        <label htmlFor="invite-email" className="block text-sm font-medium text-dimWhite mb-1">{t('emailAddress')}</label>
                        <input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2 border border-gray-600 bg-primary rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                            placeholder="name@example.com"
                        />
                    </div>
                </form>
                <footer className="p-4 border-t border-gray-700 mt-auto">
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500">
                            {t('cancel')}
                        </button>
                        <button type="submit" onClick={handleSubmit} disabled={isLoading || !email} className="py-2 px-4 bg-blue-gradient text-primary font-bold rounded-md disabled:opacity-50 w-36 flex justify-center items-center">
                            {isLoading ? <Spinner size="5" /> : <><Send size={16} /> {t('sendInvitation')}</>}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default InviteUserModal;
