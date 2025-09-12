import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import DailyDevotional from '../components/DailyDevotional';
import DailyContentManager from '../components/admin/DailyContentManager';
import { BookOpen, Settings, Calendar, Users, Heart, Star } from 'lucide-react';

const DailyDevotionalPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'browse' | 'manage'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  const tabs = [
    {
      id: 'today',
      label: lang === 'fa' ? 'امروز' : 'Today',
      icon: <BookOpen className="w-5 h-5" />,
      description: lang === 'fa' ? 'محتوای تعبدی امروز' : 'Today\'s devotional content'
    },
    {
      id: 'browse',
      label: lang === 'fa' ? 'مرور' : 'Browse',
      icon: <Calendar className="w-5 h-5" />,
      description: lang === 'fa' ? 'مرور محتوای روزهای مختلف' : 'Browse content from different days'
    }
  ];

  if (isAdmin) {
    tabs.push({
      id: 'manage',
      label: lang === 'fa' ? 'مدیریت' : 'Manage',
      icon: <Settings className="w-5 h-5" />,
      description: lang === 'fa' ? 'مدیریت محتوای روزانه' : 'Manage daily content'
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <BookOpen className="w-10 h-10 text-blue-600" />
            {lang === 'fa' ? 'تعبدات روزانه' : 'Daily Devotionals'}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {lang === 'fa' 
              ? 'هر روز با کلام خدا و سرودهای پرستشی زیبا شروع کنید. آیات مقدس و پیام‌های روزانه برای تقویت ایمان شما'
              : 'Start each day with God\'s Word and beautiful worship songs. Daily scriptures and messages to strengthen your faith'
            }
          </p>
        </div>

        {/* Scripture Banner */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center">
            <h2 className="text-xl font-bold mb-3">
              {lang === 'fa' ? '📖 آیه روز' : '📖 Verse of the Day'}
            </h2>
            <blockquote className="text-lg italic mb-2">
              {lang === 'fa' 
                ? '«هر صبح رحمت‌های تو نو می‌شود؛ امانت تو بزرگ است.»'
                : '"Great is your faithfulness; your mercies begin afresh each morning."'
              }
            </blockquote>
            <cite className="text-blue-200">
              {lang === 'fa' ? 'مراثی ۳:۲۳' : 'Lamentations 3:23'}
            </cite>
          </div>
        </div>

        {/* Statistics */}
        {activeTab === 'today' && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-700">
                    {lang === 'fa' ? 'روزهای تعبد' : 'Days of Devotion'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">365</p>
                <p className="text-sm text-gray-500">
                  {lang === 'fa' ? 'محتوای سالانه' : 'Annual Content'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-700">
                    {lang === 'fa' ? 'آیات' : 'Verses'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-sm text-gray-500">
                  {lang === 'fa' ? 'کتاب مقدس' : 'Scripture'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-700">
                    {lang === 'fa' ? 'خوانندگان' : 'Readers'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
                <p className="text-sm text-gray-500">
                  {lang === 'fa' ? 'فعال ماهانه' : 'Monthly Active'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="font-medium text-gray-700">
                    {lang === 'fa' ? 'پسندها' : 'Likes'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">18,392</p>
                <p className="text-sm text-gray-500">
                  {lang === 'fa' ? 'کل تعاملات' : 'Total Interactions'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
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
          {activeTab === 'today' && (
            <div>
              {/* Today's Content */}
              <div className="mb-8">
                <DailyDevotional 
                  showDate={true}
                  showNavigation={false}
                  compact={false}
                  className="max-w-4xl mx-auto"
                />
              </div>

              {/* Additional Features */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    {lang === 'fa' ? 'راهنمای تعبد' : 'Devotion Guide'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                      <p className="text-gray-700 text-sm">
                        {lang === 'fa' 
                          ? 'آیه روز را با دقت بخوانید و در مورد آن تفکر کنید'
                          : 'Read the daily verse carefully and reflect on its meaning'
                        }
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                      <p className="text-gray-700 text-sm">
                        {lang === 'fa' 
                          ? 'سرود پرستشی را گوش دهید یا همراهی کنید'
                          : 'Listen to or sing along with the worship song'
                        }
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                      <p className="text-gray-700 text-sm">
                        {lang === 'fa' 
                          ? 'چند دقیقه در دعا و شکرگزاری بگذرانید'
                          : 'Spend a few minutes in prayer and thanksgiving'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />
                    {lang === 'fa' ? 'منابع مطالعه' : 'Study Resources'}
                  </h3>
                  <div className="space-y-3">
                    <a 
                      href="/bible" 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">
                        {lang === 'fa' ? 'کتاب مقدس کامل' : 'Complete Bible'}
                      </span>
                    </a>
                    <a 
                      href="/worship-songs" 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">
                        {lang === 'fa' ? 'کتابخانه سرودها' : 'Songs Library'}
                      </span>
                    </a>
                    <a 
                      href="/prayer-requests" 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">
                        {lang === 'fa' ? 'درخواست دعا' : 'Prayer Requests'}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'browse' && (
            <div>
              {/* Date Selector */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {lang === 'fa' ? 'انتخاب تاریخ' : 'Select Date'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                      {lang === 'fa' ? 'تاریخ:' : 'Date:'}
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Date Content */}
              <DailyDevotional 
                date={selectedDate}
                showDate={true}
                showNavigation={true}
                compact={false}
                className="max-w-4xl mx-auto"
              />
            </div>
          )}

          {activeTab === 'manage' && isAdmin && (
            <DailyContentManager />
          )}
        </div>

        {/* CTA Section */}
        {activeTab === 'today' && (
          <div className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              {lang === 'fa' ? 'محتوای روزانه را دنبال کنید' : 'Follow Daily Content'}
            </h3>
            <p className="text-indigo-100 mb-6">
              {lang === 'fa' 
                ? 'هر روز آیات جدید و سرودهای پرستشی دریافت کنید. با ما در سفر روحانی همراه باشید.'
                : 'Receive new verses and worship songs every day. Join us on the spiritual journey.'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                {lang === 'fa' ? 'عضویت در خبرنامه' : 'Subscribe to Newsletter'}
              </button>
              <button className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-400 transition-colors border border-indigo-400">
                {lang === 'fa' ? 'دنبال کردن در واتساپ' : 'Follow on WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyDevotionalPage;