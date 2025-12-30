import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, BookOpen, Sparkles, RefreshCw, Volume2, Share2, Copy } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  verses?: Array<{
    reference: string;
    text: string;
    book_code: string;
    chapter: number;
    verse: number;
  }>;
  timestamp: Date;
}

interface DailyVerse {
  reference: string;
  text: string;
  book_code: string;
  chapter: number;
  verse: number;
}

const BibleAIChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [language, setLanguage] = useState<'fa' | 'en'>('fa');
  const [darkMode, setDarkMode] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [requestQueue, setRequestQueue] = useState<Array<() => Promise<any>>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // In production, use empty string so /api/* goes through nginx proxy
  // In development, use localhost:3001
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_URL = isDevelopment ? 'http://localhost:3001' : '';
  
  // Rate limiting configuration
  const RATE_LIMIT = {
    minRequestInterval: 1000, // 1 second between requests
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds for retry
  };

  // Cache keys
  const CACHE_KEYS = {
    dailyVerse: (lang: string) => `dailyVerse_${lang}_${new Date().toDateString()}`,
    searchResults: (query: string, lang: string) => `search_${lang}_${query}`,
    chatHistory: 'chatHistory'
  };

  // Get from localStorage cache
  const getFromCache = (key: string): any => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 24 hours
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  };

  // Save to localStorage cache
  const saveToCache = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  };

  // Process request queue with rate limiting
  const processRequestQueue = async () => {
    if (isProcessingQueue || requestQueue.length === 0) return;
    
    setIsProcessingQueue(true);
    
    try {
      while (requestQueue.length > 0) {
        const request = requestQueue[0];
        setRequestQueue(prev => prev.slice(1));
        
        await request();
        
        // Add delay between queued requests
        await new Promise(resolve =>
          setTimeout(resolve, RATE_LIMIT.minRequestInterval)
        );
      }
    } catch (error) {
      console.error('Error processing request queue:', error);
    } finally {
      setIsProcessingQueue(false);
    }
  };

  // Load daily verse on mount with debouncing
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load dark mode preference first
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode) {
          setDarkMode(savedDarkMode === 'true');
        }
        
        // Load chat history from localStorage
        const savedHistory = getFromCache(CACHE_KEYS.chatHistory);
        if (savedHistory && Array.isArray(savedHistory)) {
          setMessages(savedHistory);
        }
        
        // Debounce daily verse fetch
        const timer = setTimeout(() => {
          fetchDailyVerse();
        }, 500);
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveToCache(CACHE_KEYS.chatHistory, messages);
    }
  }, [messages]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Process queue when it changes
  useEffect(() => {
    if (requestQueue.length > 0 && !isProcessingQueue) {
      processRequestQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestQueue, isProcessingQueue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDailyVerse = async () => {
    try {
      // Check cache first
      const cacheKey = CACHE_KEYS.dailyVerse(language);
      const cached = getFromCache(cacheKey);
      
      if (cached) {
        console.log('✅ Daily verse loaded from cache');
        setDailyVerse(cached);
        return;
      }

      // Rate limiting check
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < RATE_LIMIT.minRequestInterval) {
        // Wait before making the request
        await new Promise(resolve =>
          setTimeout(resolve, RATE_LIMIT.minRequestInterval - timeSinceLastRequest)
        );
      }

      // Fetch from API with retry mechanism
      let response;
      let retryCount = 0;
      
      while (retryCount < RATE_LIMIT.maxRetries) {
        try {
          response = await axios.get(`${API_URL}/api/ai-chat/daily-verse`, {
            params: { language },
            timeout: 5000
          });
          
          setDailyVerse(response.data);
          
          // Save to cache
          saveToCache(cacheKey, response.data);
          console.log('✅ Daily verse cached');
          
          setLastRequestTime(Date.now());
          break;
          
        } catch (error: any) {
          retryCount++;
          console.error(`❌ Failed to fetch daily verse (attempt ${retryCount}):`, error);
          
          if (retryCount >= RATE_LIMIT.maxRetries) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve =>
            setTimeout(resolve, RATE_LIMIT.retryDelay)
          );
        }
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch daily verse after all retries:', error);
      // Don't show error to user for daily verse - just log it
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = inputText;
    setInputText('');
    setIsLoading(true);

    // Add to request queue instead of making immediate request
    const request = async () => {
      try {
        // Rate limiting check
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        
        if (timeSinceLastRequest < RATE_LIMIT.minRequestInterval) {
          // Wait before making the request
          await new Promise(resolve =>
            setTimeout(resolve, RATE_LIMIT.minRequestInterval - timeSinceLastRequest)
          );
        }

        let response;
        let retryCount = 0;
        
        // Retry mechanism
        while (retryCount < RATE_LIMIT.maxRetries) {
          try {
            response = await axios.post(`${API_URL}/api/ai-chat/ask`, {
              question: currentQuestion,
              language
            }, {
              timeout: 10000 // 10 second timeout
            });
            
            setLastRequestTime(Date.now());
            break;
            
          } catch (error: any) {
            retryCount++;
            console.error(`❌ AI Chat Error (attempt ${retryCount}):`, error);
            
            if (retryCount >= RATE_LIMIT.maxRetries) {
              throw error;
            }
            
            // Exponential backoff for retries
            await new Promise(resolve =>
              setTimeout(resolve, RATE_LIMIT.retryDelay * Math.pow(2, retryCount - 1))
            );
          }
        }

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: response.data.answer,
          verses: response.data.verses,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        
      } catch (error: any) {
        console.error('❌ AI Chat Error after all retries:', error);
        
        let errorText = '';
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          errorText = language === 'fa'
            ? '❌ خطا در اتصال به سرور. لطفاً مطمئن شوید سرور در حال اجراست.'
            : '❌ Connection error. Please make sure the server is running.';
        } else if (error.code === 'ECONNABORTED') {
          errorText = language === 'fa'
            ? '⏱️ زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید.'
            : '⏱️ Request timeout. Please try again.';
        } else if (error.response) {
          errorText = language === 'fa'
            ? `❌ خطای سرور (${error.response.status}): ${error.response.data?.message || 'خطای ناشناخته'}`
            : `❌ Server error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`;
        } else {
          errorText = language === 'fa'
            ? `❌ خطا: ${error.message}`
            : `❌ Error: ${error.message}`;
        }
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          text: errorText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    // Add to queue - useEffect will trigger processRequestQueue
    setRequestQueue(prev => [...prev, request]);
    // Removed duplicate call: processRequestQueue() is called by useEffect when requestQueue changes
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
    // Debounce quick questions to prevent rapid fire
    setTimeout(() => {
      if (inputText === question) {
        handleSendMessage();
      }
    }, 300);
  };

  const handleVerseClick = (bookCode: string, chapter: number, verse: number) => {
    // Navigate to Bible Reader with specific verse
    window.location.href = `/bible?book=${bookCode}&chapter=${chapter}&verse=${verse}`;
  };

  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem(CACHE_KEYS.chatHistory);
    console.log('🗑️ Chat history cleared');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  // Text to Speech
  const speakText = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'fa' ? 'fa-IR' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert(language === 'fa' 
        ? 'مرورگر شما از پخش صدا پشتیبانی نمی‌کند'
        : 'Your browser does not support text-to-speech');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(language === 'fa' ? '✅ کپی شد!' : '✅ Copied!');
    }).catch(() => {
      alert(language === 'fa' ? '❌ خطا در کپی' : '❌ Copy failed');
    });
  };

  // Share verse
  const shareVerse = (reference: string, text: string) => {
    const shareText = `${reference}\n\n${text}`;
    
    if (navigator.share) {
      navigator.share({
        title: reference,
        text: shareText
      }).catch(err => console.log('Share failed:', err));
    } else {
      copyToClipboard(shareText);
    }
  };

  const quickQuestions = language === 'fa' ? [
    'چگونه می‌توانم آرامش پیدا کنم؟',
    'خداوند چه می‌گوید درباره محبت؟',
    'در زمان سختی چه کنم؟',
    'چگونه ایمانم را قوی‌تر کنم؟'
  ] : [
    'How can I find peace?',
    'What does God say about love?',
    'What should I do in difficult times?',
    'How can I strengthen my faith?'
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 z-50 group"
          aria-label={language === 'fa' ? 'باز کردن چت کتاب مقدس' : 'Open Bible Chat'}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            AI
          </span>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 w-96 h-[600px] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border ${
            darkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}
          dir={language === 'fa' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <div>
                <h3 className="font-bold text-lg">
                  {language === 'fa' ? 'دستیار هوشمند کتاب مقدس' : 'Bible AI Assistant'}
                </h3>
                <p className="text-xs opacity-90">
                  {language === 'fa' ? 'پاسخ به سوالات شما با آیات کتاب مقدس' : 'Answering your questions with Scripture'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                onClick={toggleDarkMode}
                className="px-2 py-1 bg-white/20 rounded-lg text-xs hover:bg-white/30 transition"
                title={language === 'fa' ? 'تغییر تم' : 'Toggle theme'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
                className="px-2 py-1 bg-white/20 rounded-lg text-xs hover:bg-white/30 transition"
                title={language === 'fa' ? 'Switch to English' : 'تغییر به فارسی'}
              >
                {language === 'fa' ? 'EN' : 'فا'}
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="px-2 py-1 bg-white/20 rounded-lg text-xs hover:bg-white/30 transition"
                  title={language === 'fa' ? 'پاک کردن تاریخچه' : 'Clear history'}
                >
                  🗑️
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Daily Verse Banner */}
          {dailyVerse && messages.length === 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 border-b border-amber-200">
              <div className="flex items-start space-x-2 space-x-reverse">
                <BookOpen className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800 mb-1">
                    {language === 'fa' ? '📖 آیه امروز' : '📖 Today\'s Verse'}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    {dailyVerse.text}
                  </p>
                  <p className="text-xs text-amber-600 font-medium">
                    {dailyVerse.reference}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            {messages.length === 0 ? (
              <div className="text-center py-8 space-y-6">
                <div className="text-6xl">🙏</div>
                <div>
                  <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {language === 'fa' 
                      ? 'به دستیار هوشمند کتاب مقدس خوش آمدید!'
                      : 'Welcome to Bible AI Assistant!'}
                  </h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fa'
                      ? 'سوالات خود را بپرسید یا یکی از سوالات پیشنهادی را انتخاب کنید'
                      : 'Ask your questions or choose from suggested questions'}
                  </p>
                </div>

                {/* Quick Questions */}
                <div className="space-y-2">
                  <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fa' ? 'سوالات پیشنهادی:' : 'Suggested Questions:'}
                  </p>
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className={`w-full text-sm px-4 py-3 rounded-xl border transition text-right ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 hover:border-blue-400 hover:bg-gray-600 text-gray-200'
                          : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-800'
                      }`}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 border border-gray-600 text-gray-200'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>

                      {/* Verses */}
                      {message.verses && message.verses.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.verses.map((verse, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <p 
                                  className="text-xs font-semibold text-amber-800 flex items-center cursor-pointer hover:text-amber-900"
                                  onClick={() => handleVerseClick(verse.book_code, verse.chapter, verse.verse)}
                                >
                                  <BookOpen className="w-3 h-3 mr-1 ml-1" />
                                  {verse.reference}
                                </p>
                                <div className="flex space-x-1 space-x-reverse">
                                  <button
                                    onClick={() => speakText(verse.text, language)}
                                    className="p-1 hover:bg-amber-200 rounded transition"
                                    title={language === 'fa' ? 'پخش صدا' : 'Play audio'}
                                  >
                                    <Volume2 className="w-3 h-3 text-amber-700" />
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(`${verse.reference}\n${verse.text}`)}
                                    className="p-1 hover:bg-amber-200 rounded transition"
                                    title={language === 'fa' ? 'کپی' : 'Copy'}
                                  >
                                    <Copy className="w-3 h-3 text-amber-700" />
                                  </button>
                                  <button
                                    onClick={() => shareVerse(verse.reference, verse.text)}
                                    className="p-1 hover:bg-amber-200 rounded transition"
                                    title={language === 'fa' ? 'اشتراک‌گذاری' : 'Share'}
                                  >
                                    <Share2 className="w-3 h-3 text-amber-700" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {verse.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString(language === 'fa' ? 'fa-IR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`p-4 border-t ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex space-x-2 space-x-reverse">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={language === 'fa' ? 'سوال خود را بپرسید...' : 'Ask your question...'}
                className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  darkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                }`}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {language === 'fa' 
                ? 'با ❤️ از کتاب مقدس - پاسخ‌های مبتنی بر آیات'
                : 'Powered by Scripture ❤️ - Bible-based answers'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default BibleAIChatWidget;
