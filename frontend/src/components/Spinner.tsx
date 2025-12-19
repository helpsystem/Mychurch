import React from 'react';

const Spinner: React.FC<{ size?: string }> = ({ size = '8' }) => {
  const sizeClass = `w-${size} h-${size}`;
  return (
    <div className={`${sizeClass} border-4 border-white/20 border-t-secondary rounded-full animate-spin`}></div>
  );
};

export default Spinner;