import React from 'react';
import { useContent } from '../hooks/useContent';
import { useLanguage } from '../hooks/useLanguage';
import Spinner from '../components/Spinner';

const GalleryPage: React.FC = () => {
  const { content, loading } = useContent();
  const { t, lang } = useLanguage();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="12" /></div>;
  }

  return (
    <div className="space-y-12 sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 text-gradient">{t('galleries')}</h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">{t('galleryDescription')}</p> 
      </div>
      
      {content.galleries.map(gallery => (
        <section key={gallery.id} className="max-w-7xl mx-auto">
          <h2 className="font-semibold text-3xl text-white mb-2">{gallery.title[lang]}</h2>
          <p className="text-dimWhite mb-6 max-w-4xl">{gallery.description[lang]}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.images.map(image => (
              <div key={image.id} className="group relative overflow-hidden rounded-lg aspect-square bg-black-gradient">
                <img src={image.url} alt={image.caption[lang]} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <p className="text-white font-semibold transform-gpu translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">{image.caption[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default GalleryPage;
