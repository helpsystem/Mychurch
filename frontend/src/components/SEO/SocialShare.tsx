import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react';

interface SocialShareProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
  showLabel?: boolean;
}

const SocialShare: React.FC<SocialShareProps> = ({
  url = window.location.href,
  title = '',
  description = '',
  className = '',
  showLabel = true
}) => {
  const { t, lang } = useLanguage();
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || t('churchTitle'));
  const encodedDescription = encodeURIComponent(description || t('welcomeMessage'));
  const fullText = encodeURIComponent(`${title} - ${description}`);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: <Facebook size={20} />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-500'
    },
    {
      name: 'Twitter',
      icon: <Twitter size={20} />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${fullText}`,
      color: 'hover:text-blue-400'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={20} />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:text-blue-600'
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={20} />,
      url: `https://wa.me/?text=${fullText}%20${encodedUrl}`,
      color: 'hover:text-green-500'
    }
  ];

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || t('churchTitle'),
          text: description || t('welcomeMessage'),
          url: url
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  return (
    <div className={`flex items-center space-x-2 rtl:space-x-reverse ${className}`}>
      {showLabel && (
        <span className="text-dimWhite text-sm flex items-center">
          <Share2 size={16} className="mr-1 rtl:mr-0 rtl:ml-1" />
          {t('share')}:
        </span>
      )}
      
      {/* Native share button for mobile */}
      {navigator.share && (
        <button
          onClick={handleNativeShare}
          className="p-2 text-dimWhite hover:text-secondary transition-colors duration-200 lg:hidden"
          aria-label={t('share')}
        >
          <Share2 size={20} />
        </button>
      )}

      {/* Social share buttons */}
      <div className="flex space-x-1 rtl:space-x-reverse">
        {shareLinks.map((social) => (
          <button
            key={social.name}
            onClick={() => handleShare(social.url)}
            className={`p-2 text-dimWhite transition-colors duration-200 ${social.color}`}
            aria-label={`${t('share')} ${lang === 'fa' ? 'در' : 'on'} ${social.name}`}
            title={`${t('share')} ${lang === 'fa' ? 'در' : 'on'} ${social.name}`}
          >
            {social.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SocialShare;