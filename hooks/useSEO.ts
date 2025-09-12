import { useEffect } from 'react';
import { useLanguage } from './useLanguage';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  siteName?: string;
  locale?: string;
  alternateLocale?: string;
  canonical?: string;
  noindex?: boolean;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  twitterHandle?: string;
  fbAppId?: string;
}

export const useSEO = (config: SEOConfig) => {
  const { lang, t } = useLanguage();
  
  useEffect(() => {
    const {
      title,
      description,
      keywords = [],
      image,
      url,
      type = 'website',
      siteName = t('churchTitle'),
      canonical,
      noindex = false,
      author,
      publishedTime,
      modifiedTime,
      twitterHandle = '@ICCDCChurch',
      fbAppId
    } = config;

    // Set document title
    if (title) {
      document.title = `${title} | ${siteName}`;
    } else {
      document.title = siteName;
    }

    // Get current URL
    const currentUrl = url || window.location.href;
    const baseUrl = window.location.origin;

    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Helper function to set link tag
    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang 
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]`;
      let link = document.querySelector(selector) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        if (hreflang) {
          link.setAttribute('hreflang', hreflang);
        }
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // Basic meta tags
    if (description) {
      setMetaTag('description', description);
    }

    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }

    if (author) {
      setMetaTag('author', author);
    }

    // Language and locale
    document.documentElement.setAttribute('lang', lang);
    setMetaTag('language', lang);
    
    // Set text direction for Persian
    document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

    // Robots meta tag
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Canonical URL
    if (canonical) {
      setLinkTag('canonical', canonical);
    } else {
      setLinkTag('canonical', currentUrl);
    }

    // Open Graph tags
    setMetaTag('og:title', title || siteName, true);
    setMetaTag('og:description', description || t('welcomeMessage'), true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:url', currentUrl, true);
    setMetaTag('og:site_name', siteName, true);
    setMetaTag('og:locale', lang === 'fa' ? 'fa_IR' : 'en_US', true);
    
    // Alternate locale
    const alternateLocale = lang === 'fa' ? 'en_US' : 'fa_IR';
    setMetaTag('og:locale:alternate', alternateLocale, true);

    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
      setMetaTag('og:image', fullImageUrl, true);
      setMetaTag('og:image:width', '1200', true);
      setMetaTag('og:image:height', '630', true);
      setMetaTag('og:image:alt', title || siteName, true);
    }

    if (fbAppId) {
      setMetaTag('fb:app_id', fbAppId, true);
    }

    // Twitter Card tags
    setMetaTag('twitter:card', image ? 'summary_large_image' : 'summary');
    setMetaTag('twitter:title', title || siteName);
    setMetaTag('twitter:description', description || t('welcomeMessage'));
    if (twitterHandle) {
      setMetaTag('twitter:site', twitterHandle);
      setMetaTag('twitter:creator', twitterHandle);
    }
    if (image) {
      const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
      setMetaTag('twitter:image', fullImageUrl);
      setMetaTag('twitter:image:alt', title || siteName);
    }

    // Article specific meta tags
    if (type === 'article') {
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        setMetaTag('article:modified_time', modifiedTime, true);
      }
      if (author) {
        setMetaTag('article:author', author, true);
      }
    }

    // Alternate language links for bilingual SEO
    const alternateUrl = currentUrl.replace(`/${lang}/`, lang === 'fa' ? '/en/' : '/fa/');
    const alternateHreflang = lang === 'fa' ? 'en' : 'fa';
    setLinkTag('alternate', alternateUrl, alternateHreflang);
    setLinkTag('alternate', currentUrl, lang);

    // Self-referencing canonical
    setLinkTag('alternate', currentUrl, 'x-default');

    // Additional meta tags for Persian content
    if (lang === 'fa') {
      setMetaTag('content-language', 'fa');
      // Persian-specific keywords
      const persianKeywords = [
        'کلیسای ایرانی',
        'مسیحیان ایرانی',
        'واشنگتن دی سی',
        'کلیسای فارسی زبان',
        'جامعه مسیحی ایرانی'
      ];
      setMetaTag('keywords', [...keywords, ...persianKeywords].join(', '));
    } else {
      setMetaTag('content-language', 'en');
      // English-specific keywords
      const englishKeywords = [
        'Iranian Church',
        'Persian Christians',
        'Washington DC',
        'Farsi Church',
        'Iranian Christian Community'
      ];
      setMetaTag('keywords', [...keywords, ...englishKeywords].join(', '));
    }

    // Clean up function to remove meta tags on unmount
    return () => {
      // Note: In a SPA, we generally don't want to remove meta tags
      // as they'll be overwritten by the next page's SEO configuration
    };
  }, [config, lang, t]);
};