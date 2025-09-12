import React, { useState, useEffect } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import PresentationViewer from '../components/PresentationViewer';
import { 
  Music, 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Upload, 
  Download, 
  Copy,
  Shuffle,
  List,
  Search,
  Filter,
  Settings
} from 'lucide-react';

interface PresentationSlide {
  id: string;
  type: 'song' | 'scripture' | 'image' | 'video';
  title: string;
  content: {
    en: string;
    fa: string;
  };
  metadata?: {
    book?: string;
    chapter?: number;
    verse?: string;
    artist?: string;
    copyright?: string;
    background?: string;
    textColor?: string;
    fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
  };
}

interface WorshipSong {
  id: string;
  title: {
    en: string;
    fa: string;
  };
  artist?: string;
  lyrics: {
    en: string;
    fa: string;
  };
  copyright?: string;
  tags: string[];
  category: 'worship' | 'praise' | 'hymn' | 'contemporary' | 'traditional';
}

interface BibleVerse {
  id: string;
  book: string;
  chapter: number;
  verse: string;
  text: {
    en: string;
    fa: string;
  };
  version: string;
}

const WorshipPresentationPage: React.FC = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'presentation' | 'songs' | 'verses' | 'create'>('presentation');
  const [currentSlides, setCurrentSlides] = useState<PresentationSlide[]>([]);
  const [worshipSongs, setWorshipSongs] = useState<WorshipSong[]>([]);
  const [bibleVerses, setBibleVerses] = useState<BibleVerse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const isAdmin = user && ['MANAGER', 'SUPER_ADMIN'].includes(user.role);

  useEffect(() => {
    loadWorshipContent();
  }, []);

  const loadWorshipContent = async () => {
    setLoading(true);
    try {
      // Load worship songs
      const songsResponse = await fetch('/api/worship-songs');
      if (songsResponse.ok) {
        const songsData = await songsResponse.json();
        setWorshipSongs(songsData.songs || []);
      } else {
        // Mock data
        setWorshipSongs([
          {
            id: '1',
            title: { en: 'Amazing Grace', fa: 'فیض شگفت‌انگیز' },
            artist: 'John Newton',
            lyrics: {
              en: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.`,
              fa: `فیض شگفت‌انگیز! چه آوازی شیرین
که مرا گنهکار نجات داد!
یک‌بار گم شده بودم، اما اکنون یافته شده‌ام؛
کور بودم، اما اکنون می‌بینم.

فیض بود که به قلبم ترس آموخت،
و فیض ترس‌هایم را تسکین داد؛
چقدر گرانبها نمود آن فیض
در ساعتی که نخستین‌بار ایمان آوردم.`
            },
            copyright: 'Public Domain',
            tags: ['classic', 'hymn', 'grace'],
            category: 'hymn'
          },
          {
            id: '2',
            title: { en: 'How Great Thou Art', fa: 'چقدر عظیم هستی تو' },
            artist: 'Carl Boberg',
            lyrics: {
              en: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made
I see the stars, I hear the rolling thunder
Thy power throughout the universe displayed

Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee
How great Thou art! How great Thou art!`,
              fa: `ای خداوند، خدای من، وقتی با تعجب
همه جهان‌هایی را که دست‌هایت ساخته‌اند، می‌نگرم
ستاره‌ها را می‌بینم، صدای رعد غرنده را می‌شنوم
قدرت تو در سراسر کیهان نمایان است

پس روحم می‌سراید، ای خدای نجات‌دهنده‌ام، برای تو
چقدر عظیم هستی تو! چقدر عظیم هستی تو!
پس روحم می‌سراید، ای خدای نجات‌دهنده‌ام، برای تو
چقدر عظیم هستی تو! چقدر عظیم هستی تو!`
            },
            copyright: '© 1949, 1953 Stuart K. Hine',
            tags: ['worship', 'nature', 'praise'],
            category: 'worship'
          }
        ]);
      }

      // Load Bible verses (daily verses or selected)
      const versesResponse = await fetch('/api/bible/daily-verses');
      if (versesResponse.ok) {
        const versesData = await versesResponse.json();
        setBibleVerses(versesData.verses || []);
      } else {
        // Mock data
        setBibleVerses([
          {
            id: '1',
            book: 'John',
            chapter: 3,
            verse: '16',
            text: {
              en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
              fa: 'زیرا خدا آنقدر جهان را دوست داشت که پسر یگانه خود را داد، تا هر که بر او ایمان آورد هلاک نشود، بلکه حیات جاودانی یابد.'
            },
            version: 'NIV / ترجمه معاصر'
          },
          {
            id: '2',
            book: 'Psalms',
            chapter: 23,
            verse: '1',
            text: {
              en: 'The Lord is my shepherd, I lack nothing.',
              fa: 'خداوند شبان من است، محتاج چیزی نخواهم بود.'
            },
            version: 'NIV / ترجمه معاصر'
          },
          {
            id: '3',
            book: 'Matthew',
            chapter: 5,
            verse: '14',
            text: {
              en: 'You are the light of the world. A town built on a hill cannot be hidden.',
              fa: 'شما نور جهان هستید. شهری که بر کوه واقع است نمی‌تواند پنهان شود.'
            },
            version: 'NIV / ترجمه معاصر'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading worship content:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSlideFromSong = (song: WorshipSong): PresentationSlide[] => {
    const lyrics = song.lyrics[lang] || song.lyrics.en || song.lyrics.fa || '';
    const verses = lyrics.split('\n\n').filter(verse => verse.trim());
    
    return verses.map((verse, index) => ({
      id: `${song.id}-${index}`,
      type: 'song' as const,
      title: song.title[lang] || song.title.en || song.title.fa || '',
      content: {
        en: verse,
        fa: verse
      },
      metadata: {
        artist: song.artist,
        copyright: song.copyright,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#ffffff',
        fontSize: 'large'
      }
    }));
  };

  const createSlideFromVerse = (verse: BibleVerse): PresentationSlide => ({
    id: verse.id,
    type: 'scripture' as const,
    title: `${verse.book} ${verse.chapter}:${verse.verse}`,
    content: {
      en: verse.text.en,
      fa: verse.text.fa
    },
    metadata: {
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verse,
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      textColor: '#ffffff',
      fontSize: 'large'
    }
  });

  const addSongToPresentation = (song: WorshipSong) => {
    const slides = createSlideFromSong(song);
    setCurrentSlides(prev => [...prev, ...slides]);
  };

  const addVerseToPresentation = (verse: BibleVerse) => {
    const slide = createSlideFromVerse(verse);
    setCurrentSlides(prev => [...prev, slide]);
  };

  const removeSlideFromPresentation = (slideId: string) => {
    setCurrentSlides(prev => prev.filter(slide => slide.id !== slideId));
  };

  const reorderSlides = (fromIndex: number, toIndex: number) => {
    setCurrentSlides(prev => {
      const newSlides = [...prev];
      const [movedSlide] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, movedSlide);
      return newSlides;
    });
  };

  const clearPresentation = () => {
    setCurrentSlides([]);
  };

  const savePresentation = async () => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch('/api/presentations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          slides: currentSlides,
          title: `Presentation ${new Date().toLocaleDateString()}`,
          createdBy: user?.email
        })
      });
      
      if (response.ok) {
        alert(lang === 'fa' ? 'پرزنتیشن ذخیره شد' : 'Presentation saved successfully');
      }
    } catch (error) {
      console.error('Error saving presentation:', error);
      alert(lang === 'fa' ? 'خطا در ذخیره پرزنتیشن' : 'Error saving presentation');
    }
  };

  const filteredSongs = worshipSongs.filter(song => {
    const matchesSearch = !searchTerm || 
      song.title.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.title.fa.includes(searchTerm) ||
      (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredVerses = bibleVerses.filter(verse => {
    return !searchTerm || 
      verse.book.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verse.text.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verse.text.fa.includes(searchTerm);
  });

  const tabs = [
    {
      id: 'presentation',
      label: lang === 'fa' ? 'پرزنتیشن' : 'Presentation',
      icon: <BookOpen className="w-5 h-5" />
    },
    {
      id: 'songs',
      label: lang === 'fa' ? 'سرودها' : 'Songs',
      icon: <Music className="w-5 h-5" />
    },
    {
      id: 'verses',
      label: lang === 'fa' ? 'آیات' : 'Verses',
      icon: <BookOpen className="w-5 h-5" />
    }
  ];

  if (isAdmin) {
    tabs.push({
      id: 'create',
      label: lang === 'fa' ? 'ایجاد' : 'Create',
      icon: <Plus className="w-5 h-5" />
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Music className="w-10 h-10 text-purple-600" />
            {lang === 'fa' ? 'پرزنتیشن عبادت' : 'Worship Presentation'}
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {lang === 'fa' 
              ? 'نمایش زیبا و حرفه‌ای سرودها و آیات کتاب مقدس برای خدمات عبادی'
              : 'Beautiful and professional display of worship songs and Bible verses for worship services'
            }
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'presentation' && (
            <div>
              {/* Presentation Controls */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {lang === 'fa' ? 'پرزنتیشن فعلی' : 'Current Presentation'}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {currentSlides.length} {lang === 'fa' ? 'اسلاید' : 'slides'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={savePresentation}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {lang === 'fa' ? 'ذخیره' : 'Save'}
                      </button>
                    )}
                    <button
                      onClick={clearPresentation}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {lang === 'fa' ? 'پاک کردن' : 'Clear'}
                    </button>
                  </div>
                </div>

                {/* Current Slides List */}
                {currentSlides.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {lang === 'fa' ? 'اسلایدهای موجود:' : 'Current Slides:'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currentSlides.map((slide, index) => (
                        <div key={slide.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {slide.type === 'song' ? <Music className="w-4 h-4 text-purple-600" /> : <BookOpen className="w-4 h-4 text-green-600" />}
                              <span className="text-sm font-medium text-gray-900 truncate">{slide.title}</span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {slide.content[lang] || slide.content.en || slide.content.fa}
                            </p>
                          </div>
                          <button
                            onClick={() => removeSlideFromPresentation(slide.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Presentation Viewer */}
              <PresentationViewer 
                slides={currentSlides}
                autoPlay={false}
                showControls={true}
                className="shadow-xl"
              />
            </div>
          )}

          {activeTab === 'songs' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Search and Filter */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-60">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={lang === 'fa' ? 'جستجو در سرودها...' : 'Search songs...'}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">{lang === 'fa' ? 'همه دسته‌ها' : 'All Categories'}</option>
                  <option value="worship">{lang === 'fa' ? 'ستایش' : 'Worship'}</option>
                  <option value="praise">{lang === 'fa' ? 'حمد' : 'Praise'}</option>
                  <option value="hymn">{lang === 'fa' ? 'سرود' : 'Hymn'}</option>
                  <option value="contemporary">{lang === 'fa' ? 'معاصر' : 'Contemporary'}</option>
                  <option value="traditional">{lang === 'fa' ? 'سنتی' : 'Traditional'}</option>
                </select>
              </div>

              {/* Songs List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredSongs.map((song) => (
                  <div key={song.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {song.title[lang] || song.title.en || song.title.fa}
                        </h3>
                        {song.artist && (
                          <p className="text-sm text-gray-600 mb-2">{song.artist}</p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {song.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => addSongToPresentation(song)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {lang === 'fa' ? 'افزودن' : 'Add'}
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans line-clamp-6">
                        {(song.lyrics[lang] || song.lyrics.en || song.lyrics.fa || '').slice(0, 200)}...
                      </pre>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSongs.length === 0 && (
                <div className="text-center py-8">
                  <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {lang === 'fa' ? 'هیچ سرودی یافت نشد' : 'No songs found'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'verses' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={lang === 'fa' ? 'جستجو در آیات...' : 'Search verses...'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Verses List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredVerses.map((verse) => (
                  <div key={verse.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {verse.book} {verse.chapter}:{verse.verse}
                        </h3>
                        <p className="text-sm text-gray-600">{verse.version}</p>
                      </div>
                      <button
                        onClick={() => addVerseToPresentation(verse)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {lang === 'fa' ? 'افزودن' : 'Add'}
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-gray-700 leading-relaxed">
                        {verse.text[lang] || verse.text.en || verse.text.fa}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredVerses.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {lang === 'fa' ? 'هیچ آیه‌ای یافت نشد' : 'No verses found'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && isAdmin && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {lang === 'fa' ? 'ایجاد محتوای جدید' : 'Create New Content'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {lang === 'fa' 
                    ? 'این بخش برای ایجاد سرودها و آیات جدید در دست توسعه است'
                    : 'This section for creating new songs and verses is under development'
                  }
                </p>
                <div className="flex justify-center gap-4">
                  <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Plus className="w-5 h-5" />
                    {lang === 'fa' ? 'سرود جدید' : 'New Song'}
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Plus className="w-5 h-5" />
                    {lang === 'fa' ? 'آیه جدید' : 'New Verse'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorshipPresentationPage;