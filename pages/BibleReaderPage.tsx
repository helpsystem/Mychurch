import React, { useState } from 'react';
import BibleReader from '../components/BibleReader';
import FlipBookBibleReader from '../components/FlipBookBibleReader';
import { useLanguage } from '../hooks/useLanguage';

const BibleReaderPage = () => {
  const { lang } = useLanguage();
  const [viewMode, setViewMode] = useState<'flipbook' | 'standard'>('flipbook');

  return (
    <div>
      {/* View Mode Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        marginBottom: '1rem'
      }}>
        <button
          onClick={() => setViewMode('flipbook')}
          style={{
            padding: '0.75rem 2rem',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            background: viewMode === 'flipbook' ? 'white' : 'rgba(255, 255, 255, 0.2)',
            color: viewMode === 'flipbook' ? '#667eea' : 'white',
            transition: 'all 0.3s',
            fontSize: '1rem'
          }}
        >
          📚 {lang === 'fa' ? 'نمای کتاب (3D Flip)' : 'Book View (3D Flip)'}
        </button>
        <button
          onClick={() => setViewMode('standard')}
          style={{
            padding: '0.75rem 2rem',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            background: viewMode === 'standard' ? 'white' : 'rgba(255, 255, 255, 0.2)',
            color: viewMode === 'standard' ? '#667eea' : 'white',
            transition: 'all 0.3s',
            fontSize: '1rem'
          }}
        >
          📄 {lang === 'fa' ? 'نمای استاندارد' : 'Standard View'}
        </button>
      </div>

      {/* Render Selected View */}
      {viewMode === 'flipbook' ? <FlipBookBibleReader /> : <BibleReader />}
    </div>
  );
};

export default BibleReaderPage;