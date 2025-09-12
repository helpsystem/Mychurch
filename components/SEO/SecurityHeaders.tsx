import React, { useEffect } from 'react';

const SecurityHeaders: React.FC = () => {
  useEffect(() => {
    // Add security-related meta tags
    const addSecurityMeta = () => {
      const securityMetas = [
        // Content Security Policy (basic - adjust for production)
        {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://esm.sh https://fonts.googleapis.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://esm.sh; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss: data:; media-src 'self' https: blob:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
        },
        
        // X-Frame-Options
        {
          'http-equiv': 'X-Frame-Options',
          content: 'DENY'
        },
        
        // X-Content-Type-Options
        {
          'http-equiv': 'X-Content-Type-Options',
          content: 'nosniff'
        },
        
        // Referrer Policy
        {
          'http-equiv': 'Referrer-Policy',
          content: 'strict-origin-when-cross-origin'
        },
        
        // Permissions Policy
        {
          'http-equiv': 'Permissions-Policy',
          content: 'geolocation=(), microphone=(), camera=(), payment=()'
        },
        
        // Additional security headers
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'msapplication-tap-highlight', content: 'no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ];

      securityMetas.forEach(meta => {
        const existingMeta = document.querySelector(
          meta['http-equiv'] 
            ? `meta[http-equiv="${meta['http-equiv']}"]`
            : `meta[name="${meta.name}"]`
        );
        
        if (!existingMeta) {
          const metaElement = document.createElement('meta');
          if (meta['http-equiv']) {
            metaElement.setAttribute('http-equiv', meta['http-equiv']);
          } else if (meta.name) {
            metaElement.setAttribute('name', meta.name);
          }
          metaElement.setAttribute('content', meta.content);
          document.head.appendChild(metaElement);
        }
      });
    };

    addSecurityMeta();
  }, []);

  return null;
};

export default SecurityHeaders;