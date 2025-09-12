import React, { useEffect } from 'react';

interface CriticalResource {
  href: string;
  as?: 'style' | 'script' | 'font' | 'image' | 'document';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
}

interface CriticalResourceLoaderProps {
  resources: CriticalResource[];
}

const CriticalResourceLoader: React.FC<CriticalResourceLoaderProps> = ({ resources }) => {
  useEffect(() => {
    const preloadResources = () => {
      resources.forEach((resource) => {
        // Check if resource is already preloaded
        const existingLink = document.querySelector(`link[href="${resource.href}"]`);
        if (existingLink) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        
        if (resource.as) {
          link.as = resource.as;
        }
        
        if (resource.type) {
          link.type = resource.type;
        }
        
        if (resource.crossorigin) {
          link.crossOrigin = resource.crossorigin;
        }

        // For fonts, add additional attributes
        if (resource.as === 'font') {
          link.crossOrigin = 'anonymous';
        }

        document.head.appendChild(link);
      });
    };

    preloadResources();
  }, [resources]);

  return null;
};

// Critical resources for the church website
export const criticalResources: CriticalResource[] = [
  // Critical fonts
  {
    href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    as: 'style'
  },
  {
    href: 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&display=swap',
    as: 'style'
  },
  
  // Critical images
  {
    href: '/images/church-logo-hq.png',
    as: 'image'
  },
  {
    href: '/images/jesus-cross-sunset.jpg',
    as: 'image'
  },
  
  // Critical scripts
  {
    href: 'https://cdn.tailwindcss.com',
    as: 'script'
  }
];

export default CriticalResourceLoader;