import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  color?: 'blue' | 'purple' | 'gold' | 'white';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = '', 
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    purple: 'border-purple-600 border-t-transparent',
    gold: 'border-yellow-500 border-t-transparent',
    white: 'border-white border-t-transparent'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-300 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
