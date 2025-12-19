import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import PrayerRequestForm from '../components/PrayerRequestForm';
import PrayerWall from '../components/PrayerWall';
import { Heart, Plus, List, Users, Shield } from 'lucide-react';

const PrayerRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'submit' | 'wall' | 'manage'>('submit');

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  const handleRequestSubmitted = (request: any) => {
    // Switch to prayer wall after successful submission
    setActiveTab('wall');
  };

  const tabs = [
    {
      id: 'submit',
      label: lang === 'fa' ? 'ارسال درخواست' : 'Submit Request',
      icon: <Plus className="w-5 h-5" />,
      description: lang === 'fa' ? 'درخواست دعا یا شکرگزاری جدید' : 'Submit new prayer request or thanksgiving'
    },
    {
      id: 'wall',
      label: lang === 'fa' ? 'دیوار دعا' : 'Prayer Wall',
      icon: <Heart className="w-5 h-5" />,
      description: lang === 'fa' ? 'مشاهده درخواست‌های عمومی' : 'View public prayer requests'
    }
  ];

  // Add admin tab if user is admin
  if (isAdmin) {
    tabs.push({
      id: 'manage',
      label: lang === 'fa' ? 'مدیریت' : 'Manage',
      icon: <Shield className="w-5 h-5" />,
      description: lang === 'fa' ? 'مدیریت همه درخواست‌ها' : 'Manage all prayer requests'
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Heart className="w-10 h-10 text-red-500" />
            {lang === 'fa' ? 'درخواست‌های دعا' : 'Prayer Requests'}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {lang === 'fa' 
              ? 'درخواست‌های دعای خود را با ما در میان بگذارید، یا برای دیگران دعا کنید. جامعه مسیحی ما همیشه آماده دعا و حمایت از شماست.'
              : 'Share your prayer requests with us, or pray for others. Our Christian community is always ready to pray and support you.'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Description */}
          <div className="text-center">
            <p className="text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'submit' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {lang === 'fa' ? 'درخواست دعا یا شکرگزاری' : 'Prayer Request or Thanksgiving'}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🙏</span>
                      <h3 className="font-semibold text-gray-900">
                        {lang === 'fa' ? 'محرمانه' : 'Confidential'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {lang === 'fa' 
                        ? 'همه درخواست‌ها محرمانه هستند و فقط تیم دعا مشاهده می‌کند'
                        : 'All requests are confidential and only seen by prayer team'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">👥</span>
                      <h3 className="font-semibold text-gray-900">
                        {lang === 'fa' ? 'تیم دعا' : 'Prayer Team'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {lang === 'fa' 
                        ? 'تیم مخصوص دعای کلیسا برای شما دعا خواهد کرد'
                        : 'Dedicated church prayer team will pray for you'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🤲</span>
                      <h3 className="font-semibold text-gray-900">
                        {lang === 'fa' ? 'پیگیری' : 'Follow-up'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {lang === 'fa' 
                        ? 'در صورت نیاز، رهبران کلیسا با شما تماس خواهند گرفت'
                        : 'Church leaders will follow up with you if needed'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <PrayerRequestForm onSubmit={handleRequestSubmitted} />
            </div>
          )}

          {activeTab === 'wall' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {lang === 'fa' ? 'دیوار دعای عمومی' : 'Public Prayer Wall'}
                </h2>
                <p className="text-gray-600">
                  {lang === 'fa' 
                    ? 'درخواست‌هایی که توسط اعضا برای اشتراک‌گذاری عمومی انتخاب شده‌اند'
                    : 'Requests that members have chosen to share publicly'
                  }
                </p>
              </div>
              
              <PrayerWall showOnlyPublic={true} />
            </div>
          )}

          {activeTab === 'manage' && isAdmin && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {lang === 'fa' ? 'مدیریت درخواست‌های دعا' : 'Manage Prayer Requests'}
                </h2>
                <p className="text-gray-600">
                  {lang === 'fa' 
                    ? 'مشاهده و مدیریت همه درخواست‌های دعا شامل محرمانه و عمومی'
                    : 'View and manage all prayer requests including confidential and public ones'
                  }
                </p>
              </div>

              {/* Admin Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-gray-700">
                      {lang === 'fa' ? 'کل درخواست‌ها' : 'Total Requests'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                  <p className="text-sm text-gray-500">
                    {lang === 'fa' ? 'این ماه' : 'This month'}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-700">
                      {lang === 'fa' ? 'عمومی' : 'Public'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                  <p className="text-sm text-gray-500">
                    {lang === 'fa' ? 'قابل مشاهده' : 'Visible'}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-700">
                      {lang === 'fa' ? 'محرمانه' : 'Confidential'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">16</p>
                  <p className="text-sm text-gray-500">
                    {lang === 'fa' ? 'خصوصی' : 'Private'}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 text-yellow-500">🚨</span>
                    <span className="font-medium text-gray-700">
                      {lang === 'fa' ? 'فوری' : 'Urgent'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <p className="text-sm text-gray-500">
                    {lang === 'fa' ? 'نیاز به توجه' : 'Need attention'}
                  </p>
                </div>
              </div>
              
              <PrayerWall showOnlyPublic={false} />
            </div>
          )}
        </div>

        {/* Prayer Guidelines */}
        <div className="max-w-4xl mx-auto mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {lang === 'fa' ? 'راهنمای درخواست دعا' : 'Prayer Request Guidelines'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                {lang === 'fa' ? 'چه مواردی را می‌توانید درخواست کنید:' : 'What you can request prayer for:'}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {lang === 'fa' ? 'مسائل سلامتی و بیماری' : 'Health issues and illness'}</li>
                <li>• {lang === 'fa' ? 'مشکلات خانوادگی' : 'Family concerns'}</li>
                <li>• {lang === 'fa' ? 'شغل و مسائل مالی' : 'Job and financial matters'}</li>
                <li>• {lang === 'fa' ? 'رشد معنوی' : 'Spiritual growth'}</li>
                <li>• {lang === 'fa' ? 'تصمیمات مهم زندگی' : 'Important life decisions'}</li>
                <li>• {lang === 'fa' ? 'شکرگزاری از برکات' : 'Thanksgiving for blessings'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                {lang === 'fa' ? 'تضمین محرمانگی:' : 'Privacy guarantee:'}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {lang === 'fa' ? 'همه درخواست‌ها محرمانه هستند' : 'All requests are confidential'}</li>
                <li>• {lang === 'fa' ? 'فقط تیم دعا دسترسی دارند' : 'Only prayer team has access'}</li>
                <li>• {lang === 'fa' ? 'امکان ارسال ناشناس' : 'Anonymous submission available'}</li>
                <li>• {lang === 'fa' ? 'کنترل نمایش عمومی با خودتان' : 'You control public visibility'}</li>
                <li>• {lang === 'fa' ? 'عدم ذخیره اطلاعات شخصی' : 'No personal data storage'}</li>
                <li>• {lang === 'fa' ? 'رعایت کامل حریم خصوصی' : 'Full privacy protection'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerRequestsPage;