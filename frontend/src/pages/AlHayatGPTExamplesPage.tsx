import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import AlHayatGPTWidget from '../components/AlHayatGPTWidget';

const AlHayatGPTExamplesPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [activeExample, setActiveExample] = useState('fullscreen');

  const examples = [
    {
      id: 'fullscreen',
      title: lang === 'fa' ? 'تمام صفحه' : 'Full Screen',
      description: lang === 'fa' ? 'ویجت تمام صفحه برای تجربه کامل' : 'Full screen widget for complete experience'
    },
    {
      id: 'centered',
      title: lang === 'fa' ? 'مرکزی استایل شده' : 'Centered Styled',
      description: lang === 'fa' ? 'ویجت مرکزی با طراحی زیبا' : 'Centered widget with beautiful design'
    },
    {
      id: 'compact',
      title: lang === 'fa' ? 'فشرده موبایل' : 'Compact Mobile',
      description: lang === 'fa' ? 'ویجت فشرده برای نمایش موبایل' : 'Compact widget for mobile display'
    },
    {
      id: 'sidebar',
      title: lang === 'fa' ? 'نوار کناری' : 'Sidebar',
      description: lang === 'fa' ? 'ویجت کوچک برای نوار کناری' : 'Small widget for sidebar use'
    }
  ];

  const renderExample = () => {
    switch (activeExample) {
      case 'fullscreen':
        return (
          <div className="w-full h-full">
            <AlHayatGPTWidget 
              containerId="fullscreen-widget"
              style={{ 
                width: '100%', 
                height: '100%'
              }}
            />
          </div>
        );

      case 'centered':
        return (
          <div className="flex justify-center items-center w-full h-full p-4">
            <AlHayatGPTWidget 
              containerId="centered-widget"
              width="500px"
              height="700px"
              customStyle={{
                borderRadius: '20px',
                boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                border: '2px solid #f0f0f0'
              }}
              style={{ 
                width: '500px', 
                height: '700px'
              }}
            />
          </div>
        );

      case 'compact':
        return (
          <div className="flex justify-center items-center w-full h-full p-4">
            <AlHayatGPTWidget 
              containerId="compact-widget"
              width="100%"
              height="500px"
              customStyle={{
                maxWidth: '400px',
                margin: '0 auto',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }}
              style={{ 
                width: '100%', 
                maxWidth: '400px', 
                height: '500px',
                margin: '0 auto'
              }}
            />
          </div>
        );

      case 'sidebar':
        return (
          <div className="flex w-full h-full">
            {/* Main content area */}
            <div className="flex-1 p-6 bg-gray-50">
              <h3 className="text-xl font-bold mb-4">
                {lang === 'fa' ? 'محتوای اصلی صفحه' : 'Main Page Content'}
              </h3>
              <p className="text-gray-600 mb-4">
                {lang === 'fa' 
                  ? 'این منطقه محتوای اصلی صفحه را نشان می‌دهد. ویجت Al Hayat GPT در نوار کناری قرار دارد.'
                  : 'This area shows the main page content. The Al Hayat GPT widget is placed in the sidebar.'
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-semibold mb-2">
                    {lang === 'fa' ? 'بخش اول' : 'Section 1'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {lang === 'fa' ? 'محتوای نمونه برای نمایش' : 'Sample content for display'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-semibold mb-2">
                    {lang === 'fa' ? 'بخش دوم' : 'Section 2'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {lang === 'fa' ? 'محتوای نمونه برای نمایش' : 'Sample content for display'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Sidebar with widget */}
            <div className="w-80 bg-white border-l border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                {lang === 'fa' ? 'دستیار مسیحی' : 'Christian Assistant'}
              </h3>
              <AlHayatGPTWidget 
                containerId="sidebar-widget"
                width="100%"
                height="450px"
                customStyle={{
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                style={{ 
                  width: '100%', 
                  height: '450px'
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {lang === 'fa' ? 'نمونه‌های Al Hayat GPT' : 'Al Hayat GPT Examples'}
              </h1>
              <p className="text-gray-600 mt-2">
                {lang === 'fa' 
                  ? 'انواع مختلف نمایش و استایل ویجت دستیار هوشمند مسیحی'
                  : 'Different display styles and configurations for the Christian AI assistant widget'
                }
              </p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium">
                {lang === 'fa' ? 'آنلاین' : 'Online'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Example Selection */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {lang === 'fa' ? 'انتخاب نوع نمایش:' : 'Choose Display Style:'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  activeExample === example.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900">{example.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{example.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Widget Display Area */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
          {renderExample()}
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">
            {lang === 'fa' ? 'کد نمونه:' : 'Sample Code:'}
          </h2>
          <div className="bg-gray-900 text-white p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>
{activeExample === 'fullscreen' && `// Full Screen Widget
<AlHayatGPTWidget 
  containerId="fullscreen-widget"
  style={{ 
    width: '100%', 
    height: '100%'
  }}
/>`}
{activeExample === 'centered' && `// Centered Styled Widget
<AlHayatGPTWidget 
  containerId="centered-widget"
  width="500px"
  height="700px"
  customStyle={{
    borderRadius: '20px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
    border: '2px solid #f0f0f0'
  }}
  style={{ 
    width: '500px', 
    height: '700px'
  }}
/>`}
{activeExample === 'compact' && `// Compact Mobile Widget
<AlHayatGPTWidget 
  containerId="compact-widget"
  width="100%"
  height="500px"
  customStyle={{
    maxWidth: '400px',
    margin: '0 auto',
    borderRadius: '12px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
  }}
  style={{ 
    width: '100%', 
    maxWidth: '400px', 
    height: '500px',
    margin: '0 auto'
  }}
/>`}
{activeExample === 'sidebar' && `// Sidebar Widget
<AlHayatGPTWidget 
  containerId="sidebar-widget"
  width="100%"
  height="450px"
  customStyle={{
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }}
  style={{ 
    width: '100%', 
    height: '450px'
  }}
/>`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlHayatGPTExamplesPage;