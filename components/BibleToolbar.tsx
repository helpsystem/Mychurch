import React, { useState } from 'react';
import type { BibleMode, Language, DisplayMode } from '../hooks/useBibleMode';

interface BibleToolbarProps {
  mode: BibleMode;
  language: Language;
  displayMode: DisplayMode;
  isPlaying: boolean;
  isLoading: boolean;
  currentBook: string;
  currentChapter: number;
  onModeToggle: () => void;
  onLanguageToggle: () => void;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onSearch: (query: string) => void;
  onPlayPause: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  bookName?: string;
}

const BibleToolbar: React.FC<BibleToolbarProps> = ({
  mode,
  language,
  displayMode,
  isPlaying,
  isLoading,
  currentBook,
  currentChapter,
  onModeToggle,
  onLanguageToggle,
  onDisplayModeChange,
  onSearch,
  onPlayPause,
  onPreviousChapter,
  onNextChapter,
  onFullscreen,
  isFullscreen,
  bookName = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  return (
    <header className={`
      sticky top-0 z-50 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900
      border-b-2 border-gold-300 shadow-lg backdrop-blur-md bg-opacity-95
      ${language === 'fa' ? 'font-vazir' : 'font-sans'}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📖</span>
            <div className="hidden md:block">
              <h1 className="text-white font-bold text-lg leading-tight">
                {language === 'en' ? 'Holy Bible' : 'کتاب مقدس'}
              </h1>
              {bookName && (
                <p className="text-blue-200 text-xs">
                  {bookName} - {language === 'en' ? 'Chapter' : 'فصل'} {currentChapter}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Language Toggle */}
            <button
              onClick={onLanguageToggle}
              className="px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white font-medium transition-colors flex items-center space-x-2"
              title={language === 'en' ? 'Switch to Persian' : 'تغییر به انگلیسی'}
            >
              <span className="text-sm">{language === 'en' ? '🇬🇧 EN' : '🇮🇷 FA'}</span>
            </button>

            {/* Mode Toggle */}
            <button
              onClick={onModeToggle}
              className="px-3 py-2 rounded-lg bg-purple-800 hover:bg-purple-700 text-white font-medium transition-colors flex items-center space-x-2"
              title={mode === 'simple' ? 'Switch to Flipbook' : 'Switch to Simple'}
            >
              <span className="text-lg">{mode === 'simple' ? '📜' : '📖'}</span>
              <span className="text-sm">{mode === 'simple' ? 'Simple' : 'Flipbook'}</span>
            </button>

            {/* Display Mode Dropdown */}
            <select
              value={displayMode}
              onChange={(e) => onDisplayModeChange(e.target.value as DisplayMode)}
              className="px-3 py-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-medium transition-colors text-sm cursor-pointer"
              title="Display Mode"
            >
              <option value="normal">🖥️ Normal</option>
              <option value="presentation">🎬 Presentation</option>
            </select>

            {/* Navigation */}
            <div className="flex items-center space-x-2 bg-blue-950 rounded-lg px-2 py-1">
              <button
                onClick={onPreviousChapter}
                className="p-2 hover:bg-blue-800 rounded-lg text-white transition-colors"
                title="Previous Chapter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={onPlayPause}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-colors ${
                  isLoading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : isPlaying 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                } text-white`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={onNextChapter}
                className="p-2 hover:bg-blue-800 rounded-lg text-white transition-colors"
                title="Next Chapter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <button
              onClick={handleSearchToggle}
              className={`p-2 rounded-lg transition-colors ${
                showSearch ? 'bg-yellow-600' : 'bg-blue-800 hover:bg-blue-700'
              } text-white`}
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Fullscreen */}
            <button
              onClick={onFullscreen}
              className="p-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Search Bar (Desktop) */}
        {showSearch && (
          <div className="pb-4">
            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search verses...' : 'جستجوی آیات...'}
                className={`flex-1 px-4 py-2 rounded-lg bg-blue-950 text-white placeholder-blue-300 border border-blue-700 focus:border-blue-500 focus:outline-none ${
                  language === 'fa' ? 'text-right' : 'text-left'
                }`}
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors"
              >
                {language === 'en' ? 'Search' : 'جستجو'}
              </button>
              <button
                type="button"
                onClick={handleSearchToggle}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                ✕
              </button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden pb-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { onLanguageToggle(); setShowMobileMenu(false); }}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-sm"
              >
                {language === 'en' ? '🇬🇧 EN' : '🇮🇷 FA'}
              </button>
              <button
                onClick={() => { onModeToggle(); setShowMobileMenu(false); }}
                className="flex-1 px-3 py-2 rounded-lg bg-purple-800 hover:bg-purple-700 text-white text-sm"
              >
                {mode === 'simple' ? '📜 Simple' : '📖 Flipbook'}
              </button>
            </div>

            <select
              value={displayMode}
              onChange={(e) => { onDisplayModeChange(e.target.value as DisplayMode); setShowMobileMenu(false); }}
              className="w-full px-3 py-2 rounded-lg bg-indigo-800 text-white text-sm"
            >
              <option value="normal">🖥️ Normal</option>
              <option value="presentation">🎬 Presentation</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => { onPreviousChapter(); setShowMobileMenu(false); }}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-sm"
              >
                ◄ Prev
              </button>
              <button
                onClick={() => { onPlayPause(); setShowMobileMenu(false); }}
                className={`flex-1 px-3 py-2 rounded-lg text-white text-sm ${
                  isPlaying ? 'bg-red-600' : 'bg-green-600'
                }`}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={() => { onNextChapter(); setShowMobileMenu(false); }}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-sm"
              >
                Next ►
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { handleSearchToggle(); setShowMobileMenu(false); }}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-sm"
              >
                🔍 Search
              </button>
              <button
                onClick={() => { onFullscreen(); setShowMobileMenu(false); }}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-sm"
              >
                {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="hidden xl:block absolute right-4 top-20 bg-blue-950 text-blue-200 text-xs px-3 py-2 rounded-lg shadow-lg opacity-75">
        <div className="space-y-1">
          <div><kbd className="px-1 bg-blue-800 rounded">←→</kbd> Navigate</div>
          <div><kbd className="px-1 bg-blue-800 rounded">Space</kbd> Play/Pause</div>
          <div><kbd className="px-1 bg-blue-800 rounded">M</kbd> Mode</div>
          <div><kbd className="px-1 bg-blue-800 rounded">L</kbd> Language</div>
          <div><kbd className="px-1 bg-blue-800 rounded">F11</kbd> Fullscreen</div>
        </div>
      </div>
    </header>
  );
};

export default BibleToolbar;
