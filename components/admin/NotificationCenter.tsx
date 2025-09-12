import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Phone, 
  Users, 
  Settings, 
  BarChart3,
  Plus,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Bell,
  Target,
  MessageCircle,
  Smartphone,
  Globe,
  Download,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { 
  notificationService, 
  type NotificationRecipient, 
  type NotificationOptions,
  type NotificationResult,
  type NotificationTemplate
} from '../../lib/services/notificationService';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history' | 'stats'>('send');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Send notification state
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [notificationOptions, setNotificationOptions] = useState<NotificationOptions>({
    content: {
      sms: { en: '', fa: '' }
    },
    channels: {
      email: false,
      sms: false,
      whatsapp: false
    },
    priority: 'normal'
  });
  
  // Templates state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  // History state
  const [notificationHistory, setNotificationHistory] = useState<NotificationResult[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'sent' | 'failed' | 'partial'>('all');
  
  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    partial: 0,
    failed: 0,
    channels: {
      email: { sent: 0, failed: 0 },
      sms: { sent: 0, failed: 0 },
      whatsapp: { sent: 0, failed: 0 }
    }
  });
  
  // Connectivity status
  const [connectivity, setConnectivity] = useState({
    email: { available: false, error: undefined as string | undefined },
    sms: { available: false, error: undefined as string | undefined },
    whatsapp: { available: false, error: undefined as string | undefined }
  });

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  useEffect(() => {
    if (isAdmin) {
      loadInitialData();
    }
  }, [isAdmin]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load recipients from API with fallback
      try {
        const apiRecipients = await notificationService.getRecipients();
        if (Array.isArray(apiRecipients) && apiRecipients.length > 0) {
          setRecipients(apiRecipients);
        } else {
          // Fallback to empty array if no recipients
          setRecipients([]);
        }
      } catch (recipientError) {
        console.warn('Failed to load recipients:', recipientError);
        setRecipients([]);
      }
      
      // Load templates with fallback
      try {
        const availableTemplates = await notificationService.getTemplates();
        setTemplates(Array.isArray(availableTemplates) ? availableTemplates : []);
      } catch (templateError) {
        console.warn('Failed to load templates:', templateError);
        setTemplates([]);
      }
      
      // Load notification history with fallback
      try {
        const history = await notificationService.getDeliveryLog(50);
        setNotificationHistory(Array.isArray(history) ? history : []);
      } catch (historyError) {
        console.warn('Failed to load notification history:', historyError);
        setNotificationHistory([]);
      }
      
      // Load stats with fallback
      try {
        const currentStats = await notificationService.getDeliveryStats(24);
        if (currentStats && typeof currentStats === 'object') {
          setStats(currentStats);
        }
      } catch (statsError) {
        console.warn('Failed to load stats:', statsError);
        // Keep default stats structure
      }
      
      // Test connectivity
      try {
        const connectivityStatus = await notificationService.testConnectivity();
        setConnectivity(connectivityStatus);
      } catch (connectivityError) {
        console.warn('Failed to test connectivity:', connectivityError);
        setConnectivity({
          email: { available: false, error: 'Connection test failed' },
          sms: { available: false, error: 'Connection test failed' },
          whatsapp: { available: false, error: 'Connection test failed' }
        });
      }
    } catch (error) {
      console.error('Critical error loading notification center data:', error);
      // Show user-friendly error message
      const errorMessage = lang === 'fa' 
        ? 'خطا در بارگذاری اطلاعات مرکز اعلان‌رسانی. لطفاً دوباره تلاش کنید.' 
        : 'Error loading notification center data. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (selectedRecipients.length === 0) {
      alert(lang === 'fa' ? 'لطفاً گیرندگان را انتخاب کنید' : 'Please select recipients');
      return;
    }

    if (!notificationOptions.content.sms.en && !notificationOptions.content.sms.fa) {
      alert(lang === 'fa' ? 'لطفاً متن پیام را وارد کنید' : 'Please enter message content');
      return;
    }

    setSending(true);
    try {
      const targetRecipients = recipients.filter(r => selectedRecipients.includes(r.id));
      
      if (targetRecipients.length === 0) {
        throw new Error(lang === 'fa' ? 'گیرنده معتبری یافت نشد' : 'No valid recipients found');
      }
      
      const results = await notificationService.sendBulkNotification(targetRecipients, notificationOptions);
      
      if (!Array.isArray(results)) {
        throw new Error(lang === 'fa' ? 'پاسخ نامعتبر از سرور' : 'Invalid response from server');
      }
      
      // Update history
      setNotificationHistory(prev => [...results, ...prev]);
      
      // Update stats with error handling
      try {
        const newStats = await notificationService.getDeliveryStats(24);
        if (newStats && typeof newStats === 'object') {
          setStats(newStats);
        }
      } catch (statsError) {
        console.warn('Failed to update stats after sending:', statsError);
      }
      
      // Success feedback
      const successCount = results.filter(r => r.status === 'sent').length;
      const partialCount = results.filter(r => r.status === 'partial').length;
      const failedCount = results.filter(r => r.status === 'failed').length;
      
      let message = '';
      if (lang === 'fa') {
        message = `ارسال کامل شد: ${successCount} موفق، ${partialCount} جزئی، ${failedCount} ناموفق`;
      } else {
        message = `Sent: ${successCount} successful, ${partialCount} partial, ${failedCount} failed`;
      }
      
      alert(message);
      
      // Reset form
      setSelectedRecipients([]);
      setNotificationOptions({
        content: {
          sms: { en: '', fa: '' }
        },
        channels: {
          email: false,
          sms: false,
          whatsapp: false
        },
        priority: 'normal'
      });
      
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert(lang === 'fa' ? 'خطا در ارسال پیام' : 'Error sending notifications');
    } finally {
      setSending(false);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setNotificationOptions({
        ...notificationOptions,
        templateId,
        content: {
          email: template.content.email,
          sms: template.content.sms,
          push: template.content.push
        }
      });
    }
  };

  const filteredHistory = notificationHistory.filter(result => {
    if (historyFilter === 'all') return true;
    return result.status === historyFilter;
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">
          {lang === 'fa' ? 'دسترسی محدود به ادمین' : 'Admin access required'}
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            {lang === 'fa' ? 'مرکز اعلان‌رسانی' : 'Notification Center'}
          </h2>
          <button
            onClick={loadInitialData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {lang === 'fa' ? 'بروزرسانی' : 'Refresh'}
          </button>
        </div>

        {/* Connectivity Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className={`p-3 rounded-lg ${connectivity.email.available ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              <Mail className={`w-4 h-4 ${connectivity.email.available ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${connectivity.email.available ? 'text-green-800' : 'text-red-800'}`}>
                {lang === 'fa' ? 'ایمیل' : 'Email'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                connectivity.email.available 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-red-200 text-red-800'
              }`}>
                {connectivity.email.available 
                  ? (lang === 'fa' ? 'فعال' : 'Active') 
                  : (lang === 'fa' ? 'غیرفعال' : 'Inactive')
                }
              </span>
            </div>
            {connectivity.email.error && (
              <p className="text-xs text-red-600 mt-1">{connectivity.email.error}</p>
            )}
          </div>

          <div className={`p-3 rounded-lg ${connectivity.sms.available ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              <MessageSquare className={`w-4 h-4 ${connectivity.sms.available ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${connectivity.sms.available ? 'text-green-800' : 'text-red-800'}`}>
                SMS
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                connectivity.sms.available 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-red-200 text-red-800'
              }`}>
                {connectivity.sms.available 
                  ? (lang === 'fa' ? 'فعال' : 'Active') 
                  : (lang === 'fa' ? 'غیرفعال' : 'Inactive')
                }
              </span>
            </div>
            {connectivity.sms.error && (
              <p className="text-xs text-red-600 mt-1">{connectivity.sms.error}</p>
            )}
          </div>

          <div className={`p-3 rounded-lg ${connectivity.whatsapp.available ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              <Phone className={`w-4 h-4 ${connectivity.whatsapp.available ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm font-medium ${connectivity.whatsapp.available ? 'text-green-800' : 'text-red-800'}`}>
                WhatsApp
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                connectivity.whatsapp.available 
                  ? 'bg-green-200 text-green-800' 
                  : 'bg-red-200 text-red-800'
              }`}>
                {connectivity.whatsapp.available 
                  ? (lang === 'fa' ? 'فعال' : 'Active') 
                  : (lang === 'fa' ? 'غیرفعال' : 'Inactive')
                }
              </span>
            </div>
            {connectivity.whatsapp.error && (
              <p className="text-xs text-red-600 mt-1">{connectivity.whatsapp.error}</p>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'send', label: lang === 'fa' ? 'ارسال پیام' : 'Send Message', icon: <Send className="w-4 h-4" /> },
            { id: 'templates', label: lang === 'fa' ? 'قالب‌ها' : 'Templates', icon: <MessageCircle className="w-4 h-4" /> },
            { id: 'history', label: lang === 'fa' ? 'تاریخچه' : 'History', icon: <Clock className="w-4 h-4" /> },
            { id: 'stats', label: lang === 'fa' ? 'آمار' : 'Statistics', icon: <BarChart3 className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg">
              {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
            </span>
          </div>
        ) : (
          <>
            {/* Send Message Tab */}
            {activeTab === 'send' && (
              <div className="space-y-6">
                {/* Recipients Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    {lang === 'fa' ? 'انتخاب گیرندگان' : 'Select Recipients'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedRecipients.includes(recipient.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedRecipients(prev =>
                            prev.includes(recipient.id)
                              ? prev.filter(id => id !== recipient.id)
                              : [...prev, recipient.id]
                          );
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{recipient.name}</h4>
                            <p className="text-sm text-gray-600">{recipient.email}</p>
                            {recipient.phone && (
                              <p className="text-sm text-gray-600">{recipient.phone}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {recipient.channels.email && <Mail className="w-4 h-4 text-blue-500" />}
                            {recipient.channels.sms && <MessageSquare className="w-4 h-4 text-green-500" />}
                            {recipient.channels.whatsapp && <Phone className="w-4 h-4 text-green-600" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Templates */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                    {lang === 'fa' ? 'قالب پیام' : 'Message Template'}
                  </h3>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      if (e.target.value) {
                        handleUseTemplate(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">
                      {lang === 'fa' ? 'انتخاب قالب (اختیاری)' : 'Select template (optional)'}
                    </option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Channels */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    {lang === 'fa' ? 'کانال‌های ارسال' : 'Delivery Channels'}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notificationOptions.channels.email || false}
                        onChange={(e) => setNotificationOptions(prev => ({
                          ...prev,
                          channels: { ...prev.channels, email: e.target.checked }
                        }))}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        disabled={!connectivity.email.available}
                      />
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {lang === 'fa' ? 'ایمیل' : 'Email'}
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notificationOptions.channels.sms || false}
                        onChange={(e) => setNotificationOptions(prev => ({
                          ...prev,
                          channels: { ...prev.channels, sms: e.target.checked }
                        }))}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        disabled={!connectivity.sms.available}
                      />
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-700">SMS</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notificationOptions.channels.whatsapp || false}
                        onChange={(e) => setNotificationOptions(prev => ({
                          ...prev,
                          channels: { ...prev.channels, whatsapp: e.target.checked }
                        }))}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        disabled={!connectivity.whatsapp.available}
                      />
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                    </label>
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {lang === 'fa' ? 'محتوای پیام' : 'Message Content'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === 'fa' ? 'متن انگلیسی' : 'English Text'}
                      </label>
                      <textarea
                        value={notificationOptions.content.sms.en}
                        onChange={(e) => setNotificationOptions(prev => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            sms: { ...prev.content.sms, en: e.target.value }
                          }
                        }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Enter message in English..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === 'fa' ? 'متن فارسی' : 'Persian Text'}
                      </label>
                      <textarea
                        value={notificationOptions.content.sms.fa}
                        onChange={(e) => setNotificationOptions(prev => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            sms: { ...prev.content.sms, fa: e.target.value }
                          }
                        }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="متن پیام را به فارسی وارد کنید..."
                      />
                    </div>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'fa' ? 'اولویت' : 'Priority'}
                  </label>
                  <select
                    value={notificationOptions.priority}
                    onChange={(e) => setNotificationOptions(prev => ({
                      ...prev,
                      priority: e.target.value as any
                    }))}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">{lang === 'fa' ? 'کم' : 'Low'}</option>
                    <option value="normal">{lang === 'fa' ? 'عادی' : 'Normal'}</option>
                    <option value="high">{lang === 'fa' ? 'بالا' : 'High'}</option>
                    <option value="urgent">{lang === 'fa' ? 'فوری' : 'Urgent'}</option>
                  </select>
                </div>

                {/* Send Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSendNotification}
                    disabled={sending || selectedRecipients.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {lang === 'fa' ? 'در حال ارسال...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {lang === 'fa' ? 'ارسال پیام' : 'Send Message'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {lang === 'fa' ? 'قالب‌های پیام' : 'Message Templates'}
                  </h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    {lang === 'fa' ? 'قالب جدید' : 'New Template'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {template.type}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {lang === 'fa' ? 'موضوع:' : 'Subject:'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {template.subject[lang] || template.subject.en}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {lang === 'fa' ? 'متن پیام:' : 'Message:'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {template.content.sms[lang] || template.content.sms.en}
                          </p>
                        </div>
                        
                        {template.variables && template.variables.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              {lang === 'fa' ? 'متغیرها:' : 'Variables:'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((variable) => (
                                <span key={variable} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  {variable}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => {
                            setActiveTab('send');
                            handleUseTemplate(template.id);
                          }}
                          className="text-sm px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          {lang === 'fa' ? 'استفاده از قالب' : 'Use Template'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {lang === 'fa' ? 'تاریخچه ارسال' : 'Delivery History'}
                  </h3>
                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">{lang === 'fa' ? 'همه' : 'All'}</option>
                    <option value="sent">{lang === 'fa' ? 'ارسال شده' : 'Sent'}</option>
                    <option value="partial">{lang === 'fa' ? 'جزئی' : 'Partial'}</option>
                    <option value="failed">{lang === 'fa' ? 'ناموفق' : 'Failed'}</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {lang === 'fa' ? 'هیچ تاریخچه‌ای یافت نشد' : 'No history found'}
                      </p>
                    </div>
                  ) : (
                    filteredHistory.map((result) => (
                      <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${
                              result.status === 'sent' ? 'bg-green-500' :
                              result.status === 'partial' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></span>
                            <span className="font-medium text-gray-900">
                              {result.status === 'sent' 
                                ? (lang === 'fa' ? 'ارسال شده' : 'Sent')
                                : result.status === 'partial'
                                ? (lang === 'fa' ? 'جزئی' : 'Partial')
                                : (lang === 'fa' ? 'ناموفق' : 'Failed')
                              }
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {result.sentAt.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          {result.channels.email && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.channels.email.success 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              📧 {result.channels.email.success ? '✓' : '✗'}
                            </span>
                          )}
                          {result.channels.sms && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.channels.sms.success 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              💬 {result.channels.sms.success ? '✓' : '✗'}
                            </span>
                          )}
                          {result.channels.whatsapp && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.channels.whatsapp.success 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              📱 {result.channels.whatsapp.success ? '✓' : '✗'}
                            </span>
                          )}
                        </div>
                        
                        {result.errors && result.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-red-700 mb-1">
                              {lang === 'fa' ? 'خطاها:' : 'Errors:'}
                            </p>
                            <ul className="text-sm text-red-600 space-y-1">
                              {result.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {lang === 'fa' ? 'آمار ارسال (۲۴ ساعت گذشته)' : 'Delivery Statistics (Last 24 Hours)'}
                </h3>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        {lang === 'fa' ? 'کل ارسال' : 'Total Sent'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        {lang === 'fa' ? 'موفق' : 'Successful'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{stats.sent}</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        {lang === 'fa' ? 'جزئی' : 'Partial'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900">{stats.partial}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-800">
                        {lang === 'fa' ? 'ناموفق' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
                  </div>
                </div>

                {/* Channel Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      {lang === 'fa' ? 'ایمیل' : 'Email'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {lang === 'fa' ? 'ارسال شده:' : 'Sent:'}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {stats.channels.email.sent}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {lang === 'fa' ? 'ناموفق:' : 'Failed:'}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {stats.channels.email.failed}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      SMS
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {lang === 'fa' ? 'ارسال شده:' : 'Sent:'}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {stats.channels.sms.sent}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {lang === 'fa' ? 'ناموفق:' : 'Failed:'}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {stats.channels.sms.failed}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      WhatsApp
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {lang === 'fa' ? 'ارسال شده:' : 'Sent:'}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {stats.channels.whatsapp.sent}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {lang === 'fa' ? 'ناموفق:' : 'Failed:'}
                        </span>
                        <span className="text-sm font-medium text-red-600">
                          {stats.channels.whatsapp.failed}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;