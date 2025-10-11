/**
 * Auto-Generated Image Gallery
 * گالری عکس‌های خودکار مسیحی
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Image as ImageIcon, Calendar, Download, ExternalLink } from 'lucide-react';
import axios from 'axios';

interface GeneratedImage {
  topic: string;
  filename: string;
  url: string;
  source: 'unsplash' | 'openai-dalle' | 'stability-ai' | 'placeholder';
  photographer?: string;
  photographerUrl?: string;
  description?: string;
  prompt?: string;
  timestamp: number;
}

interface GalleryProps {
  limit?: number;
  showControls?: boolean;
  autoRefresh?: boolean;
}

const AutoImageGallery: React.FC<GalleryProps> = ({ 
  limit, 
  showControls = true,
  autoRefresh = false 
}) => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

  // Fetch images
  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/images/all`);
      
      if (response.data.success) {
        let fetchedImages = response.data.images;
        
        // Apply limit if specified
        if (limit && fetchedImages.length > limit) {
          fetchedImages = fetchedImages.slice(0, limit);
        }
        
        setImages(fetchedImages);
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch images:', err);
      setError('خطا در دریافت عکس‌ها');
    } finally {
      setLoading(false);
    }
  };

  // Fetch status
  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/images/status`);
      if (response.data.success) {
        setStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  // Generate new images
  const generateImages = async () => {
    try {
      setGenerating(true);
      await axios.post(`${API_URL}/api/images/generate`);
      
      // Poll for completion (check every 5 seconds)
      const pollInterval = setInterval(async () => {
        const response = await axios.get(`${API_URL}/api/images/all`);
        if (response.data.images.length > images.length) {
          clearInterval(pollInterval);
          await fetchImages();
          await fetchStatus();
          setGenerating(false);
        }
      }, 5000);
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setGenerating(false);
      }, 5 * 60 * 1000);
      
    } catch (err: any) {
      console.error('Failed to generate images:', err);
      setError('خطا در تولید عکس‌ها');
      setGenerating(false);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchImages();
    fetchStatus();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchImages();
        fetchStatus();
      }, 60000); // Every minute
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Get topic translations
  const getTopicName = (topic: string): { fa: string; en: string } => {
    const topics: Record<string, { fa: string; en: string }> = {
      jesus: { fa: 'عیسی مسیح', en: 'Jesus Christ' },
      cross: { fa: 'صلیب', en: 'Cross' },
      church: { fa: 'کلیسا', en: 'Church' },
      prayer: { fa: 'دعا', en: 'Prayer' },
      worship: { fa: 'عبادت', en: 'Worship' },
      bible: { fa: 'کتاب مقدس', en: 'Bible' },
      faith: { fa: 'ایمان', en: 'Faith' },
      hope: { fa: 'امید', en: 'Hope' },
      love: { fa: 'محبت', en: 'Love' },
      peace: { fa: 'صلح', en: 'Peace' },
      salvation: { fa: 'نجات', en: 'Salvation' },
      grace: { fa: 'فیض', en: 'Grace' }
    };
    
    return topics[topic] || { fa: topic, en: topic };
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="auto-image-gallery">
      {/* Header with controls */}
      {showControls && (
        <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <div>
            <h2 className="text-2xl font-bold text-purple-900 mb-1">
              گالری عکس‌های مسیحی
            </h2>
            <p className="text-sm text-gray-600">
              {images.length} عکس موجود
              {status && status.daysUntilNext > 0 && (
                <span className="mr-2">
                  • آپدیت بعدی: {status.daysUntilNext} روز دیگر
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={fetchImages}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>بروزرسانی</span>
            </button>
            
            <button
              onClick={generateImages}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <ImageIcon className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
              <span>{generating ? 'در حال تولید...' : 'تولید جدید'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Gallery grid */}
      {images.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">هنوز عکسی تولید نشده است</p>
          {showControls && (
            <button
              onClick={generateImages}
              disabled={generating}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              تولید اولین عکس‌ها
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => {
            const topicNames = getTopicName(image.topic);
            
            return (
              <div
                key={`${image.topic}-${index}`}
                className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow bg-white"
              >
                {/* Image */}
                <div className="aspect-video overflow-hidden">
                  <img
                    src={`${API_URL}${image.url}`}
                    alt={topicNames.fa}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-bold mb-1">{topicNames.fa}</h3>
                    <p className="text-sm opacity-90 mb-2">{topicNames.en}</p>
                    
                    {image.description && (
                      <p className="text-xs opacity-75 mb-3 line-clamp-2">
                        {image.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(image.timestamp).toLocaleDateString('fa-IR')}</span>
                      
                      {image.photographer && (
                        <>
                          <span className="mx-1">•</span>
                          <a
                            href={image.photographerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            {image.photographer}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Source badge */}
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  {image.source}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status info */}
      {showControls && status && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="font-semibold text-gray-900">وضعیت</p>
              <p>{status.status === 'scheduled' ? 'زمان‌بندی شده' : 
                  status.status === 'ready' ? 'آماده' : 'هرگز اجرا نشده'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">آخرین آپدیت</p>
              <p>{status.lastUpdate ? 
                new Date(status.lastUpdate).toLocaleDateString('fa-IR') : 
                'هرگز'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">API های فعال</p>
              <p>
                {status.apisConfigured.openai && '🟢 OpenAI '}
                {status.apisConfigured.stability && '🟢 Stability '}
                {status.apisConfigured.unsplash && '🟢 Unsplash '}
                {!status.apisConfigured.openai && 
                 !status.apisConfigured.stability && 
                 !status.apisConfigured.unsplash && '⚪ هیچکدام'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">تعداد موضوعات</p>
              <p>{status.config.topics.length} موضوع</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoImageGallery;
