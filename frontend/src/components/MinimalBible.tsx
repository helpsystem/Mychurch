import React from 'react';

const MinimalBible: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f8ff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#2563eb',
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '2.5rem'
        }}>
          📖 کتاب مقدس
        </h1>
        
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          ✅ کامپوننت React بارگذاری شده است
        </div>

        <div style={{
          backgroundColor: '#dcfce7',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          ✅ CSS Styling کار می‌کند
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          🔄 آماده برای اتصال به API
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
            onClick={() => {
              alert('دکمه کار می‌کند! 🎉');
              console.log('Button clicked successfully!');
            }}
          >
            تست عملکرد
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimalBible;