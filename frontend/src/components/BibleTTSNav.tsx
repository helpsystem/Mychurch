/**
 * Bible TTS Navigation Helper
 * 
 * A simple navigation component to quickly access Bible TTS features
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Upload, Volume2 } from 'lucide-react';

export const BibleTTSNav: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bible-tts-nav bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Volume2 size={28} />
        Bible Text-to-Speech Reader
      </h3>
      
      <p className="mb-6 text-blue-100">
        Experience the Bible with synchronized word-by-word highlighting and professional narration
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Access Books - English */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={20} />
            Quick Access (English)
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/bible/tts/GEN/1')}
              className="w-full text-left px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all"
            >
              Genesis 1 - Creation
            </button>
            <button
              onClick={() => navigate('/bible/tts/PSA/23')}
              className="w-full text-left px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all"
            >
              Psalm 23 - The Lord is My Shepherd
            </button>
            <button
              onClick={() => navigate('/bible/tts/JHN/3')}
              className="w-full text-left px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all"
            >
              John 3 - Born Again
            </button>
            <button
              onClick={() => navigate('/bible/tts/MAT/5')}
              className="w-full text-left px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all"
            >
              Matthew 5 - Sermon on the Mount
            </button>
          </div>
        </div>

        {/* Quick Access Books - Persian */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4" dir="rtl">
          <h4 className="font-semibold mb-3 flex items-center gap-2 font-vazir">
            <BookOpen size={20} />
            دسترسی سریع (فارسی)
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/bible-fa/tts/GEN/1')}
              className="w-full text-right px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all font-vazir"
            >
              پیدایش 1 - آفرینش
            </button>
            <button
              onClick={() => navigate('/bible-fa/tts/PSA/23')}
              className="w-full text-right px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all font-vazir"
            >
              مزمور 23 - خداوند شبان من است
            </button>
            <button
              onClick={() => navigate('/bible-fa/tts/JHN/3')}
              className="w-full text-right px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all font-vazir"
            >
              یوحنا 3 - تولد دوباره
            </button>
            <button
              onClick={() => navigate('/bible-fa/tts/MAT/5')}
              className="w-full text-right px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all font-vazir"
            >
              متی 5 - موعظه کوهستان
            </button>
          </div>
        </div>
      </div>

      {/* Admin Functions */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Upload size={20} />
            Admin Functions
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/bible/admin/upload')}
              className="w-full text-left px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded transition-all"
            >
              📤 Upload Bible Translations
            </button>
            <div className="text-sm text-blue-100 mt-3 p-3 bg-black bg-opacity-20 rounded">
              <p className="font-medium mb-1">Supported Formats:</p>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>HTML with data attributes</li>
                <li>JSON structured data</li>
                <li>XML verse tags</li>
                <li>Plain text with markers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="text-center p-3 bg-white bg-opacity-10 rounded">
          <div className="text-2xl mb-1">🎯</div>
          <div className="font-medium">Word Highlighting</div>
        </div>
        <div className="text-center p-3 bg-white bg-opacity-10 rounded">
          <div className="text-2xl mb-1">🌍</div>
          <div className="font-medium">Bilingual</div>
        </div>
        <div className="text-center p-3 bg-white bg-opacity-10 rounded">
          <div className="text-2xl mb-1">🎮</div>
          <div className="font-medium">Full Controls</div>
        </div>
        <div className="text-center p-3 bg-white bg-opacity-10 rounded">
          <div className="text-2xl mb-1">⚡</div>
          <div className="font-medium">Speed Control</div>
        </div>
      </div>
    </div>
  );
};

export default BibleTTSNav;
