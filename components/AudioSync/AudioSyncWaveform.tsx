
import React from 'react';

interface WaveformProps {
  isActive: boolean;
  colorClass?: string;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive, colorClass = 'bg-blue-400' }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-6">
      {[0, 1, 2, 3, 2, 1, 0].map((level, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${colorClass}`}
          style={{
            height: isActive ? `${4 + level * 4}px` : '4px',
            animation: isActive ? `pulse ${700 + i * 100}ms infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
};
