import React from 'react';
import { AdminMessage } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface Props {
  message: AdminMessage;
  onClick: () => void;
}

const InboxMessage: React.FC<Props> = ({ message, onClick }) => {
    const { lang } = useLanguage();

    const shortBody = message.body[lang].substring(0, 50) + '...';

    return (
        <button onClick={onClick} className="letter-image block mx-auto focus:outline-none focus:ring-2 focus:ring-secondary rounded-lg">
            <div className="animated-mail">
                <div className="back-fold"></div>
                <div className="letter">
                    <div className="letter-border"></div>
                    <div className="letter-title m-2 text-xs font-bold text-[#cb5a5e] truncate">{message.subject[lang]}</div>
                    <div className="letter-context m-2 text-xs text-[#cb5a5e]">{shortBody}</div>
                </div>
                <div className="top-fold"></div>
                <div className="body"></div>
                <div className="left-fold"></div>
            </div>
        </button>
    );
};

export default InboxMessage;
