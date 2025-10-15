import React, { useState, useEffect } from 'react';

const SimpleBibleReader: React.FC = () => {
  const [translations, setTranslations] = useState<any[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load translations on mount
  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    try {
      console.log('🔄 Loading translations...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/bible/translations');
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Data received:', data);
      
      if (data.success && data.translations) {
        setTranslations(data.translations);
        console.log('📚 Translations set:', data.translations.length);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(`خطا در بارگذاری: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async (translationCode: string) => {
    try {
      console.log('🔄 Loading books for:', translationCode);
      setLoading(true);
      
      const response = await fetch('/api/bible/books');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📖 Books received:', data);
      
      if (data.success && data.books) {
        setBooks(data.books);
        setSelectedTranslation(translationCode);
        console.log('📚 Books set:', data.books.length);
      }
      
    } catch (err: any) {
      console.error('❌ Books error:', err);
      setError(`خطا در بارگذاری کتاب‌ها: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  console.log('🔄 Render - Loading:', loading, 'Translations:', translations.length, 'Error:', error);

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#2563eb',
          marginBottom: '30px',
          fontSize: '2rem'
        }}>
          📖 کتاب مقدس
        </h1>

        {/* Debug Info */}
        <div style={{
          backgroundColor: '#e5f3ff',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          🔧 Debug: Loading={loading ? 'بله' : 'خیر'}, 
          Translations={translations.length}, 
          Books={books.length}, 
          Error={error || 'ندارد'}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>🔄</div>
            در حال بارگذاری...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #fcc'
          }}>
            ❌ {error}
            <button 
              onClick={loadTranslations}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                backgroundColor: '#007cba',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {/* Translations List */}
        {!loading && !error && translations.length > 0 && !selectedTranslation && (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>
              انتخاب ترجمه ({translations.length} ترجمه موجود)
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '15px'
            }}>
              {translations.map((translation) => (
                <button
                  key={translation.code}
                  onClick={() => loadBooks(translation.code)}
                  style={{
                    padding: '15px',
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.backgroundColor = '#eff6ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {translation.name.fa}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {translation.language} • کد: {translation.code}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Books List */}
        {!loading && !error && books.length > 0 && selectedTranslation && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => {
                  setSelectedTranslation('');
                  setBooks([]);
                }}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                ← بازگشت به ترجمه‌ها
              </button>
              <span style={{ color: '#374151' }}>
                ترجمه انتخاب شده: {translations.find(t => t.code === selectedTranslation)?.name.fa}
              </span>
            </div>
            
            <h2 style={{ marginBottom: '20px', color: '#374151' }}>
              انتخاب کتاب ({books.length} کتاب)
            </h2>
            
            {/* Old Testament */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>عهد عتیق</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px'
              }}>
                {books.filter(book => book.testament === 'OT').map((book) => (
                  <button
                    key={book.key}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                      e.currentTarget.style.borderColor = '#2563eb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onClick={() => alert(`کتاب ${book.name.fa} انتخاب شد!\nتعداد فصل‌ها: ${book.chapters}`)}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {book.name.fa}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {book.chapters} فصل
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* New Testament */}
            <div>
              <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>عهد جدید</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '10px'
              }}>
                {books.filter(book => book.testament === 'NT').map((book) => (
                  <button
                    key={book.key}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#dbeafe';
                      e.currentTarget.style.borderColor = '#2563eb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onClick={() => alert(`کتاب ${book.name.fa} انتخاب شد!\nتعداد فصل‌ها: ${book.chapters}`)}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {book.name.fa}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {book.chapters} فصل
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && translations.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
            <div>هیچ ترجمه‌ای یافت نشد</div>
            <button 
              onClick={loadTranslations}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              بارگذاری مجدد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleBibleReader;