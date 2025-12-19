import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: 'microphone' | 'stop' | 'upload';
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'microphone':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm0 16a5 5 0 0 1-5-5H5a7 7 0 0 0 6 6.93V22h2v-2.07A7 7 0 0 0 19 13h-2a5 5 0 0 1-5 5Z" />
        </svg>
      );
    case 'stop':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M6 6h12v12H6V6Z" />
        </svg>
      );
    case 'upload':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M9 16h6v-6h4l-8-8-8 8h4v6zm-4 2h14v2H5v-2z" />
        </svg>
      );
    default:
      return null;
  }
};