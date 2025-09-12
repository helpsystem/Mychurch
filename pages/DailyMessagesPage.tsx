import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { 
  MessageCircle, 
  Calendar, 
  Send, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Copy,
  Heart,
  Star,
  Book,
  Clock,
  Users,
  CheckCircle,
  Sparkles,
  Mail,
  Phone,
  Globe
} from 'lucide-react';

interface DailyMessage {
  id: string;
  title: {
    en: string;
    fa: string;
  };
  content: {
    en: string;
    fa: string;
  };
  bibleVerse?: {
    reference: string;
    text: {
      en: string;
      fa: string;
    };
  };
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  isPublished: boolean;
  channels: ('email' | 'sms' | 'whatsapp' | 'website')[];
  createdBy: string;
  createdAt: string;
  sentAt?: string;
  recipientCount?: number;
}

const DailyMessagesPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { content } = useContent();
  const [messages, setMessages] = useState<DailyMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'schedule' | 'sent'>('list');
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState<Partial<DailyMessage>>({
    title: { en: '', fa: '' },
    content: { en: '', fa: '' },
    bibleVerse: { reference: '', text: { en: '', fa: '' } },
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    isPublished: false,
    channels: ['website']
  });

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  useEffect(() => {
    loadDailyMessages();
  }, []);

  const loadDailyMessages = async () => {
    setLoading(true);
    try {
      // Load from API when available
      const response = await fetch('/api/daily-messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        // Mock data for now
        setMessages([
          {
            id: '1',
            title: { 
              en: 'Morning Blessing', 
              fa: 'برکت صبحگاهی' 
            },
            content: {
              en: '🌅 Good morning, beloved family in Christ!\n\n✨ May God\'s peace fill your heart today\n\n🙏 Remember that His love never fails\n\n💝 Have a blessed day!',
              fa: '🌅 صبح بخیر خانواده محبوب در مسیح!\n\n✨ باشد که آرامش خدا دل شما را امروز پر کند\n\n🙏 به یاد داشته باشید که محبت او هرگز ناکام نمی‌شود\n\n💝 روز پربرکتی داشته باشید!'
            },
            bibleVerse: {
              reference: 'Psalm 23:1',
              text: {
                en: 'The Lord is my shepherd, I lack nothing.',
                fa: 'خداوند شبان من است، محتاج چیزی نخواهم بود.'
              }
            },
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '09:00',
            isPublished: true,
            channels: ['email', 'website'],
            createdBy: 'Pastor Javad',
            createdAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            recipientCount: 150
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading daily messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMessage = async () => {
    if (!isAdmin) return;
    
    try {
      const messageToCreate: DailyMessage = {
        id: `msg-${Date.now()}`,
        title: newMessage.title!,
        content: newMessage.content!,
        bibleVerse: newMessage.bibleVerse,
        scheduledDate: newMessage.scheduledDate!,
        scheduledTime: newMessage.scheduledTime!,
        isPublished: false,
        channels: newMessage.channels!,
        createdBy: user?.name || user?.email || 'Unknown',
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [messageToCreate, ...prev]);
      
      // Reset form
      setNewMessage({
        title: { en: '', fa: '' },
        content: { en: '', fa: '' },
        bibleVerse: { reference: '', text: { en: '', fa: '' } },
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        isPublished: false,
        channels: ['website']
      });
      
      setActiveTab('list');
      
      alert(lang === 'fa' ? 'پیام ایجاد شد' : 'Message created successfully');
    } catch (error) {
      console.error('Error creating message:', error);
      alert(lang === 'fa' ? 'خطا در ایجاد پیام' : 'Error creating message');
    }
  };

  const publishMessage = async (messageId: string) => {
    if (!isAdmin) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isPublished: true, sentAt: new Date().toISOString(), recipientCount: 150 }
        : msg
    ));
    
    alert(lang === 'fa' ? 'پیام منتشر شد' : 'Message published successfully');
  };

  const deleteMessage = async (messageId: string) => {
    if (!isAdmin) return;
    
    if (confirm(lang === 'fa' ? 'آیا مطمئن هستید؟' : 'Are you sure?')) {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    }
  };

  const tabs = [
    {
      id: 'list',
      label: lang === 'fa' ? 'پیام‌ها' : 'Messages',
      icon: <MessageCircle className="w-5 h-5" />,
      count: messages.length
    },
    {
      id: 'create',
      label: lang === 'fa' ? 'ایجاد پیام' : 'Create Message',
      icon: <Plus className="w-5 h-5" />
    },
    {
      id: 'schedule',
      label: lang === 'fa' ? 'برنامه‌ریزی' : 'Schedule',
      icon: <Calendar className="w-5 h-5" />,
      count: messages.filter(m => !m.isPublished).length
    },
    {
      id: 'sent',
      label: lang === 'fa' ? 'ارسال شده' : 'Sent',
      icon: <CheckCircle className="w-5 h-5" />,
      count: messages.filter(m => m.isPublished).length
    }
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {lang === 'fa' ? 'دسترسی محدود' : 'Access Restricted'}
            </h1>
            <p className="text-gray-600">
              {lang === 'fa' 
                ? 'این بخش فقط برای مدیران و رهبران کلیسا در دسترس است.'
                : 'This section is only available for church managers and leaders.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <MessageCircle className="w-10 h-10 text-purple-600" />
            {lang === 'fa' ? '💌 پیام‌های روزانه الهام‌بخش' : '💌 Daily Inspirational Messages'}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {lang === 'fa' 
              ? 'ایجاد و ارسال پیام‌های روزانه الهام‌بخش برای اعضای کلیسا با آیات کتاب مقدس و محتوای معنوی'
              : 'Create and send daily inspirational messages to church members with Bible verses and spiritual content'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white text-purple-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'list' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                  {lang === 'fa' ? 'همه پیام‌ها' : 'All Messages'}
                </h2>
                
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {lang === 'fa' ? 'هیچ پیامی موجود نیست' : 'No messages available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {message.title[lang] || message.title.en}
                              </h3>
                              {message.isPublished ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {lang === 'fa' ? 'منتشر شده' : 'Published'}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  {lang === 'fa' ? 'پیش‌نویس' : 'Draft'}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {(message.content[lang] || message.content.en).split('\n')[0]}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {message.scheduledDate} {message.scheduledTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {message.recipientCount || 0} {lang === 'fa' ? 'دریافت‌کننده' : 'recipients'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!message.isPublished && (
                              <button
                                onClick={() => publishMessage(message.id)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title={lang === 'fa' ? 'انتشار' : 'Publish'}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteMessage(message.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title={lang === 'fa' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                {lang === 'fa' ? '✨ ایجاد پیام الهام‌بخش' : '✨ Create Inspirational Message'}
              </h2>
              
              <div className="space-y-6">
                {/* Title Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'fa' ? '📝 عنوان پیام' : '📝 Message Title'}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={lang === 'fa' ? 'عنوان فارسی...' : 'Title in Farsi...'}
                      value={newMessage.title?.fa || ''}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        title: { ...prev.title!, fa: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder={lang === 'fa' ? 'عنوان انگلیسی...' : 'Title in English...'}
                      value={newMessage.title?.en || ''}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        title: { ...prev.title!, en: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Content Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'fa' ? '💝 محتوای پیام (با ایموجی‌های زیبا)' : '💝 Message Content (with beautiful emojis)'}
                  </label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">فارسی:</label>
                      <textarea
                        rows={8}
                        placeholder="🌅 صبح بخیر عزیزان!&#10;&#10;✨ امروز روز پربرکتی داشته باشید&#10;🙏 خداوند همراه شما باشد&#10;💝 با محبت و دعا"
                        value={newMessage.content?.fa || ''}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          content: { ...prev.content!, fa: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">English:</label>
                      <textarea
                        rows={8}
                        placeholder="🌅 Good morning beloved!&#10;&#10;✨ May you have a blessed day&#10;🙏 May the Lord be with you&#10;💝 With love and prayers"
                        value={newMessage.content?.en || ''}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          content: { ...prev.content!, en: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                  
                  {/* Emoji Helper */}
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2">
                      {lang === 'fa' ? '💡 ایموجی‌های پیشنهادی:' : '💡 Suggested emojis:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['🙏', '💝', '✨', '🌟', '🌅', '🕊️', '💙', '🌸', '⭐', '💫', '🤲', '👑', '🌹', '☀️', '🌙'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            const textArea = document.activeElement as HTMLTextAreaElement;
                            if (textArea && textArea.tagName === 'TEXTAREA') {
                              const cursorPos = textArea.selectionStart;
                              const currentValue = textArea.value;
                              const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
                              
                              if (textArea.placeholder.includes('فارسی') || textArea.placeholder.includes('صبح')) {
                                setNewMessage(prev => ({
                                  ...prev,
                                  content: { ...prev.content!, fa: newValue }
                                }));
                              } else {
                                setNewMessage(prev => ({
                                  ...prev,
                                  content: { ...prev.content!, en: newValue }
                                }));
                              }
                            }
                          }}
                          className="text-lg hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bible Verse Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Book className="w-4 h-4 text-blue-600" />
                    {lang === 'fa' ? '📖 آیه کتاب مقدس (اختیاری)' : '📖 Bible Verse (Optional)'}
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={lang === 'fa' ? 'مرجع آیه (مثل: مزمور ۲۳:۱)' : 'Verse reference (e.g., Psalm 23:1)'}
                      value={newMessage.bibleVerse?.reference || ''}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        bibleVerse: { ...prev.bibleVerse!, reference: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder={lang === 'fa' ? 'متن فارسی آیه...' : 'Verse text in Farsi...'}
                        value={newMessage.bibleVerse?.text?.fa || ''}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          bibleVerse: { 
                            ...prev.bibleVerse!, 
                            text: { ...prev.bibleVerse?.text!, fa: e.target.value }
                          }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder={lang === 'fa' ? 'متن انگلیسی آیه...' : 'Verse text in English...'}
                        value={newMessage.bibleVerse?.text?.en || ''}
                        onChange={(e) => setNewMessage(prev => ({
                          ...prev,
                          bibleVerse: { 
                            ...prev.bibleVerse!, 
                            text: { ...prev.bibleVerse?.text!, en: e.target.value }
                          }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    {lang === 'fa' ? '⏰ زمان‌بندی ارسال' : '⏰ Send Schedule'}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={newMessage.scheduledDate || ''}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        scheduledDate: e.target.value
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="time"
                      value={newMessage.scheduledTime || ''}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        scheduledTime: e.target.value
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Channels Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    {lang === 'fa' ? '📢 کانال‌های ارسال' : '📢 Send Channels'}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'website', label: lang === 'fa' ? 'وب‌سایت' : 'Website', icon: <Globe className="w-4 h-4" /> },
                      { id: 'email', label: lang === 'fa' ? 'ایمیل' : 'Email', icon: <Mail className="w-4 h-4" /> },
                      { id: 'sms', label: lang === 'fa' ? 'پیامک' : 'SMS', icon: <Phone className="w-4 h-4" /> },
                      { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" /> }
                    ].map((channel) => (
                      <label key={channel.id} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={newMessage.channels?.includes(channel.id as any) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMessage(prev => ({
                                ...prev,
                                channels: [...(prev.channels || []), channel.id as any]
                              }));
                            } else {
                              setNewMessage(prev => ({
                                ...prev,
                                channels: (prev.channels || []).filter(c => c !== channel.id)
                              }));
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        {channel.icon}
                        <span className="text-sm">{channel.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <button
                    onClick={createMessage}
                    disabled={!newMessage.title?.fa || !newMessage.content?.fa}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {lang === 'fa' ? 'ذخیره پیام' : 'Save Message'}
                  </button>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {lang === 'fa' ? 'انصراف' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs content will be implemented later */}
          {(activeTab === 'schedule' || activeTab === 'sent') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {activeTab === 'schedule' 
                    ? (lang === 'fa' ? 'برنامه‌ریزی پیام‌ها' : 'Message Scheduling')
                    : (lang === 'fa' ? 'پیام‌های ارسال شده' : 'Sent Messages')
                  }
                </h3>
                <p className="text-gray-600">
                  {lang === 'fa' 
                    ? 'این بخش به زودی اضافه خواهد شد'
                    : 'This section will be added soon'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyMessagesPage;