import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Download, Maximize, Minimize } from 'lucide-react';

interface LocalMediaPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  artist?: string;
  audioUrl?: string;
  videoUrl?: string;
  pdfUrl?: string;
  powerpointUrl?: string;
  type: 'audio' | 'video' | 'pdf' | 'powerpoint';
}

const LocalMediaPlayer = ({
  isOpen,
  onClose,
  title,
  artist,
  audioUrl,
  videoUrl,
  pdfUrl,
  powerpointUrl,
  type
}: LocalMediaPlayerProps) => {
  const { lang } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [pptSlide, setPptSlide] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaElement = audioRef.current || videoRef.current;
    if (mediaElement && isOpen) {
      const handleLoadedMetadata = () => setDuration(mediaElement.duration);
      const handleTimeUpdate = () => setCurrentTime(mediaElement.currentTime);
      const handleEnded = () => setIsPlaying(false);

      mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.addEventListener('timeupdate', handleTimeUpdate);
      mediaElement.addEventListener('ended', handleEnded);

      return () => {
        mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
        mediaElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const togglePlay = () => {
    const mediaElement = audioRef.current || videoRef.current;
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mediaElement = audioRef.current || videoRef.current;
    const time = parseFloat(e.target.value);
    if (mediaElement) {
      mediaElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    const mediaElement = audioRef.current || videoRef.current;
    setVolume(vol);
    if (mediaElement) {
      mediaElement.volume = vol;
    }
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    const mediaElement = audioRef.current || videoRef.current;
    if (mediaElement) {
      if (isMuted) {
        mediaElement.volume = volume;
        setIsMuted(false);
      } else {
        mediaElement.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skip = (seconds: number) => {
    const mediaElement = audioRef.current || videoRef.current;
    if (mediaElement) {
      mediaElement.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 ${isFullscreen ? 'bg-black' : ''}`}>
      <div className={`bg-white rounded-lg w-full ${isFullscreen ? 'h-full max-w-none max-h-none' : 'max-w-4xl max-h-[90vh]'} overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            {artist && <p className="text-sm text-gray-600">{artist}</p>}
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {(type === 'video' || type === 'audio') && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="flex-1">
          {type === 'audio' && audioUrl && (
            <div className="p-8">
              <div className="text-center space-y-6">
                {/* Album Art Placeholder */}
                <div className="w-48 h-48 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg mx-auto flex items-center justify-center shadow-lg">
                  <Volume2 className="h-24 w-24 text-white opacity-80" />
                </div>
                
                {/* Lyrics/Subtitles Display */}
                <div className="bg-white rounded-lg p-4 border mt-6">
                  <h5 className="font-medium text-gray-900 mb-3 text-center">
                    {lang === 'fa' ? 'متن سرود / زیرنویس' : 'Lyrics / Subtitles'}
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line text-center" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                      {lang === 'fa' 
                        ? `متن سرود: ${title}

♪ در ابتدا خدا آسمان‌ها و زمین را آفرید ♪
♪ زمین بی‌صورت و خالی بود ♪
♪ خدا گفت نور بشود و نور شد ♪

[این متن همزمان با پخش صوت نمایش داده می‌شود]` 
                        : `Song Lyrics: ${title}

♪ In the beginning God created the heavens and the earth ♪
♪ Now the earth was formless and empty ♪
♪ And God said "Let there be light," and there was light ♪

[This text is displayed simultaneously with audio playback]`
                      }
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{title}</h4>
                  {artist && <p className="text-gray-600">{artist}</p>}
                </div>

                {/* Audio Element */}
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  preload="metadata"
                />

                {/* Controls */}
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
                    <button
                      onClick={() => skip(-10)}
                      className="p-3 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <SkipBack className="h-6 w-6" />
                    </button>
                    
                    <button
                      onClick={togglePlay}
                      className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </button>
                    
                    <button
                      onClick={() => skip(10)}
                      className="p-3 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <SkipForward className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <button onClick={toggleMute} className="p-2 text-gray-600 hover:text-gray-800">
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === 'video' && videoUrl && (
            <div className="relative">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-auto max-h-[60vh]"
                controls
                preload="metadata"
              />
            </div>
          )}

          {type === 'pdf' && pdfUrl && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <button
                    onClick={() => setPdfPage(Math.max(1, pdfPage - 1))}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={pdfPage <= 1}
                  >
                    {lang === 'fa' ? 'صفحه قبل' : 'Previous'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {lang === 'fa' ? `صفحه ${pdfPage}` : `Page ${pdfPage}`}
                  </span>
                  <button
                    onClick={() => setPdfPage(pdfPage + 1)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {lang === 'fa' ? 'صفحه بعد' : 'Next'}
                  </button>
                </div>
                <button
                  onClick={() => handleDownload(pdfUrl, `${title}.pdf`)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {lang === 'fa' ? 'دانلود' : 'Download'}
                </button>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4 text-center min-h-[400px] flex items-center justify-center">
                <div>
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600 mb-4">
                    {lang === 'fa' ? 'نمایش PDF در مرورگر' : 'PDF viewer in browser'}
                  </p>
                  <iframe
                    src={`${pdfUrl}#page=${pdfPage}`}
                    className="w-full h-96 border border-gray-300 rounded-lg"
                    title={title}
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'powerpoint' && powerpointUrl && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <button
                    onClick={() => setPptSlide(Math.max(1, pptSlide - 1))}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={pptSlide <= 1}
                  >
                    {lang === 'fa' ? 'اسلاید قبل' : 'Previous'}
                  </button>
                  <span className="text-sm text-gray-600">
                    {lang === 'fa' ? `اسلاید ${pptSlide}` : `Slide ${pptSlide}`}
                  </span>
                  <button
                    onClick={() => setPptSlide(pptSlide + 1)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {lang === 'fa' ? 'اسلاید بعد' : 'Next'}
                  </button>
                </div>
                <button
                  onClick={() => handleDownload(powerpointUrl, `${title}.pptx`)}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {lang === 'fa' ? 'دانلود' : 'Download'}
                </button>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[500px] flex items-center justify-center">
                <div>
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-semibold text-gray-800 mb-2">{title}</p>
                  <p className="text-gray-600 mb-6">
                    {lang === 'fa' ? `اسلاید ${pptSlide} از ارائه` : `Slide ${pptSlide} of presentation`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {lang === 'fa' 
                      ? 'برای مشاهده کامل ارائه، فایل را دانلود کنید' 
                      : 'Download the file to view the complete presentation'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {type !== 'pdf' && type !== 'powerpoint' && (
          <div className="px-4 pb-4 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {lang === 'fa' ? 'بستن' : 'Close'}
            </button>
            
            {(audioUrl || videoUrl) && (
              <button
                onClick={() => handleDownload(audioUrl || videoUrl || '', `${title}.${type === 'audio' ? 'mp3' : 'mp4'}`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {lang === 'fa' ? 'دانلود' : 'Download'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalMediaPlayer;