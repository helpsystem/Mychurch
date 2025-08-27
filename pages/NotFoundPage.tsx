import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { TriangleAlert } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 sm:px-16 px-6">
      <TriangleAlert size={64} className="text-secondary mb-4" />
      <h1 className="text-6xl font-bold text-white mb-2">404</h1>
      <h2 className="text-3xl font-semibold text-white mb-4">{t('notFoundTitle')}</h2>
      <p className="text-dimWhite mb-8 max-w-md">{t('notFoundText')}</p>
      <Link
        to="/"
        className="py-4 px-6 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none"
      >
        {t('goHome')}
      </Link>
    </div>
  );
};

export default NotFoundPage;