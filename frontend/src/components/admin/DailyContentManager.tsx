import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  BookOpen, 
  Music, 
  Search,
  Filter,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Repeat,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';

interface DailyContent {
  id: string;
  date: string;
  scripture?: {
    reference: string;
    text: {
      en: string;
      fa: string;
    };
    theme?: string;
  };
  worshipSong?: {
    id: string;
    title: {
      en: string;
      fa: string;
    };
    artist?: string;
  };
  devotionalTheme?: {
    en: string;
    fa: string;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

interface DailyContentManagerProps {
  className?: string;
}

const DailyContentManager: React.FC<DailyContentManagerProps> = ({ className = '' }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [dailyContents, setDailyContents] = useState<DailyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContent, setEditingContent] = useState<DailyContent | null>(null);

  const [formData, setFormData] = useState({
    date: selectedDate,
    scriptureReference: '',
    scriptureTextEn: '',
    scriptureTextFa: '',
    scriptureTheme: '',
    worshipSongId: '',
    devotionalThemeEn: '',
    devotionalThemeFa: '',
    isActive: true
  });

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  useEffect(() => {
    if (isAdmin) {
      loadDailyContents();
    }
  }, [isAdmin]);

  const loadDailyContents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/daily-content', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDailyContents(data.contents || []);
      } else {
        // Mock data for demonstration
        setDailyContents([
          {
            id: '1',
            date: new Date().toISOString().split('T')[0],
            scripture: {
              reference: 'John 3:16',
              text: {
                en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
                fa: 'زیرا خدا آنقدر جهان را دوست داشت که پسر یگانه خود را داد، تا هر که بر او ایمان آورد هلاک نشود، بلکه حیات جاودانی یابد.'
              },
              theme: 'God\'s Love'
            },
            worshipSong: {
              id: 'song-1',
              title: {
                en: 'Amazing Grace',
                fa: 'فیض شگفت‌انگیز'
              },
              artist: 'John Newton'
            },
            devotionalTheme: {
              en: 'God\'s Amazing Love',
              fa: 'محبت شگفت‌انگیز خدا'
            },
            isActive: true,
            createdBy: user?.email || 'admin@church.com',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            scripture: {
              reference: 'Psalms 23:1',
              text: {
                en: 'The Lord is my shepherd, I lack nothing.',
                fa: 'خداوند شبان من است، محتاج چیزی نخواهم بود.'
              },
              theme: 'God\'s Provision'
            },
            devotionalTheme: {
              en: 'The Good Shepherd',
              fa: 'شبان نیکو'
            },
            isActive: true,
            createdBy: user?.email || 'admin@church.com',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading daily contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const contentData = {
        date: formData.date,
        scripture: formData.scriptureReference ? {
          reference: formData.scriptureReference,
          text: {
            en: formData.scriptureTextEn,
            fa: formData.scriptureTextFa
          },
          theme: formData.scriptureTheme
        } : undefined,
        worshipSong: formData.worshipSongId ? {
          id: formData.worshipSongId
        } : undefined,
        devotionalTheme: (formData.devotionalThemeEn || formData.devotionalThemeFa) ? {
          en: formData.devotionalThemeEn,
          fa: formData.devotionalThemeFa
        } : undefined,
        isActive: formData.isActive
      };

      const method = editingContent ? 'PUT' : 'POST';
      const url = editingContent ? `/api/daily-content/${editingContent.id}` : '/api/daily-content';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(contentData)
      });

      if (response.ok) {
        await loadDailyContents();
        resetForm();
        setShowModal(false);
        alert(lang === 'fa' ? 'محتوای روزانه ذخیره شد' : 'Daily content saved successfully');
      } else {
        alert(lang === 'fa' ? 'خطا در ذخیره محتوا' : 'Error saving content');
      }
    } catch (error) {
      console.error('Error saving daily content:', error);
      alert(lang === 'fa' ? 'خطا در ذخیره محتوا' : 'Error saving content');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (content: DailyContent) => {
    setEditingContent(content);
    setFormData({
      date: content.date,
      scriptureReference: content.scripture?.reference || '',
      scriptureTextEn: content.scripture?.text.en || '',
      scriptureTextFa: content.scripture?.text.fa || '',
      scriptureTheme: content.scripture?.theme || '',
      worshipSongId: content.worshipSong?.id || '',
      devotionalThemeEn: content.devotionalTheme?.en || '',
      devotionalThemeFa: content.devotionalTheme?.fa || '',
      isActive: content.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (contentId: string) => {
    if (confirm(lang === 'fa' ? 'آیا مطمئن هستید؟' : 'Are you sure?')) {
      try {
        const response = await fetch(`/api/daily-content/${contentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          await loadDailyContents();
          alert(lang === 'fa' ? 'محتوا حذف شد' : 'Content deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting content:', error);
        alert(lang === 'fa' ? 'خطا در حذف محتوا' : 'Error deleting content');
      }
    }
  };

  const toggleActive = async (contentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/daily-content/${contentId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        await loadDailyContents();
      }
    } catch (error) {
      console.error('Error toggling content status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      scriptureReference: '',
      scriptureTextEn: '',
      scriptureTextFa: '',
      scriptureTheme: '',
      worshipSongId: '',
      devotionalThemeEn: '',
      devotionalThemeFa: '',
      isActive: true
    });
    setEditingContent(null);
  };

  const generateForWeek = async () => {
    if (confirm(lang === 'fa' ? 'آیا می‌خواهید محتوای خودکار برای یک هفته تولید کنید؟' : 'Generate automatic content for one week?')) {
      setSaving(true);
      try {
        const response = await fetch('/api/daily-content/generate-week', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ startDate: selectedDate })
        });

        if (response.ok) {
          await loadDailyContents();
          alert(lang === 'fa' ? 'محتوای هفتگی تولید شد' : 'Weekly content generated successfully');
        }
      } catch (error) {
        console.error('Error generating weekly content:', error);
        alert(lang === 'fa' ? 'خطا در تولید محتوا' : 'Error generating content');
      } finally {
        setSaving(false);
      }
    }
  };

  const filteredContents = dailyContents.filter(content => {
    const matchesSearch = !searchTerm || 
      content.scripture?.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.scripture?.text.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.scripture?.text.fa.includes(searchTerm) ||
      content.devotionalTheme?.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.devotionalTheme?.fa.includes(searchTerm);

    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && content.isActive) ||
      (filterStatus === 'inactive' && !content.isActive);

    return matchesSearch && matchesFilter;
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            {lang === 'fa' ? 'مدیریت محتوای روزانه' : 'Daily Content Manager'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={generateForWeek}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Repeat className="w-4 h-4" />
              {lang === 'fa' ? 'تولید هفتگی' : 'Generate Week'}
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {lang === 'fa' ? 'محتوای جدید' : 'New Content'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-60">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'fa' ? 'جستجو در محتوا...' : 'Search content...'}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'fa' ? 'تاریخ انتخابی' : 'Selected Date'}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'fa' ? 'وضعیت' : 'Status'}
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">{lang === 'fa' ? 'همه' : 'All'}</option>
              <option value="active">{lang === 'fa' ? 'فعال' : 'Active'}</option>
              <option value="inactive">{lang === 'fa' ? 'غیرفعال' : 'Inactive'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg">
              {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
            </span>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {lang === 'fa' ? 'هیچ محتوایی یافت نشد' : 'No content found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredContents.map((content) => (
              <div key={content.id} className="border border-gray-200 rounded-lg p-6">
                {/* Content Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {new Date(content.date).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                      </span>
                      <button
                        onClick={() => toggleActive(content.id, content.isActive)}
                        className={`p-1 rounded ${content.isActive ? 'text-green-600' : 'text-gray-400'}`}
                        title={content.isActive ? (lang === 'fa' ? 'فعال' : 'Active') : (lang === 'fa' ? 'غیرفعال' : 'Inactive')}
                      >
                        {content.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                    {content.devotionalTheme && (
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {content.devotionalTheme[lang] || content.devotionalTheme.en || content.devotionalTheme.fa}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(content)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Scripture */}
                {content.scripture && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">{content.scripture.reference}</span>
                      {content.scripture.theme && (
                        <span className="text-sm text-blue-600">• {content.scripture.theme}</span>
                      )}
                    </div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {content.scripture.text[lang] || content.scripture.text.en || content.scripture.text.fa}
                    </p>
                  </div>
                )}

                {/* Worship Song */}
                {content.worshipSong && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-800">
                        {content.worshipSong.title[lang] || content.worshipSong.title.en || content.worshipSong.title.fa}
                      </span>
                      {content.worshipSong.artist && (
                        <span className="text-sm text-purple-600">• {content.worshipSong.artist}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span>
                      {lang === 'fa' ? 'ایجاد شده در' : 'Created'} {new Date(content.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      content.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {content.isActive ? (lang === 'fa' ? 'فعال' : 'Active') : (lang === 'fa' ? 'غیرفعال' : 'Inactive')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingContent 
                  ? (lang === 'fa' ? 'ویرایش محتوای روزانه' : 'Edit Daily Content')
                  : (lang === 'fa' ? 'محتوای روزانه جدید' : 'New Daily Content')
                }
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Date and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === 'fa' ? 'تاریخ *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                    {lang === 'fa' ? 'فعال' : 'Active'}
                  </label>
                </div>
              </div>

              {/* Devotional Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'fa' ? 'موضوع تعبدی' : 'Devotional Theme'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formData.devotionalThemeEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, devotionalThemeEn: e.target.value }))}
                    placeholder="English theme"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={formData.devotionalThemeFa}
                    onChange={(e) => setFormData(prev => ({ ...prev, devotionalThemeFa: e.target.value }))}
                    placeholder="موضوع فارسی"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Scripture Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {lang === 'fa' ? 'آیه کتاب مقدس' : 'Scripture Verse'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={formData.scriptureReference}
                    onChange={(e) => setFormData(prev => ({ ...prev, scriptureReference: e.target.value }))}
                    placeholder={lang === 'fa' ? 'مثال: یوحنا ۳:۱۶' : 'e.g., John 3:16'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={formData.scriptureTheme}
                    onChange={(e) => setFormData(prev => ({ ...prev, scriptureTheme: e.target.value }))}
                    placeholder={lang === 'fa' ? 'موضوع آیه' : 'Scripture theme'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <textarea
                    value={formData.scriptureTextEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, scriptureTextEn: e.target.value }))}
                    placeholder="English scripture text"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                  <textarea
                    value={formData.scriptureTextFa}
                    onChange={(e) => setFormData(prev => ({ ...prev, scriptureTextFa: e.target.value }))}
                    placeholder="متن فارسی آیه"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Worship Song Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  {lang === 'fa' ? 'سرود پرستشی' : 'Worship Song'}
                </h4>
                
                <input
                  type="text"
                  value={formData.worshipSongId}
                  onChange={(e) => setFormData(prev => ({ ...prev, worshipSongId: e.target.value }))}
                  placeholder={lang === 'fa' ? 'شناسه سرود (اختیاری)' : 'Song ID (optional)'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-gray-600 mt-2">
                  {lang === 'fa' 
                    ? 'شناسه سرود از کتابخانه سرودها را وارد کنید'
                    : 'Enter the song ID from the worship songs library'
                  }
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {lang === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lang === 'fa' ? 'در حال ذخیره...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {lang === 'fa' ? 'ذخیره' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyContentManager;