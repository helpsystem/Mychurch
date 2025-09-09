import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Music, Play, Download, ExternalLink, FileText, Video } from 'lucide-react';

interface Song {
  id: number;
  title: { en: string; fa: string };
  artist: string;
  key: string;
  mode: 'Major' | 'Minor';
  audioUrl?: string;
  videoUrl?: string;
  lyricsVideoUrl?: string;
  powerpointUrl?: string;
  downloadUrl?: string;
  chordUrl?: string;
  duration?: string;
  size?: string;
}

const WorshipSongs = () => {
  const { t, lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState('all');

  // Sample songs from Kalameh.com
  const songs: Song[] = [
    {
      id: 1,
      title: { en: 'I Love You Romantically', fa: 'تو را عاشقانه دوستت دارم' },
      artist: 'نیلوفر',
      key: 'D',
      mode: 'Minor',
      audioUrl: 'https://www.kalameh.com/file/16679/download',
      videoUrl: 'https://www.youtube.com/embed/SoetDZ6kOfc',
      lyricsVideoUrl: 'https://www.youtube.com/embed/xdv4z3z7Upk',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/TORAASHEGHANEDUSTATDARAM.pptx',
      duration: '00:00',
      size: '6.06 MB'
    },
    {
      id: 2,
      title: { en: 'Call the Name of Jesus', fa: 'بخوان نام عیسی را' },
      artist: 'مجید دستوری',
      key: 'B',
      mode: 'Minor',
      audioUrl: 'https://www.kalameh.com/file/16641/download',
      videoUrl: 'https://www.youtube.com/embed/v8wDZ9pxTPc',
      lyricsVideoUrl: 'https://www.youtube.com/embed/imH_tsWORto',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/BEKHANNAMEISARA.pptx',
      size: '4.76 MB'
    },
    {
      id: 3,
      title: { en: 'The Lord is my Shepherd', fa: 'خداوند شبان جانم است' },
      artist: 'رضا وطن‌پرست',
      key: 'D',
      mode: 'Minor',
      audioUrl: 'https://www.kalameh.com/file/16609/download',
      videoUrl: 'https://www.youtube.com/embed/XL7Q6YOzZ1M',
      lyricsVideoUrl: 'https://www.youtube.com/embed/3mN1xLVIbbk',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/KHODAVANDSHABANEJANAMAST.pptx',
      size: '3.21 MB'
    },
    {
      id: 4,
      title: { en: 'I Am Yours, Abba', fa: 'من از آن توام ابا' },
      artist: 'سینا مسیحا',
      key: 'Bb',
      mode: 'Major',
      audioUrl: 'https://www.kalameh.com/file/16507/download',
      videoUrl: 'https://www.youtube.com/embed/HjoBg1LdvXQ',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/MANAZANETOAMABBA.pptx',
      size: '5.82 MB'
    },
    {
      id: 5,
      title: { en: 'My World Has No Meaning Without You', fa: 'جهانم بی تو دگر معنا ندارد' },
      artist: 'آراد طفلان',
      key: 'Eb',
      mode: 'Major',
      audioUrl: 'https://www.kalameh.com/file/16309/download',
      videoUrl: 'https://www.youtube.com/embed/o2D_n7LvHmI',
      lyricsVideoUrl: 'https://www.youtube.com/embed/qziXfCBUtOE',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/JAHANAMBITODEGARMANANADARAD.pptx',
      size: '3.47 MB'
    },
    {
      id: 6,
      title: { en: 'The Most Beautiful Picture in the World', fa: 'تماشایی‌ترین تصویر دنیا' },
      artist: 'روزبه نجارنژاد',
      key: 'A',
      mode: 'Minor',
      audioUrl: 'https://www.kalameh.com/file/15376/download',
      videoUrl: 'https://www.youtube.com/embed/W_DeB7ZOAwo',
      lyricsVideoUrl: 'https://www.youtube.com/embed/Z5gG6yy66ws',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/TAMASHAYITARINTASVIREDONYA.pptx',
      size: '3.96 MB'
    },
    {
      id: 7,
      title: { en: 'To a New Vision and Touch', fa: 'به دیدار و لمسی تازه' },
      artist: 'أنا محتاج لمسة روحك',
      key: 'G',
      mode: 'Minor',
      audioUrl: 'https://www.kalameh.com/file/15355/download',
      videoUrl: 'https://www.youtube.com/embed/jn1VM50hws4',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/BEDIDAROLAMSITAZE.pptx',
      size: '8.81 MB'
    },
    {
      id: 8,
      title: { en: 'Jesus I Worship You', fa: 'عیسی تو را می‌پرستم' },
      artist: 'دریا',
      key: 'E',
      mode: 'Minor',
      audioUrl: 'https://www.kalameh.com/file/15301/download',
      videoUrl: 'https://www.youtube.com/embed/aLSI9gIDepg',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/ISATORAMIPARASTAM.pptx',
      size: '7.95 MB'
    },
    {
      id: 9,
      title: { en: 'The Word Became Flesh', fa: 'کلمه جسم گردید' },
      artist: 'سینا مسیحا',
      key: 'A',
      mode: 'Minor',
      audioUrl: 'https://www.kalameh.com/file/15587/download',
      videoUrl: 'https://www.youtube.com/embed/eV-1Or6qfOw',
      lyricsVideoUrl: 'https://www.youtube.com/embed/s3HFJes72I4',
      powerpointUrl: 'https://www.kalameh.com/sites/default/files/songs/powerpoints/KALAMEHJESMGARDID.pptx',
      size: '1.93 MB'
    }
  ];

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title[lang].toLowerCase().includes(searchTerm.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = selectedMode === 'all' || song.mode === selectedMode;
    return matchesSearch && matchesMode;
  });

  const handleKalamehArchive = () => {
    window.open('https://www.kalameh.com/song-archive', '_blank');
  };

  const SongCard = ({ song }: { song: Song }) => (
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
        {song.audioUrl && (
          <a
            href={song.audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
          >
            <Play className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'پخش' : 'Play'}
          </a>
        )}

        {song.videoUrl && (
          <a
            href={song.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            <Video className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'ویدیو' : 'Video'}
          </a>
        )}

        {song.lyricsVideoUrl && (
          <a
            href={song.lyricsVideoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
          >
            <FileText className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'متن + صوت' : 'Lyrics'}
          </a>
        )}

        {song.powerpointUrl && (
          <a
            href={song.powerpointUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm"
          >
            <Download className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {lang === 'fa' ? 'پاورپوینت' : 'PowerPoint'}
          </a>
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
    </div>
  );
};

export default WorshipSongs;