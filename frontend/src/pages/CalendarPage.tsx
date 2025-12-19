import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import EventsCalendar from '../components/EventsCalendar';
import CreateEventModal from '../components/admin/CreateEventModal';

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  const handleCreateEvent = () => {
    setShowCreateModal(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    // Additional event click handling can go here
  };

  const handleEventCreated = () => {
    setShowCreateModal(false);
    // Refresh calendar events
    window.location.reload(); // Simple refresh for now
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {lang === 'fa' ? 'تقویم رویدادهای کلیسا' : 'Church Events Calendar'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {lang === 'fa' 
              ? 'مراسم‌ها، جلسات دعا، مطالعات کتاب مقدس و سایر رویدادهای کلیسا را مشاهده کنید'
              : 'View worship services, prayer meetings, Bible studies, and other church events'
            }
          </p>
        </div>

        {/* Calendar Component */}
        <div className="max-w-7xl mx-auto">
          <EventsCalendar
            isAdmin={isAdmin}
            onEventClick={handleEventClick}
            onCreateEvent={handleCreateEvent}
          />
        </div>

        {/* Quick Actions for Admin */}
        {isAdmin && (
          <div className="max-w-7xl mx-auto mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {lang === 'fa' ? 'عملیات سریع' : 'Quick Actions'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleCreateEvent}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📅</span>
                    <span className="font-medium">
                      {lang === 'fa' ? 'رویداد جدید' : 'New Event'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {lang === 'fa' 
                      ? 'مراسم، جلسه یا فعالیت جدید ایجاد کنید'
                      : 'Create a new service, meeting, or activity'
                    }
                  </p>
                </button>

                <button
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🔄</span>
                    <span className="font-medium">
                      {lang === 'fa' ? 'رویدادهای تکراری' : 'Recurring Events'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {lang === 'fa' 
                      ? 'مدیریت مراسم‌های هفتگی و ماهانه'
                      : 'Manage weekly and monthly services'
                    }
                  </p>
                </button>

                <button
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📊</span>
                    <span className="font-medium">
                      {lang === 'fa' ? 'گزارش حضور' : 'Attendance Reports'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {lang === 'fa' 
                      ? 'آمار حضور و شرکت در رویدادها'
                      : 'View attendance statistics and reports'
                    }
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Events Sidebar */}
        <div className="max-w-7xl mx-auto mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {/* Additional calendar views or details can go here */}
            </div>
            
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-xl">⏰</span>
                  {lang === 'fa' ? 'رویدادهای آینده' : 'Upcoming Events'}
                </h3>
                <div className="space-y-3">
                  <div className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">⛪</span>
                      <span className="font-medium text-sm">
                        {lang === 'fa' ? 'مراسم یکشنبه' : 'Sunday Service'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {lang === 'fa' ? 'یکشنبه ۱۰:۰۰' : 'Sunday 10:00 AM'}
                    </div>
                  </div>
                  
                  <div className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">🙏</span>
                      <span className="font-medium text-sm">
                        {lang === 'fa' ? 'جلسه دعا' : 'Prayer Meeting'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {lang === 'fa' ? 'چهارشنبه ۱۹:۰۰' : 'Wednesday 7:00 PM'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Categories */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {lang === 'fa' ? 'دسته‌بندی رویدادها' : 'Event Categories'}
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: '⛪', label: lang === 'fa' ? 'مراسم عبادت' : 'Worship Services', color: 'bg-blue-100 text-blue-800' },
                    { icon: '🙏', label: lang === 'fa' ? 'جلسات دعا' : 'Prayer Meetings', color: 'bg-green-100 text-green-800' },
                    { icon: '📖', label: lang === 'fa' ? 'مطالعه کتاب مقدس' : 'Bible Study', color: 'bg-purple-100 text-purple-800' },
                    { icon: '🤝', label: lang === 'fa' ? 'فعالیت‌های اجتماعی' : 'Fellowship', color: 'bg-yellow-100 text-yellow-800' },
                    { icon: '🌍', label: lang === 'fa' ? 'خدمات اجتماعی' : 'Outreach', color: 'bg-red-100 text-red-800' }
                  ].map((category, index) => (
                    <div key={index} className={`flex items-center gap-2 p-2 rounded-lg ${category.color}`}>
                      <span className="text-sm">{category.icon}</span>
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
};

export default CalendarPage;