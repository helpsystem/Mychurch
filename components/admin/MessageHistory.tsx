import React, { useState, useEffect } from 'react';
import { 
  Send, MessageSquare, Mail, Phone, MessageCircle, 
  Clock, CheckCircle, AlertCircle, XCircle, 
  RefreshCw, Calendar, Archive, Filter, Search,
  Eye, Download, Globe
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { api } from '../../lib/api';

interface DeliveryLog {
  id: string;
  messageId: string;
  channel: string;
  recipient: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  attemptAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  cost?: number;
}

interface MessageLog {
  id: string;
  title: string;
  title_en?: string;
  title_fa?: string;
  type: 'announcement' | 'event' | 'newsletter' | 'alert';
  priority: string;
  targetAudience: string[];
  channels: string[];
  authorEmail: string;
  sentAt: string;
  totalRecipients: number;
  deliveryLogs: DeliveryLog[];
  status: 'draft' | 'sending' | 'sent' | 'failed' | 'published';
  referenceNumber: string;
}

interface MessageHistoryResponse {
  messages: MessageLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const MessageHistory: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [pagination, setPagination] = useState<{page: number; limit: number; total: number; pages: number}>({page: 1, limit: 20, total: 0, pages: 0});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  
  // Filter states
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchMessageHistory();
  }, [currentLanguage, filterChannel, filterStatus, filterType, dateRange, pagination.page]);
  
  // Reset to first page when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [filterChannel, filterStatus, filterType, dateRange]);

  const fetchMessageHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters for server-side filtering
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        channel: filterChannel,
        status: filterStatus,
        type: filterType,
        dateRange: dateRange
      });
      
      const data: MessageHistoryResponse = await api.get(`/api/messages/history`, Object.fromEntries(params));
      
      // Process messages to handle language-specific titles
      const processedMessages = data.messages.map(message => ({
        ...message,
        title: currentLanguage === 'fa' 
          ? (message.title_fa || message.title_en || message.title || 'No title')
          : (message.title_en || message.title_fa || message.title || 'No title')
      }));
      
      setMessages(processedMessages);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching message history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load message history');
      // Reset pagination on error
      setPagination({page: 1, limit: 20, total: 0, pages: 0});
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Phone className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'website': return <Globe className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'sending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'sending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'bounced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryStats = (deliveryLogs: DeliveryLog[]) => {
    const stats = {
      total: deliveryLogs.length,
      delivered: deliveryLogs.filter(log => log.status === 'delivered').length,
      failed: deliveryLogs.filter(log => log.status === 'failed').length,
      pending: deliveryLogs.filter(log => log.status === 'pending').length
    };
    return stats;
  };

  // Client-side search filtering only (server handles other filters)
  const filteredMessages = messages.filter(message => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return message.title.toLowerCase().includes(searchLower) ||
           message.referenceNumber.toLowerCase().includes(searchLower);
  });
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="mr-3 text-lg">
          {currentLanguage === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentLanguage === 'fa' ? 'تاریخچه ارسال پیام‌ها' : 'Message History'}
          </h2>
          <p className="text-gray-600 mt-1">
            {currentLanguage === 'fa' 
              ? 'مشاهده جزئیات ارسال و لاگ‌های تحویل پیام‌ها'
              : 'View detailed delivery logs and message sending history'
            }
          </p>
        </div>
        <button
          onClick={fetchMessageHistory}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {currentLanguage === 'fa' ? 'بروزرسانی' : 'Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={currentLanguage === 'fa' ? 'جستجو...' : 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Channel Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="all">{currentLanguage === 'fa' ? 'همه کانال‌ها' : 'All Channels'}</option>
              <option value="email">{currentLanguage === 'fa' ? 'ایمیل' : 'Email'}</option>
              <option value="sms">{currentLanguage === 'fa' ? 'پیامک' : 'SMS'}</option>
              <option value="whatsapp">{currentLanguage === 'fa' ? 'واتساپ' : 'WhatsApp'}</option>
              <option value="website">{currentLanguage === 'fa' ? 'وبسایت' : 'Website'}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="all">{currentLanguage === 'fa' ? 'همه وضعیت‌ها' : 'All Status'}</option>
              <option value="published">{currentLanguage === 'fa' ? 'منتشر شده' : 'Published'}</option>
              <option value="draft">{currentLanguage === 'fa' ? 'پیش نویس' : 'Draft'}</option>
              <option value="sending">{currentLanguage === 'fa' ? 'در حال ارسال' : 'Sending'}</option>
              <option value="failed">{currentLanguage === 'fa' ? 'ناموفق' : 'Failed'}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="all">{currentLanguage === 'fa' ? 'همه انواع' : 'All Types'}</option>
              <option value="announcement">{currentLanguage === 'fa' ? 'اطلاعیه' : 'Announcement'}</option>
              <option value="event">{currentLanguage === 'fa' ? 'رویداد' : 'Event'}</option>
              <option value="newsletter">{currentLanguage === 'fa' ? 'خبرنامه' : 'Newsletter'}</option>
              <option value="alert">{currentLanguage === 'fa' ? 'هشدار' : 'Alert'}</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="all">{currentLanguage === 'fa' ? 'همه تاریخ‌ها' : 'All Dates'}</option>
              <option value="today">{currentLanguage === 'fa' ? 'امروز' : 'Today'}</option>
              <option value="week">{currentLanguage === 'fa' ? 'این هفته' : 'This Week'}</option>
              <option value="month">{currentLanguage === 'fa' ? 'این ماه' : 'This Month'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {currentLanguage === 'fa' ? 'هیچ پیامی یافت نشد' : 'No messages found'}
            </p>
          </div>
        ) : (
          filteredMessages.map(message => {
            const stats = getDeliveryStats(message.deliveryLogs);
            const successRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

            return (
              <div key={message.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{message.title}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(message.status)}`}>
                          {getStatusIcon(message.status)}
                          <span className="mr-1">
                            {currentLanguage === 'fa' 
                              ? {sent: 'ارسال شده', sending: 'در حال ارسال', failed: 'ناموفق', draft: 'پیش‌نویس'}[message.status]
                              : message.status.charAt(0).toUpperCase() + message.status.slice(1)
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Archive className="w-4 h-4" />
                          {message.referenceNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(message.sentAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Send className="w-4 h-4" />
                          {message.totalRecipients} {currentLanguage === 'fa' ? 'گیرنده' : 'recipients'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMessage(message);
                          setShowDeliveryDetails(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {currentLanguage === 'fa' ? 'جزئیات' : 'Details'}
                      </button>
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'fa' ? 'کانال‌ها:' : 'Channels:'}
                    </span>
                    {message.channels.map(channel => (
                      <div key={channel} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {getChannelIcon(channel)}
                        <span>{channel}</span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Stats */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
                      <div className="text-xs text-gray-600">
                        {currentLanguage === 'fa' ? 'نرخ موفقیت' : 'Success Rate'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                      <div className="text-xs text-gray-600">
                        {currentLanguage === 'fa' ? 'تحویل شده' : 'Delivered'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                      <div className="text-xs text-gray-600">
                        {currentLanguage === 'fa' ? 'ناموفق' : 'Failed'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                      <div className="text-xs text-gray-600">
                        {currentLanguage === 'fa' ? 'در انتظار' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delivery Details Modal */}
      {showDeliveryDetails && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {currentLanguage === 'fa' ? 'جزئیات تحویل پیام' : 'Message Delivery Details'}
                  </h3>
                  <p className="text-gray-600">{selectedMessage.title}</p>
                </div>
                <button
                  onClick={() => setShowDeliveryDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {selectedMessage.deliveryLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getChannelIcon(log.channel)}
                      <div>
                        <div className="font-medium text-gray-900">{log.recipient}</div>
                        <div className="text-sm text-gray-600">{log.channel}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {formatDate(log.attemptAt)}
                        </div>
                        {log.deliveredAt && (
                          <div className="text-xs text-green-600">
                            {currentLanguage === 'fa' ? 'تحویل:' : 'Delivered:'} {formatDate(log.deliveredAt)}
                          </div>
                        )}
                        {log.errorMessage && (
                          <div className="text-xs text-red-600">{log.errorMessage}</div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        <span className="mr-1">{log.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageHistory;