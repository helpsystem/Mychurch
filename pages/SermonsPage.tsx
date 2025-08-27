import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Sermon } from '../types';
import { useContent } from '../hooks/useContent';
import { Play, Pause, User, Download, History } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import BilingualDateDisplay from '../components/BilingualDateDisplay';

const SermonCard: React.FC<{ sermon: Sermon }> = ({ sermon }) => {
  const { lang, t } = useLanguage();
  const { currentTrack, isPlaying, playTrack } = useAudioPlayer();
  const [savedTime, setSavedTime] = useState<number | null>(null);

  const isCurrentTrack = currentTrack?.id === sermon.id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  useEffect(() => {
    const time = localStorage.getItem(`sermon-progress-${sermon.id}`);
    if (time) {
        const parsedTime = parseFloat(time);
        if (parsedTime > 5) { // Only show resume if more than 5 seconds in
             setSavedTime(parsedTime);
        }
    }
  }, [sermon.id]);

  const handlePlayClick = () => {
      playTrack(sermon);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-black-gradient p-6 rounded-[20px] box-shadow flex flex-col sm:flex-row justify-between items-center gap-5 interactive-card interactive-card-glow transition-all duration-300 ${isCurrentTrack ? 'border-2 border-secondary' : 'border-2 border-transparent'}`}>
      <div className="flex-grow w-full">
        <h3 className="font-semibold text-white text-xl">{sermon.title[lang]}</h3>
        <div className="flex items-center gap-x-4 text-sm text-dimWhite mt-2">
            <span className="flex items-center gap-2"><User size={14}/> {sermon.speaker}</span>
        </div>
        {savedTime && !isCurrentTrack && (
            <div className="text-xs text-secondary mt-2 flex items-center gap-1">
                <History size={12} />
                <span>Resume from {formatTime(savedTime)}</span>
            </div>
        )}
      </div>
      <div className="flex-shrink-0 w-full sm:w-auto flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 mt-4 sm:mt-0">
        <BilingualDateDisplay dateStr={sermon.date} />
        <div className="flex flex-col gap-2">
            <button onClick={handlePlayClick} className="py-3 px-5 font-medium text-[16px] text-primary bg-blue-gradient rounded-[10px] outline-none inline-flex items-center gap-2 w-40 justify-center">
                {isThisTrackPlaying ? <Pause size={20} /> : <Play size={20} />}
                <span>{isThisTrackPlaying ? t('pause') : t('play')}</span>
            </button>
            {sermon.notesUrl && (
                <a href={sermon.notesUrl} target="_blank" rel="noopener noreferrer" className="py-2 px-5 font-medium text-xs text-dimWhite bg-gray-700 hover:bg-gray-600 rounded-[10px] outline-none inline-flex items-center gap-2 w-40 justify-center">
                    <Download size={14} />
                    <span>{t('downloadNotes')}</span>
                </a>
            )}
        </div>
      </div>
    </div>
  );
};


const SermonsPage: React.FC = () => {
  const { t, lang } = useLanguage();
  const { content } = useContent();
  
  const groupedSermons = content.sermons.reduce((acc, sermon) => {
    const seriesTitle = sermon.series ? sermon.series[lang] : t('standaloneSermons');
    if (!acc[seriesTitle]) {
      acc[seriesTitle] = [];
    }
    acc[seriesTitle].push(sermon);
    return acc;
  }, {} as Record<string, Sermon[]>);

  return (
    <div className="sm:px-16 px-6 sm:py-12 py-4">
      <div className="text-center mb-12 reveal-on-scroll">
        <h1 className="font-semibold text-4xl md:text-5xl text-white mb-2 leading-tight">
          {t('sermonsTitle')}
        </h1>
        <p className="font-normal text-dimWhite text-lg max-w-3xl mx-auto">{t('sermonsDescription')}</p>
      </div>
      <div className="space-y-12 max-w-4xl mx-auto">
        {Object.entries(groupedSermons).map(([seriesTitle, sermons], index) => (
            <section key={seriesTitle} className="reveal-on-scroll" style={{transitionDelay: `${index * 150}ms`}}>
                <h2 className="text-2xl font-bold text-gradient mb-4 border-b-2 border-secondary/20 pb-2">{seriesTitle}</h2>
                <div className="space-y-6">
                    {sermons.map(sermon => (
                      <SermonCard key={sermon.id} sermon={sermon} />
                    ))}
                </div>
            </section>
        ))}
      </div>
    </div>
  );
};

export default SermonsPage;