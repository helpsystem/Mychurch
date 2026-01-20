import React, { useEffect, useState } from 'react';
import KaraokeWorshipPlayer from '../components/KaraokeWorshipPlayer';

/**
 * Simple test page to verify KaraokeWorshipPlayer functionality
 */
const SimpleKaraokeTest: React.FC = () => {
  const [timingStatus, setTimingStatus] = useState<string>('Loading...');
  const [songData, setSongData] = useState<any>(null);

  // Test fetch timing data directly
  useEffect(() => {
    const testFetch = async () => {
      try {
        // Test song 2 timing
        const timingRes = await fetch('/worship/data/timings/song_2_timing.json');
        const timingData = await timingRes.json();
        console.log('Direct timing fetch:', timingData);
        
        // Test worship songs
        const songsRes = await fetch('/worship/data/worship_songs.json');
        const songs = await songsRes.json();
        const song2 = songs.find((s: any) => s.id === 2);
        console.log('Song 2 data:', song2);
        setSongData(song2);
        
        setTimingStatus(`✅ Timing loaded: ${timingData.lines?.length || 0} lines`);
      } catch (err) {
        console.error('Fetch error:', err);
        setTimingStatus(`❌ Error: ${err}`);
      }
    };
    testFetch();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8" dir="rtl" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
      <h1 className="text-3xl text-white mb-4">تست ساده پلیر کارائوکه</h1>
      
      {/* Status */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6 text-white">
        <p><strong>Status:</strong> {timingStatus}</p>
        {songData && (
          <>
            <p><strong>Song Title:</strong> {songData.title?.fa}</p>
            <p><strong>Audio URL:</strong> {songData.audioUrl}</p>
          </>
        )}
      </div>

      {/* Player */}
      {songData && (
        <KaraokeWorshipPlayer
          audioUrl={songData.audioUrl}
          songId={2}
          title={songData.title?.fa || 'تو را عاشقانه دوستت دارم'}
          artist={songData.artist}
          lang="fa"
          showControls={true}
        />
      )}
    </div>
  );
};

export default SimpleKaraokeTest;
