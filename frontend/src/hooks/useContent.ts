import { useContext, useEffect, useState } from 'react';
import { ContentContext } from '../context/ContentContext';
import { ContentContextType, WorshipSong } from '../types';

export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Lightweight helper hook when you only need worship songs without pulling the entire context.
// Fetches the normalized JSON that the site serves from public/worship/data.
// Usage matches the snippet in the request: returns { songs, loading }.
export const useWorshipSongs = () => {
  const context = useContext(ContentContext);
  const initial = context?.content?.worshipSongs as WorshipSong[] | undefined;
  const [songs, setSongs] = useState<WorshipSong[]>(initial || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch('/worship/data/worship_songs.json', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setSongs(data as WorshipSong[]);
        } else {
          // Fallback to context if available
          if (initial && initial.length) setSongs(initial);
        }
      } catch (_) {
        if (initial && initial.length) setSongs(initial);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  return { songs, loading };
};
