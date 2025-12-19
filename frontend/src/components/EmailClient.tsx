
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { User, Email } from '../types';
import { mockEmails } from '../lib/mockData';
import { Inbox, User as UserIcon, Mail } from 'lucide-react';

interface Props {
    user: User;
}

const EmailClient: React.FC<Props> = ({ user }) => {
    const { t } = useLanguage();
    const [selectedInbox, setSelectedInbox] = useState(user.email);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

    const inboxes = [user.email, ...(user.accessibleInboxes || ['info@iccdc.com'])];

    const emailsForInbox = useMemo(() => {
        return mockEmails.filter(email => email.to === selectedInbox).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedInbox]);

    return (
        <div className="flex flex-col md:flex-row bg-primary border border-gray-700 rounded-lg overflow-hidden min-h-[60vh]">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 lg:w-1/4 border-b md:border-b-0 md:border-r border-gray-700 flex-shrink-0">
                <div className="p-4">
                    <button 
                        onClick={() => setSelectedInbox(user.email)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-medium ${selectedInbox === user.email ? 'bg-blue-gradient text-primary' : 'text-dimWhite hover:bg-gray-800'}`}
                    >
                        <UserIcon size={16} /> {t('personalInbox')}
                    </button>
                </div>
                <div className="px-4 py-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('sharedInboxes')}</h3>
                    <div className="mt-2 space-y-1">
                        {(user.accessibleInboxes || ['info@iccdc.com']).map(inbox => (
                             <button 
                                key={inbox}
                                onClick={() => setSelectedInbox(inbox)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-medium ${selectedInbox === inbox ? 'bg-blue-gradient text-primary' : 'text-dimWhite hover:bg-gray-800'}`}
                            >
                                <Inbox size={16} /> {inbox}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Email List */}
            <div className="w-full md:w-1/3 lg:w-1/3 border-b md:border-b-0 md:border-r border-gray-700 overflow-y-auto">
                {emailsForInbox.map(email => (
                    <button 
                        key={email.id} 
                        onClick={() => setSelectedEmail(email)}
                        className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-800/50 ${selectedEmail?.id === email.id ? 'bg-gray-800' : ''}`}
                    >
                        <div className="flex justify-between items-baseline">
                            <p className={`font-semibold truncate ${!email.isRead ? 'text-white' : 'text-dimWhite'}`}>{email.from.name}</p>
                            <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{new Date(email.date).toLocaleDateString()}</p>
                        </div>
                        <p className={`truncate text-sm ${!email.isRead ? 'text-secondary' : 'text-gray-400'}`}>{email.subject}</p>
                    </button>
                ))}
            </div>

            {/* Email Detail View */}
            <div className="w-full md:w-1/3 lg:w-2/3 p-6 overflow-y-auto">
                {selectedEmail ? (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{selectedEmail.subject}</h2>
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center font-bold text-white">
                                {selectedEmail.from.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-white">{selectedEmail.from.name}</p>
                                <p className="text-sm text-gray-400">&lt;{selectedEmail.from.email}&gt;</p>
                            </div>
                        </div>
                        <div className="prose prose-invert max-w-none text-dimWhite" dangerouslySetInnerHTML={{ __html: selectedEmail.body }}></div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <Mail size={48} />
                        <p className="mt-2">{t('noEmailSelected')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailClient;
