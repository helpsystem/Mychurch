import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { WorshipSong } from '../types';
import { useContent } from '../hooks/useContent';
import { Youtube, FileText, FileMusic } from 'lucide-react';
import AudioPlayerWithLyrics from '../components/AudioPlayerWithLyrics';
import YouTubePlayerWithLyrics from '../components/YouTubePlayerWithLyrics';
import LocalAudioPlayerWithSyncedLyrics from '../components/LocalAudioPlayerWithSyncedLyrics';
import ChordLyricsDisplay from '../components/ChordLyricsDisplay';
import { getRandomImage } from '../lib/theme';

// 🔹 کارت نمایش سرود
const WorshipSongCard: React.FC<{ song: WorshipSong; onClick?: () => void }> = ({ song, onClick }) => {
  const { lang } = useLanguage();
  const hasYoutube = !!song.youtubeId;
  const thumbnailUrl = hasYoutube ? `https://img.youtube.com/vi/${song.youtubeId}/hqdefault.jpg` : getRandomImage();

  return (
    <div
      className="bg-black-gradient rounded-[20px] overflow-hidden cursor-pointer hover:scale-105 transition-all"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
    >
      <div className="relative">
        <img src={thumbnailUrl} alt={song.title?.[lang] || 'Song'} className="w-full h-48 object-cover" />
        {hasYoutube && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
            <Youtube size={64} className="text-white" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col">
        <h3 className="text-lg font-semibold text-white text-center">{song.title?.[lang]}</h3>
        <p className="text-dimWhite text-sm text-center">{song.artist}</p>
      </div>
    </div>
  );
};

// 🔹 اسکلت لودینگ
const LoadingSkeleton: React.FC = () => (
  <div className="bg-black-gradient rounded-[20px] p-1 animate-pulse">
    <div className="bg-primary rounded-[18px] h-64"></div>
  </div>
);


const WorshipPage: React.FC = () => {
  const { lang, t } = useLanguage();
  const { content, loading: isLoading } = useContent();
  const songs = content.worshipSongs || [];

  const [presentationMode, setPresentationMode] = useState(false);
  const [selectedSongIndex, setSelectedSongIndex] = useState(0);
  const [activeSong, setActiveSong] = useState<WorshipSong | null>(null);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (activeSong) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeSong]);

  return (
    <div className="sm:px-16 px-6 sm:py-12 py-4">
      {/* Presentation Mode Toggle Button */}
      {!presentationMode && (
        <button
          onClick={() => {
            setPresentationMode(true);
            setSelectedSongIndex(0);
          }}
          className="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-600 z-50 flex items-center gap-2 font-semibold"
          title={lang === 'fa' ? 'حالت پرزنتیشن' : 'Presentation Mode'}
        >
          🎥 {lang === 'fa' ? 'حالت پرزنتیشن' : 'Presentation Mode'}
        </button>
      )}

      {presentationMode ? (
        /* Presentation Mode View */
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* بالای صفحه */}
          <div className="bg-black/70 p-4 flex justify-between items-center">
            <button
              onClick={() => setPresentationMode(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              ✕ {lang === 'fa' ? 'خروج از پرزنتیشن' : 'Exit'}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSongIndex(Math.max(0, selectedSongIndex - 1))}
                disabled={selectedSongIndex === 0}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-40"
              >
                ◀ {lang === 'fa' ? 'قبلی' : 'Prev'}
              </button>
              
              <select
                value={selectedSongIndex}
                onChange={(e) => setSelectedSongIndex(Number(e.target.value))}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-600"
                dir={lang === 'fa' ? 'rtl' : 'ltr'}
              >
                {songs.map((song, index) => (
                  <option key={song.id} value={index}>
                    {song.title[lang]} - {song.artist}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setSelectedSongIndex(Math.min(songs.length - 1, selectedSongIndex + 1))}
                disabled={selectedSongIndex === songs.length - 1}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg disabled:opacity-40"
              >
                {lang === 'fa' ? 'بعدی' : 'Next'} ▶
              </button>
            </div>
          </div>

          {/* محتوا */}
          {songs[selectedSongIndex] && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-5xl font-bold mb-4">{songs[selectedSongIndex].title?.[lang]}</h1>
              <p className="text-2xl text-gray-400 mb-8">{songs[selectedSongIndex].artist}</p>

              {songs[selectedSongIndex].audioUrl ? (
                <>
                  <LocalAudioPlayerWithSyncedLyrics
                    audioUrl={songs[selectedSongIndex].audioUrl}
                    lyrics={songs[selectedSongIndex].lyrics?.[lang]}
                    lang={lang}
                    title={songs[selectedSongIndex].title?.[lang]}
                    artist={songs[selectedSongIndex].artist}
                  />
                  {songs[selectedSongIndex].youtubeId && (
                    <div className="mt-4">
                      <a
                        href={`https://www.youtube.com/watch?v=${songs[selectedSongIndex].youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        🎥 {lang === 'fa' ? 'مشاهده ویدیو' : 'Watch Video'}
                      </a>
                    </div>
                  )}
                </>
              ) : songs[selectedSongIndex].youtubeId ? (
                <div className="text-center">
                  <a
                    href={`https://www.youtube.com/watch?v=${songs[selectedSongIndex].youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    🎥 {lang === 'fa' ? 'مشاهده در یوتیوب' : 'Watch on YouTube'}
                  </a>
                </div>
              ) : (
                <p className="text-gray-400 text-lg">{t('noMedia')}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Normal Mode View */
        <>
          <div className="text-center mb-12">
            <h1 className="font-bold text-4xl md:text-5xl mb-2">{t('worshipTitle')}</h1>
            <p className="text-gray-400">{t('worshipDescription')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} />)
              : songs.map((song, i) => (
                  <WorshipSongCard key={song.id || i} song={song} onClick={() => setActiveSong(song)} />
                ))}
          </div>

          {/* Popup Modal for Song Details */}
          {activeSong && (
            <div 
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setActiveSong(null);
              }}
            >
              <div className="bg-gray-900 rounded-2xl p-6 max-w-5xl w-full relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={() => setActiveSong(null)}
                  className="absolute top-4 right-4 bg-gray-800 text-white rounded-full w-10 h-10 hover:bg-gray-700 z-10 flex items-center justify-center"
                >
                  ✕
                </button>

                <h2 className="text-3xl font-bold mb-2 text-center">{activeSong.title?.[lang]}</h2>
                <p className="text-gray-400 text-center mb-2">{activeSong.artist}</p>
                {/* chord/mode badges if provided */}
                {(activeSong as any)?.chord || (activeSong as any)?.mode ? (
                  <div className="flex items-center justify-center gap-3 mb-4 text-sm">
                    {(activeSong as any)?.chord && (
                      <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full">🎸 {lang === 'fa' ? 'آکورد' : 'Chord'}: {(activeSong as any).chord}</span>
                    )}
                    {(activeSong as any)?.mode && (
                      <span className="bg-gray-800 text-gray-200 px-3 py-1 rounded-full">🎼 {lang === 'fa' ? 'مد' : 'Mode'}: {(activeSong as any).mode}</span>
                    )}
                  </div>
                ) : null}

                {/* پخش ویدیو یا صدا */}
                <div className="mb-6">
                  {/* اولویت با پلیر صوتی + متن هایلایت شده */}
                  {activeSong.audioUrl ? (
                    <>
                      <LocalAudioPlayerWithSyncedLyrics
                        audioUrl={activeSong.audioUrl}
                        lyrics={activeSong.lyrics?.[lang]}
                        chords={(activeSong as any)?.chords}
                        notation={activeSong.notation}
                        lang={lang}
                        title={activeSong.title?.[lang]}
                        artist={activeSong.artist}
                        showChords={false}
                      />
                      {/* لینک یوتیوب اگر موجود باشد */}
                      {activeSong.youtubeId && (
                        <div className="mt-4 text-center">
                          <a
                            href={`https://www.youtube.com/watch?v=${activeSong.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                          >
                            🎥 {lang === 'fa' ? 'مشاهده ویدیو در یوتیوب' : 'Watch on YouTube'}
                          </a>
                        </div>
                      )}
                      {/* نمایش آکوردها و نوت‌ها زیر پلیر */}
                      <div className="mt-6">
                        <ChordLyricsDisplay
                          lyrics={activeSong.lyrics?.[lang]}
                          chords={(activeSong as any)?.chords}
                          notation={activeSong.notation}
                          lang={lang}
                          showChords={true}
                        />
                      </div>
                    </>
                  ) : activeSong.youtubeId ? (
                    <>
                      {/* فقط اگر MP3 نداشته باشد، یوتیوب نمایش بده */}
                      <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                        <div className="text-center mb-4">
                          <p className="text-gray-400 mb-4">{lang === 'fa' ? 'فایل صوتی موجود نیست، مشاهده در یوتیوب:' : 'No audio file, watch on YouTube:'}</p>
                          <a
                            href={`https://www.youtube.com/watch?v=${activeSong.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                          >
                            🎥 {lang === 'fa' ? 'مشاهده در یوتیوب' : 'Watch on YouTube'}
                          </a>
                        </div>
                      </div>
                      {/* نمایش آکوردها و متن */}
                      <div className="mt-6">
                        <ChordLyricsDisplay
                          lyrics={activeSong.lyrics?.[lang]}
                          chords={(activeSong as any)?.chords}
                          notation={activeSong.notation}
                          lang={lang}
                          showChords={true}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500">{t('noMedia')}</p>
                  )}
                </div>

                {/* بخش دانلود فایل‌ها - همیشه نمایش بده */}
                <div className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto mb-6">
                  {/* PPTX */}
                  {activeSong.presentationFileUrl ? (
                    <a href={activeSong.presentationFileUrl} download className="bg-green-600 py-2 rounded-lg text-center hover:bg-green-700">
                      📑 {lang === 'fa' ? 'دانلود پاورپوینت' : 'Download PPT'}
                    </a>
                  ) : (
                    <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                      📑 {lang === 'fa' ? 'پاورپوینت موجود نیست' : 'No PowerPoint'}
                    </button>
                  )}
                  {/* PDF */}
                  {activeSong.pdfFileUrl ? (
                    <a href={activeSong.pdfFileUrl} download className="bg-blue-600 py-2 rounded-lg text-center hover:bg-blue-700">
                      <FileText className="inline mr-1" /> {lang === 'fa' ? 'دانلود PDF' : 'Download PDF'}
                    </a>
                  ) : (
                    <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                      <FileText className="inline mr-1" /> {lang === 'fa' ? 'PDF موجود نیست' : 'No PDF'}
                    </button>
                  )}
                  {/* Sheet */}
                  {activeSong.sheetMusicUrl ? (
                    <a href={activeSong.sheetMusicUrl} download className="bg-purple-600 py-2 rounded-lg text-center hover:bg-purple-700">
                      <FileMusic className="inline mr-1" /> {lang === 'fa' ? 'دانلود نت' : 'Download Sheet'}
                    </a>
                  ) : (
                    <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                      <FileMusic className="inline mr-1" /> {lang === 'fa' ? 'نت موجود نیست' : 'No Sheet'}
                    </button>
                  )}
                  {/* MP3 */}
                  {activeSong.audioUrl ? (
                    <a href={activeSong.audioUrl} download className="bg-teal-600 py-2 rounded-lg text-center hover:bg-teal-700">
                      🎵 {lang === 'fa' ? 'دانلود MP3' : 'Download MP3'}
                    </a>
                  ) : (
                    <button disabled className="bg-gray-700/60 py-2 rounded-lg text-center cursor-not-allowed text-gray-300">
                      🎵 {lang === 'fa' ? 'فایل صوتی موجود نیست' : 'No MP3'}
                    </button>
                  )}
                </div>

                {/* شعر - فقط اگر آکورد و نوت جدا نباشند */}
                {!((activeSong as any)?.chords || activeSong.notation) && activeSong.lyrics?.[lang] && (
                  <div className="bg-black/40 border border-gray-700 rounded-xl p-4 mb-6">
                    <h3 className="text-xl font-semibold mb-2 text-center">{lang === 'fa' ? 'متن سرود' : 'Lyrics'}</h3>
                    <pre className="whitespace-pre-wrap text-gray-200 text-center" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                      {activeSong.lyrics[lang]}
                    </pre>
                  </div>
                )}

                {/* نوت موسیقی - حذف شد چون در ChordLyricsDisplay نمایش داده می‌شود */}

                {/* توضیحات - همیشه نمایش بده */}
                <div className="bg-black/40 border border-gray-700 rounded-xl p-4 mb-6">
                  <h3 className="text-xl font-semibold mb-2 text-center">{lang === 'fa' ? 'توضیحات' : 'Notes'}</h3>
                  {activeSong.notes ? (
                    <p className="text-gray-300 text-center" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                      {activeSong.notes}
                    </p>
                  ) : (
                    <p className="text-center text-gray-400">{lang === 'fa' ? 'توضیحی ثبت نشده است' : 'No notes'}</p>
                  )}
                </div>

                {/* فایل‌های ضمیمه - همیشه نمایش بده */}
                <div className="bg-black/40 border border-gray-700 rounded-xl p-4">
                  <h3 className="text-xl font-semibold mb-2 text-center">{lang === 'fa' ? 'فایل‌های ضمیمه' : 'Attachments'}</h3>
                  {activeSong.attachments && activeSong.attachments.length > 0 ? (
                    <ul className="list-disc pl-6 text-blue-400">
                      {activeSong.attachments.map((a, i) => (
                        <li key={i}>
                          <a href={a.url || (a as any).path} target="_blank" rel="noopener noreferrer" download className="hover:text-blue-300">
                            {a.name || a.url || (a as any).path}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-400">{lang === 'fa' ? 'فایلی موجود نیست' : 'No attachments'}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorshipPage;