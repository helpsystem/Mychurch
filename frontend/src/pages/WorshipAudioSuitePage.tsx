import React from 'react';
import { AudioTextSyncStudio } from '../components/worship/AudioTextSyncStudio';

const WorshipAudioSuitePage: React.FC = () => {
  return (
    <div className="pt-20"> {/* Add padding for fixed header if needed */}
      <AudioTextSyncStudio />
    </div>
  );
};

export default WorshipAudioSuitePage;
