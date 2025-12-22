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
// Note: Removed preloads that caused warnings - fonts already loaded via CSS in index.html
export const criticalResources: CriticalResource[] = [
  // Only preconnect hints are useful - actual resources loaded elsewhere
  // Fonts are loaded via link tags in index.html with media="print" onload trick
  // Images are loaded on-demand when needed
];

export default CriticalResourceLoader;