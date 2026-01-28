/**
 * 🎬 Admin Broadcast Page
 * صفحه مدیریت پخش زنده برای ادمین‌ها و رهبران کلیسا
 */

import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { BroadcastConsole } from '../components/broadcast';

const AdminBroadcastPage: React.FC = () => {
  const { lang } = useLanguage();

  return (
    <div className="h-screen w-screen overflow-hidden">
      <BroadcastConsole initialLang={lang as 'fa' | 'en'} />
    </div>
  );
};

export default AdminBroadcastPage;
