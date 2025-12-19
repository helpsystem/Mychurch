import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
          🧪 Test Component
        </h1>
        <p className="text-lg text-center text-gray-700 mb-6">
          اگر این متن را می‌بینید، React و routing کار می‌کند!
        </p>
        
        <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded mb-4">
          ✅ React component بارگذاری شده است
        </div>
        
        <div className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded mb-4">
          ✅ CSS styles کار می‌کند
        </div>
        
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 px-4 py-3 rounded mb-4">
          ⏳ در حال آماده‌سازی کامپوننت Bible اصلی...
        </div>

        <div className="text-center">
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => console.log('دکمه کلیک شد!')}
          >
            تست دکمه
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;