import { useEffect } from 'react';
import { getContrastColor } from '../hooks/useContrastColor';

/**
 * Auto Contrast Component
 * Automatically adjusts text color across the entire site based on background colors
 * for maximum readability and WCAG compliance
 */
export function AutoContrast() {
  useEffect(() => {
    const applyContrastColors = () => {
      // Get all elements with background colors
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const computed = window.getComputedStyle(htmlElement);
        const bgColor = computed.backgroundColor;
        
        // Skip if transparent or no background
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
          return;
        }
        
        // Skip if element already has data-contrast-applied
        if (htmlElement.dataset.contrastApplied === 'true') {
          return;
        }
        
        // Calculate optimal text color
        const optimalColor = getContrastColor(bgColor);
        
        // Apply to element if it has text content
        if (htmlElement.textContent && htmlElement.textContent.trim().length > 0) {
          // Don't override if element has explicit color set (unless it's from our previous run)
          const currentColor = computed.color;
          const hasExplicitColor = htmlElement.style.color && 
                                  htmlElement.style.color !== optimalColor;
          
          if (!hasExplicitColor) {
            htmlElement.style.color = optimalColor;
            htmlElement.dataset.contrastApplied = 'true';
          }
        }
      });
    };

    // Apply on mount
    applyContrastColors();

    // Re-apply when DOM changes
    const observer = new MutationObserver((mutations) => {
      // Debounce to avoid too many calls
      clearTimeout((window as any).contrastTimeout);
      (window as any).contrastTimeout = setTimeout(applyContrastColors, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Re-apply on window resize or theme change
    window.addEventListener('resize', applyContrastColors);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', applyContrastColors);
      clearTimeout((window as any).contrastTimeout);
    };
  }, []);

  // Add global CSS for enhanced contrast
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'auto-contrast-global';
    style.textContent = `
      /* Auto Contrast Global Styles */
      
      /* Ensure minimum contrast for all text */
      body, body * {
        text-shadow: none !important;
      }
      
      /* High contrast for links */
      a {
        text-decoration-thickness: 2px;
        text-underline-offset: 2px;
      }
      
      /* Ensure buttons have good contrast */
      button, .btn, [role="button"] {
        border: 2px solid currentColor;
      }
      
      /* Ensure form inputs have good contrast */
      input, textarea, select {
        border: 2px solid rgba(0, 0, 0, 0.3);
      }
      
      /* Enhanced focus indicators */
      *:focus-visible {
        outline: 3px solid currentColor;
        outline-offset: 2px;
      }
      
      /* Ensure SVG icons inherit text color */
      svg {
        color: inherit;
        fill: currentColor;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('auto-contrast-global');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
}

export default AutoContrast;
