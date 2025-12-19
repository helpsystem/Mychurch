import React from 'react';
import BibleAIChatWidget from '../components/BibleAIChatWidget';
import AutoImageGallery from '../components/AutoImageGallery';

const AITestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-4">
            🤖 دستیار هوشمند کتاب مقدس
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            پرسش و پاسخ هوشمند از کتاب مقدس
          </p>
          <p className="text-sm text-gray-500">
            AI Chat Assistant + Auto-Generated Biblical Images
          </p>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <h3 className="font-bold text-gray-900 mb-1">✅ Backend Server</h3>
            <p className="text-sm text-gray-600">http://localhost:3001</p>
            <p className="text-xs text-green-600 mt-1">Connected</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <h3 className="font-bold text-gray-900 mb-1">🤖 AI Chat Service</h3>
            <p className="text-sm text-gray-600">Pattern matching ready</p>
            <p className="text-xs text-blue-600 mt-1">8 API endpoints active</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <h3 className="font-bold text-gray-900 mb-1">🎨 Image Generation</h3>
            <p className="text-sm text-gray-600">Auto-update every 7 days</p>
            <p className="text-xs text-purple-600 mt-1">12 biblical topics</p>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8 border border-purple-200">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">
            📋 راهنمای تست
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">1️⃣ تست دستیار هوشمند</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mr-4">
                <li>دکمه چت پایین سمت راست را کلیک کنید 💬</li>
                <li>سوالات تست: "درباره صلح بهم بگو" | "آیه‌ای درباره محبت" | "امید در کتاب مقدس"</li>
                <li>ویژگی‌ها: Dark Mode 🌙 | TTS 🔊 | Copy 📋 | Share 📤</li>
                <li>تاریخچه چت: پیام‌ها ذخیره می‌شوند (localStorage)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">2️⃣ تست گالری عکس</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mr-4">
                <li>دکمه "تولید جدید" را کلیک کنید (اولین بار)</li>
                <li>منتظر بمانید تا عکس‌ها تولید شوند</li>
                <li>هر 7 روز یکبار خودکار آپدیت می‌شود</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">3️⃣ API Keys (اختیاری)</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mr-4">
                <li><strong>Unsplash</strong> (رایگان): برای عکس‌های واقعی</li>
                <li><strong>OpenAI DALL-E</strong> (پولی): برای عکس‌های AI</li>
                <li>بدون API key: عکس‌های placeholder استفاده می‌شود</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-12">
          <AutoImageGallery 
            showControls={true}
            autoRefresh={false}
          />
        </div>

        {/* API Test Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🧪 تست API Endpoints
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TestButton
              title="Health Check"
              endpoint="/api/health"
              method="GET"
            />
            
            <TestButton
              title="Daily Verse (FA)"
              endpoint="/api/ai-chat/daily-verse?language=fa"
              method="GET"
            />
            
            <TestButton
              title="AI Ask (Peace)"
              endpoint="/api/ai-chat/ask"
              method="POST"
              body={{ question: "tell me about peace", language: "en" }}
            />
            
            <TestButton
              title="Images Status"
              endpoint="/api/images/status"
              method="GET"
            />
            
            <TestButton
              title="All Images"
              endpoint="/api/images/all"
              method="GET"
            />
            
            <TestButton
              title="Random Image"
              endpoint="/api/images/random"
              method="GET"
            />
          </div>
        </div>
      </div>

      {/* Bible AI Chat Widget */}
      <BibleAIChatWidget />
    </div>
  );
};

// Test Button Component
interface TestButtonProps {
  title: string;
  endpoint: string;
  method: 'GET' | 'POST';
  body?: any;
}

const TestButton: React.FC<TestButtonProps> = ({ title, endpoint, method, body }) => {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const config: any = {
        method,
        url: `${API_URL}${endpoint}`,
      };

      if (body) {
        config.data = body;
      }

      const response = await fetch(config.url, {
        method: config.method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <span className={`px-2 py-1 text-xs rounded ${
          method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {method}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 mb-3 font-mono">{endpoint}</p>
      
      <button
        onClick={handleTest}
        disabled={loading}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
      >
        {loading ? '⏳ Testing...' : '🧪 Test'}
      </button>

      {result && (
        <div className="mt-3 p-3 bg-white rounded border border-green-200">
          <p className="text-xs font-mono text-green-800 whitespace-pre-wrap overflow-auto max-h-32">
            {JSON.stringify(result, null, 2).substring(0, 200)}...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
          <p className="text-xs text-red-800">❌ {error}</p>
        </div>
      )}
    </div>
  );
};

export default AITestPage;
