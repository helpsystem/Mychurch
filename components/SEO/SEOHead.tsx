import React, { useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useSEO, SEOConfig } from '../../hooks/useSEO';

interface SEOHeadProps extends SEOConfig {
  children?: React.ReactNode;
}

const SEOHead: React.FC<SEOHeadProps> = ({ children, ...seoConfig }) => {
  const { lang, t } = useLanguage();
  
  // Use the SEO hook to manage meta tags
  useSEO(seoConfig);

  // Add structured data to the page
  useEffect(() => {
    const addStructuredData = (data: object) => {
      const existingScript = document.querySelector('#structured-data');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    };

    // Organization structured data
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Church',
      'name': t('churchTitle'),
      'alternateName': lang === 'fa' ? 'Iranian Christian Church of D.C.' : 'کلیسای مسیحی ایرانی واشنگتن دی‌سی',
      'description': seoConfig.description || t('welcomeMessage'),
      'url': window.location.origin,
      'logo': `${window.location.origin}/images/church-logo-hq.png`,
      'image': seoConfig.image ? `${window.location.origin}${seoConfig.image}` : `${window.location.origin}/images/church-logo-hq.png`,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Washington',
        'addressRegion': 'DC',
        'addressCountry': 'US'
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'customer service',
        'email': 'info@iccdc.org'
      },
      'sameAs': [
        'https://www.facebook.com/ICCDCChurch',
        'https://www.youtube.com/@ICCDCChurch',
        'https://www.instagram.com/ICCDCChurch'
      ],
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'reviewCount': '150'
      },
      'foundingDate': '1995',
      'denomination': 'Protestant',
      'inLanguage': [
        {
          '@type': 'Language',
          'name': 'English',
          'alternateName': 'en'
        },
        {
          '@type': 'Language', 
          'name': 'Persian',
          'alternateName': 'fa'
        }
      ]
    };

    // Add page-specific structured data
    if (seoConfig.type === 'article') {
      const articleData = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': seoConfig.title,
        'description': seoConfig.description,
        'author': {
          '@type': 'Organization',
          'name': t('churchTitle')
        },
        'publisher': {
          '@type': 'Organization',
          'name': t('churchTitle'),
          'logo': {
            '@type': 'ImageObject',
            'url': `${window.location.origin}/images/church-logo-hq.png`
          }
        },
        'datePublished': seoConfig.publishedTime,
        'dateModified': seoConfig.modifiedTime || seoConfig.publishedTime,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': window.location.href
        },
        'image': seoConfig.image ? `${window.location.origin}${seoConfig.image}` : undefined,
        'inLanguage': lang === 'fa' ? 'fa-IR' : 'en-US'
      };
      addStructuredData([organizationData, articleData]);
    } else {
      addStructuredData(organizationData);
    }

    return () => {
      const script = document.querySelector('#structured-data');
      if (script) {
        script.remove();
      }
    };
  }, [seoConfig, lang, t]);

  return (
    <>
      {children}
    </>
  );
};

export default SEOHead;