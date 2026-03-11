import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Wand2, Languages, Loader2, Check } from 'lucide-react';

interface SmartTranslatorProps {
  initialFa?: string;
  initialEn?: string;
  onSave?: (faText: string, enText: string) => void;
  className?: string;
}

const SmartTranslator: React.FC<SmartTranslatorProps> = ({
  initialFa = '',
  initialEn = '',
  onSave,
  className = ''
}) => {
  const { lang } = useLanguage();
  const [faText, setFaText] = useState(initialFa);
  const [enText, setEnText] = useState(initialEn);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleEnhanceFa = async () => {
    if (!faText.trim()) return;
    setIsEnhancing(true);
    
    try {
      // In a real implementation, this would call your AI endpoint
      // const response = await fetch('/api/ai/enhance', { ... });
      
      // Mock delay for UI
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock enhancement
      setFaText(faText + ' (ویراستاری حرفه‌ای اعمال شد)');
    } catch (error) {
      console.error('Failed to enhance text:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleTranslateToEn = async () => {
    if (!faText.trim()) return;
    setIsTranslating(true);
    
    try {
      // In a real implementation, this would call your AI endpoint
      // const response = await fetch('/api/ai/translate', { ... });
      
      // Mock delay for UI
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock translation
      setEnText('Translated to English automatically based on Persian text.');
    } catch (error) {
      console.error('Failed to translate text:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(faText, enText);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  return (
    <div className={`w-full bg-slate-900/50 border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">
            {lang === 'fa' ? 'دستیار نویسنده هوشمند' : 'Smart Writer Assistant'}
          </h3>
          <p className="text-dimWhite text-sm">
            {lang === 'fa' 
              ? 'متن خود را حرفه‌ای ویرایش کنید و به صورت خودکار به انگلیسی ترجمه کنید.' 
              : 'Enhance your text professionally and translate it automatically.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Persian Pane (Source & Editing) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-white text-sm font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/80 flex items-center justify-center text-xs border border-white/10">فا</span>
              متن فارسی (اصلی)
            </label>
            <button
              onClick={handleEnhanceFa}
              disabled={isEnhancing || !faText.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !faText.trim() 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                  : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 border border-indigo-500/30'
              }`}
            >
              {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {isEnhancing ? 'در حال ویرایش...' : 'ویرایش حرفه‌ای (انسانی)'}
            </button>
          </div>
          
          <textarea
            dir="rtl"
            value={faText}
            onChange={(e) => setFaText(e.target.value)}
            placeholder="متن خود را اینجا بنویسید..."
            className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none transition-all placeholder:text-white/20"
          />
        </div>

        {/* English Pane (Translation) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-white text-sm font-medium flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/80 flex items-center justify-center text-xs border border-white/10">EN</span>
              English Translation
            </label>
            <button
              onClick={handleTranslateToEn}
              disabled={isTranslating || !faText.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !faText.trim() 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                  : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 border border-blue-500/30'
              }`}
            >
              {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
              {lang === 'fa' ? 'ترجمه به انگلیسی' : 'Translate to English'}
            </button>
          </div>
          
          <textarea
            dir="ltr"
            value={enText}
            onChange={(e) => setEnText(e.target.value)}
            placeholder="English translation will appear here..."
            className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none transition-all placeholder:text-white/20"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
        >
          {showSuccess ? (
            <>
              <Check className="w-5 h-5" />
              {lang === 'fa' ? 'ذخیره شد' : 'Saved'}
            </>
          ) : (
            lang === 'fa' ? 'تایید و استفاده از متن' : 'Confirm & Use Text'
          )}
        </button>
      </div>

    </div>
  );
};

export default SmartTranslator;
