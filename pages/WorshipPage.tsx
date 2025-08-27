import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { WorshipSong } from '../types';
import { useContent } from '../hooks/useContent';
import { Youtube, Music } from 'lucide-react';
import { getRandomImage } from '../lib/theme';

const WorshipSongCard: React.FC<{ song: WorshipSong }> = ({ song }) => {
  const { lang, t } = useLanguage();
  const youtubeVideoUrl = `https://www.youtube.com/watch?v=${song.youtubeId}`;
  const [showLyrics, setShowLyrics] = useState(false);
  
  const hasYoutube = !!song.youtubeId;
  const thumbnailUrl = hasYoutube ? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg` : getRandomImage();

  return (
    <div className="bg-black-gradient rounded-[20px] box-shadow overflow-hidden flex flex-col p-1 interactive-card interactive-card-glow">
      <div className="bg-primary rounded-[18px] h-full flex flex-col">
        <div className="relative group">
          <div className="w-full h-48 image-container rounded-t-[18px]">
            <img src={thumbnailUrl} alt="" className="image-background" aria-hidden="true" />
            <img src={thumbnailUrl} alt={song.title[lang]} className="image-foreground" />
          </div>
           {hasYoutube && (
            <a href={youtubeVideoUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-t-[18px]">
              <Youtube size={64} className="text-white"/>
            </a>
          )}
           {!hasYoutube && (
             <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-t-[18px]">
               <Music size={64} className="text-white"/>
             </div>
           )}
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-white text-lg">{song.title[lang]}</h3>
          <p className="text-dimWhite text-sm mb-2">{song.artist}</p>
          
           <div className="my-2 space-y-3">
            {song.videoUrl && (
              <div>
                <video controls src={song.videoUrl} className="w-full h-auto rounded-md bg-black">
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            {song.audioUrl && (
              <div>
                <audio controls src={song.audioUrl} className="w-full h-10">
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>

          {song.lyrics && (
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="text-sm text-secondary hover:text-white my-2 text-left"
            >
              {showLyrics ? t('hideLyrics') : t('showLyrics')}
            </button>
          )}

          {showLyrics && song.lyrics && (
            <div className="mb-4 p-3 bg-primary border border-gray-700 rounded-md max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm text-dimWhite" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                {song.lyrics[lang]}
              </pre>
            </div>
          )}

          <div className="mt-auto">
            {hasYoutube && (
              <a
                href={youtubeVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center bg-red-600 text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
              >
                <Youtube size={20} />
                <span>{t('watchOnYoutube')}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC = () => (
    <div className="bg-black-gradient rounded-[20px] p-1">
      <div className="bg-primary rounded-[18px] h-full flex flex-col">
        <div className="bg-gray-800 w-full h-48 rounded-t-[18px] animate-pulse"></div>
        <div className="p-4 flex flex-col flex-grow">
            <div className="h-6 bg-gray-800 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-4 animate-pulse"></div>
            <div className="mt-auto h-10 bg-gray-800 rounded-full w-full animate-pulse"></div>
        </div>
      </div>
    </div>
);


const WorshipPage: React.FC = () => {
  const { t } = useLanguage();
  const { content, loading: isLoading } = useContent();
  const songs = content.worshipSongs;

  return (
    <div className="sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center mb-12">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 leading-tight">{t('worshipTitle')}</h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">{t('worshipDescription')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <LoadingSkeleton key={index} />)
        ) : (
          songs.map((song, index) => (
            <div key={song.id} className="reveal-on-scroll" style={{transitionDelay: `${index * 100}ms`}}>
              <WorshipSongCard song={song} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorshipPage;