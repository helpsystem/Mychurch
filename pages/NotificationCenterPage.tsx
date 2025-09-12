import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import NotificationCenter from '../components/admin/NotificationCenter';
import { Bell, MessageCircle, AlertCircle } from 'lucide-react';

const NotificationCenterPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {lang === 'fa' ? 'دسترسی محدود' : 'Access Restricted'}
            </h1>
            <p className="text-lg text-red-600 mb-8">
              {lang === 'fa' 
                ? 'این صفحه فقط برای مدیران و رهبران کلیسا در دسترس است'
                : 'This page is only accessible to church managers and leaders'
              }
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {lang === 'fa' ? 'بازگشت به صفحه اصلی' : 'Return to Home'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Bell className="w-10 h-10 text-indigo-600" />
            {lang === 'fa' ? 'مرکز اعلان‌رسانی کلیسا' : 'Church Notification Center'}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {lang === 'fa' 
              ? 'سیستم جامع ارسال پیام به اعضای کلیسا از طریق ایمیل، SMS و WhatsApp. مدیریت قالب‌ها، تاریخچه ارسال و آمار کامل'
              : 'Comprehensive messaging system for church members via email, SMS, and WhatsApp. Manage templates, delivery history, and complete statistics'
            }
          </p>
        </div>

        {/* Features Overview */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {lang === 'fa' ? 'ارسال چندکاناله' : 'Multi-Channel Delivery'}
              </h3>
              <p className="text-gray-600 text-sm">
                {lang === 'fa' 
                  ? 'ارسال همزمان پیام از طریق ایمیل، SMS و WhatsApp با یک کلیک'
                  : 'Send messages simultaneously via email, SMS, and WhatsApp with one click'
                }
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {lang === 'fa' ? 'قالب‌های هوشمند' : 'Smart Templates'}
              </h3>
              <p className="text-gray-600 text-sm">
                {lang === 'fa' 
                  ? 'قالب‌های آماده برای انواع پیام‌ها: رویدادها، دعوت‌ها، تعبدات روزانه'
                  : 'Ready templates for various messages: events, invitations, daily devotionals'
                }
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {lang === 'fa' ? 'پیگیری کامل' : 'Complete Tracking'}
              </h3>
              <p className="text-gray-600 text-sm">
                {lang === 'fa' 
                  ? 'تاریخچه کامل ارسال، آمار تحویل و وضعیت هر پیام'
                  : 'Complete delivery history, delivery statistics, and status of each message'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Main Notification Center */}
        <div className="max-w-7xl mx-auto">
          <NotificationCenter />
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4 text-center">
              {lang === 'fa' ? 'راهنمای استفاده' : 'Usage Guide'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">
                  {lang === 'fa' ? 'مراحل ارسال پیام:' : 'Message Sending Steps:'}
                </h4>
                <ol className="space-y-2 text-indigo-100">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    {lang === 'fa' 
                      ? 'گیرندگان مورد نظر را انتخاب کنید'
                      : 'Select desired recipients'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    {lang === 'fa' 
                      ? 'کانال‌های ارسال (ایمیل، SMS، WhatsApp) را فعال کنید'
                      : 'Enable delivery channels (Email, SMS, WhatsApp)'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    {lang === 'fa' 
                      ? 'قالب پیام انتخاب کنید یا متن سفارشی بنویسید'
                      : 'Choose a message template or write custom text'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-medium">4</span>
                    {lang === 'fa' 
                      ? 'اولویت پیام را تعیین کرده و ارسال کنید'
                      : 'Set message priority and send'
                    }
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">
                  {lang === 'fa' ? 'نکات مهم:' : 'Important Notes:'}
                </h4>
                <ul className="space-y-2 text-indigo-100">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300">•</span>
                    {lang === 'fa' 
                      ? 'پیام‌ها به زبان ترجیحی هر گیرنده ارسال می‌شوند'
                      : 'Messages are sent in each recipient\'s preferred language'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300">•</span>
                    {lang === 'fa' 
                      ? 'وضعیت اتصال سرویس‌ها در بالای صفحه نمایش داده می‌شود'
                      : 'Service connectivity status is shown at the top of the page'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300">•</span>
                    {lang === 'fa' 
                      ? 'تاریخچه کامل ارسال در تب "تاریخچه" قابل مشاهده است'
                      : 'Complete delivery history is available in the "History" tab'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-300">•</span>
                    {lang === 'fa' 
                      ? 'آمار تفصیلی ۲۴ ساعت گذشته در تب "آمار" نمایش داده می‌شود'
                      : 'Detailed statistics for the last 24 hours are shown in the "Statistics" tab'
                    }
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterPage;