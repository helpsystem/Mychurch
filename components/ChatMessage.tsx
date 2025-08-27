import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useContent } from '../hooks/useContent';
import { Bot, User, Phone } from 'lucide-react';
import { CHURCH_PHONE } from '../lib/constants';

const ChatMessage: React.FC<{ message: ChatMessageType }> = ({ message }) => {
  const { t } = useLanguage();
  const { content } = useContent();
  const isUser = message.sender === 'user';

  const getWhatsAppUrl = () => {
      const phone = content.settings?.whatsappNumber || content.settings?.phone || CHURCH_PHONE; 
      const sanitizedPhone = phone.replace(/[^0-9+]/g, '');
      const text = t('whatsappMessage');
      return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(text)}`;
  };

  if (message.isConnectingToWhatsapp) {
    return (
      <div className="my-4 p-4 rounded-lg bg-green-900/50 border border-green-500/50 text-green-200 text-center">
        <p className="mb-4">{t('aiConnectPrompt')}</p>
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Phone size={18} />
          {t('connectOnWhatsApp')}
        </a>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-gradient text-primary flex items-center justify-center">
          <Bot size={24} />
        </div>
      )}
      <div
        className={`max-w-xl p-4 rounded-2xl ${
          isUser
            ? 'bg-gray-700 text-white rounded-br-lg'
            : 'bg-gray-800 text-dimWhite rounded-bl-lg'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center">
          <User size={24} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;