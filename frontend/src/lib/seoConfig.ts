import { SEOConfig } from '../hooks/useSEO';

// Default SEO configuration for the website
export const defaultSEOConfig: SEOConfig = {
  siteName: 'Iranian Christian Church of D.C.',
  twitterHandle: '@ICCDCChurch',
  fbAppId: '', // Add Facebook App ID if available
  type: 'website'
};

// Page-specific SEO configurations (bilingual)
export const pageSEOConfig: Record<string, { en: Partial<SEOConfig>, fa: Partial<SEOConfig> }> = {
  home: {
    en: {
      title: 'Welcome to Iranian Christian Church of D.C.',
      description: 'Join our vibrant Persian-speaking Christian community in Washington DC. Experience faith, fellowship, and worship in both English and Farsi. Weekly services, Bible studies, and community events.',
      keywords: ['Iranian Church', 'Persian Christians', 'Washington DC Church', 'Farsi Church', 'Iranian Christian Community', 'DC Persian Church', 'Christian Fellowship'],
      image: '/images/church-logo-hq.png'
    },
    fa: {
      title: 'به کلیسای مسیحی ایرانی واشنگتن دی‌سی خوش آمدید',
      description: 'به جامعه پر جنب و جوش مسیحیان فارسی زبان ما در واشنگتن دی‌سی بپیوندید. ایمان، رفاقت و عبادت را به زبان‌های انگلیسی و فارسی تجربه کنید. خدمات هفتگی، مطالعه کتاب مقدس و رویدادهای اجتماعی.',
      keywords: ['کلیسای ایرانی', 'مسیحیان فارسی', 'کلیسا واشنگتن', 'کلیسای فارسی', 'جامعه مسیحی ایرانی', 'کلیسای پارسی', 'اتحادیه مسیحی'],
      image: '/images/church-logo-hq.png'
    }
  },
  about: {
    en: {
      title: 'About Our Iranian Christian Church',
      description: 'Learn about our mission, vision, and beliefs. Discover the history of our Persian Christian community in Washington DC and our commitment to serving God and the Iranian diaspora.',
      keywords: ['About Iranian Church', 'Persian Christian Mission', 'Iranian Church History', 'Christian Beliefs', 'Persian Christian Community'],
      image: '/images/Church_community_gathering_a97f90e1.png'
    },
    fa: {
      title: 'درباره کلیسای مسیحی ایرانی ما',
      description: 'در مورد مأموریت، چشم‌انداز و اعتقادات ما بیاموزید. تاریخ جامعه مسیحی پارسی ما در واشنگتن دی‌سی و تعهد ما برای خدمت به خدا و جامعه ایرانی را کشف کنید.',
      keywords: ['درباره کلیسای ایرانی', 'مأموریت مسیحی پارسی', 'تاریخ کلیسای ایرانی', 'اعتقادات مسیحی', 'جامعه مسیحی پارسی'],
      image: '/images/Church_community_gathering_a97f90e1.png'
    }
  },
  sermons: {
    en: {
      title: 'Sermons & Bible Teaching',
      description: 'Listen to inspiring sermons and Bible teachings in English and Farsi. Download sermon recordings, read transcripts, and grow in your faith through our weekly messages.',
      keywords: ['Christian Sermons', 'Persian Sermons', 'Bible Teaching', 'Farsi Sermons', 'Iranian Pastor', 'Bible Study'],
      image: '/images/Bible_study_peaceful_setting_6bb44b27.png'
    },
    fa: {
      title: 'موعظه‌ها و تعالیم کتاب مقدس',
      description: 'به موعظه‌های الهام‌بخش و تعالیم کتاب مقدس به زبان‌های انگلیسی و فارسی گوش دهید. ضبط موعظه‌ها را دانلود کنید، متن‌ها را بخوانید و از طریق پیام‌های هفتگی ما در ایمان خود رشد کنید.',
      keywords: ['موعظه مسیحی', 'موعظه فارسی', 'تعلیم کتاب مقدس', 'موعظه فارسی', 'کشیش ایرانی', 'مطالعه کتاب مقدس'],
      image: '/images/Bible_study_peaceful_setting_6bb44b27.png'
    }
  },
  events: {
    en: {
      title: 'Church Events & Activities',
      description: 'Join our community events, Bible studies, youth programs, and special celebrations. Stay connected with the Iranian Christian community in the DC area.',
      keywords: ['Church Events', 'Persian Christian Events', 'Bible Study Groups', 'Youth Programs', 'Community Activities'],
      image: '/images/Church_community_gathering_a97f90e1.png'
    },
    fa: {
      title: 'رویدادها و فعالیت‌های کلیسا',
      description: 'به رویدادهای اجتماعی، مطالعات کتاب مقدس، برنامه‌های جوانان و جشن‌های ویژه ما بپیوندید. با جامعه مسیحی ایرانی در منطقه دی‌سی در ارتباط باشید.',
      keywords: ['رویدادهای کلیسا', 'رویدادهای مسیحی پارسی', 'گروه‌های مطالعه کتاب مقدس', 'برنامه‌های جوانان', 'فعالیت‌های اجتماعی'],
      image: '/images/Church_community_gathering_a97f90e1.png'
    }
  },
  prayer: {
    en: {
      title: 'Prayer Requests & Prayer Wall',
      description: 'Submit your prayer requests and join our prayer community. Share testimonies, pray for others, and experience the power of united prayer in our faith community.',
      keywords: ['Prayer Requests', 'Christian Prayer', 'Prayer Community', 'Faith Testimonies', 'United Prayer'],
      image: '/images/Prayer_circle_hands_together_feb88f83.png'
    },
    fa: {
      title: 'درخواست‌های دعا و دیوار دعا',
      description: 'درخواست‌های دعای خود را ارسال کنید و به جامعه دعای ما بپیوندید. شهادت‌ها را به اشتراک بگذارید، برای دیگران دعا کنید و قدرت دعای متحد را در جامعه ایمان ما تجربه کنید.',
      keywords: ['درخواست دعا', 'دعای مسیحی', 'جامعه دعا', 'شهادت‌های ایمان', 'دعای متحد'],
      image: '/images/Prayer_circle_hands_together_feb88f83.png'
    }
  },
  bible: {
    en: {
      title: 'Bible Reader & Audio Bible',
      description: 'Read and listen to the Bible in multiple languages including Farsi. Access Bible studies, commentaries, and devotionals for spiritual growth.',
      keywords: ['Bible Reader', 'Audio Bible', 'Persian Bible', 'Farsi Bible', 'Bible Study', 'Scripture Reading'],
      image: '/images/Bible_study_peaceful_setting_6bb44b27.png'
    },
    fa: {
      title: 'خواننده کتاب مقدس و کتاب مقدس صوتی',
      description: 'کتاب مقدس را به زبان‌های مختلف از جمله فارسی بخوانید و گوش دهید. به مطالعات کتاب مقدس، تفسیرها و عبادت‌ها برای رشد روحانی دسترسی پیدا کنید.',
      keywords: ['خواننده کتاب مقدس', 'کتاب مقدس صوتی', 'کتاب مقدس فارسی', 'کتاب مقدس پارسی', 'مطالعه کتاب مقدس', 'خواندن کتاب مقدس'],
      image: '/images/Bible_study_peaceful_setting_6bb44b27.png'
    }
  },
  worship: {
    en: {
      title: 'Worship & Music Ministry',
      description: 'Experience powerful worship through music, songs, and praise. Listen to worship songs in English and Farsi, download lyrics, and join our worship ministry.',
      keywords: ['Christian Worship', 'Worship Music', 'Persian Worship Songs', 'Praise Music', 'Worship Ministry'],
      image: '/images/Persian_Christian_choir_singing_bfe3adf8.png'
    },
    fa: {
      title: 'عبادت و خدمات موسیقی',
      description: 'عبادت قدرتمند را از طریق موسیقی، آواز و ستایش تجربه کنید. به آهنگ‌های عبادت به زبان‌های انگلیسی و فارسی گوش دهید، متن آهنگ‌ها را دانلود کنید و به خدمات عبادت ما بپیوندید.',
      keywords: ['عبادت مسیحی', 'موسیقی عبادت', 'سرودهای عبادت فارسی', 'موسیقی ستایش', 'خدمات عبادت'],
      image: '/images/Persian_Christian_choir_singing_bfe3adf8.png'
    }
  },
  contact: {
    en: {
      title: 'Contact Iranian Christian Church',
      description: 'Get in touch with our Iranian Christian Church in Washington DC. Find our location, service times, contact information, and ways to connect with our community.',
      keywords: ['Contact Church', 'Church Location', 'Service Times', 'Persian Church Contact', 'Iranian Church DC'],
      image: '/images/church-logo-hq.png'
    },
    fa: {
      title: 'تماس با کلیسای مسیحی ایرانی',
      description: 'با کلیسای مسیحی ایرانی ما در واشنگتن دی‌سی در تماس باشید. مکان ما، زمان‌های خدمات، اطلاعات تماس و راه‌های ارتباط با جامعه ما را پیدا کنید.',
      keywords: ['تماس با کلیسا', 'مکان کلیسا', 'زمان خدمات', 'تماس کلیسای پارسی', 'کلیسای ایرانی دی سی'],
      image: '/images/church-logo-hq.png'
    }
  }
};

// Utility function to get SEO config for a specific page
export const getPageSEOConfig = (pageKey: string, language: 'en' | 'fa'): SEOConfig => {
  const pageConfig = pageSEOConfig[pageKey];
  if (!pageConfig) {
    return defaultSEOConfig;
  }
  
  return {
    ...defaultSEOConfig,
    ...pageConfig[language]
  };
};

// Utility function to generate hreflang URLs
export const generateHreflangUrls = (currentPath: string, baseUrl: string) => {
  const cleanPath = currentPath.replace(/^\/?(en|fa)\//, '/');
  return {
    en: `${baseUrl}/en${cleanPath}`,
    fa: `${baseUrl}/fa${cleanPath}`,
    'x-default': `${baseUrl}${cleanPath}`
  };
};

// Breadcrumb structured data generator
export const generateBreadcrumbData = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': breadcrumb.name,
      'item': breadcrumb.url
    }))
  };
};