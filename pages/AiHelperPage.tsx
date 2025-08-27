import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { geminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import ChatMessageComponent from '../components/ChatMessage';
import Spinner from '../components/Spinner';
import { Send } from 'lucide-react';
import { WHATSAPP_CONNECT_TRIGGER } from '../lib/constants';

const LOCAL_STORAGE_KEY = 'icc-ai-helper-chat';

const AiHelperPage: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{ sender: 'ai', text: t('aiWelcome') }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error("Failed to save messages:", error);
    }
  }, [messages]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out the initial UI-only welcome message from the history sent to the API
      const historyForApi = newMessages.filter(m => m.text !== t('aiWelcome'));
      const response = await geminiService.chatWithAlHayat(historyForApi);
      let aiText = response.text.trim();
      
      let aiMessage: ChatMessage;

      if (aiText === WHATSAPP_CONNECT_TRIGGER) {
        aiMessage = { sender: 'ai', text: '', isConnectingToWhatsapp: true };
      } else {
        aiMessage = { sender: 'ai', text: aiText };
      }
      
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { sender: 'ai', text: t('aiError') };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:px-16 px-6 sm:py-8 py-4 flex flex-col h-full">
        <div className="flex flex-col flex-grow max-w-4xl mx-auto w-full bg-black-gradient rounded-[20px] shadow-2xl overflow-hidden border border-gray-800">
          <header className="bg-primary text-white p-4 text-center border-b border-gray-700">
            <h1 className="font-semibold text-xl text-gradient">{t('navAiHelper')}</h1>
            <div className="flex justify-center items-center gap-2 text-xs text-green-400 mt-1">
                <span className="relative flex h-2 w-2">
                    <span className="animate-pulse-fast absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {t('connected')}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            {messages.map((msg, index) => (
              <ChatMessageComponent key={index} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start my-4">
                <div className="flex items-center gap-3 text-dimWhite">
                   <Spinner size="6"/>
                   <span>{t('aiThinking')}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>
          <footer className="p-4 bg-primary/50 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('aiPlaceholder')}
                className="flex-1 p-3 border border-gray-700 bg-primary rounded-full focus:outline-none focus:ring-2 focus:ring-secondary text-white"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-blue-gradient text-primary rounded-full p-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send size={24} />
              </button>
            </div>
          </footer>
        </div>
    </div>
  );
};

export default AiHelperPage;