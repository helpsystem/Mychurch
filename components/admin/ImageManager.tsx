import React, { useState, useRef } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Upload, Trash2, Eye, Copy, Check, Image as ImageIcon } from 'lucide-react';
import Spinner from '../Spinner';

interface ImageManagerProps {
  images: string[];
  onImageSelect?: (imageUrl: string) => void;
  allowMultiSelect?: boolean;
  title?: string;
}

const ImageManager: React.FC<ImageManagerProps> = ({ 
  images: initialImages = [], 
  onImageSelect, 
  allowMultiSelect = false,
  title = 'Image Manager'
}) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<string[]>(initialImages);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      // For now, just show uploaded files in console
      // In future, integrate with actual upload service
      console.log('Files to upload:', files.map(f => f.name));
      alert('فایل‌ها آپلود شدند (در آینده به سرور متصل خواهد شد)');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageUrl: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این تصویر را حذف کنید?')) return;
    
    try {
      // For now, just remove from UI
      // In future, integrate with actual delete service
      console.log('Delete file:', imageUrl);
      alert('تصویر حذف شد (در آینده از سرور نیز حذف خواهد شد)');
      setImages(prev => prev.filter(img => img !== imageUrl));
      setSelectedImages(prev => prev.filter(img => img !== imageUrl));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    if (allowMultiSelect) {
      setSelectedImages(prev => 
        prev.includes(imageUrl) 
          ? prev.filter(img => img !== imageUrl)
          : [...prev, imageUrl]
      );
    } else {
      setSelectedImages([imageUrl]);
      onImageSelect?.(imageUrl);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Get all current website images
  const getAllWebsiteImages = () => {
    const websiteImages = [
      '/images/Church_interior_worship_space_70ed9ac2.png',
      '/images/Church_community_gathering_a97f90e1.png',
      '/images/Prayer_circle_hands_together_feb88f83.png',
      '/images/Bible_study_peaceful_setting_6bb44b27.png',
      '/images/Modern_church_building_exterior_83da6dba.png',
      '/images/Persian_Christian_choir_singing_bfe3adf8.png',
      '/images/Children_Sunday_school_class_ade575b6.png',
      '/images/cross-cave-sunset.jpg',
      '/images/jesus-cross-sunset.jpg',
      '/images/church-logo-ultra-hd.png',
      '/images/church-logo-hq.png',
      '/images/church-logo-3d.png',
      '/images/pastor-javad.png',
      '/images/leader-nazi.png',
      '/images/church-icons.png',
      '/images/ministry-icons.png'
    ];
    return websiteImages;
  };

  const websiteImages = getAllWebsiteImages();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? <Spinner size="4" /> : <Upload size={16} />}
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <ImageIcon size={20} />
          Website Images
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {websiteImages.map((imageUrl, index) => (
            <div 
              key={index} 
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                ${selectedImages.includes(imageUrl) ? 'border-blue-500' : 'border-gray-600'}
                hover:border-blue-400`}
              onClick={() => handleImageSelect(imageUrl)}
            >
              <div className="aspect-square bg-gray-700 flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="text-gray-400 text-sm p-2">Not Found</div>`;
                    }
                  }}
                />
              </div>
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(imageUrl);
                    }}
                    className="p-1 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                    title="Copy URL"
                  >
                    {copiedUrl === imageUrl ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-white" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(imageUrl, '_blank');
                    }}
                    className="p-1 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
                    title="View Full Size"
                  >
                    <Eye size={16} className="text-white" />
                  </button>
                </div>
              </div>

              {selectedImages.includes(imageUrl) && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                  <Check size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedImages.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-2">Selected Images ({selectedImages.length})</h3>
          <div className="space-y-2">
            {selectedImages.map((url, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <span className="text-sm text-gray-300 font-mono truncate flex-1">{url}</span>
                <button
                  onClick={() => copyToClipboard(url)}
                  className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {copiedUrl === url ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageManager;