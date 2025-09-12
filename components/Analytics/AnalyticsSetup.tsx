import React, { useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

interface AnalyticsSetupProps {
  googleAnalyticsId?: string;
  enableGoogleAnalytics?: boolean;
  enablePageViews?: boolean;
  enableUserTracking?: boolean;
}

const AnalyticsSetup: React.FC<AnalyticsSetupProps> = ({
  googleAnalyticsId = 'GA_MEASUREMENT_ID', // Replace with actual GA4 ID
  enableGoogleAnalytics = false, // Set to true when ready for production
  enablePageViews = true,
  enableUserTracking = false // Set to true for user analytics
}) => {
  const { lang } = useLanguage();

  useEffect(() => {
    if (!enableGoogleAnalytics || !googleAnalyticsId || googleAnalyticsId === 'GA_MEASUREMENT_ID') {
      console.log('📊 Analytics: Google Analytics not configured or disabled');
      return;
    }

    // Load Google Analytics 4
    const loadGoogleAnalytics = () => {
      // Add gtag script
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      document.head.appendChild(script1);

      // Add gtag config
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${googleAnalyticsId}', {
          page_title: document.title,
          page_location: window.location.href,
          custom_map: {
            'custom_parameter_1': 'language',
            'custom_parameter_2': 'user_type'
          }
        });
        
        // Enhanced ecommerce for donations (if applicable)
        gtag('config', '${googleAnalyticsId}', {
          custom_map: {'custom_parameter_1': 'donation_amount'}
        });
      `;
      document.head.appendChild(script2);

      // Make gtag globally available for custom events
      (window as any).gtag = (window as any).gtag || function() {
        ((window as any).dataLayer = (window as any).dataLayer || []).push(arguments);
      };
    };

    loadGoogleAnalytics();
  }, [googleAnalyticsId, enableGoogleAnalytics]);

  // Track page views
  useEffect(() => {
    if (!enablePageViews || !enableGoogleAnalytics) return;

    const trackPageView = () => {
      if ((window as any).gtag) {
        (window as any).gtag('config', googleAnalyticsId, {
          page_title: document.title,
          page_location: window.location.href,
          custom_map: {
            'language': lang,
            'page_type': getPageType()
          }
        });
      }
    };

    // Track initial page view
    const timer = setTimeout(trackPageView, 1000);
    return () => clearTimeout(timer);
  }, [lang, enablePageViews, enableGoogleAnalytics, googleAnalyticsId]);

  // Helper function to determine page type
  const getPageType = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '/en/' || path === '/fa/') return 'home';
    if (path.includes('/sermon')) return 'sermon';
    if (path.includes('/bible')) return 'bible';
    if (path.includes('/prayer')) return 'prayer';
    if (path.includes('/event')) return 'event';
    if (path.includes('/about')) return 'about';
    return 'other';
  };

  // Custom event tracking functions (available globally)
  useEffect(() => {
    if (!enableGoogleAnalytics) return;

    // Make custom tracking functions available globally
    (window as any).trackCustomEvent = (eventName: string, parameters: object = {}) => {
      if ((window as any).gtag) {
        (window as any).gtag('event', eventName, {
          ...parameters,
          language: lang,
          timestamp: new Date().toISOString()
        });
      }
    };

    // Track specific church-related events
    (window as any).trackSermonPlay = (sermonTitle: string) => {
      (window as any).trackCustomEvent('sermon_play', {
        sermon_title: sermonTitle,
        content_type: 'audio',
        language: lang
      });
    };

    (window as any).trackPrayerRequest = (prayerType: string) => {
      (window as any).trackCustomEvent('prayer_request', {
        prayer_type: prayerType,
        language: lang
      });
    };

    (window as any).trackBibleRead = (book: string, chapter: string) => {
      (window as any).trackCustomEvent('bible_read', {
        book: book,
        chapter: chapter,
        language: lang
      });
    };

    (window as any).trackDonation = (amount: number, currency: string = 'USD') => {
      (window as any).trackCustomEvent('donation', {
        value: amount,
        currency: currency,
        language: lang
      });
    };

  }, [lang, enableGoogleAnalytics]);

  // Performance monitoring
  useEffect(() => {
    if (!enableGoogleAnalytics) return;

    const trackPerformance = () => {
      if ('performance' in window && (window as any).gtag) {
        // Track page load time
        window.addEventListener('load', () => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (perfData) {
            (window as any).gtag('event', 'page_load_time', {
              value: Math.round(perfData.loadEventEnd - perfData.fetchStart),
              language: lang,
              page_type: getPageType()
            });
          }
        });

        // Track Core Web Vitals
        const trackWebVitals = () => {
          if ('web-vitals' in window) {
            // This would require importing web-vitals library
            console.log('📊 Web Vitals tracking ready');
          }
        };

        trackWebVitals();
      }
    };

    trackPerformance();
  }, [lang, enableGoogleAnalytics]);

  return null;
};

export default AnalyticsSetup;