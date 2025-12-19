import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { ChurchAnnouncement, Language } from '../../types';
import { Plus, Send, Edit, Trash2, Eye, Languages, MessageCircle, Mail, Smartphone, Bell, Globe } from 'lucide-react';

interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: string[];
  channels: ('website' | 'email' | 'sms' | 'whatsapp' | 'notification')[];
  autoTranslate: boolean;
  sourceLanguage: 'en' | 'fa';
  publishDate?: string;
  expiryDate?: string;
}

const AnnouncementsManager: React.FC = () => {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [announcements, setAnnouncements] = useState<ChurchAnnouncement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<ChurchAnnouncement | null>(null);
  const [translating, setTranslating] = useState<number | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    type: 'general',
    priority: 'normal',
    targetAudience: ['all'],
    channels: ['website'],
    autoTranslate: false,
    sourceLanguage: lang,
    publishDate: '',
    expiryDate: ''
  });

  // Content translations
  const content = {
    en: {
      title: 'Church Announcements Manager',
      subtitle: 'Create and manage church announcements with professional translation',
      createNew: 'Create New Announcement',
      edit: 'Edit',
      delete: 'Delete',
      publish: 'Publish',
      translate: 'Auto-Translate',
      view: 'View',
      form: {
        title: 'Announcement Title',
        content: 'Content',
        type: 'Type',
        priority: 'Priority',
        sourceLanguage: 'Source Language',
        autoTranslate: 'Enable Auto-Translation',
        targetAudience: 'Target Audience',
        channels: 'Distribution Channels',
        publishDate: 'Publish Date (Optional)',
        expiryDate: 'Expiry Date (Optional)',
        save: 'Save Announcement',
        cancel: 'Cancel'
      },
      types: {
        general: 'General',
        urgent: 'Urgent',
        event: 'Event',
        announcement: 'Official Announcement'
      },
      priorities: {
        low: 'Low',
        normal: 'Normal', 
        high: 'High',
        urgent: 'Urgent'
      },
      audiences: {
        all: 'All Members',
        members: 'Church Members',
        leaders: 'Church Leaders',
        volunteers: 'Volunteers',
        youth: 'Youth Group',
        seniors: 'Seniors'
      },
      channelLabels: {
        website: 'Website',
        email: 'Email',
        sms: 'SMS',
        whatsapp: 'WhatsApp',
        notification: 'Push Notification'
      },
      status: {
        draft: 'Draft',
        published: 'Published',
        archived: 'Archived'
      },
      messages: {
        createSuccess: 'Announcement created successfully',
        updateSuccess: 'Announcement updated successfully',
        deleteSuccess: 'Announcement deleted successfully',
        publishSuccess: 'Announcement published successfully',
        translateSuccess: 'Translation completed successfully',
        error: 'An error occurred. Please try again.'
      }
    },
    fa: {
      title: 'مدیریت اطلاعیه‌های کلیسا',
      subtitle: 'ایجاد و مدیریت اطلاعیه‌های کلیسا با ترجمه حرفه‌ای',
      createNew: 'ایجاد اطلاعیه جدید',
      edit: 'ویرایش',
      delete: 'حذف',
      publish: 'انتشار',
      translate: 'ترجمه خودکار',
      view: 'نمایش',
      form: {
        title: 'عنوان اطلاعیه',
        content: 'محتوا',
        type: 'نوع',
        priority: 'اولویت',
        sourceLanguage: 'زبان مبدا',
        autoTranslate: 'فعال‌سازی ترجمه خودکار',
        targetAudience: 'مخاطبان هدف',
        channels: 'کانال‌های توزیع',
        publishDate: 'تاریخ انتشار (اختیاری)',
        expiryDate: 'تاریخ انقضا (اختیاری)',
        save: 'ذخیره اطلاعیه',
        cancel: 'انصراف'
      },
      types: {
        general: 'عمومی',
        urgent: 'فوری',
        event: 'رویداد',
        announcement: 'اطلاعیه رسمی'
      },
      priorities: {
        low: 'پایین',
        normal: 'عادی',
        high: 'بالا',
        urgent: 'فوری'
      },
      audiences: {
        all: 'همه اعضا',
        members: 'اعضای کلیسا',
        leaders: 'رهبران کلیسا',
        volunteers: 'داوطلبان',
        youth: 'گروه جوانان',
        seniors: 'سالمندان'
      },
      channelLabels: {
        website: 'وب‌سایت',
        email: 'ایمیل',
        sms: 'پیامک',
        whatsapp: 'واتساپ',
        notification: 'نوتیفیکیشن'
      },
      status: {
        draft: 'پیش‌نویس',
        published: 'منتشر شده',
        archived: 'بایگانی شده'
      },
      messages: {
        createSuccess: 'اطلاعیه با موفقیت ایجاد شد',
        updateSuccess: 'اطلاعیه با موفقیت به‌روزرسانی شد',
        deleteSuccess: 'اطلاعیه با موفقیت حذف شد',
        publishSuccess: 'اطلاعیه با موفقیت منتشر شد',
        translateSuccess: 'ترجمه با موفقیت تکمیل شد',
        error: 'خطایی رخ داده است. لطفاً دوباره تلاش کنید.'
      }
    }
  };

  const t_content = content[lang];

  // Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.location.origin.replace(':5000', ':3001')}/api/announcements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(t_content.messages.error);
    } finally {
      setLoading(false);
    }
  };

  // Create or update announcement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = editingAnnouncement 
        ? `${window.location.origin.replace(':5000', ':3001')}/api/announcements/${editingAnnouncement.id}`
        : `${window.location.origin.replace(':5000', ':3001')}/api/announcements`;

      const response = await fetch(url, {
        method: editingAnnouncement ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save announcement');
      }

      const savedAnnouncement = await response.json();
      
      if (editingAnnouncement) {
        setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? savedAnnouncement : a));
        setError(t_content.messages.updateSuccess);
      } else {
        setAnnouncements(prev => [savedAnnouncement, ...prev]);
        setError(t_content.messages.createSuccess);
      }

      // Auto-translate if enabled
      if (formData.autoTranslate && savedAnnouncement.id) {
        await handleAutoTranslate(savedAnnouncement.id);
      }

      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      setError(t_content.messages.error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-translate announcement
  const handleAutoTranslate = async (announcementId: number) => {
    setTranslating(announcementId);
    try {
      const token = localStorage.getItem('token');
      
      // Call translation service
      const response = await fetch(`${window.location.origin.replace(':5000', ':3001')}/api/announcements/${announcementId}/translate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetLanguage: formData.sourceLanguage === 'en' ? 'fa' : 'en'
        })
      });

      if (response.ok) {
        const updatedAnnouncement = await response.json();
        setAnnouncements(prev => prev.map(a => a.id === announcementId ? updatedAnnouncement : a));
        setError(t_content.messages.translateSuccess);
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(t_content.messages.error);
    } finally {
      setTranslating(null);
    }
  };

  // Publish announcement
  const handlePublish = async (announcement: ChurchAnnouncement) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.location.origin.replace(':5000', ':3001')}/api/announcements/${announcement.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          channels: announcement.channels,
          sendNotifications: true
        })
      });

      if (response.ok) {
        const publishedAnnouncement = await response.json();
        setAnnouncements(prev => prev.map(a => a.id === announcement.id ? {...a, ...publishedAnnouncement} : a));
        setError(t_content.messages.publishSuccess);
      }
    } catch (err) {
      console.error('Publish error:', err);
      setError(t_content.messages.error);
    } finally {
      setLoading(false);
    }
  };

  // Delete announcement  
  const handleDelete = async (announcementId: number) => {
    if (!confirm(lang === 'fa' ? 'آیا مطمئن هستید؟' : 'Are you sure?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${window.location.origin.replace(':5000', ':3001')}/api/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
        setError(t_content.messages.deleteSuccess);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(t_content.messages.error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'normal',
      targetAudience: ['all'],
      channels: ['website'],
      autoTranslate: false,
      sourceLanguage: lang,
      publishDate: '',
      expiryDate: ''
    });
    setShowForm(false);
    setEditingAnnouncement(null);
  };

  const startEdit = (announcement: ChurchAnnouncement) => {
    setFormData({
      title: announcement.title[announcement.sourceLanguage] || '',
      content: announcement.content[announcement.sourceLanguage] || '',
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      channels: announcement.channels,
      autoTranslate: announcement.autoTranslate,
      sourceLanguage: announcement.sourceLanguage,
      publishDate: announcement.publishDate ? announcement.publishDate.split('T')[0] : '',
      expiryDate: announcement.expiryDate ? announcement.expiryDate.split('T')[0] : ''
    });
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const getChannelIcon = (channel: string) => {
    const icons = {
      website: Globe,
      email: Mail,
      sms: MessageCircle,
      whatsapp: Smartphone,
      notification: Bell
    };
    return icons[channel as keyof typeof icons] || Globe;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      normal: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  if (!user?.permissions.includes('manage_announcements')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{lang === 'fa' ? 'دسترسی محدود' : 'Access restricted'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t_content.title}</h2>
          <p className="text-gray-600">{t_content.subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={20} />
          {t_content.createNew}
        </button>
      </div>

      {error && (
        <div className={`p-4 rounded-md mb-4 ${error.includes('success') || error.includes('موفقیت') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      {/* Announcement Form */}
      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingAnnouncement ? t_content.edit : t_content.createNew}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t_content.form.title}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                  className="w-full p-3 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t_content.form.sourceLanguage}</label>
                <select
                  value={formData.sourceLanguage}
                  onChange={(e) => setFormData(prev => ({...prev, sourceLanguage: e.target.value as 'en' | 'fa'}))}
                  className="w-full p-3 border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="fa">فارسی</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t_content.form.content}</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                rows={6}
                className="w-full p-3 border rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t_content.form.type}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({...prev, type: e.target.value as any}))}
                  className="w-full p-3 border rounded-md"
                >
                  {Object.entries(t_content.types).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t_content.form.priority}</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value as any}))}
                  className="w-full p-3 border rounded-md"
                >
                  {Object.entries(t_content.priorities).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 mt-8">
                  <input
                    type="checkbox"
                    checked={formData.autoTranslate}
                    onChange={(e) => setFormData(prev => ({...prev, autoTranslate: e.target.checked}))}
                    className="rounded"
                  />
                  <span className="text-sm">{t_content.form.autoTranslate}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t_content.form.channels}</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {Object.entries(t_content.channelLabels).map(([channel, label]) => {
                  const IconComponent = getChannelIcon(channel);
                  return (
                    <label key={channel} className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({...prev, channels: [...prev.channels, channel as any]}));
                          } else {
                            setFormData(prev => ({...prev, channels: prev.channels.filter(c => c !== channel)}));
                          }
                        }}
                        className="rounded"
                      />
                      <IconComponent size={16} />
                      <span className="text-sm">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t_content.form.publishDate}</label>
                <input
                  type="datetime-local"
                  value={formData.publishDate}
                  onChange={(e) => setFormData(prev => ({...prev, publishDate: e.target.value}))}
                  className="w-full p-3 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t_content.form.expiryDate}</label>
                <input
                  type="datetime-local"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({...prev, expiryDate: e.target.value}))}
                  className="w-full p-3 border rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '...' : t_content.form.save}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
              >
                {t_content.form.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {loading && announcements.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{announcement.title[lang] || announcement.title.en}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                      {t_content.priorities[announcement.priority as keyof typeof t_content.priorities]}
                    </span>
                    <span className="text-xs text-gray-500">#{announcement.referenceNumber}</span>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {announcement.content[lang] || announcement.content.en}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{t_content.status[announcement.status as keyof typeof t_content.status]}</span>
                    <span>{new Date(announcement.createdAt).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}</span>
                    <div className="flex gap-1">
                      {announcement.channels.map(channel => {
                        const IconComponent = getChannelIcon(channel);
                        return <IconComponent key={channel} size={14} />;
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAutoTranslate(announcement.id)}
                    disabled={translating === announcement.id}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                    title={t_content.translate}
                  >
                    <Languages size={18} className={translating === announcement.id ? 'animate-spin' : ''} />
                  </button>
                  
                  {announcement.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(announcement)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-md"
                      title={t_content.publish}
                    >
                      <Send size={18} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => startEdit(announcement)}
                    className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-md"
                    title={t_content.edit}
                  >
                    <Edit size={18} />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                    title={t_content.delete}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {announcements.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">{lang === 'fa' ? 'هیچ اطلاعیه‌ای یافت نشد' : 'No announcements found'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsManager;