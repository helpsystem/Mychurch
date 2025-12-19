import { useEffect, useState, RefObject } from 'react';

/**
 * Calculate relative luminance of a color (WCAG formula)
 * @param r Red (0-255)
 * @param g Green (0-255)
 * @param b Blue (0-255)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 */
function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract RGB from various color formats
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }

  // Handle hex
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }

  // Handle named colors by creating temp element
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  const computed = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);
  
  const computedMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (computedMatch) {
    return {
      r: parseInt(computedMatch[1]),
      g: parseInt(computedMatch[2]),
      b: parseInt(computedMatch[3])
    };
  }

  return null;
}

/**
 * Get optimal text color (black or white) based on background
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = parseColor(backgroundColor);
  if (!rgb) return '#1a1a1a'; // Default to dark text

  const bgLuminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const whiteLuminance = 1; // White has luminance of 1
  const blackLuminance = 0; // Black has luminance of 0

  const contrastWithWhite = getContrastRatio(bgLuminance, whiteLuminance);
  const contrastWithBlack = getContrastRatio(bgLuminance, blackLuminance);

  // WCAG AA requires contrast ratio of at least 4.5:1 for normal text
  // Return white if it has better contrast, otherwise black
  return contrastWithWhite > contrastWithBlack ? '#ffffff' : '#1a1a1a';
}

/**
 * Hook to automatically detect background color and return optimal text color
 */
export function useContrastColor(elementRef: RefObject<HTMLElement>): string {
  const [textColor, setTextColor] = useState('#1a1a1a');

  useEffect(() => {
    if (!elementRef.current) return;

    const updateTextColor = () => {
      if (!elementRef.current) return;

      const computed = window.getComputedStyle(elementRef.current);
      const bgColor = computed.backgroundColor;

      // If background is transparent, check parent
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        let parent = elementRef.current.parentElement;
        while (parent) {
          const parentBg = window.getComputedStyle(parent).backgroundColor;
          if (parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
            setTextColor(getContrastColor(parentBg));
            return;
          }
          parent = parent.parentElement;
        }
        // Fallback to body background
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        setTextColor(getContrastColor(bodyBg));
      } else {
        setTextColor(getContrastColor(bgColor));
      }
    };

    updateTextColor();

    // Re-check on theme changes or window resize
    const observer = new MutationObserver(updateTextColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    window.addEventListener('resize', updateTextColor);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateTextColor);
    };
  }, [elementRef]);

  return textColor;
}

/**
 * Get a color with guaranteed contrast against background
 */
export function getAccessibleColor(
  backgroundColor: string,
  preferredColor: string,
  minContrast: number = 4.5
): string {
  const bgRgb = parseColor(backgroundColor);
  const prefRgb = parseColor(preferredColor);

  if (!bgRgb || !prefRgb) return preferredColor;

  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const prefLum = getLuminance(prefRgb.r, prefRgb.g, prefRgb.b);
  const contrast = getContrastRatio(bgLum, prefLum);

  // If contrast is sufficient, return preferred color
  if (contrast >= minContrast) {
    return preferredColor;
  }

  // Otherwise return optimal contrast color
  return getContrastColor(backgroundColor);
}
