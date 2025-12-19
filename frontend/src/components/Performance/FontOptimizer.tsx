import React, { useEffect } from 'react';

const FontOptimizer: React.FC = () => {
  useEffect(() => {
    // Font display optimization
    const optimizeFonts = () => {
      // Create font-face declarations with optimal loading
      const fontStyles = `
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2') format('woff2');
          unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
        }
        
        @font-face {
          font-family: 'Vazirmatn';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('https://fonts.gstatic.com/s/vazirmatn/v13/Dxx78j6PP2D_kU2muijPEe1n2vVbfJRklWUYSGU2.woff2') format('woff2');
          unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE80-FEFC;
        }
        
        /* Font loading optimizations */
        .font-poppins {
          font-family: 'Poppins', system-ui, -apple-system, sans-serif;
        }
        
        .font-vazir {
          font-family: 'Vazirmatn', 'Tahoma', sans-serif;
        }
        
        /* Prevent invisible text during font swap */
        body {
          font-display: swap;
        }
        
        /* Optimize font rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
      `;

      // Add optimized font styles to head
      const styleElement = document.createElement('style');
      styleElement.textContent = fontStyles;
      styleElement.id = 'font-optimizer-styles';
      
      // Remove existing styles if any
      const existingStyles = document.getElementById('font-optimizer-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
      
      document.head.appendChild(styleElement);
    };

    // Preload critical font files
    const preloadCriticalFonts = () => {
      const fontFiles = [
        {
          href: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
          type: 'font/woff2'
        },
        {
          href: 'https://fonts.gstatic.com/s/vazirmatn/v13/Dxx78j6PP2D_kU2muijPEe1n2vVbfJRklWUYSGU2.woff2',
          type: 'font/woff2'
        }
      ];

      fontFiles.forEach((font) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = font.href;
        link.as = 'font';
        link.type = font.type;
        link.crossOrigin = 'anonymous';
        
        // Check if already preloaded
        const existingLink = document.querySelector(`link[href="${font.href}"]`);
        if (!existingLink) {
          document.head.appendChild(link);
        }
      });
    };

    // Optimize font loading performance
    const optimizeFontLoading = () => {
      // Use font loading API if available
      if ('fonts' in document) {
        // Load fonts with high priority
        const fontFaces = [
          new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2)', {
            weight: '400',
            style: 'normal',
            display: 'swap'
          }),
          new FontFace('Vazirmatn', 'url(https://fonts.gstatic.com/s/vazirmatn/v13/Dxx78j6PP2D_kU2muijPEe1n2vVbfJRklWUYSGU2.woff2)', {
            weight: '400',
            style: 'normal',
            display: 'swap'
          })
        ];

        fontFaces.forEach((fontFace) => {
          fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
          }).catch((error) => {
            console.warn('Font loading failed:', error);
          });
        });
      }
    };

    // Execute optimizations
    optimizeFonts();
    preloadCriticalFonts();
    optimizeFontLoading();

    // Cleanup
    return () => {
      const styleElement = document.getElementById('font-optimizer-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return null;
};

export default FontOptimizer;