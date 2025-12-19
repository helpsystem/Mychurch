
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../hooks/useLanguage';
import { ZendeskArticle } from '../types';
import Spinner from '../components/Spinner';

const HelpCenterPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const [articles, setArticles] = useState<ZendeskArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      setError('');
      
      const langCode = lang === 'fa' ? 'fa' : 'en-us';
      const url = `https://youversion.zendesk.com/api/v2/help_center/${langCode}/articles.json`;

      try {
        const response = await axios.get(url);
        
        if (lang === 'fa' && response.data.articles.length === 0) {
            console.warn("Farsi articles not found, fetching English as fallback.");
            const fallbackUrl = `https://youversion.zendesk.com/api/v2/help_center/en-us/articles.json`;
            const fallbackResponse = await axios.get(fallbackUrl);
            const mappedArticles = fallbackResponse.data.articles.map((article: any) => ({
                id: article.id,
                title: article.title,
                html_url: article.html_url,
                snippet: article.snippet || article.body.substring(0, 150) + '...'
            }));
            setArticles(mappedArticles);
        } else {
             const mappedArticles = response.data.articles.map((article: any) => ({
                id: article.id,
                title: article.title,
                html_url: article.html_url,
                snippet: article.snippet || article.body.substring(0, 150) + '...'
            }));
            setArticles(mappedArticles);
        }

      } catch (err) {
        console.error('Failed to fetch help articles:', err);
        setError(t('fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticles();
  }, [lang, t]);

  return (
    <div className="sm:px-16 px-6 sm:py-12 py-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 text-gradient">
          {t('helpCenterTitle')}
        </h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">
          {t('helpCenterDescription')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="12" />
        </div>
      ) : error ? (
        <div className="text-center text-red-400 bg-red-900/30 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map(article => (
            <div key={article.id} className="bg-black-gradient p-6 rounded-[20px] box-shadow interactive-card">
              <h2 className="text-xl font-semibold text-white mb-2">{article.title}</h2>
              <p className="text-dimWhite mb-4">{article.snippet}</p>
              <a 
                href={article.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-secondary hover:text-white transition-colors"
              >
                {t('readMore')} &rarr;
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpCenterPage;
