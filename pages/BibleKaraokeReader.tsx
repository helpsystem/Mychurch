import React from 'react';
import BibleKaraokeMode from '../components/BibleKaraokeMode';

const BibleKaraokeReader: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6 text-white">کتاب مقدس - حالت روخوانی (Karaoke)</h1>
      <BibleKaraokeMode />
    </div>
  );
};

export default BibleKaraokeReader;
