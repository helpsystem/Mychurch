import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import AlHayatGPTWidget from '../components/AlHayatGPTWidget';
import { useLanguage } from '../hooks/useLanguage';

// Local Error Boundary for the widget only
interface WidgetErrorBoundaryProps {
  children: ReactNode;
  lang: string;
}

interface WidgetErrorBoundaryState {
  hasError: boolean;
}

class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  public state: WidgetErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Al-Hayat Widget Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gray-900">
          <div className="text-6xl mb-4">🙏</div>
          <p className="text-white/80 mb-4">
            {this.props.lang === 'fa'
              ? 'در حال بارگذاری دستیار هوشمند...'
              : 'Loading AI Assistant...'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary rounded-full text-white hover:opacity-90 transition"
          >
            {this.props.lang === 'fa' ? 'بارگذاری مجدد' : 'Reload'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AiHelperPage: React.FC = () => {
  const { lang } = useLanguage();

  // Hide the floating Al-Hayat button that causes crashes
  useEffect(() => {
    const hideFloatingButton = () => {
      // Try multiple selectors to find and hide the floating button
      const selectors = [
        '[class*="ahgpt-floating"]',
        '[class*="alhayat-floating"]',
        '[id*="ahgpt-floating"]',
        '[id*="alhayat-floating"]',
        'button[class*="floating"]',
        '.ahgpt-widget-bubble',
        '#ahgpt-widget-bubble'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      });
    };

    // Run immediately and also after a delay (for dynamically injected elements)
    hideFloatingButton();
    const interval = setInterval(hideFloatingButton, 500);

    // Also add a global CSS rule
    const style = document.createElement('style');
    style.textContent = `
      [class*="ahgpt-floating"], 
      [class*="alhayat-floating"],
      .ahgpt-widget-bubble,
      #ahgpt-widget-bubble,
      [class*="floating-button"],
      [class*="chat-bubble"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      clearInterval(interval);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh', height: '100vh' }}>
      {/* Compact Header with Persian Instructions */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white py-3 px-4 text-center flex-shrink-0">
        <div className="flex items-center justify-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14" />
            <path d="M7 9h10" />
          </svg>
          <h1 className="font-semibold text-xl">
            {lang === 'fa' ? '✝️ دستیار هوشمند مسیحی' : '✝️ Christian AI Assistant'}
          </h1>
        </div>
        <p className="text-xs text-white/80 mt-1">
          {lang === 'fa'
            ? '💬 می‌توانید به فارسی، انگلیسی یا عربی سوال بپرسید - هوش مصنوعی شما را درک می‌کند'
            : '💬 You can ask in Persian, English or Arabic - AI will understand you'}
        </p>
      </header>

      {/* Persian Tip Banner */}
      {lang === 'fa' && (
        <div className="bg-blue-900/50 text-white py-2 px-4 text-center text-sm flex-shrink-0">
          <span className="inline-block animate-pulse mr-2">💡</span>
          نکته: رابط کاربری انگلیسی است، اما <strong>سوالات خود را به فارسی بپرسید</strong> - پاسخ‌ها به فارسی خواهد بود!
        </div>
      )}

      {/* Al Hayat GPT Widget - Takes all remaining space */}
      <main className="flex-1 relative overflow-hidden bg-gray-900" style={{ minHeight: '500px' }}>
        <WidgetErrorBoundary lang={lang}>
          <AlHayatGPTWidget
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />
        </WidgetErrorBoundary>
      </main>
    </div>
  );
};

export default AiHelperPage;
