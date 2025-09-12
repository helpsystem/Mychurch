import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Bell, Calendar, ChevronDown, Filter, Search, Clock, MessageCircle, Tag, Archive } from 'lucide-react';

interface Announcement {
  id: string;
  title: {
    en: string;
    fa: string;
  };
  content: {
    en: string;
    fa: string;
  };
  type: string;
  priority: string;
  publishDate: string;
  referenceNumber: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  currentLanguage: string;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, currentLanguage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const title = announcement.title[currentLanguage as keyof typeof announcement.title] || announcement.title.en;
  const content = announcement.content[currentLanguage as keyof typeof announcement.content] || announcement.content.en;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    const labels = {
      fa: { urgent: 'فوری', high: 'مهم', normal: 'عادی', low: 'کم' },
      en: { urgent: 'Urgent', high: 'Important', normal: 'Normal', low: 'Low' }
    };
    const key = priority.toLowerCase() as keyof typeof labels.fa;
    return labels[currentLanguage as keyof typeof labels]?.[key] || 'Normal';
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(announcement.priority)}`}>
              {getPriorityText(announcement.priority)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Archive className="w-3 h-3" />
              {announcement.referenceNumber}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {formatDate(announcement.publishDate)}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
          {title}
        </h3>
        
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-600" />
          <span className="text-sm text-indigo-600 font-medium">
            {announcement.type === 'announcement' ? 
              (currentLanguage === 'fa' ? 'اطلاعیه عمومی' : 'General Announcement') :
              (currentLanguage === 'fa' ? 'رویداد' : 'Event')
            }
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className={`text-gray-700 leading-relaxed ${currentLanguage === 'fa' ? 'text-right' : 'text-left'}`}>
          {isExpanded ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="line-clamp-3">
              {content.replace(/<[^>]*>/g, '').substring(0, 200)}
              {content.length > 200 && '...'}
            </p>
          )}
        </div>
        
        {content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
          >
            {isExpanded ? 
              (currentLanguage === 'fa' ? 'کمتر نشان بده' : 'Show Less') : 
              (currentLanguage === 'fa' ? 'بیشتر بخوان' : 'Read More')
            }
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

const AnnouncementsPage: React.FC = () => {
  const { lang: currentLanguage, t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements/published');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      } else {
        console.error('Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const title = announcement.title[currentLanguage as keyof typeof announcement.title] || announcement.title.en;
    const content = announcement.content[currentLanguage as keyof typeof announcement.content] || announcement.content.en;
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || announcement.type === filterType;
    const matchesPriority = filterPriority === 'all' || announcement.priority.toLowerCase() === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{currentLanguage === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Bell className="w-16 h-16 text-white/90" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {currentLanguage === 'fa' ? 'اطلاعیه‌های کلیسا' : 'Church Announcements'}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {currentLanguage === 'fa' ? 
                'آخرین اخبار، رویدادها و اطلاعیه‌های مهم کلیسای مسیحیان ایرانی واشنگتن' :
                'Latest news, events, and important announcements from the Iranian Christian Church of Washington D.C.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={currentLanguage === 'fa' ? 'جستجو در اطلاعیه‌ها...' : 'Search announcements...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="all">{currentLanguage === 'fa' ? 'همه انواع' : 'All Types'}</option>
                <option value="announcement">{currentLanguage === 'fa' ? 'اطلاعیه' : 'Announcement'}</option>
                <option value="event">{currentLanguage === 'fa' ? 'رویداد' : 'Event'}</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="all">{currentLanguage === 'fa' ? 'همه اولویت‌ها' : 'All Priorities'}</option>
                <option value="urgent">{currentLanguage === 'fa' ? 'فوری' : 'Urgent'}</option>
                <option value="high">{currentLanguage === 'fa' ? 'مهم' : 'Important'}</option>
                <option value="normal">{currentLanguage === 'fa' ? 'عادی' : 'Normal'}</option>
                <option value="low">{currentLanguage === 'fa' ? 'کم' : 'Low'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span>
              {currentLanguage === 'fa' ? 
                `${filteredAnnouncements.length} اطلاعیه یافت شد` :
                `Found ${filteredAnnouncements.length} announcements`
              }
            </span>
          </div>
        </div>

        {/* Announcements List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              {currentLanguage === 'fa' ? 'اطلاعیه‌ای یافت نشد' : 'No announcements found'}
            </h3>
            <p className="text-gray-500">
              {currentLanguage === 'fa' ? 
                'در حال حاضر هیچ اطلاعیه‌ای منتشر نشده است' :
                'No announcements have been published at this time'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                currentLanguage={currentLanguage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;