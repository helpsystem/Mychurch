import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, Tag, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: () => void;
  editEvent?: any;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ 
  onClose, 
  onEventCreated, 
  editEvent 
}) => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title_en: editEvent?.title?.en || '',
    title_fa: editEvent?.title?.fa || '',
    description_en: editEvent?.description?.en || '',
    description_fa: editEvent?.description?.fa || '',
    date: editEvent?.date || new Date().toISOString().split('T')[0],
    startTime: editEvent?.startTime || '10:00',
    endTime: editEvent?.endTime || '12:00',
    location: editEvent?.location || '',
    category: editEvent?.category || 'service',
    maxAttendees: editEvent?.maxAttendees || '',
    color: editEvent?.color || '#3B82F6',
    recurring: {
      type: editEvent?.recurring?.type || 'none',
      interval: editEvent?.recurring?.interval || 1,
      endDate: editEvent?.recurring?.endDate || ''
    }
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('recurring.')) {
      const recurringField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recurring: {
          ...prev.recurring,
          [recurringField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const eventData = {
        title: {
          en: formData.title_en,
          fa: formData.title_fa
        },
        description: {
          en: formData.description_en,
          fa: formData.description_fa
        },
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        category: formData.category,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        color: formData.color,
        recurring: formData.recurring.type !== 'none' ? formData.recurring : null
      };

      const response = await fetch('/api/events', {
        method: editEvent ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editEvent ? { ...eventData, id: editEvent.id } : eventData)
      });

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      onEventCreated();
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'service', label: lang === 'fa' ? 'مراسم عبادت' : 'Worship Service', icon: '⛪', color: '#3B82F6' },
    { value: 'prayer', label: lang === 'fa' ? 'جلسه دعا' : 'Prayer Meeting', icon: '🙏', color: '#10B981' },
    { value: 'study', label: lang === 'fa' ? 'مطالعه کتاب مقدس' : 'Bible Study', icon: '📖', color: '#8B5CF6' },
    { value: 'fellowship', label: lang === 'fa' ? 'فعالیت اجتماعی' : 'Fellowship', icon: '🤝', color: '#F59E0B' },
    { value: 'outreach', label: lang === 'fa' ? 'خدمات اجتماعی' : 'Outreach', icon: '🌍', color: '#EF4444' },
    { value: 'special', label: lang === 'fa' ? 'مراسم ویژه' : 'Special Event', icon: '✨', color: '#6366F1' }
  ];

  const recurringTypes = [
    { value: 'none', label: lang === 'fa' ? 'تکراری نیست' : 'Not Recurring' },
    { value: 'daily', label: lang === 'fa' ? 'روزانه' : 'Daily' },
    { value: 'weekly', label: lang === 'fa' ? 'هفتگی' : 'Weekly' },
    { value: 'monthly', label: lang === 'fa' ? 'ماهانه' : 'Monthly' },
    { value: 'yearly', label: lang === 'fa' ? 'سالانه' : 'Yearly' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {editEvent 
                ? (lang === 'fa' ? 'ویرایش رویداد' : 'Edit Event')
                : (lang === 'fa' ? 'رویداد جدید' : 'Create New Event')
              }
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'fa' ? 'عنوان (انگلیسی)' : 'Title (English)'}
                </label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => handleInputChange('title_en', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'fa' ? 'عنوان (فارسی)' : 'Title (Persian)'}
                </label>
                <input
                  type="text"
                  value={formData.title_fa}
                  onChange={(e) => handleInputChange('title_fa', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'fa' ? 'توضیحات (انگلیسی)' : 'Description (English)'}
                </label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => handleInputChange('description_en', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {lang === 'fa' ? 'توضیحات (فارسی)' : 'Description (Persian)'}
                </label>
                <textarea
                  value={formData.description_fa}
                  onChange={(e) => handleInputChange('description_fa', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {lang === 'fa' ? 'تاریخ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {lang === 'fa' ? 'زمان شروع' : 'Start Time'}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {lang === 'fa' ? 'زمان پایان' : 'End Time'}
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Location and Attendees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {lang === 'fa' ? 'مکان' : 'Location'}
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  {lang === 'fa' ? 'حداکثر شرکت‌کنندگان' : 'Max Attendees'}
                </label>
                <input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                {lang === 'fa' ? 'دسته‌بندی' : 'Category'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      handleInputChange('category', category.value);
                      handleInputChange('color', category.color);
                    }}
                    className={`
                      p-3 border-2 rounded-lg text-left transition-all
                      ${formData.category === category.value 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                    <div 
                      className="w-full h-2 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <RefreshCw className="w-4 h-4 inline mr-2" />
                {lang === 'fa' ? 'تکرار رویداد' : 'Event Recurrence'}
              </label>
              <div className="space-y-4">
                <select
                  value={formData.recurring.type}
                  onChange={(e) => handleInputChange('recurring.type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {recurringTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                {formData.recurring.type !== 'none' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === 'fa' ? 'فاصله تکرار' : 'Repeat Interval'}
                      </label>
                      <input
                        type="number"
                        value={formData.recurring.interval}
                        onChange={(e) => handleInputChange('recurring.interval', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {lang === 'fa' ? 'تاریخ پایان' : 'End Date (Optional)'}
                      </label>
                      <input
                        type="date"
                        value={formData.recurring.endDate}
                        onChange={(e) => handleInputChange('recurring.endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {lang === 'fa' ? 'انصراف' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editEvent 
                  ? (lang === 'fa' ? 'ذخیره تغییرات' : 'Save Changes')
                  : (lang === 'fa' ? 'ایجاد رویداد' : 'Create Event')
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;