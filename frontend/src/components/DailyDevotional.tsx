import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Music, 
  Calendar, 
  Heart, 
  Share2, 
  Copy, 
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

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
}

interface DailyDevotionalProps {
  className?: string;
  showDate?: boolean;
  showNavigation?: boolean;
  compact?: boolean;
  date?: string;
}

const DailyDevotional: React.FC<DailyDevotionalProps> = ({ 
  className = '',
  showDate = true,
  showNavigation = false,
  compact = false,
  date
}) => {
  const { lang } = useLanguage();
  const [currentContent, setCurrentContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);
  const [liked, setLiked] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  useEffect(() => {
    loadDailyContent(selectedDate);
  }, [selectedDate]);

  const loadDailyContent = async (targetDate: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/daily-content/public?date=${targetDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setCurrentContent(data.content || null);
      } else {
        // Mock data fallback
        const mockContent: DailyContent = {
          id: `mock-${targetDate}`,
          date: targetDate,
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
          isActive: true
        };
        setCurrentContent(mockContent);
      }
    } catch (error) {
      console.error('Error loading daily content:', error);
      setError(lang === 'fa' ? 'خطا در بارگذاری محتوا' : 'Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const handleLike = () => {
    setLiked(!liked);
    // In a real implementation, this would send to the backend
  };

  const handleShare = (method: 'copy' | 'whatsapp' | 'email') => {
    if (!currentContent) return;

    const title = currentContent.devotionalTheme?.[lang] || 
                  currentContent.devotionalTheme?.en || 
                  currentContent.devotionalTheme?.fa || 
                  'Daily Devotional';
    
    const scriptureText = currentContent.scripture ? 
      `${currentContent.scripture.reference}: ${currentContent.scripture.text[lang] || currentContent.scripture.text.en || currentContent.scripture.text.fa}` : 
      '';

    const shareText = `${title}\n\n${scriptureText}\n\nIranian Christian Church of D.C.`;
    const shareUrl = `${window.location.origin}/#/daily-devotional?date=${selectedDate}`;

    switch (method) {
      case 'copy':
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        alert(lang === 'fa' ? 'متن کپی شد' : 'Text copied to clipboard');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`);
        break;
    }
    setShareMenuOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'py-4' : 'py-8'} ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3">
          {lang === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center ${compact ? 'py-4' : 'py-8'} ${className}`}>
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => loadDailyContent(selectedDate)}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {lang === 'fa' ? 'تلاش مجدد' : 'Try Again'}
        </button>
      </div>
    );
  }

  if (!currentContent) {
    return (
      <div className={`text-center ${compact ? 'py-4' : 'py-8'} ${className}`}>
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">
          {lang === 'fa' ? 'محتوایی برای این روز یافت نشد' : 'No content found for this date'}
        </p>
        {showNavigation && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className={`${compact ? 'p-4' : 'p-6'} ${compact ? '' : 'border-b border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {showDate && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
                  {formatDate(selectedDate)}
                </span>
              </div>
            )}
            {currentContent.devotionalTheme && !compact && (
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentContent.devotionalTheme[lang] || 
                   currentContent.devotionalTheme.en || 
                   currentContent.devotionalTheme.fa}
                </h2>
              </div>
            )}
          </div>
          
          {/* Navigation and Actions */}
          <div className="flex items-center gap-2">
            {showNavigation && (
              <>
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title={lang === 'fa' ? 'روز قبل' : 'Previous day'}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title={lang === 'fa' ? 'روز بعد' : 'Next day'}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            
            {!compact && (
              <>
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-lg transition-colors ${
                    liked 
                      ? 'text-red-600 bg-red-100' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={lang === 'fa' ? 'پسندیدن' : 'Like'}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShareMenuOpen(!shareMenuOpen)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title={lang === 'fa' ? 'اشتراک‌گذاری' : 'Share'}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  
                  {shareMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-36">
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-t-lg"
                      >
                        <Copy className="w-4 h-4" />
                        {lang === 'fa' ? 'کپی' : 'Copy'}
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      >
                        <span className="w-4 h-4 text-green-600">📱</span>
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleShare('email')}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-b-lg"
                      >
                        <span className="w-4 h-4">📧</span>
                        {lang === 'fa' ? 'ایمیل' : 'Email'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Compact Title */}
        {currentContent.devotionalTheme && compact && (
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {currentContent.devotionalTheme[lang] || 
             currentContent.devotionalTheme.en || 
             currentContent.devotionalTheme.fa}
          </h3>
        )}
      </div>

      {/* Content */}
      <div className={compact ? 'space-y-4' : 'p-6 space-y-6'}>
        {/* Scripture */}
        {currentContent.scripture && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">
                {currentContent.scripture.reference}
              </span>
              {currentContent.scripture.theme && (
                <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {currentContent.scripture.theme}
                </span>
              )}
            </div>
            <blockquote className={`text-blue-700 leading-relaxed ${compact ? 'text-sm' : 'text-base'} italic`}>
              "{currentContent.scripture.text[lang] || 
                currentContent.scripture.text.en || 
                currentContent.scripture.text.fa}"
            </blockquote>
          </div>
        )}

        {/* Worship Song */}
        {currentContent.worshipSong && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">
                {lang === 'fa' ? 'سرود امروز' : 'Today\'s Worship Song'}
              </span>
            </div>
            <div className="text-purple-700">
              <h4 className={`font-medium ${compact ? 'text-sm' : 'text-base'}`}>
                {currentContent.worshipSong.title[lang] || 
                 currentContent.worshipSong.title.en || 
                 currentContent.worshipSong.title.fa}
              </h4>
              {currentContent.worshipSong.artist && (
                <p className={`text-purple-600 ${compact ? 'text-xs' : 'text-sm'} mt-1`}>
                  {lang === 'fa' ? 'اثر: ' : 'by '}{currentContent.worshipSong.artist}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Compact Actions */}
        {compact && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  liked 
                    ? 'text-red-600' 
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                {lang === 'fa' ? 'پسند' : 'Like'}
              </button>
              
              <button
                onClick={() => setShareMenuOpen(!shareMenuOpen)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {lang === 'fa' ? 'اشتراک' : 'Share'}
              </button>
            </div>
            
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lang === 'fa' ? 'محتوای روزانه' : 'Daily Content'}
            </span>
          </div>
        )}
      </div>

      {/* Share Menu for Compact */}
      {compact && shareMenuOpen && (
        <div className="absolute right-4 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
          <button
            onClick={() => handleShare('copy')}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-t-lg text-sm"
          >
            <Copy className="w-3 h-3" />
            {lang === 'fa' ? 'کپی' : 'Copy'}
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 text-sm"
          >
            <span className="w-3 h-3 text-green-600">📱</span>
            WhatsApp
          </button>
          <button
            onClick={() => handleShare('email')}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-b-lg text-sm"
          >
            <span className="w-3 h-3">📧</span>
            {lang === 'fa' ? 'ایمیل' : 'Email'}
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyDevotional;