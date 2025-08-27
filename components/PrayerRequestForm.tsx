import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { geminiService } from '../services/geminiService';
import Spinner from './Spinner';
import { Send, Wand2 } from 'lucide-react';

const PrayerRequestForm: React.FC = () => {
  const { t } = useLanguage();
  const [request, setRequest] = useState('');
  const [generatedPrayer, setGeneratedPrayer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleGeneratePrayer = async () => {
    if (!request.trim()) return;
    setIsLoading(true);
    setStatus(null);
    setGeneratedPrayer('');
    try {
      const response = await geminiService.generatePrayer(request);
      setGeneratedPrayer(response.text);
    } catch (err) {
      setStatus({ message: t('prayerRequestError'), type: 'error' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfidentialSubmit = () => {
    // This simulates a successful API call for confidential submission.
    setStatus(null);
    setGeneratedPrayer('');
    setIsLoading(false);
    
    // In a real app, you would have an API call here.
    // For now, we'll just show the success message.
    setStatus({ message: t('prayerRequestSuccess'), type: 'success' });
    setRequest(''); // Clear the text area on success
  };

  return (
    <div className="space-y-6 my-8">
      <div className="bg-black-gradient p-8 rounded-[20px] box-shadow">
        <label htmlFor="prayer-request" className="block font-semibold text-xl text-white mb-2">
          {t('yourRequest')}
        </label>
        <textarea
          id="prayer-request"
          rows={6}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          placeholder={t('prayerRequestPlaceholder')}
          className="w-full p-3 border border-gray-700 bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-white"
          dir={t('lang') === 'fa' ? 'rtl' : 'ltr'}
        ></textarea>

        {status && (
          <div className={`mt-4 p-3 text-center rounded-lg border ${
              status.type === 'success' 
              ? 'text-green-300 bg-green-900/50 border-green-500/50' 
              : 'text-red-300 bg-red-900/50 border-red-500/50'
            }`}>
            {status.message}
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-4">
           <button
            onClick={handleConfidentialSubmit}
            className="w-full sm:w-auto flex-1 bg-gray-800 text-white font-bold py-3 px-6 rounded-lg inline-flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
          >
            <Send size={18} />
            {t('submitRequest')}
          </button>
          <button
            onClick={handleGeneratePrayer}
            disabled={isLoading}
            className="w-full sm:w-auto flex-1 py-3 px-6 font-medium text-[18px] text-primary bg-blue-gradient rounded-[10px] outline-none inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Spinner size="5" />
                {t('generating')}
              </>
            ) : (
             <>
               <Wand2 size={18} />
               {t('generatePrayer')}
             </>
            )}
          </button>
        </div>
      </div>
      
      {generatedPrayer && (
        <div className="bg-gray-gradient p-8 rounded-[20px] ">
          <h2 className="font-semibold text-2xl text-white mb-4">{t('generatedPrayer')}</h2>
          <p className="text-dimWhite whitespace-pre-wrap leading-relaxed">{generatedPrayer}</p>
        </div>
      )}
    </div>
  );
};

export default PrayerRequestForm;
