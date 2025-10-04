import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Music, Play, Download, ExternalLink, FileText, Video, File } from 'lucide-react';
import LocalMediaPlayer from './LocalMediaPlayer';
import { localSongs, LocalSong } from '../lib/mediaManager';

// Using LocalSong interface from mediaManager

const WorshipSongs = () => {
  const { t, lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<{
    title: string;
    artist?: string;
    audioUrl?: string;
    videoUrl?: string;
    pdfUrl?: string;
    powerpointUrl?: string;
    type: 'video' | 'audio' | 'pdf' | 'powerpoint';
  } | null>(null);

  // Using local songs from mediaManager
  const songs = localSongs;

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = selectedMode === 'all' || song.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  const handleKalamehArchive = () => {
    window.open('https://www.kalameh.com/song-archive', '_blank');
  };

  const handlePlayMedia = (song: LocalSong, type: 'video' | 'audio' | 'pdf' | 'powerpoint', url?: string) => {
    let mediaUrl = '';
    
    switch (type) {
      case 'video':
        mediaUrl = url || song.localVideoPath || song.localLyricsVideoPath || '';
        break;
      case 'audio':
        mediaUrl = song.localAudioPath || '';
        break;
      case 'pdf':
        mediaUrl = song.localPdfPath || '';
        break;
      case 'powerpoint':
        mediaUrl = song.localPowerpointPath || '';
        break;
    }
    
    if (mediaUrl) {
      setCurrentMedia({
        title: song.title[lang],
        artist: song.artist,
        audioUrl: type === 'audio' ? mediaUrl : undefined,
        videoUrl: type === 'video' ? mediaUrl : undefined,
        pdfUrl: type === 'pdf' ? mediaUrl : undefined,
        powerpointUrl: type === 'powerpoint' ? mediaUrl : undefined,
        type
      });
      setPlayerOpen(true);
    }
  };

  const SongCard: React.FC<{ song: LocalSong }> = ({ song }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {song.title[lang]}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{song.artist}</p>
          <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs text-gray-500">
            <span className="flex items-center">
              <Music className="h-3 w-3 mr-1 rtl:ml-1 rtl:mr-0" />
              {song.key} {song.mode}
            </span>
            {song.size && (
              <span>{song.size}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {song.localAudioPath && (
          <button
            onClick={() => handlePlayMedia(song, 'audio')}
            className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
          >
            <Play className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'پخش صوتی' : 'Play Audio'}
          </button>
        )}

        {song.localVideoPath && (
          <button
            onClick={() => handlePlayMedia(song, 'video')}
            className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            <Video className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'پخش ویدیو' : 'Play Video'}
          </button>
        )}

        {song.localLyricsVideoPath && (
          <button
            onClick={() => handlePlayMedia(song, 'video', song.localLyricsVideoPath)}
            className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
          >
            <FileText className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'ویدیو + متن' : 'Video with Lyrics'}
          </button>
        )}

        {song.localPdfPath && (
          <button
            onClick={() => handlePlayMedia(song, 'pdf')}
            className="flex items-center justify-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
          >
            <File className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'مشاهده PDF' : 'View PDF'}
          </button>
        )}

        {song.localPowerpointPath && (
          <button
            onClick={() => handlePlayMedia(song, 'powerpoint')}
            className="flex items-center justify-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm"
          >
            <Download className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'پاورپوینت' : 'PowerPoint'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === 'fa' ? 'آرشیو سرودهای مسیحی' : 'Christian Worship Songs Archive'}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
          {lang === 'fa' 
            ? 'مجموعه کاملی از سرودهای مسیحی فارسی شامل فایل‌های صوتی، ویدیویی، متن و آکوردهای موسیقی' 
            : 'A complete collection of Persian Christian worship songs including audio files, videos, lyrics, and musical chords'
          }
        </p>

        <button
          onClick={handleKalamehArchive}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
          {lang === 'fa' ? 'مشاهده آرشیو کامل در کلمه' : 'View Full Archive on Kalameh'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder={lang === 'fa' ? 'جستجو سرود یا خواننده...' : 'Search songs or artists...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:w-48">
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value as 'all' | 'Major' | 'Minor')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{lang === 'fa' ? 'همه گام‌ها' : 'All Keys'}</option>
            <option value="Major">{lang === 'fa' ? 'ماژور' : 'Major'}</option>
            <option value="Minor">{lang === 'fa' ? 'مینور' : 'Minor'}</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {lang === 'fa' 
            ? `${filteredSongs.length} سرود یافت شد` 
            : `${filteredSongs.length} songs found`
          }
        </p>
      </div>

      {/* Songs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSongs.map(song => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      {/* No Results */}
      {filteredSongs.length === 0 && (
        <div className="text-center py-12">
          <Music className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {lang === 'fa' ? 'سرودی یافت نشد' : 'No songs found'}
          </h3>
          <p className="text-gray-600">
            {lang === 'fa' 
              ? 'لطفاً کلمات جستجو یا فیلترها را تغییر دهید' 
              : 'Try adjusting your search terms or filters'
            }
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-2">
          {lang === 'fa' 
            ? 'محتوا از وب‌سایت کلمه ارائه شده است' 
            : 'Content provided by Kalameh.com'
          }
        </p>
        <div className="flex justify-center space-x-4 rtl:space-x-reverse text-sm">
          <a 
            href="https://www.kalameh.com/song-archive" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {lang === 'fa' ? 'آرشیو کامل' : 'Full Archive'}
          </a>
          <span className="text-gray-400">|</span>
          <a 
            href="https://www.kalameh.com/shop" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {lang === 'fa' ? 'فروشگاه' : 'Shop'}
          </a>
        </div>
      </div>

      {/* Local Media Player */}
      {currentMedia && (
        <LocalMediaPlayer
          isOpen={playerOpen}
          onClose={() => setPlayerOpen(false)}
          title={currentMedia.title}
          artist={currentMedia.artist}
          audioUrl={currentMedia.audioUrl}
          videoUrl={currentMedia.videoUrl}
          pdfUrl={currentMedia.pdfUrl}
          powerpointUrl={currentMedia.powerpointUrl}
          type={currentMedia.type}
        />
      )}
    </div>
  );
};

export default WorshipSongs;