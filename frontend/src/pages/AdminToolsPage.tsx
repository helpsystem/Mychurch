import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import {
  Music,
  BookOpen,
  Settings,
  Users,
  Calendar,
  FileText,
  Timer,
  RefreshCw,
  Presentation,
  Layout as LayoutIcon,
  AudioLines,
  FileAudio,
  BarChart3,
  Zap
} from 'lucide-react';

interface AdminTool {
  id: string;
  title: { fa: string; en: string };
  description: { fa: string; en: string };
  icon: any;
  path: string;
  roles: string[];
  category: 'worship' | 'bible' | 'content' | 'system';
}

function AdminToolsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const tools: AdminTool[] = [
    // Worship Tools
    {
      id: 'worship-management',
      title: { fa: 'مدیریت سرودها', en: 'Worship Management' },
      description: { fa: 'ویرایش، افزودن و مدیریت سرودهای ستایش', en: 'Edit, add and manage worship songs' },
      icon: <Music className="w-6 h-6" />,
      path: '/admin/worship-management',
      roles: ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'],
      category: 'worship'
    },
    {
      id: 'worship-health',
      title: { fa: 'وضعیت سلامت سرودها', en: 'Worship Health Dashboard' },
      description: { fa: 'بررسی کیفیت و کامل بودن سرودها', en: 'Check quality and completeness of songs' },
      icon: <BarChart3 className="w-6 h-6" />,
      path: '/admin/worship-health',
      roles: ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'],
      category: 'worship'
    },
    {
      id: 'timing',
      title: { fa: 'خودکارسازی تایمینگ', en: 'Timing Automation' },
      description: { fa: 'تولید خودکار تایمینگ با هوش مصنوعی', en: 'Auto-generate timing with AI' },
      icon: <Timer className="w-6 h-6" />,
      path: '/admin/timing',
      roles: ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'],
      category: 'worship'
    },
    {
      id: 'sync-management',
      title: { fa: 'مدیریت همگام‌سازی', en: 'Sync Management' },
      description: { fa: 'همگام‌سازی صدا و متن سرودها و کتاب مقدس', en: 'Sync audio and text for songs and Bible' },
      icon: <RefreshCw className="w-6 h-6" />,
      path: '/admin/sync-management',
      roles: ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'],
      category: 'worship'
    },
    {
      id: 'audio-sync',
      title: { fa: 'ابزار پیشرفته همگام‌سازی', en: 'Advanced Audio Sync' },
      description: { fa: 'همگام‌سازی دستی دقیق صدا و متن', en: 'Manual precise audio-text synchronization' },
      icon: <AudioLines className="w-6 h-6" />,
      path: '/admin/audio-sync',
      roles: ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'],
      category: 'worship'
    },
    {
      id: 'presentation-creator',
      title: { fa: 'ساخت پرزنتیشن', en: 'Presentation Creator' },
      description: { fa: 'ساخت اسلاید PowerPoint با تایمینگ', en: 'Create PowerPoint slides with timing' },
      icon: <Presentation className="w-6 h-6" />,
      path: '/admin/presentation-creator',
      roles: ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'],
      category: 'worship'
    },
    // Bible Tools
    {
      id: 'bible-presentation',
      title: { fa: 'پرزنتیشن کتاب مقدس', en: 'Bible Presentation' },
      description: { fa: 'ساخت اسلاید از آیات کتاب مقدس', en: 'Create slides from Bible verses' },
      icon: <BookOpen className="w-6 h-6" />,
      path: '/admin/bible-presentation',
      roles: ['SUPER_ADMIN', 'MANAGER', 'WORSHIP_LEADER'],
      category: 'bible'
    },
    {
      id: 'bible-audio-upload',
      title: { fa: 'آپلود صدای کتاب مقدس', en: 'Bible Audio Upload' },
      description: { fa: 'آپلود و مدیریت فایل‌های صوتی کتاب مقدس', en: 'Upload and manage Bible audio files' },
      icon: <FileAudio className="w-6 h-6" />,
      path: '/bible-admin-upload',
      roles: ['SUPER_ADMIN', 'MANAGER'],
      category: 'bible'
    },
    // Content Management
    {
      id: 'sermons',
      title: { fa: 'مدیریت موعظه‌ها', en: 'Sermons Management' },
      description: { fa: 'افزودن و ویرایش موعظه‌ها', en: 'Add and edit sermons' },
      icon: <FileText className="w-6 h-6" />,
      path: '/admin/sermons',
      roles: ['SUPER_ADMIN', 'MANAGER', 'LEADER'],
      category: 'content'
    },
    {
      id: 'events-recorder',
      title: { fa: 'ضبط رویدادها', en: 'Event Recorder' },
      description: { fa: 'ضبط و مستندسازی رویدادهای کلیسا', en: 'Record and document church events' },
      icon: <Calendar className="w-6 h-6" />,
      path: '/events/recorder',
      roles: ['SUPER_ADMIN', 'MANAGER', 'LEADER'],
      category: 'content'
    },
    // System Tools
    {
      id: 'automations',
      title: { fa: 'اتوماسیون N8N', en: 'N8N Automation' },
      description: { fa: 'مدیریت خودکارسازی‌ها', en: 'Manage automations' },
      icon: <Zap className="w-6 h-6" />,
      path: '/admin/automations',
      roles: ['SUPER_ADMIN'],
      category: 'system'
    },
    {
      id: 'backend-config',
      title: { fa: 'پیکربندی سرور', en: 'Backend Configuration' },
      description: { fa: 'تنظیمات سرور و پایگاه داده', en: 'Server and database settings' },
      icon: <Settings className="w-6 h-6" />,
      path: '/admin/configure-backend',
      roles: ['SUPER_ADMIN'],
      category: 'system'
    }
  ];

  const canAccess = (tool: AdminTool) => {
    if (!user) return false;
    return tool.roles.includes(user.role);
  };

  const categories = {
    worship: { fa: 'ابزارهای ستایش', en: 'Worship Tools' },
    bible: { fa: 'ابزارهای کتاب مقدس', en: 'Bible Tools' },
    content: { fa: 'مدیریت محتوا', en: 'Content Management' },
    system: { fa: 'ابزارهای سیستم', en: 'System Tools' }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-6">
            <LayoutIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            {lang === 'fa' ? 'پنل مدیریت' : 'Admin Panel'}
          </h1>
          <p className="text-lg text-gray-600" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            {lang === 'fa' 
              ? 'ابزارهای مدیریتی برای کلیسای مسیحیان ایرانی دی‌سی' 
              : 'Management tools for Iranian Christian Church DC'}
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">{user.email}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {user.role}
              </span>
            </div>
          )}
        </div>

        {/* Tools Grid by Category */}
        {Object.entries(categories).map(([categoryKey, categoryName]) => {
          const categoryTools = tools.filter(t => t.category === categoryKey && canAccess(t));
          if (categoryTools.length === 0) return null;

          return (
            <div key={categoryKey} className="mb-12">
              <h2 
                className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3"
                dir={lang === 'fa' ? 'rtl' : 'ltr'}
              >
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                {lang === 'fa' ? categoryName.fa : categoryName.en}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTools.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.path}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300"
                  >
                    <div className="p-6" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {lang === 'fa' ? tool.title.fa : tool.title.en}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {lang === 'fa' ? tool.description.fa : tool.description.en}
                          </p>
                        </div>
                      </div>
                      
                      {/* Role badges */}
                      <div className="mt-4 flex flex-wrap gap-1" dir="ltr">
                        {tool.roles.map(role => (
                          <span 
                            key={role}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Hover effect bar */}
                    <div className="h-1 bg-gradient-to-r from-blue-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* No Access Message */}
        {tools.filter(canAccess).length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg text-gray-600" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
              {lang === 'fa' 
                ? 'شما به هیچ ابزار مدیریتی دسترسی ندارید' 
                : 'You do not have access to any admin tools'}
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <span>{lang === 'fa' ? 'بازگشت به صفحه اصلی' : 'Back to Home'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminToolsPage;
