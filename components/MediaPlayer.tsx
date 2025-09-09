import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { X, ExternalLink } from 'lucide-react';

interface MediaPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoUrl?: string;
  audioUrl?: string;
  type: 'video' | 'audio';
}

const MediaPlayer = ({ isOpen, onClose, title, videoUrl, audioUrl, type }: MediaPlayerProps) => {
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const getEmbedUrl = (url: string) => {
    // Convert YouTube URLs to embedded format
    if (url.includes('youtube.com/embed/')) {
      return url + '?autoplay=1&rel=0';
    }
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 truncate" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Media Content */}
        <div className="p-4">
          {type === 'video' && videoUrl && (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={getEmbedUrl(videoUrl)}
                title={title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {type === 'audio' && audioUrl && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎵</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
              </div>
              
              <audio 
                controls 
                className="w-full"
                autoPlay
              >
                <source src={audioUrl} type="audio/mpeg" />
                <source src={audioUrl} type="audio/wav" />
                <source src={audioUrl} type="audio/ogg" />
                {lang === 'fa' ? 'مرورگر شما از پخش صوت پشتیبانی نمی‌کند.' : 'Your browser does not support the audio element.'}
              </audio>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {lang === 'fa' ? 'بستن' : 'Close'}
          </button>
          
          {(videoUrl || audioUrl) && (
            <a
              href={videoUrl || audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {lang === 'fa' ? 'باز کردن در صفحه جدید' : 'Open in new tab'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer;