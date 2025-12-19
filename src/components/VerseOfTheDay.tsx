import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Verse {
  verse: {
    details: {
      text: string;
      reference: string;
    };
  };
}

const VerseOfTheDay: React.FC = () => {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVerse = async () => {
      try {
        const response = await axios.get('https://www.ourmanna.com/verses/api/get?format=json&order=daily');
        setVerse(response.data);
      } catch (err) {
        setError('Failed to fetch verse');
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
  }, []);

  if (loading) {
    return <div>Loading verse of the day...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-2">Verse of the Day</h2>
      {verse && (
        <div>
          <p className="text-lg">{verse.verse.details.text}</p>
          <p className="text-right font-bold mt-2">{verse.verse.details.reference}</p>
        </div>
      )}
    </div>
  );
};

export default VerseOfTheDay;
